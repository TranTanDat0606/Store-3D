# QR Bank-Transfer Payment + Categories Restore — Design Doc

Date: 2026-08-14
Status: Approved

## Problem

1. **Categories UI drifted** from the original design. The asymmetric mosaic
   (`categories-section.tsx`) replaced the project's original category layout
   (first card = wide gradient banner, rest = square image cards). The original
   look must be restored without touching data, APIs, or other home sections.

2. **Bank-transfer checkout is not a real payment flow.** Today
   `orderApi.create` with `paymentMethod: 'bank-transfer'` simply creates an
   unpaid order and navigates to a static success page. There is no QR, no
   order code, no expiry, and no backend confirmation of the transfer. The user
   wants a VietQR payment flow: QR generated from real order data, a 5-minute
   countdown, automatic confirmation when the bank confirms the transfer, and a
   frontend that updates **without refresh** — with the backend as the only
   authority for `paid`.

## Constraints (user-mandated)

- Keep ALL existing logic, project structure, and working features (cart,
  checkout, order, auth, admin). Do not rewrite the project.
- Frontend must NEVER mark an order paid on its own. `paid`/`confirmed` come
  only from the backend reconciling a payment/webhook callback.
- Reuse the existing order/payment architecture where it exists; do not build a
  parallel payment system.
- Since no real payment gateway/bank API exists yet, create an architecture
  ready for a real webhook later, plus a DEV-only simulation path that runs the
  *exact same* server-side reconcile logic a real webhook would call.
- UI must stay consistent with the current theme (ocean-blue glass, premium).
- QR payment UX must be clear, modern, and mobile-first.
- Countdown must be exact; frontend must auto-flip to "Đơn hàng đã xác nhận"
  when the backend confirms.
- One new server dependency is allowed: `qrcode` (approved).

## Approved decisions (Q&A)

- QR generation: **server builds standard VietQR content from real order data**
  (amount + orderCode) and renders it with the `qrcode` package (data URL).
- Bank account info: **env-driven** (`BANK_BIN`, `BANK_ACCOUNT_NUMBER`,
  `BANK_ACCOUNT_NAME`) — no fake constants in code.
- Status sync: **frontend polls `GET /api/orders/:id` every 3s** while the QR
  screen is open (no new infra).
- Webhook: **real webhook route + DEV-only simulation endpoint** sharing the
  same `markOrderPaid(orderCode, amount)` reconciler.

## Design decisions

### A. Categories restore (client)

`client/src/pages/home-page.tsx` — restore the **original** categories block:

- Section wrapper: `mx-auto max-w-7xl px-4 py-16 sm:px-6` with the original
  heading ("Danh mục sản phẩm" / "Khám phá theo danh mục bạn yêu thích").
- Grid: `grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6`.
- **First category** (`i === 0`): wide gradient banner card
  (`col-span-2 sm:col-span-2 lg:col-span-3`, min-h-44, rounded-2xl, gradient
  accent from `CATEGORY_ACCENTS`, image watermark at opacity-25, name +
  description over gradient, `group hover:-translate-y-1`).
- **Other categories**: square card (`rounded-xl border bg-card p-4`, aspect
  square image with `group-hover:scale-110`, name below).
- Data/navigation identical: `to=/san-pham?categorySlug=${cat.slug}`,
  `resolveImageUrl`, `Layers` fallback.
- `CATEGORY_ACCENTS` array restored (6 gradient pairs).
- Remove `CategoriesSection` import; delete the now-unused
  `client/src/components/home/categories-section.tsx`.
- `HotSaleSection`, `ProductCard`, hero, features sections stay exactly as-is.

### B. Backend — Order model + payment status (server)

`server/src/models/Order.ts`:

- Extend `PaymentStatus`: `unpaid`, `pending_payment`, `paid`.
- Add to `payment`: `orderCode?: string` (indexed, `ST3D-XXXXXX`), `qrExpiresAt?: Date`.
- Add `paidAt?: Date`.

State machine (backend-owned):

```
unpaid ──(payment-qr created)──▶ pending_payment
pending_payment ──(webhook reconcile ok)──▶ paid  (also sets status=confirmed, paidAt)
pending_payment ──(expired / mismatch)──▶ stays pending_payment (QR invalid)
unpaid (COD) ── unchanged, fulfillment drives order.status
```

### C. Backend — payment service + VietQR (server)

- `server/src/services/vietQrService.ts`: builds the standard VietQR payload
  (bank BIN, account number, account name, amount, orderCode) and returns a QR
  data URL via the `qrcode` package.
- `server/src/services/paymentService.ts`: 
  - `generateOrderCode()` → `ST3D-` + 6 uppercase hex.
  - `createQrForOrder(userId, orderId)` → ownership check; order must be
    `bank-transfer` and not yet paid; set `payment.status=pending_payment`,
    `payment.orderCode`, `payment.qrExpiresAt = now + QR_TTL_MINUTES`;
    return `{ bank, qrDataUrl, orderCode, amount: order.total, expiresAt }`.
  - `markOrderPaid(orderCode, amount)` → **the reconciler**:
    - find order by `payment.orderCode` (exact).
    - if already `paid` → idempotent success (no double-processing).
    - require `payment.status === 'pending_payment'` (else 409/400).
    - require `payment.qrExpiresAt > now` (expired → 400, no state change).
    - require `amount === order.total` (mismatch → 400, no state change).
    - within one atomic update: set `payment.status='paid'`, `paidAt=now`,
      `order.status='confirmed'`.
  - `getQrStatus(orderId, userId)` → minimal public status for polling.

