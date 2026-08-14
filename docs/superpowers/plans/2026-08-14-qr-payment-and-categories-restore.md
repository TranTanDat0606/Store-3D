# QR Bank-Transfer Payment + Categories Restore — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real VietQR bank-transfer payment flow (orderCode + QR + 5-min countdown + backend-only webhook confirmation) and restore the original home-page categories layout.

**Architecture:** Reuse the existing `Order` model, extending `payment` with `orderCode`, `qrExpiresAt` and a new `pending_payment` status, plus a top-level `paidAt`. A new `paymentService` generates `ST3D-XXXXXX` codes, builds VietQR payloads from env-driven bank data (rendered via the `qrcode` package), and owns the only path that marks an order `paid` (webhook reconcile). A new `/api/payment/webhook` route plus a DEV-only `/simulate` twin share that same reconciler. The client checkout routes bank-transfer to a new `/thanh-toan-qr/:orderId` page that polls the existing `GET /api/orders/:id` every 3s. The home page reverts its categories section to the original inline grid from commit `6a46c97`.

**Tech Stack:** server: express 4, mongoose 8, zod; deps + `qrcode` (+`@types/qrcode`). client: React 19, Vite 8, TS, Tailwind v4, react-router v7, lucide-react, framer-motion, sonner.

## Global Constraints

- Keep ALL existing logic, structure, and working features (cart, checkout, order, auth, admin). Do not rewrite the project.
- Frontend must NEVER self-confirm paid. `paid`/`confirmed` only from backend webhook reconcile.
- State machine: `unpaid → pending_payment → paid` (NO `payment_received`).
- One new server runtime dep only: `qrcode` (approved). One new server dev dep: `@types/qrcode`.
- Bank account info is env-driven (`BANK_BIN`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_NAME`) — no hardcoded constants.
- Reconcile conditions: exact orderCode, `status === 'pending_payment'`, `qrExpiresAt > now` (server clock wins), `amount === total`. Idempotent when already `paid`. Single atomic update sets `payment.status='paid'`, `paidAt=now`, `order.status='confirmed'`.
- Frontend copy (Vietnamese) is exact — do not reword: waiting "Vui lòng quét mã QR và hoàn tất chuyển khoản.", paid "Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.", expired "Mã QR đã hết hạn. Vui lòng tạo mã thanh toán mới." + "Tạo mã QR mới", failed "Không thể xác nhận giao dịch. Vui lòng thử lại.", countdown label "Mã QR sẽ hết hạn sau: MM:SS".
- No comments unless the existing file uses them; follow file conventions (server semicolons, client none).
- Server checks: `npm run build` (strict tsc) and `npm test` (node:test via tsx). Client checks: `npm run build` + `npm run lint`.
- Both dev servers run: `cd server && npm run dev` (port 5000), `cd client && npm run dev` (port 5173). MongoDB already on 27017.

---

## File Map

**Server (create):**
- `server/src/services/vietQrService.ts` — pure VietQR payload builder + QR data URL renderer.
- `server/src/services/paymentService.ts` — `generateOrderCode`, `createQrForOrder`, `validateReconcile`, `markOrderPaid`.
- `server/src/routes/payment.ts` — webhook + simulate routes.
- `server/tests/vietQr.test.ts`, `server/tests/payment.test.ts` — node:test unit tests.

**Server (modify):**
- `server/src/models/Order.ts` — PaymentStatus + payment.orderCode/qrExpiresAt + paidAt.
- `server/src/config/index.ts` + `server/.env` — bank/TTL/webhook-secret settings.
- `server/src/controllers/orderController.ts` — `createPaymentQr`.
- `server/src/routes/order.ts` — `POST /:id/payment-qr`.
- `server/src/app.ts` — mount `/api/payment`.
- `server/package.json` — `test` script.

**Client (create):**
- `client/src/pages/qr-payment-page.tsx` — QR payment page.

**Client (modify):**
- `client/src/types/index.ts` — PaymentStatus + Order.payment fields.
- `client/src/services/index.ts` — `paymentApi`.
- `client/src/components/order/order-status-badge.tsx` — pending_payment label/style.
- `client/src/pages/checkout-page.tsx` — route bank-transfer to QR page.
- `client/src/App.tsx` — lazy route `/thanh-toan-qr/:id`.
- `client/src/pages/home-page.tsx` — restore original categories block.

**Client (delete):**
- `client/src/components/home/categories-section.tsx`.

---

### Task 1: Server — Order model (payment status + QR fields)

**Files:**
- Modify: `server/src/models/Order.ts`

**Interfaces:**
- Produces: `PaymentStatus.PendingPayment = 'pending_payment'`; `IOrder.payment.orderCode?: string`, `IOrder.payment.qrExpiresAt?: Date`, `IOrder.paidAt?: Date`.

- [ ] **Step 1: Extend the `PaymentStatus` enum**

```ts
export enum PaymentStatus {
  Unpaid = 'unpaid',
  PendingPayment = 'pending_payment',
  Paid = 'paid',
}
```

- [ ] **Step 2: Extend `IOrder`**

```ts
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    orderCode?: string;
    qrExpiresAt?: Date;
  };
  paidAt?: Date;
