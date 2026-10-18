# Plan 4 Survey — Auth / Checkout / Account / Payment / Game (2026-10-18)

Read-only survey on branch **`dev` @ `bdf54fd`** (`git branch --show-current` → `dev`; no checkout/stash/worktree ops run, no source modified).
Design truth = `.stitch/metadata.json` (40 screens, GATE 1 v2) + `.stitch/designs/*` + `.stitch/DESIGN.md`. Foundation (Plan 2) + Storefront (Plan 3) = DONE, not re-surveyed. Binding contract = `docs/superpowers/plans/2026-10-17-backend-trust-track.md:37-45`.

## 1. Design screen inventory — Plan 4 set (html+png pairs in `.stitch/designs/`)

1. **`login`** — "Đăng nhập & Đăng ký" (metadata.json `slug: login`, supersede `9aa02c4…` id `5527d204…`).
   - Split screen: left marketing rail (3 benefit h2: "Thành viên nhận mã giảm giá riêng" / "Theo dõi đơn hàng mọi lúc" / "Lưu danh sách yêu thích"), right auth card.
   - Two tabs in ONE screen: `Đăng nhập` (Email + Mật khẩu, eye toggle) and `Đăng ký` (Họ và tên, Email, Số điện thoại, Mật khẩu, Xác nhận mật khẩu).
   - **No social login, no forgot/reset-password screen anywhere in the 40-screen index** (grep of `metadata.json`/`login.html` → 0 hits for Google/Zalo/quên mật khẩu).
2. **`checkout`** — "Thanh toán (COD & VietQR)" (supersede `ac8c685…`).
   - Single page, numbered sections (no wizard): `Thông tin nhận hàng` → `Phương thức thanh toán` → `Đơn hàng của bạn`.
   - Address: history selector (`Lịch sử địa chỉ`, `Chọn địa chỉ`, `Thêm địa chỉ giao hàng mới`) + full VN field set: Tỉnh/Thành, Quận/Huyện, Phường/Xã, Địa chỉ cụ thể, Họ tên, SĐT, Email ("nhận mã kích hoạt bảo hành 3D & Hóa đơn VAT"), Ghi chú vận chuyển.
   - Payment = exactly 2 radio: `Chuyển khoản VietQR (Khuyến nghị)` / `Thanh toán tiền mặt khi nhận hàng (COD)` — matches metadata `businessAccuracyPass.rules[0]` (Visa/Mastercard/MoMo/VNPay badges removed).
   - Summary: `Tạm tính (n sản phẩm)` + voucher row (`Giảm giá voucher`, "Mã giảm giá SALE10: Giảm 10% tối đa 100.000₫") + `Phí vận chuyển toàn quốc → 0₫ (Miễn phí)` ("Miễn phí cho đơn hàng từ 500.000₫" tooltip) + `TỔNG CỘNG THANH TOÁN`.
3. **`checkout-states`** — "Checkout — dialog thêm địa chỉ + banner lỗi tồn kho" (supersede `b92b336…`).
   - Same page in states: numbered `1. Địa chỉ nhận hàng`, `2. Phương thức thanh toán`; `Cảnh báo tồn kho mô hình` banner + `Cập nhật lại giỏ hàng` recovery.
   - Modal `Thêm địa chỉ nhận hàng mới` with required fields `*` + `Đặt làm địa chỉ nhận hàng mặc định` + `Hủy`/`Lưu địa chỉ`.
   - Order summary sidebar with `Xác nhận đặt hàng` CTA, `Gửi` note action; footer trust blocks (`Vệ chống gian lận`, `Hỗ trợ khách hàng`).
4. **`qr-payment`** — "Trang thanh toán VietQR (đếm giờ, polling)" (supersede `1914789…`).
   - `Quét mã VietQR để thanh toán` QR image + countdown + manual transfer block (Ngân hàng / Số tài khoản / Chủ tài khoản / Số tiền / Nội dung `ST3D-…`) with 3 `Sao chép` buttons.
   - Actions: `Tôi đã chuyển khoản`, `Hủy đơn hàng`; order code heading `ST3D-2026-0142`, line items listed.