### D. Backend — routes (server)

`server/src/routes/payment.ts` (mounted at `/api/payment` in `app.ts`):

- `POST /api/orders/:id/payment-qr` (requireAuth + owner) → `paymentService.createQrForOrder`.
- `POST /api/payment/webhook` (no auth; gateway signature future-proofed via
  optional `PAYMENT_WEBHOOK_SECRET` header check) → body `{ orderCode, amount,
  status: 'success' }` → `paymentService.markOrderPaid`.
- `POST /api/payment/webhook/simulate` (DEV only — 404 when
  `NODE_ENV === 'production'`) → same reconciler, enables end-to-end testing.
- `GET /api/orders/:id` (existing) → used by frontend polling (auth + owner).

`server/src/app.ts`: mount `app.use('/api/payment', paymentRoutes)`.

### E. Backend — env (server)

Add to `.env` + `server/src/config/index.ts`:
`BANK_BIN`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_NAME`,
`QR_TTL_MINUTES` (default 5), `PAYMENT_WEBHOOK_SECRET` (optional).

### F. Frontend — types + API (client)

`client/src/types/index.ts`:
- `PaymentStatus = 'unpaid' | 'pending_payment' | 'paid'`
- `Order.payment` gains `orderCode?: string`, `qrExpiresAt?: string`,
  `paidAt?: string`.

`client/src/services/index.ts` (or new `paymentApi.ts`):
- `paymentApi.generateQr(orderId)` → `POST /orders/:id/payment-qr`.
- `paymentApi.simulateWebhook(orderId)` → `POST /payment/webhook/simulate`
  (used only in dev testing).
- `orderApi.getById` (existing) reused for polling.

### G. Frontend — checkout flow (client)

`client/src/pages/checkout-page.tsx`:
- After `orderApi.create` succeeds:
  - `cash` → `navigate('/thanh-toan-thanh-cong/:id')` (unchanged).
  - `bank-transfer` → `navigate('/thanh-toan-qr/:orderId')`.
- Order summary/payment-method UI unchanged.

### H. Frontend — QR payment page (client)

`client/src/pages/qr-payment-page.tsx`, route `/thanh-toan-qr/:id`
(added in `client/src/App.tsx`):

- On mount (and "Tạo mã QR mới"): call `paymentApi.generateQr(orderId)`.
- Renders: bank name + account number + holder, QR image (data URL), amount,
  transfer content (`orderCode`, copy button), countdown.
- Countdown: derived from `payment.qrExpiresAt` (server time); format
  `Mã QR sẽ hết hạn sau: MM:SS`. When it reaches 0 → expired state.
- Poll `orderApi.getById` every 3s while `payment.status === 'pending_payment'`
  and not expired; stop on unmount / paid.
- States + exact copy:
  - **Đang chờ thanh toán**: "Vui lòng quét mã QR và hoàn tất chuyển khoản."
  - **Đã nhận thanh toán** (paid): "Thanh toán thành công! Đơn hàng của bạn đã
    được xác nhận." + CTA to order list / continue shopping.
  - **QR hết hạn**: "Mã QR đã hết hạn. Vui lòng tạo mã thanh toán mới." +
    "Tạo mã QR mới" button (regenerates QR, extends expiry, same orderCode).
  - **Thanh toán thất bại** (reconcile rejected): "Không thể xác nhận giao
    dịch. Vui lòng thử lại."
- Reload mid-wait: on mount re-fetch order; if still `pending_payment` →
  generate/reuse QR; if `paid` → success; if expired → expired UI.
- Styling matches current theme (glass, ocean accent, mobile-first).

### I. Edge cases (verified in testing)

1. Paid while QR valid → poll flips UI to success (no refresh).
2. QR expires before pay → expired UI; "Tạo mã QR mới" regenerates.
3. Paid near expiry → reconciler checks `qrExpiresAt > now` (server time wins).
4. Wrong amount → webhook/simulate returns 400, state stays `pending_payment`.
5. Wrong content → orderCode not found → 404/400, no state change.
6. Another person pays a valid tx → reconciler matches orderCode+amount (no
   user check) → order confirmed.
7. Reload mid-wait → page resumes from stored `expiresAt`; shows paid if done.

## Out of scope

- Real gateway/bank signature verification (a placeholder
  `PAYMENT_WEBHOOK_SECRET` hook is left for future wiring).
- Email/notification on payment success.
- Admin payment-status UI changes beyond what already exists.

## Testing plan

- `server`: `npm run build` + `npm run dev`; hit `/api/payment/webhook/simulate`
  with valid/invalid amount + expired QR + wrong orderCode; assert order state.
- `client`: `npm run build`, `npm run lint`; headless/CDP smoke test: checkout →
  QR page renders bank+QR+countdown → simulate webhook → UI auto-flips to
  success; verify expired state and "Tạo mã QR mới".
- Verify categories restore on home page (original banner + square cards) at
  desktop and mobile.