```

- [ ] **Step 3: Extend the schema**

Replace the `payment` block with:

```ts
    payment: {
      method: {
        type: String,
        enum: Object.values(PaymentMethod),
        default: PaymentMethod.Cash,
      },
      status: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.Unpaid,
      },
      orderCode: { type: String, trim: true, uppercase: true },
      qrExpiresAt: { type: Date },
    },
    paidAt: { type: Date },
```

Add after the existing indexes:

```ts
orderSchema.index({ 'payment.orderCode': 1 }, { sparse: true, unique: true });
```

- [ ] **Step 4: Verify build**

Run: `npm run build` in `server/`
Expected: compiles with 0 errors.

---

### Task 2: Server — env config (bank, TTL, webhook secret)

**Files:**
- Modify: `server/src/config/index.ts`
- Modify: `server/.env`

**Interfaces:**
- Produces: `config.bank = { bin, accountNumber, accountName }`, `config.qrTtlMinutes`, `config.paymentWebhookSecret`.

- [ ] **Step 1: Add env keys to `.env`** (append; keep existing keys)

```
BANK_BIN=970418
BANK_ACCOUNT_NUMBER=123456789012
BANK_ACCOUNT_NAME=STORE 3D
QR_TTL_MINUTES=5
PAYMENT_WEBHOOK_SECRET=
```

- [ ] **Step 2: Extend `config`**

Add before the closing `} as const;`:

```ts
  bank: {
    bin: process.env.BANK_BIN || '',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
    accountName: process.env.BANK_ACCOUNT_NAME || '',
  },
  qrTtlMinutes: Number(process.env.QR_TTL_MINUTES) || 5,
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || '',
```

- [ ] **Step 3: Verify build**

Run: `npm run build` in `server/`
Expected: compiles with 0 errors.

---

### Task 3: Server — `qrcode` dep + VietQR service (TDD)

**Files:**
- Modify: `server/package.json` (test script)
- Create: `server/src/services/vietQrService.ts`
- Test: `server/tests/vietQr.test.ts`

**Interfaces:**
- Produces: `buildVietQrPayload(bank: {bin,accountNumber,accountName}, amount: number, content: string): string` (EMVCo TLV string), `renderQrDataUrl(payload: string): Promise<string>` (PNG data URL), `crc16(data: string): number`.

- [ ] **Step 1: Install dependencies**

Run in `server/`:
```bash
npm install qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: Write the failing test**

Create `server/tests/vietQr.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVietQrPayload, crc16, renderQrDataUrl } from '../src/services/vietQrService';

const bank = { bin: '970418', accountNumber: '123456789012', accountName: 'STORE 3D' };

test('buildVietQrPayload emits EMVCo-compliant payload', () => {
  const payload = buildVietQrPayload(bank, 150000, 'ST3D-ABCDEF');
  assert.ok(payload.startsWith('000201010212'));
  assert.ok(payload.includes('A000000727'));
  assert.ok(payload.includes('970418'));
  assert.ok(payload.includes('123456789012'));
  assert.ok(payload.includes('150000'));
  assert.ok(payload.includes('ST3D-ABCDEF'));
  assert.match(payload, /6304[0-9A-F]{4}$/);
});

test('crc16 matches reference CCITT value', () => {
  assert.equal(crc16('123456789'), 0x29b1);
});

test('renderQrDataUrl returns a PNG data URL', async () => {
  const url = await renderQrDataUrl('0002010102122615A0000007270124980123456');
  assert.ok(url.startsWith('data:image/png;base64,'));
  assert.ok(url.length > 100);
});
```

- [ ] **Step 3: Add the test script to `server/package.json`**

```json
    "test": "tsx --test tests/vietQr.test.ts tests/payment.test.ts",
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test` in `server/`
Expected: FAIL — `cannot find module '../src/services/vietQrService'`.

- [ ] **Step 5: Implement `server/src/services/vietQrService.ts`**