5. **`order-success`** — "Đặt hàng thành công + CTA đánh giá/mini-game".
   - `Đặt hàng thành công!` + copy mã + `Tiến trình xử lý đơn hàng` 4-node timeline (Chờ xác nhận → Đã xác nhận → Đang giao → Hoàn tất).
   - Blocks: `Chi tiết mô hình đặt chủ tịch (n)`, `Địa chỉ nhận hàng`, `Phương thức thanh toán`, then two CTA rows: `Đánh giá sản phẩm khi nhận hàng - nhận mã giảm giá` and `Chơi mini-game nhận thưởng` (`Chơi ngay`).
6. **`review-form`** — "Form đánh giá (sao + ảnh, chưa đơn hoàn tất)".
   - Product header + `Đánh giá tổng quan chất lượng mô hình *` (5 star buttons) + `Nội dung nhận xét *` textarea + quick-tag chips (`+ Đậm nét sắc sảo`, `+ Màu sơn tinh xảo`, `+ Đóng gói kỹ`, `+ Giao hàng đúng hẹn`) + `+ Thêm ảnh (Tối đa 5 ảnh)` + `Gửi đánh giá`.
   - Success state `Gửi đánh giá thành công!`; title implies **eligibility gate** (only completed orders).
7. **`account-dashboard`** — "Tài khoản — Tổng quan": sidebar + breadcrumb; `Xin chào, {user}`; `Đơn hàng gần nhất` (3 cards), `Sản phẩm yêu thích (4)`, `Mã giảm giá (3)`, `Cập nhật hồ sơ`, collection/trust footer blocks.
8. **`account-orders`** — "Tài khoản — Đơn hàng + timeline": `Đơn hàng của tôi · Tổng cộng: 12 đơn`; status filter chips `Tất cả (12) / Chờ xác nhận (1) / Đang xử lý (2) / Đang giao hàng (1) / Hoàn tất (7) / Đã hủy (1)`; per-card actions `Hủy đơn hàng`, `Xem chi tiết đơn`, `Thanh toán ngay` (QR), `Đánh giá sản phẩm`, `Mua lại`, `Xem hóa đơn VAT`, `Mua lại toàn bộ đơn`; inline `Tiến trình xử lý & Chờ cốc mô hình` timeline; pagination.
9. **`account-coupons`** — "Tài khoản — Mã giảm giá": input `Thêm mã giảm giá mới vào ví` + `Áp dụng`; tabs `Đang hiệu lực (3) / Đã sử dụng (1) / Hết hạn (1)`; cards with `Sao chép mã` (incl. "Quà tặng Mini-game" coupon); `Quy định sử dụng voucher` block → maps to `GET /rewards/my-coupons`.
10. **`account-wishlist`** — "Tài khoản — Yêu thích": `Thêm tất cả vào giỏ hàng`, product cards (image/cart/favorite), `Đặt in 48h` badge, `Bạn có file 3D muốn in riêng? → Gửi file in 3D`.
11. **`account-profile`** — "Tài khoản — Hồ sơ + địa chỉ mặc định": avatar (`Đổi ảnh`/`Tải ảnh mới`/`Xóa`) + `Thông tin tài khoản` (Họ và tên*, Địa chỉ email*, Số điện thoại*, Ngày sinh, Giới tính) + `Lưu thay đổi`/`Hủy bỏ`; `Địa chỉ mặc định` 4-field VN block + `Đặt làm địa chỉ mặc định khi đặt mua mô hình`; `Đổi mật khẩu tài khoản` section link (⇒ current `/tai-khoan/mat-khau` route).
12. **`mini-game-modal`** — "Mini-game nhận thưởng (modal sau mua)": post-order overlay `Đặt hàng thành công!` + `Trạng thái xử lý đơn hàng` + `Mini-game: Đập hộp nhận thưởng` + result `Bạn đã nhận được mã: REWARD-10` + `Sao chép mã` / `Về đơn hàng` / `Xem mã giảm giá`.
13. **`overlays-spec`** — cross-plan spec (login prompt `Đăng nhập để tiếp tục` → `Đăng nhập ngay` / `Đóng & Tiếp tục duyệt sản phẩm`, cancel-order dialog `Hủy đơn hàng …?` with `Lý do hủy đơn hàng *` required + 200 ký tự note, lightbox, toasts) — Plan 4 owns the login-prompt + cancel-dialog halves; already partially built in Plan 2 T10.
14. **Not in design (gaps to decide):** no dedicated customer **order-detail** screen (client has `/tai-khoan/don-hang/:id` today), no **addresses management** screen, no **forgot/reset password**, no **social login**, no guest-checkout variant. `admin-mini-game` = Plan 6. `cart-drawer` coupon/VAT/free-ship blocks were explicitly omitted in Plan 3 → `review-artifacts/plan3/gate/REPORT.md:140` ("coupon = Plan 4").

