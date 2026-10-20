# Plan 4 — Task 12 — Playwright AUTH/CHECKOUT GATE (owner decision 7)

**Date:** 2026-10-20 · **Branch:** `dev` (verified `git branch --show-current` = `dev`; NO branch ops, no merge/push) · **Runner:** Playwright (repo `node_modules/playwright`, Chromium headless) driven by a scripted run with persistent `console` / `pageerror` / `response` / `requestfailed` listeners per page · **Evidence dir:** `review-artifacts/plan4/gate/`

## 1. URLs / boot record

| URL | Status at task start | Started by this task |
|---|---|---|
| `http://localhost:5173` (client) | 200 | pre-existing → **restored mid-task** (see below) |
| `http://localhost:5174` (client, second instance) | 200 | pre-existing (not restored — no gate phase uses it) |
| `http://localhost:5000/api/health` (API) | 200 | pre-existing → **restored mid-task** (see below) |

**Timeline (honest record):** all three were probed 200 at task start and were **not** started by this task. Between gate attempts (2026-10-20) all three Node listeners disappeared **without this task stopping them** (no stop/kill was ever issued by this task; MongoDB `27017` stayed up, PID 6104). To complete the mandated gate, this task restored the two URLs the gate needs:

- `cd client && npm.cmd run dev` → **5173 → 200**
- `cd server && $env:MONGODB_URI='mongodb://127.0.0.1:27017/store3d'; npm.cmd run dev` → **5000 `/api/health` → 200** — process-env `MONGODB_URI` override (dotenv does not override pre-set env), pointing at the **same local MongoDB the gate data lives in** (verified after boot: gate-customer login → 200 with the profile-edited name intact, i.e. the restarted API reads the gate DB, not Atlas)
- 5174 was not restored (only probed at start; unused by the gate matrix)

The API booted with `MONGODB_URI` present (boot guard satisfied; the guard rejects a missing `MONGODB_URI` — not exercised). Both restored servers are **stopped at the end** (they were started by this task).

## 2. Screenshot inventory — 63 PNGs (all in this directory, force-added)

| Area (matrix) | Count | Files |
|---|---|---|
| Auth ①②③ | 11 | `auth-login`×3 (desktop/tablet/mobile), `auth-register`×3, `auth-wrong-password`, `auth-admin-guarded`, `auth-admin-dashboard`, `auth-register-success`, `auth-bounce` |
| Checkout ④⑤ | 12 | `checkout-guest-prompt`×3, `checkout-guest-prompt-390-overflow`, `checkout-ac7-return`, `checkout-address-dialog`, `checkout-filled`×3, `checkout-coupon`, `checkout-qty-refire`, `checkout-coupon-removed` |
| Order/QR ⑤⑥ | 6 | `order-success`×3, `qr-payment`×3 |
| Account ⑦ | 24 | `account-dashboard`×3, `account-orders`×3, `account-order-detail`×3, `account-order-detail-completed`, `account-profile`×3, `account-profile-saved`, `account-wishlist`×3, `account-coupons-empty`×3, `account-coupons-reward`, `account-change-password`×3, `admin-order-completed` |
| Review ⑦ | 4 | `review-form-ineligible`×3, `review-form-eligible` |
| Storefront spot ⑨ | 2 | `regression-home`, `regression-plp` |
| Game ⑧ | 3 | `game-modal`×2 (desktop/mobile), `game-round-result` |

## 3. Console / network results per group

Persistent `console` / `pageerror` / `response` / `requestfailed` listeners per page for the whole run:

| Group | console | pageerrors | reqfailed | http 4xx/5xx | accounted for by (allowed noise) |
|---|---|---|---|---|---|
| auth-guest | 10 | 0 | 0 | 7 (6×401 GET, **1×401 POST login**) | logged-out `auth/me` 401 + the *intentional* wrong-password 401 |
| register | 4 | 0 | 0 | 2 (401 GET) | logged-out `auth/me` |
| admin-race | 3 | 0 | 0 | 2 (401 GET) | same |
| guest-checkout | 7 | 0 | 0 | 4 (401 GET) | same |
| checkout | 6 | 0 | 0 | 3 (2×401 GET, **1×404 POST `/api/coupons/apply`**) | `auth/me` + the *negative* unknown-coupon test (cited `couponService.ts:138` resourceNotFound → 404, deliberate) |
| qr | 6 | 0 | 0 | 2 (401 GET) | `auth/me` |
| account | 14 | 0 | 0 | 2 (401 GET) | `auth/me` |
| storefront-regression | 6 | 0 | 0 | 4 (401 GET) | `auth/me` |
| admin-complete | 4 | 0 | 0 | 2 (401 GET) | `auth/me` |
| recheck | 7 | 0 | 0 | 2 (401 GET) | `auth/me` |
| game | 8 | 0 | 0 | 2 (401 GET) | `auth/me` |
| overflow | 23 | 0 | 0 | 8 (401 GET) | `auth/me` |
| boot | 0 | 0 | 0 | 0 | — |
| **Total** | **98** | **0** | **0** | **40** | **0×429** |

All 98 console messages classified: **55×** React DevTools dev-notice, **39×** "Failed to load resource … 401" (mirror of the auth/me + intentional login 401s), **1×** "… 404" (mirror of the negative coupon test), **3×** `PixiJS Warning: [BindGroup] texture… destroyed while still bound` (game-canvas teardown on modal close — benign engine warnings, no failed asset, no error; the round still completed 200). **Unexpected console errors: 0.**

Network evidence snippets:
- **Coupon preview (AC3):** `POST /api/coupons/apply → { basis: "server-priced", subtotalVnd: 150000, discountVnd: 15000 }` — 10 % of the **server-priced** subtotal.
- **QR image:** `GET https://img.vietqr.io/image/970423-70877769859-qr_only.png → 301 → GET …qr_only.svg → 200` (pre-existing CDN redirect), rendered `naturalWidth=490`.
- **QR poll lifecycle:** 3 ticks in 10.5 s (~3 s cadence), countdown `04:56` visible, **0** `GET /orders/:id` in the 8 s after unmount (polling stops).
- **Storefront spot-check:** hero video `GET 206` ×4 (range requests), **0 broken images** on `/` and `/san-pham`.

## 4. Overflow table — 56 cells, all **0 px** (`documentElement.scrollWidth − clientWidth`)

| Context | 375 | 390 | 834 | 1920 |
|---|---|---|---|---|
| guest `/dang-nhap` | 0 | 0 | 0 | 0 |
| guest `/dang-ky` | 0 | 0 | 0 | 0 |
| guest checkout (login overlay) | 0 | 0 | 0 | 0 |
| customer checkout (filled) | 0 | 0 | 0 | 0 |
| customer QR payment | 0 | 0 | 0 | 0 |
| customer order success | 0 | 0 | 0 | 0 |
| customer account dashboard | 0 | 0 | 0 | 0 |
| customer account orders | 0 | 0 | 0 | 0 |
| customer account order-detail | 0 | 0 | 0 | 0 |
| customer account profile | 0 | 0 | 0 | 0 |
| customer account wishlist | 0 | 0 | 0 | 0 |
| customer account coupons | 0 | 0 | 0 | 0 |
| customer review form | 0 | 0 | 0 | 0 |
| mini-game modal (open) | 0 | 0 | 0 | 0 |

13 pages × 4 widths + game-modal × 4 = **56/56 cells 0 px** (admin excluded → Plan 6, §7.4).

## 5. Flows (numbers from `results.json.flows`)