```ts
import QRCode from 'qrcode';

interface VietQrBank {
  bin: string;
  accountNumber: string;
  accountName: string;
}

function tlv(tag: string, value: string): string {
  const len = Buffer.byteLength(value, 'utf8');
  return `${tag}${String(len).padStart(2, '0')}${value}`;
}

/** CRC-16/CCITT (poly 0x1021, init 0xFFFF, non-reflected). */
export function crc16(data: string): number {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc & 0xffff;
}

export function buildVietQrPayload(bank: VietQrBank, amount: number, content: string): string {
  const merchantAccount =
    tlv('00', 'A000000727') + tlv('01', bank.bin) + tlv('02', bank.accountNumber);
  const billInfo = tlv('01', content);
  const withoutCrc =
    '000201010212' +
    tlv('26', merchantAccount) +
    tlv('52', '0000') +
    tlv('53', '704') +
    tlv('54', String(amount)) +
    tlv('58', 'VN') +
    tlv('59', bank.accountName) +
    tlv('62', billInfo);
  const crcHex = crc16(withoutCrc + '6304').toString(16).toUpperCase().padStart(4, '0');
  return `${withoutCrc}6304${crcHex}`;
}

export async function renderQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { width: 480, margin: 2, errorCorrectionLevel: 'M' });
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test` in `server/`
Expected: 3 tests PASS.

- [ ] **Step 7: Verify build**

Run: `npm run build` in `server/`
Expected: compiles with 0 errors.

---

### Task 4: Server — paymentService (TDD)

**Files:**
- Create: `server/src/services/paymentService.ts`
- Test: `server/tests/payment.test.ts`

**Interfaces:**
- Consumes: `config.bank`, `config.qrTtlMinutes`, `buildVietQrPayload`, `renderQrDataUrl`, `Order`, `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `AppError`.
- Produces: `generateOrderCode(): string` → `ST3D-XXXXXX` (uppercase hex); `validateReconcile(order: {status, qrExpiresAt?, total}, amount, now): {ok:true} | {ok:false, code, message}`; `paymentService.createQrForOrder(userId, orderId)`; `paymentService.markOrderPaid(orderCode, amount)`.

- [ ] **Step 1: Write the failing test**

Create `server/tests/payment.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateOrderCode, validateReconcile } from '../src/services/paymentService';

const base = { qrExpiresAt: new Date('2026-08-14T12:05:00.000Z'), total: 150000 };
const now = new Date('2026-08-14T12:00:00.000Z');

test('generateOrderCode returns ST3D-XXXXXX uppercase hex', () => {
  const code = generateOrderCode();
  assert.match(code, /^ST3D-[0-9A-F]{6}$/);
  assert.notEqual(code, generateOrderCode());
});

test('validateReconcile accepts pending_payment, valid expiry, exact amount', () => {
  const r = validateReconcile({ status: 'pending_payment', ...base }, 150000, now);
  assert.deepEqual(r, { ok: true });
});

test('validateReconcile is idempotent for already-paid orders', () => {
  const r = validateReconcile({ status: 'paid', qrExpiresAt: new Date(now.getTime() - 1), total: 0 }, 0, now);
  assert.deepEqual(r, { ok: true });
});

test('validateReconcile rejects non-pending orders', () => {
  const r = validateReconcile({ status: 'unpaid', ...base }, 150000, now);
  assert.equal(r.ok, false);
  assert.equal((r as { code: number }).code, 409);
});

test('validateReconcile rejects expired QR (server clock wins)', () => {
  const r = validateReconcile({ status: 'pending_payment', qrExpiresAt: new Date(now.getTime() - 1), total: 150000 }, 150000, now);
  assert.equal(r.ok, false);
  assert.equal((r as { code: number }).code, 400);
});

test('validateReconcile rejects missing expiry', () => {
  const r = validateReconcile({ status: 'pending_payment', total: 150000 }, 150000, now);
  assert.equal(r.ok, false);
});