## 2. Current auth reality

- **Context:** `client/src/contexts/AuthContext.tsx` (103 LOC) — reducer (`AUTH_START/SUCCESS/LOGOUT/ERROR`), `refreshUser()` on mount (`:69-71`), `login/register/logout/updateUser`. No token in JS state.
- **Token storage = httpOnly cookie, not localStorage:** `client/src/services/apiClient.ts:13` `withCredentials: true`; server sets cookie `token` httpOnly/sameSite lax (`server/src/controllers/authController.ts:10-11,30`, `server/src/utils/token.ts:10,35-37`). Consistent with hard constraint C4 (contract line 18).
- **Endpoints:** `client/src/services/authApi.ts:17-35` → `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password` (server: `server/src/routes/auth.ts`, `server/src/controllers/authController.ts`).
- **Routes:** `client/src/App.tsx:71-90` — `dang-nhap`/`dang-ky` under `GuestOnlyRoute`; `thanh-toan`, `thanh-toan-thanh-cong/:id`, `thanh-toan-qr/:id`, `danh-gia/:slug`, `tai-khoan/*` under `ProtectedRoute`; `/admin/*` under `AdminRoute` (`:95-109`).
- **Guards** (`client/src/routes/guards.tsx`): `ProtectedRoute:16-27` → not authed ⇒ `<Navigate to="/dang-nhap" state={{from: location.pathname}} replace />` (`:23`); `AdminRoute:29-44` → same (`:36`) plus `user?.role !== 'admin'` ⇒ `/` (`:39-41`); `GuestOnlyRoute:46-51` → `isLoading` ⇒ fullscreen loader (`:48`), `isAuthenticated` ⇒ **`<Navigate to="/" replace />` (`:49`)**.
- **User shape:** `User.role` `'admin' | 'customer'` (`server/src/models/User.ts`; `AdminRoute:39`); `User.active` enforced at login + every `requireAuth` (GAP-11, `.ai/CURRENT_STATE.md:14`).
- **T10 post-login race — precise diagnosis:** only ONE code path can land on `/`: `guards.tsx:49`. Sequence: (a) user hits `/admin` unauth → `AdminRoute` redirects with `state.from='/admin'` (`guards.tsx:36`); (b) login submit → `AuthContext.login` dispatches `AUTH_START` **before** the network call (`AuthContext.tsx:73-76`) → `isLoading=true` → `GuestOnlyRoute:48` swaps `<Outlet/>` for the loader, **unmounting `LoginPage` mid-flight**; (c) on success `AUTH_SUCCESS` (`AuthContext.tsx:77`) re-renders `GuestOnlyRoute`, whose `:49` is **hard-coded to `/` and never reads `location.state.from`** — it commits while `location.pathname` is still `/dang-nhap`, `replace`-ing the history entry and destroying `state.from`; (d) `LoginPage`'s post-`await` `navigate(from)` (`login-page.tsx:41,47-48`) then fires from an already-unmounted component's closure, racing the guard's navigation — observed winner = guard ⇒ `/` (`review-artifacts/plan3/gate/REPORT.md:150`, "root cause not verified"). Root defect = **two redirect-on-auth owners** (guard hard-codes `/`; page reads `state.from`) across an unmount. Fix must pick one owner (see implications).
- **Existing account pages (all legacy, only color-swept in Plan 2 T3 `bc2824e`):** `pages/account/{dashboard(123),orders(109),order-detail(269),wishlist(63),profile(141),change-password(120),coupons(170)}-page.tsx` + `layouts/account-layout.tsx` (52, sidebar nav `account-layout.tsx:7-12`). Login (127) / register (197) also legacy.

## 3. Current checkout/order reality