- **T1 race:** `/admin` logged-out → bounced to `/dang-nhap` → admin login → lands back on `http://localhost:5173/admin`; logout → `/dang-nhap`.
- **Wrong password:** `POST /api/auth/login → 401`, exactly **1** `role=alert` surface "Email hoặc mật khẩu không đúng", page stays `/dang-nhap`.
- **Register / bounce:** auto-login lands `/`, navbar "Kach Gate T12"; authed user on `/dang-nhap` → bounced `/`.
- **Cart drawer:** final run instrumented both adds — enabled "Thêm vào giỏ" clicked, cart items **0→1→2**, drawer appeared (2–3 ms) and closed via `Escape` each time (`via:["escape"]`).
- **AC7:** guest overlay verbatim **4/4** ("Đăng nhập để tiếp tục" / "Đăng nhập ngay" / "Đóng / Tiếp tục duyệt sản phẩm" / "Chưa có tài khoản?") → login → **returns `/thanh-toan` with form visible**.
- **§6 numbers:** preview `Tạm tính (2 sản phẩm) 150.000₫` + chip `SALE10` + `-15.000₫` + `TỔNG CỘNG THANH TOÁN … ƯỚC TÍNH 135.000₫`; COD success total **135.000 == preview 135.000**; order payload keys `customer,items,paymentMethod,couponCode` (**no total/discount** — server-priced); qty stepper 1→2 refires `POST /coupons/apply` (count grows) and the server recalculates (825.000 → 970.000 measured); unknown coupon `KHONGTONTAI-T12 → 404` (cited).
- **QR order:** `POST /api/orders → 201`; poll ticks **3 in 10.5 s**, countdown 04:56, **0** polls after unmount; QR renders (490 px via 301→200).
- **Game ⑧:** "Nhận quà" on the completed order → modal + chest asset 200 → `POST /rewards/game/start → 200` → score 0→50 in **31 s** (lives 3 throughout, **0** pauses) → stop input → 3 natural hits at **t≈40 s** → `POST /rewards/game/complete → 200` `{score:52, reward:{code:"REWARD-D8CB4E9A", discount:5, expiresAt:"2026-11-03"}}` → result screenshot → code visible in `/tai-khoan/ma-giam-gia` → review form **eligible**. (Runner note: the polling loop ran on the already-done result modal until its 240 s guard — the gameover overlay is replaced by the result state immediately, so the loop's gameover marker never matched; benign, the POST resolved at ~t40 s.)
- **Account:** profile `PUT /api/auth/profile → 200` + persisted after reload ("Kach Gate T12 Da Sua"); wishlist add 200; dashboard renders real widgets; review-ineligible copy verbatim; admin advanced pending→confirmed→shipping→completed (3× PUT 200).

## 6. Gate matrix ①–⑩ / AC1–AC9

Matrix: ① login+authed-bounce ✅ ② register+auto-login ✅ ③ wrong-password+admin-guard+T1-race ✅ ④ guest overlay verbatim + AC7 return ✅ ⑤ COD order + §6 totals ✅ ⑥ QR + poll lifecycle ✅ ⑦ account (dashboard/orders/detail/profile/wishlist/coupons/change-password/review states) ✅ ⑧ game round start→complete→claim→my-coupons ✅ ⑨ console/network clean (0 unexpected) ✅ ⑩ overflow 0 px @375/390/834/1920 ✅ — **55/55 checks pass, 0 fail, 0 phase errors.**

| AC | Status | Evidence |
|---|---|---|
| AC1 zero source changes | ✅ | §8 table: `tsc -b` exit 0, `cd server && npm test` **88/88**, git-status only `review-artifacts/…`, empty package.json diffs, runner outside repo |
| AC2 auth flows | ✅ | ①②③ checks + 11 `auth-*` screenshots |
| AC3 checkout/coupon | ✅ | preview `items[]`, `basis=server-priced`, payload omits total/discount, qty refire, negative 404 |
| AC4 QR + success + poll | ✅ | 201, ticks 3/10.5 s, stop-after-unmount 0, QR 200 (301 chain), totals == §6 |
| AC5 account area | ✅ | dashboard/orders/detail/profile/wishlist/coupons/change-password/review checks + 24 screenshots |
| AC6 game lifecycle | ✅ | start 200, complete 200 score 52, `REWARD-D8CB4E9A` in my-coupons, review eligible |
| AC7 guest overlay → login → return | ✅ | returns `/thanh-toan`, form visible |
| AC8 evidence committed | ✅ | this commit, `review-artifacts/plan4/gate/**` only |
| AC9 frontend-quality-checklist | ⏳ **PENDING** | runs separately per brief (§7.10) |

## 7. Deviations & known residuals (recorded, NOT fixed here)

Gate-blocking bugs: **none** — no source file was changed by this task (see §8/AC1).

Deviations / pre-existing residuals cited (from `.ai/CURRENT_STATE.md` Plan 4 + this run):

1. **Seeded customer `khach@store3d.com/khach123` = 401** (pre-existing credential drift) → gate registers a fresh customer `gate4t12.20261020@store3d.com` / `Gate123!x` / `Kach Gate T12` instead (per brief).
2. **QR image = pre-existing external CDN `img.vietqr.io`** (server-built QR, no fallback) — its requests are allowed noise if seen.
3. **No checkout `?coupon=` deep-link** (screen shows bare `#`) — equal/better, logged.
4. **Admin 15px horizontal overflow @390 + admin `<title>`/desc/mobile sidebar/logo** → **Plan 6**, excluded from the overflow matrix (client pages only).
5. **Admin dashboard decorative widgets** → Plan 6 (not asserted).
6. **Address dialog has NO delete affordance in the client UI** → address deletion is performed via API/DB during cleanup (this task), not through the UI.
7. **`qr-payment` recheck non-404 failure toasts** (outside §4's 3 cited cases, minor, pre-existing).
8. **Rate limiting is live and strict**: `globalLimiter` = `RATE_LIMIT_MAX=300` / `RATE_LIMIT_WINDOW_MS=900000` per IP and `authLimiter` = `AUTH_RATE_LIMIT_MAX=20` / 15 min on `POST /api/auth/{login,register}` (`server/src/config/rateLimit.ts`). An early unpaced attempt of this scripted sweep tripped it (429s on `/api/categories/all`, `/api/auth/login`, …). The final evidence run below is **paced** (reads `RateLimit-Remaining`/`RateLimit-Reset` headers and sleeps for window reset when low) so the recorded matrix is collected without 429 interference. The 429s were the server behaving as designed — not treated as a product defect, and not "fixed" (no config/env change).
9. **Cart drawer auto-opens on every add-to-cart** (`client/src/contexts/CartContext.tsx:116` `setIsOpen(true)`; overlay `cart-drawer.tsx:123`). The scripted runner polls for the overlay (it can appear late), presses `Escape` (drawer's own handler, `cart-drawer.tsx:78`), verifies it hid, falls back to clicking the overlay itself (`onClick={closeCart}`), and records `{status, appearMs, via, added}` per add — real-user-equivalent interaction, recorded as runner mechanics, not a defect.
10. **AC9 (frontend-quality-checklist, UI Change profile) runs separately** → reported **PENDING** here per brief.
11. **Server outage mid-task → restored by this task** (see §1 for the full record): 5173/5174/5000 vanished between gate attempts without this task stopping them; 5173 + 5000 were restarted (5000 with `MONGODB_URI` process-env override to the local gate DB, verified by gate-customer login → 200) and are stopped at the end of this task. No env/config file was modified.
12. **Mini-game pacing mechanics, diagnosed on FREE admin test rounds** (`useGameSession.startTestGame`/`completeGame` are fully client-side — `useGameSession.ts:52,74` "no backend call", so probe rounds touch no customer data): (a) default headless Chromium renders the Pixi canvas via SwiftShader at **~4.5 fps** while idle rAF is 60 (CSS-filter mitigations measured: 4.4–4.8, no help; canvas-hidden 47 → bottleneck is WebGL software raster), and the loop's `dt` cap 0.05 (`miu9-future-run.tsx:218`) makes game sim time run ~5× slower than wall clock — the root cause of an earlier `complete` timeout; the runner now launches Chromium with `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist` → **~60 fps**. (b) A rare window-blur pause overlay appears (`miu9-future-run.tsx:146`); resume is a **direct DOM click of `Tiếp tục`** — Playwright's actionability wait timed out silently, and `Escape` bubbles to the Radix dialog and **closes it** (both verified in probes). (c) Strategy: shoot (750 ms cooldown cadence) until score ≥ 50 (`REWARD_TIERS` floor → TIER-50 → 5 % coupon), then stop input → 3 natural hits → gameover → client auto-POSTs `/rewards/game/complete` within the 5-min session. All runner-side; no source change.

## 8. Verification & cleanup

**AC1 — zero source changes (evidence):**

| Check | Command | Result |
|---|---|---|
| Client type-check | `cd client && npx tsc -b` | **exit 0** (clean) |
| Server test suite | `cd server && npm test` | **88/88 passing** (~6 s; includes the live-CDN test `official VietQR CDN serves a QR image for the generated link`) |
| Working tree | `git status --porcelain` | only untracked `review-artifacts/…` paths — **no tracked file modified** |
| Dependencies | `git diff -- client/package.json server/package.json` | **empty** (no dependency additions) |
| Runner location | — | scripted gate lives in `C:\Users\Dat\AppData\Local\Temp\opencode\plan4-gate\` (**outside the repo**) |

Gate-blocking product bugs found: **none** — every mid-run failure traced to runner-side assertions/mechanics (wrong JSON path, case-sensitive CSS-uppercased copy, coupon-chip line parsed as amount, stock-clamped qty stepper, admin-guard nav order, cart-drawer late overlay, game pacing) — corrected in the runner only; **no source file changed**.

**Cleanup (`cleanup.cjs final`, 2026-10-20T13:12Z) — gate customer + all data deleted, baseline restored exactly:**

| Collection | Deleted / changed | Post-cleanup verify | Baseline |
|---|---|---|---|
| users | **1** (`gate4t12.20261020@store3d.com`) | `users_gate: 0`, totals **3** | 3 ✅ |
| orders | **2** (COD `6ad71ca3…f76f7`, QR `6ad71ca3…f7747`) | `orders_gate: 0`, totals **22** | 22 ✅ |
| orderitems | **4** | **28** | 28 ✅ |
| addresses | **1** | 0 | 0 ✅ |
| usercoupons | **1** (`REWARD-D8CB4E9A`) | 0 | 0 ✅ |
| wishlists | **1** | **12** | 12 ✅ |
| gamesessions | 0 remaining | 0 | 0 ✅ |
| reviews | 0 created (negative test only) | **3** | 3 ✅ |
| coupons | 0 deleted; SALE10 `usedCount` **2→1** | **2** + `sale10: 1` | 2 / 1 ✅ |
| products | 0 deleted; stock restored **+4 units** (`…bb` +2, `…be` +1, `…b8` +1) | `stockDrift: []` (10 products, incl. `6a7575c0ab567b53821181be` stock 1) | 10 / stock 1 ✅ |

Raw evidence copied into this directory: `results.json` (final merged run), `cleanup-final.json`, `baseline.json`.

**Server teardown:** this task restarted 5173 (client) + 5000 (API) after the mid-task outage (§1) — both are **stopped at the end of this task** (5174 was never restored; already down and unused).

**Commit:** `review-artifacts/plan4/gate/**` only (PNGs force-added; repo gitignores `*.png`).
SHA recorded in the delivery summary — a commit cannot embed its own hash.