test('validateReconcile rejects wrong amount', () => {
  const r = validateReconcile({ status: 'pending_payment', ...base }, 149999, now);
  assert.equal(r.ok, false);
  assert.equal((r as { code: number }).code, 400);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` in `server/`
Expected: FAIL — `cannot find module '../src/services/paymentService'`.

- [ ] **Step 3: Implement `server/src/services/paymentService.ts`**

```ts
import { randomBytes } from 'crypto';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../models';
import { AppError } from '../utils/AppError';
import { config } from '../config';
import { buildVietQrPayload, renderQrDataUrl } from './vietQrService';

export function generateOrderCode(): string {
  return `ST3D-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export interface ReconcileOrder {
  status: PaymentStatus | string;
  qrExpiresAt?: Date;
  total: number;
}

export type ReconcileResult =
  | { ok: true }
  | { ok: false; code: number; message: string };

export function validateReconcile(order: ReconcileOrder, amount: number, now: Date): ReconcileResult {
  if (order.status === PaymentStatus.Paid) return { ok: true };
  if (order.status !== PaymentStatus.PendingPayment) {
    return { ok: false, code: 409, message: 'Đơn hàng chưa tạo mã thanh toán' };
  }
  if (!order.qrExpiresAt || order.qrExpiresAt.getTime() <= now.getTime()) {
    return { ok: false, code: 400, message: 'Mã QR đã hết hạn' };
  }
  if (amount !== order.total) {
    return { ok: false, code: 400, message: 'Số tiền không khớp với đơn hàng' };
  }
  return { ok: true };
}

export class PaymentService {
  async createQrForOrder(userId: string, orderId: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
    if (String(order.user) !== userId) {
      throw new AppError('Không có quyền truy cập đơn hàng này', 403);
    }
    if (order.payment.method !== PaymentMethod.BankTransfer) {
      throw new AppError('Đơn hàng không dùng phương thức chuyển khoản', 400);
    }
    if (order.payment.status === PaymentStatus.Paid) {
      throw new AppError('Đơn hàng đã được thanh toán', 400);
    }
    if (!config.bank.accountNumber || !config.bank.accountName) {
      throw new AppError('Cấu hình tài khoản ngân hàng chưa được thiết lập', 500);
    }

    const now = new Date();
    const orderCode = order.payment.orderCode ?? generateOrderCode();
    const qrExpiresAt = new Date(now.getTime() + config.qrTtlMinutes * 60 * 1000);

    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          'payment.status': PaymentStatus.PendingPayment,
          'payment.orderCode': orderCode,
          'payment.qrExpiresAt': qrExpiresAt,
        },
      },
    );

    const qrDataUrl = await renderQrDataUrl(
      buildVietQrPayload(
        { bin: config.bank.bin, accountNumber: config.bank.accountNumber, accountName: config.bank.accountName },
        order.total,
        orderCode,
      ),
    );

    return {
      bank: {
        bin: config.bank.bin,
        accountNumber: config.bank.accountNumber,
        accountName: config.bank.accountName,
      },
      qrDataUrl,
      orderCode,
      amount: order.total,
      expiresAt: qrExpiresAt,
    };
  }

  async markOrderPaid(orderCode: string, amount: number) {
    const order = await Order.findOne({ 'payment.orderCode': orderCode });
    if (!order) throw new AppError('Không tìm thấy đơn hàng với mã chuyển khoản này', 404);

    const result = validateReconcile(
      { status: order.payment.status, qrExpiresAt: order.payment.qrExpiresAt, total: order.total },
      amount,
      new Date(),
    );
    if (!result.ok) throw new AppError(result.message, result.code);
    if (order.payment.status === PaymentStatus.Paid) return order;

    return Order.findByIdAndUpdate(
      order._id,
      {
        $set: {
          'payment.status': PaymentStatus.Paid,
          paidAt: new Date(),
          status: OrderStatus.Confirmed,
        },
      },
      { new: true },
    ).populate('items');
  }
}

export const paymentService = new PaymentService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` in `server/`
Expected: 10 tests PASS (3 VietQR + 7 payment).

- [ ] **Step 5: Verify build**

Run: `npm run build` in `server/`
Expected: compiles with 0 errors.

---

### Task 5: Server — payment routes + controller + mount

**Files:**
- Create: `server/src/routes/payment.ts`
- Modify: `server/src/controllers/orderController.ts`
- Modify: `server/src/routes/order.ts`
- Modify: `server/src/app.ts`

**Interfaces:**
- Consumes: `paymentService`, `config.paymentWebhookSecret`, `asyncHandler`, `successResponse`, `AppError`.
- Produces: `POST /api/payment/webhook`, `POST /api/payment/webhook/simulate` (404 in production), `POST /api/orders/:id/payment-qr` (auth + owner).

- [ ] **Step 1: Create `server/src/routes/payment.ts`**

```ts
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { config } from '../config';
import { paymentService } from '../services/paymentService';
import { successResponse } from '../utils/apiResponse';

const router = Router();

router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    if (config.paymentWebhookSecret && req.headers['x-payment-signature'] !== config.paymentWebhookSecret) {
      throw new AppError('Chữ ký webhook không hợp lệ', 401);
    }
    const { orderCode, amount } = req.body ?? {};
    await paymentService.markOrderPaid(String(orderCode ?? ''), Number(amount));
    return successResponse(res, { status: 'success' }, { message: 'Thanh toán được xác nhận' });
  }),
);

router.post(
  '/webhook/simulate',
  asyncHandler(async (req, res) => {
    if (config.env === 'production') throw new AppError('Không tìm thấy trang', 404);
    const { orderCode, amount } = req.body ?? {};
    await paymentService.markOrderPaid(String(orderCode ?? ''), Number(amount));
    return successResponse(res, { status: 'success' }, { message: 'Thanh toán được xác nhận' });
  }),
);

export default router;
```

- [ ] **Step 2: Add controller method in `server/src/controllers/orderController.ts`**

Add import and method:

```ts
import { paymentService } from '../services/paymentService';
```

```ts
  /** Customer: generate a VietQR payment code for their order. */
  createPaymentQr: asyncHandler(async (req: AuthRequest, res: Response) => {
    const qr = await paymentService.createQrForOrder(req.user!._id, req.params.id);
    return successResponse(res, qr, { message: 'Tạo mã QR thanh toán thành công' });
  }),
```

- [ ] **Step 3: Register the route in `server/src/routes/order.ts`**

Add after the `GET /:id` line:

```ts
router.post('/:id/payment-qr', requireAuth, orderController.createPaymentQr);
```

- [ ] **Step 4: Mount `/api/payment` in `server/src/app.ts`**

Add import:

```ts
import paymentRoutes from './routes/payment';
```

Add next to the other mounts:

```ts
  app.use('/api/payment', paymentRoutes);
```

- [ ] **Step 5: Verify build**

Run: `npm run build` in `server/`
Expected: compiles with 0 errors.

- [ ] **Step 6: Smoke test the webhook (requires dev server running)**

Run (PowerShell, replace `<orderCode>` with a code from Task 10):
```bash
$body = @{ orderCode = '<orderCode>'; amount = 150000 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/payment/webhook/simulate -ContentType 'application/json' -Body $body
```
Expected: JSON with `success: true`. Repeat with `amount = 1` → 400 with `message: 'Số tiền không khớp với đơn hàng'`.

---

### Task 6: Client — types + paymentApi + badge

**Files:**
- Modify: `client/src/types/index.ts`
- Modify: `client/src/services/index.ts`
- Modify: `client/src/components/order/order-status-badge.tsx`

**Interfaces:**
- Produces: `PaymentStatus = 'unpaid' | 'pending_payment' | 'paid'`; `Order.payment.orderCode?/qrExpiresAt?`, `Order.paidAt?`; `paymentApi.generateQr(orderId)` and `paymentApi.simulateWebhook(orderCode, amount)`.

- [ ] **Step 1: Update `client/src/types/index.ts`**

```ts
export type PaymentStatus = 'unpaid' | 'pending_payment' | 'paid'
```

In `Order.payment`:

```ts
  payment: {
    method: PaymentMethod
    status: PaymentStatus
    orderCode?: string
    qrExpiresAt?: string
  }
  paidAt?: string
```

- [ ] **Step 2: Add `paymentApi` to `client/src/services/index.ts`**

Add at the end of the file:

```ts
export interface QrPaymentInfo {
  bank: { bin: string; accountNumber: string; accountName: string }
  qrDataUrl: string
  orderCode: string
  amount: number
  expiresAt: string
}

export const paymentApi = {
  generateQr: (orderId: string) =>
    apiClient.post<ApiResponse<QrPaymentInfo>>(`/orders/${orderId}/payment-qr`).then((r) => r.data.data),

  simulateWebhook: (orderCode: string, amount: number) =>
    apiClient.post<ApiResponse<{ status: string }>>('/payment/webhook/simulate', { orderCode, amount }).then((r) => r.data.data),
}
```

- [ ] **Step 3: Update `client/src/components/order/order-status-badge.tsx`**

Replace `PAYMENT_LABELS` and the `PaymentStatusBadge` body:

```ts
const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
  pending_payment: 'Chờ thanh toán',
}

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  paid: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  unpaid: 'border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  pending_payment: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className={PAYMENT_STYLES[status] ?? ''}>
      {PAYMENT_LABELS[status] ?? status}
    </Badge>
  )
}
```

- [ ] **Step 4: Verify client**

Run: `npm run build` then `npm run lint` in `client/`
Expected: build OK, lint 0 errors (pre-existing warnings allowed).

---

### Task 7: Client — checkout routes bank-transfer to QR page

**Files:**
- Modify: `client/src/pages/checkout-page.tsx`

**Interfaces:**
- Consumes: `orderApi.create`, `useCart().clearCart`, `useNavigate`. No new service calls.
- Produces: bank-transfer orders navigate to `/thanh-toan-qr/:id`.

- [ ] **Step 1: Update `onSubmit`**

Replace:

```ts
      const order = await orderApi.create(payload)
      clearCart()
      navigate(`/thanh-toan-thanh-cong/${order._id}`)
```

with:

```ts
      const order = await orderApi.create(payload)
      clearCart()
      if (order.payment.method === 'bank-transfer') {
        navigate(`/thanh-toan-qr/${order._id}`)
      } else {
        navigate(`/thanh-toan-thanh-cong/${order._id}`)
      }
```

- [ ] **Step 2: Verify client**

Run: `npm run build` then `npm run lint` in `client/`
Expected: build OK, lint 0 errors.

---

### Task 8: Client — QR payment page + route

**Files:**
- Create: `client/src/pages/qr-payment-page.tsx`
- Modify: `client/src/App.tsx`

**Interfaces:**
- Consumes: `paymentApi.generateQr`, `orderApi.getById`, `getErrorMessage`, `Button`, `formatCurrency`, `toast`.
- Produces: route `/thanh-toan-qr/:id` (lazy, protected).

- [ ] **Step 1: Create `client/src/pages/qr-payment-page.tsx`**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Copy, Loader2, QrCode, RefreshCw, XCircle } from 'lucide-react'
import { orderApi, paymentApi, type QrPaymentInfo } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib'

type QrState = 'loading' | 'waiting' | 'paid' | 'expired' | 'failed'

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export default function QrPaymentPage() {
  const { id = '' } = useParams()
  const [state, setState] = useState<QrState>('loading')
  const [qr, setQr] = useState<QrPaymentInfo | null>(null)
  const [error, setError] = useState('')
  const [remainingMs, setRemainingMs] = useState(0)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const generate = useCallback(async () => {
    setState('loading')
    setError('')
    try {
      const info = await paymentApi.generateQr(id)
      setQr(info)
      setRemainingMs(new Date(info.expiresAt).getTime() - Date.now())
      setState('waiting')
    } catch (err) {
      setError(getErrorMessage(err))
      setState('failed')
    }
  }, [id])

  useEffect(() => {
    void generate()
    return stopPolling
  }, [generate, stopPolling])

  useEffect(() => {
    if (state !== 'waiting') return
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const order = await orderApi.getById(id)
        if (order.payment.status === 'paid') {
          stopPolling()
          setState('paid')
        }
      } catch {
        // transient error — keep polling
      }
    }, 3000)
    return stopPolling
  }, [state, id, stopPolling])

  useEffect(() => {
    if (state !== 'waiting' || !qr) return
    const timer = setInterval(() => {
      const left = new Date(qr.expiresAt).getTime() - Date.now()
      setRemainingMs(left)
      if (left <= 0) {
        stopPolling()
        setState('expired')
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [state, qr, stopPolling])

  const copyCode = async () => {
    if (!qr) return
    try {
      await navigator.clipboard.writeText(qr.orderCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Không thể sao chép, vui lòng chép thủ công')
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-12 sm:px-6">
      <Link to="/san-pham" className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" />
        Tiếp tục mua sắm
      </Link>

      {state === 'loading' && (
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="text-primary size-10 animate-spin" />
          <p>Đang tạo mã thanh toán...</p>
        </div>
      )}

      {state === 'failed' && (
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <XCircle className="text-destructive mx-auto size-12" />
          <h1 className="mt-4 text-lg font-bold">Thanh toán thất bại</h1>
          <p className="text-muted-foreground mt-1 text-sm">{error || 'Không thể xác nhận giao dịch. Vui lòng thử lại.'}</p>
          <Button className="mt-6 w-full" onClick={() => void generate()}>
            Thử lại
          </Button>
        </div>
      )}

      {state === 'paid' && (
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
          <h1 className="mt-4 text-lg font-bold">Thanh toán thành công!</h1>
          <p className="text-muted-foreground mt-1 text-sm">Đơn hàng của bạn đã được xác nhận.</p>
          <div className="mt-6 grid gap-2">
            <Button asChild>
              <Link to="/tai-khoan/don-hang">Xem đơn hàng</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/san-pham">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </div>
      )}

      {state === 'expired' && (
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <XCircle className="text-destructive mx-auto size-12" />
          <h1 className="mt-4 text-lg font-bold">Mã QR đã hết hạn</h1>
          <p className="text-muted-foreground mt-1 text-sm">Mã QR đã hết hạn. Vui lòng tạo mã thanh toán mới.</p>
          <Button className="mt-6 w-full" onClick={() => void generate()}>
            <RefreshCw className="mr-2 size-4" />
            Tạo mã QR mới
          </Button>
        </div>
      )}

      {state === 'waiting' && qr && (
        <div className="w-full rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <QrCode className="size-5" />
            </div>
            <div>
              <h1 className="font-bold">Thanh toán bằng mã QR</h1>
              <p className="text-muted-foreground text-xs">Chuyển khoản ngân hàng</p>
            </div>
          </div>

          <div
            className={`mx-auto w-fit rounded-xl border px-4 py-1.5 text-sm font-semibold tabular-nums ${
              remainingMs <= 60000
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-primary/30 bg-primary/5 text-primary'
            }`}
          >
            Mã QR sẽ hết hạn sau: {formatCountdown(remainingMs)}
          </div>

          <div className="my-5 flex justify-center">
            <div className="rounded-2xl border bg-white p-3">
              <img src={qr.qrDataUrl} alt="Mã thanh toán" className="size-56" />
            </div>
          </div>

          <p className="text-muted-foreground mb-4 text-center text-sm">Vui lòng quét mã QR và hoàn tất chuyển khoản.</p>

          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <BankRow label="Ngân hàng" value={qr.bank.accountName} />
            <BankRow label="Số tài khoản" value={qr.bank.accountNumber} />
            <BankRow label="Chủ tài khoản" value={qr.bank.accountName} />
            <BankRow label="Số tiền" value={formatCurrency(qr.amount)} />
            <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
              <span className="text-muted-foreground">Nội dung CK</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold">
                {qr.orderCode}
                <button onClick={() => void copyCode()} className="text-primary hover:text-primary/80" aria-label="Sao chép mã chuyển khoản">
                  <Copy className="size-4" />
                </button>
                {copied && <span className="text-emerald-600">Đã chép</span>}
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Giữ nguyên nội dung chuyển khoản. Đơn hàng sẽ được xác nhận tự động sau khi ngân hàng báo giao dịch thành công.
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Register the route in `client/src/App.tsx`**

Add lazy import after `OrderSuccessPage`:

```ts
const QrPaymentPage = lazy(() => import('@/pages/qr-payment-page'))
```

Add inside the `ProtectedRoute` block, next to the success route:

```tsx
                  <Route path="thanh-toan-qr/:id" element={<QrPaymentPage />} />
```

- [ ] **Step 3: Verify client**

Run: `npm run build` then `npm run lint` in `client/`
Expected: build OK, lint 0 errors.

---

### Task 9: Client — restore original categories layout

**Files:**
- Modify: `client/src/pages/home-page.tsx`
- Delete: `client/src/components/home/categories-section.tsx`

**Interfaces:**
- Consumes: `categoryApi.all` (unchanged), `cn`, `resolveImageUrl`, `Layers` icon.
- Produces: original inline categories grid (first = wide gradient banner, rest = square cards).

- [ ] **Step 1: Restore imports in `client/src/pages/home-page.tsx`**

Remove:

```ts
import { CategoriesSection } from '@/components/home/categories-section'
```

Change the lucide import line to add `Layers`:

```ts
import { ArrowRight, Box, Layers, Printer, Sparkles, Truck } from 'lucide-react'
```

- [ ] **Step 2: Restore `CATEGORY_ACCENTS`**

Add right after the `HeroShowcase` function:

```ts
const CATEGORY_ACCENTS = [
  'from-rose-500/70 to-orange-500/50',
  'from-cyan-500/70 to-blue-600/50',
  'from-emerald-500/70 to-teal-600/50',
  'from-violet-500/70 to-purple-600/50',
  'from-amber-500/70 to-orange-500/50',
  'from-blue-500/70 to-indigo-600/50',
]
```

- [ ] **Step 3: Replace the categories section body**

Replace the whole `{/* Categories */}` section (the `section` block that currently renders `<CategoriesSection categories={categories} />`) with the original block from commit `6a46c97`:

```tsx
      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Danh mục sản phẩm</h2>
              <p className="text-muted-foreground mt-1">Khám phá theo danh mục bạn yêu thích</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat, i) => {
              const accent = CATEGORY_ACCENTS[i % CATEGORY_ACCENTS.length]
              if (i === 0) {
                return (
                  <Link
                    key={cat._id}
                    to={`/san-pham?categorySlug=${cat.slug}`}
                    className={cn(
                      'group relative col-span-2 flex min-h-44 flex-col justify-end overflow-hidden rounded-2xl border bg-gradient-to-br p-5 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl sm:col-span-2 lg:col-span-3',
                      accent
                    )}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-25">
                      {cat.image ? (
                        <img src={resolveImageUrl(cat.image)} alt="" className="size-40 object-cover" />
                      ) : (
                        <Layers className="size-24" />
                      )}
                    </div>
                    <span className="relative text-lg font-bold drop-shadow">{cat.name}</span>
                    {cat.description && (
                      <span className="relative line-clamp-2 text-xs text-white/80">{cat.description}</span>
                    )}
                  </Link>
                )
              }
              return (
                <Link
                  key={cat._id}
                  to={`/san-pham?categorySlug=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-4 text-center transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="bg-muted relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg">
                    {cat.image ? (
                      <img
                        src={resolveImageUrl(cat.image)}
                        alt={cat.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <Layers className="text-muted-foreground size-8" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{cat.name}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
```

- [ ] **Step 4: Delete the mosaic component**

Run in `client/`:
```bash
Remove-Item src/components/home/categories-section.tsx
```

- [ ] **Step 5: Verify client**

Run: `npm run build` then `npm run lint` in `client/`
Expected: build OK, lint 0 errors (no unused import warnings for removed code).

---

### Task 10: Integration verification

**Files:** none (manual verification only).

**Interfaces:**
- End-to-end: checkout → QR page → simulate webhook → order `paid`/`confirmed`; categories restored.

- [ ] **Step 1: Restart both dev servers**

Run in `server/`: `npm run dev`. Run in `client/`: `npm run dev`.
Expected: `GET http://localhost:5000/api/health` returns `{ success: true, data: { status: 'ok' } }`; `http://localhost:5173` loads.

- [ ] **Step 2: Create a bank-transfer order (via UI or seed)**

Use the existing checkout UI: add a product, choose "Chuyển khoản ngân hàng", place order.
Expected: navigates to `/thanh-toan-qr/<orderId>`; QR image, bank rows, amount, orderCode and countdown render; copy button copies the code.

- [ ] **Step 3: Check order state before payment**

`GET http://localhost:5000/api/orders/<orderId>` (authorized cookie) →
`data.payment.status === 'pending_payment'`, `data.payment.orderCode` matches QR, `qrExpiresAt` is ~now+5min.

- [ ] **Step 4: Simulate successful payment**

```bash
$body = @{ orderCode = '<orderCode>'; amount = <total> } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/payment/webhook/simulate -ContentType 'application/json' -Body $body
```
Expected: `success: true`. Within ~3s the QR page flips to "Thanh toán thành công! Đơn hàng của bạn đã được xác nhận." without refresh.
Re-fetch order → `payment.status === 'paid'`, `paidAt` set, `status === 'confirmed'`.

- [ ] **Step 5: Edge cases (fresh order each time)**

- Wrong amount → `/webhook/simulate` returns 400 "Số tiền không khớp...", order stays `pending_payment`, QR page stays waiting.
- Wrong orderCode → 404 "Không tìm thấy đơn hàng...", no state change.
- Expired QR (set `QR_TTL_MINUTES=1` or wait 5 min) → simulate returns 400 "Mã QR đã hết hạn", order stays `pending_payment`, UI shows expired state with "Tạo mã QR mới"; clicking it regenerates (same orderCode, new expiry).
- Paid near expiry → server clock wins; reconcile either confirms or rejects based on `qrExpiresAt > now`.
- Another person pays a valid tx → reconcile matches orderCode+amount with no user check → order confirmed.
- Reload mid-wait → page resumes from stored `expiresAt`; shows paid if already confirmed.

- [ ] **Step 6: Verify categories restore**

Home page at desktop + mobile (390px): first category is the wide gradient banner (spans 2 cols mobile / 3 on lg), remaining categories are square image cards. Category links filter `/san-pham?categorySlug=<slug>` correctly. Hot Sale / featured / hero unchanged.

- [ ] **Step 7: Full check pass**

Run in `server/`: `npm run build` + `npm test`. Run in `client/`: `npm run build` + `npm run lint`.
Expected: all green.

---

## Self-Review

- **Spec coverage:** Every section of the approved spec maps to a task: A→Task 9, B→Task 1, C→Tasks 3–4, D→Task 5, E→Task 2, F→Task 6, G→Task 7, H→Task 8, I→Tasks 4 + 10. `getQrStatus` from the spec is intentionally omitted — the spec's own polling design (section H) reuses `GET /api/orders/:id`, making a separate status endpoint dead code.
- **Placeholder scan:** Every code step contains full code; test files are complete; no TBD/TODO.
- **Type consistency:** `PaymentStatus` union `'unpaid' | 'pending_payment' | 'paid'` used identically in server enum (`PendingPayment`) and client type. `markOrderPaid`/`createQrForOrder` return shapes match `QrPaymentInfo` used by the QR page. `generateOrderCode` regex `ST3D-[0-9A-F]{6}` is asserted in tests and matched by `randomBytes(3).toString('hex').toUpperCase()` (3 bytes = 6 hex chars). `validateReconcile` signature matches the reconciler usage in `markOrderPaid`.
- **Index caveat:** the sparse unique index on `payment.orderCode` only affects new writes; no migration needed since `orderCode` is `undefined` for existing orders.