- **Route/page:** `/thanh-toan` → `client/src/pages/checkout-page.tsx` (716 LOC), **single page, no step wizard**; address-history dropdown + inline add/edit dialog (`:70-80,195-243`), payment radio (`:62`), coupon input via `components/checkout/coupon-input.tsx` (230 LOC, imported `checkout-page.tsx:24`), order summary.
- **Totals are CLIENT-computed** (`checkout-page.tsx:146-147`): `shipping = 0` (constants `:37-38`), `total = max(0, subtotal - discount) + shipping`; `bank-transfer` gated at `>= 1000` (`:39,148`) mirroring `server/src/config/payment.ts:7`. **Contract §3 violation on the display side** (server does compute correctly: `server/src/services/orderService.ts:266-291,334-337`).
- **Coupon preview = subtotal-only, no `items`:** `couponApi.apply(code, subtotal)` (`services/index.ts:88`, called `checkout-page.tsx:179`) and `couponApi.eligible(subtotal)` GET (`services/index.ts:94`, called `:248`) — **`items` never sent, `basis` never read, no `Ước tính` copy** ⇒ contract §1/§2 not wired (server side ready: `server/src/validators/coupon.ts:29-35,42-56`, `server/src/controllers/couponController.ts:34-71`, `server/src/routes/coupon.ts:9-15`).
- **Order payload** (`checkout-page.tsx:266-278`): `customer{name,phone,email,address[,addressId]}`, `items[{product,quantity}]`, `note`, `paymentMethod`, `couponCode` — **no client `total`/`discount`** ✓ (matches contract §3 server rule). Server validator: `server/src/validators/order.ts:11-23` (name≥2, phone regex, email, address≥5, items≥1, `paymentMethod` enum `cash|bank-transfer` optional, `couponCode` optional); route `POST /api/orders` = `requireAuth` (`server/src/routes/order.ts:14`).
- **Cart→checkout handoff:** `contexts/CartContext.tsx` — localStorage key `store3d-cart` (`:33`), reducer, `subtotal` computed client-side from `item.price * qty` (`:136`), `clearCart()` after order (`checkout-page.tsx:281`).
- **Guest checkout: NOT possible** today (server `requireAuth` `routes/order.ts:14`; client `ProtectedRoute` `App.tsx:76-77`); design has no guest flow either.
- **Post-create navigation:** `bank-transfer` → `/thanh-toan-qr/:id`, else `/thanh-toan-thanh-cong/:id` (`checkout-page.tsx:282-286`).
- **Order success:** `pages/order-success-page.tsx` (138 LOC) renders **server** `order.total` (`:88`), line items, `OrderStatusBadge`; mini-game CTA only when `order.status === 'completed'` (`:125`) — design's post-purchase game/review CTAs are broader (see §1.5).

## 4. Payment reality (server)

- **Methods:** exactly `cash` (COD) and `bank-transfer` (VietQR) — `PaymentMethod` enum used at `orderService.ts:53`, validator `validators/order.ts:21`. **No e-wallet/gateway/vnpay/MoMo** (`.stitch/metadata.json` `businessAccuracyPass.rules[0]`).
- **Routes:** `POST /api/orders/:id/payment-qr` (`server/src/routes/order.ts:18`), `GET /api/orders/:id` (poll target, `:17`), `POST /api/payment/webhook` + dev-only `POST /api/payment/webhook/simulate` (`server/src/routes/payment.ts:17-41`; simulate 404s in prod `:35`), client `paymentApi.generateQr` / `paymentApi.simulate` (`services/index.ts:183-186`).
- **QR flow:** `paymentService.createQrForOrder` (`paymentService.ts:76-130`) — ownership/403, method/400, already-paid/400, bank config/500; sets `payment.status=pendingPayment`, `orderCode`, `qrExpiresAt = now + config.qrTtlMinutes`; `qrUrl` = official VietQR Quick Link built **server-side from `order.total` + `orderCode`** (`:109-115`).
- **Client QR page:** `pages/qr-payment-page.tsx` (198 LOC) — generate on mount (`:58-61`), **poll every 3000 ms** for `order.payment.status === 'paid'` (`:63-78`), separate countdown from `qr.expiresAt` (`:80-91`), copy buttons + `Hủy đơn hàng`.
- **COD flow:** create order with `cash` → straight to order-success (no QR, no polling); `markOrderPaid` is webhook-only (`paymentService.ts:132-139`, `canMarkPaid` pending|confirmed, GAP-9/10) — client cannot set payment status (constraint C6).

## 5. Game/loyalty + review-write + wishlist (inventory)

- **Game/loyalty: EXISTS end-to-end.** Server `server/src/routes/reward.ts:11-14` → `POST /rewards/game/start`, `POST /rewards/game/complete`, `GET /rewards/my-coupons` (all `requireAuth`, `:9`); `services/rewardService.ts` (165), `models/GameSession.ts` (53), tiers `config/rewards.ts:2-7` (minScore 50–100 → 5–30% coupon), anti-cheat GAP-6 (`.ai/CURRENT_STATE.md:14`). Client: `services/rewardApi.ts:22-31`, `hooks/useGameSession.ts` (93), `components/mini-game/{mini-game-modal(116), game-state(440), reward-coupon-card(48), game-assets(96)}`; mounted from `order-success-page.tsx:131`, `account/order-detail-page.tsx:130`, `components/order-completion-modal.tsx:160`, admin preview `pages/admin/mini-game-page.tsx:78`.
- **Review write: page EXISTS but legacy/unreconciled with design.** Route `/danh-gia/:slug` (`App.tsx:80`) → `pages/review-form-page.tsx` (254 LOC) posting `reviewApi.create` (`services/index.ts:108`) with toast (`:135`); eligibility `GET /reviews/me/:productId` (`server/src/routes/review.ts:17`, hook `hooks/useReviewEligibility.ts`); PDP entry points `components/review/rating-summary.tsx:66` + `review-action.tsx:33`; `components/product/product-tabs.tsx:29` comment "WRITE form = Plan 4".
- **Wishlist page: EXISTS.** `/tai-khoan/yeu-thich` → `pages/account/wishlist-page.tsx` (63), context `contexts/WishlistContext.tsx` (74), server `routes/wishlist.ts` incl. `move-to-cart`.
- **My-coupons: EXISTS.** `/tai-khoan/ma-giam-gia` → `pages/account/coupons-page.tsx` (170) on `GET /rewards/my-coupons`.

## 6. Contract touchpoints for Plan 4 (quote + cite)

- **§1 coupon preview request** — "`all three preview endpoints … accept optional items: [{product, quantity}]` (POST: body; **GET: URL-encoded JSON query param**, Zod-validated) … `must send items` so previews are server-priced; until then `subtotal`-only keeps working (estimate mode)" — `…backend-trust-track.md:39`. Cap = **max 50 items** (`server/src/validators/coupon.ts:25-27`, URL-encoded JSON parser `:42-56`).
- **§2 preview response** — "`basis: 'server-priced' | 'client-claimed'` — **top-level on `POST /api/coupons/apply`; per-entry on `GET /available|/eligible`** … renders exact-discount copy for `server-priced`, and an explicit **`Ước tính`** (estimate) copy for `client-claimed` — never presenting a claimed-subtotal discount as final" — `…:40`.
- **§3 authoritative total** — "order creation prices items from DB records only; preview output is never an input to create … **Plan 2 must not compute a 'final total' client-side for display as authoritative** — totals come from API responses" — `…:41`. (Checkout `:146-147` currently breaks this.)
- **§4 error codes** — "409 → 'Dữ liệu đã thay đổi bởi người khác, vui lòng tải lại' … 403 → forbidden copy, 404 → empty-state copy" — `…:42`. Global 409 toast already fires in **one** place: `client/src/services/apiClient.ts:32-34` (comment `:26-31`: 409 is the ONLY globally toasted status; 400/403/404 stay call-site). ⇒ checkout must **drop its page-level error display for 409** to avoid the double surface.
- **§5 settings** — "`GET /api/settings/public` … hides each row when its key is absent" (contact/footer) — `…:43,45`; payment/account trust copy must not invent business values (hours/hotline from settings).
- **§6 test seam** — "apply coupon in preview → create order → `order.discount === preview.discount`" end-to-end in the Playwright suite — `…:44`.
- **Auth/registration validation: NO contract section exists** (grep of plan for auth/register/password → only global constraints `:18` C2 Vietnamese copy + C4 cookie auth, and Task 7 `:146-153` inactive-user 403 message). Auth copy = design + server Zod (`server/src/validators/auth.ts`) as-is.

## 7. Known Plan-4 residual items — current status

1. **Post-login race** — **STILL PRESENT**: `guards.tsx:49` unchanged, no `state.from` read; report note `review-artifacts/plan3/gate/REPORT.md:150`.
2. **409 double-toast at checkout** — **STILL PRESENT**: global `apiClient.ts:32-34` + page-level `setError(getErrorMessage(err))` alert `checkout-page.tsx:288` (and coupon `:184`) → two surfaces for one 409.
3. **Review WRITE UI** — page exists (`review-form-page.tsx`, 254 LOC, working POST) but **legacy, not rebuilt to `review-form` design**; PDP tab comment earmarks it (`product-tabs.tsx:29`).
4. **Per-page `<title>`** — **NO mechanism**: grep `client/src` for `document.title|<title>|useTitle` → **0 hits**; only static `client/index.html` `<title>Store 3D - Mô hình in 3D</title>`.
5. **Guest checkout** — **NOT possible** (server `requireAuth`, `routes/order.ts:14`; client `App.tsx:76-77`); design has no guest variant → confirm owner intent (keep auth-required).
6. **`/tai-khoan` routes** — **EXIST** (`App.tsx:81-89`: index/don-hang/don-hang:id/yeu-thich/ho-so/mat-khau/ma-giam-gia) with 7 legacy pages + `account-layout.tsx`; last touched by color sweep `bc2824e` only (never design-rebuilt).

## Plan-4 implications

**Candidate task breakdown (order = dependency-aware):**
- **T0 Design/plan + inventory pass** (this file) → confirm owner decisions on gaps (§1.14): guest checkout off? forgot-password out of scope? customer order-detail screen derived from `account-orders` timeline?
- **T1 Auth rebuild** — `login` screen (tabbed login/register, VN validation), fix **race** here (guards + login single-owner redirect), `GuestOnlyRoute` honoring `state.from`.
- **T2 Account shell + pages** — `account-layout` to design sidebar, then dashboard / orders (filters+timeline+actions) / coupons / wishlist / profile (+ default address + change-password section) — large LOC surface, all legacy today.
- **T3 Checkout rebuild** — single-page numbered sections, address dialog + stock-outage banner, **coupon wiring: send `items` (POST body / GET URL-encoded, ≤50) and render `basis` copy (`Ước tính` vs exact)**, **totals from API response only** (contract §3), payment radios COD/VietQR, drop 409 page-level toast (§4).
- **T4 QR payment + order success** — countdown/polling page (keep 3 s poll `qr-payment-page.tsx:66`), cancel-order dialog per `overlays-spec`, success timeline + review/game CTAs.
- **T5 Review write** — rebuild `/danh-gia/:slug` to `review-form` (stars, tags, ≤5 images, eligibility gate) + PDP entry points.
- **T6 Game/loyalty** — `mini-game-modal` to design, `order-completion-modal` reconciliation (two modals exist today: `components/order-completion-modal.tsx` vs `mini-game/mini-game-modal.tsx`), my-coupons → `account-coupons`.
- **T7 Per-page `<title>` mechanism** (client-wide helper, currently 0 hits) + Playwright gate + AC9.

**Risks:**
1. **Race fix design** — moving redirect ownership touches `guards.tsx` (shared with `ProtectedRoute`/`AdminRoute`) ⇒ regression surface for `/admin` and `/tai-khoan`; must keep `state.from` write (`:23,:36`) and read in sync, and avoid unmounting the login page on `AUTH_START` (`AuthContext.tsx:74`).
2. **Coupon `items`/`basis` wiring** — GET previews need URL-encoded JSON (≤50) and tolerant fallback (invalid `items` ⇒ subtotal estimate); discount copy must branch on per-entry `basis` (§2) else estimates get shown as final; must also satisfy §6 e2e (`order.discount === preview.discount`).
3. **Server-totals display** — checkout has no post-create preview API: options are display server totals from `POST /orders` response + estimate labels pre-submit, or a pre-submit preview call; `subtotal` itself is client-derived from `CartContext` (`CartContext.tsx:136`) ⇒ every preview needs `items` to be server-priced.
4. **Payment polling** — 3 s poll + countdown races QR TTL (`config.qrTtlMinutes`); webhook-only `markOrderPaid` means paid state only lands via `GET /orders/:id`; `bank-transfer` min 1000 ₫ error path must surface as 400 copy, not 409 toast.
5. **Scope splits** — `overlays-spec`, `cart-drawer` coupon block, `admin-mini-game`, and account-pages-vs-admin boundary (Plan 6) need explicit ownership; 7 legacy account pages + 716-LOC checkout is the largest single-plan LOC surface so far → split tasks vertically (page-by-page) and keep zero-new-dependency rule (`client/package.json` byte-identical precedent).
