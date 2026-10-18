# Auth & Checkout & Account & Payment — Implementation Plan (Full Rebuild Plan 4/series)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Continuous execution; only mandatory owner approval gates (demo sync, GitHub default branch, destructive ops, dep additions) may pause it.

**Goal:** Rebuild auth, checkout (+coupon §1/§2/§3 wiring), QR payment, order-success, account area, review-write, and mini-game onto the approved Obsidian Gold design; fix the post-login redirect race; make all contract touchpoints real (server-authoritative totals, 409 single-toast, per-page titles).

**Architecture:** Existing stack only (Vite 8 + React 19 + Router 7 + Tailwind v4 + shadcn + axios services + Contexts). Zero new dependencies. Foundation (Plan 2) + Storefront (Plan 3) are the base — do not re-do them. Auth = httpOnly cookie (`apiClient.ts:13`); contexts logic untouchable (C5).

**Design source of truth:** `.stitch/designs/`: `login`, `checkout`, `checkout-states`, `qr-payment`, `order-success`, `review-form`, `account-dashboard`, `account-orders`, `account-coupons`, `account-wishlist`, `account-profile`, `mini-game-modal`, `overlays-spec` (login-prompt + cancel-dialog halves). VN copy verbatim.

**Grounding:** `docs/superpowers/specs/2026-10-18-auth-checkout-survey.md` (path-cited facts + race diagnosis) · contract in `docs/superpowers/plans/2026-10-17-backend-trust-track.md` §Cross-plan contract (§1 items GET URL-encoded ≤50 / §2 basis + "Ước tính" / §3 no client-authored totals / §4 409 global-only / §5 settings / §6 preview≡order e2e) · `.ai/CURRENT_STATE.md` Plan 3 residuals.

**Plan series:** Plan 3 DONE. Plan 4 = this. Plan 5 (news/contact/AI chat) → Plan 6 (admin pages).

## Planner scope decisions (binding)

1. **Checkout = authenticated-only (no guest checkout)** — design has no guest-checkout variant and `overlays-spec` provides a login-prompt overlay; guests at `/thanh-toan` get the prompt overlay → login (with `state.from` return, fixed by T1) → back to checkout. Logged as design-faithful decision.
2. **Race fix = single redirect owner: the GUARDS.** `GuestOnlyRoute` reads `location.state.from` (what ProtectedRoute/AdminRoute already write); `LoginPage` stops self-navigating after success (remove its `navigate(from)` calls). `AuthContext` logic untouched (C5) — guards + page only.
3. **Totals honesty (§3):** order payload keeps OMITTING total/discount (already correct — byte-preserve). Displayed totals = server values from the coupon-preview response (read its REAL shape from server code; if it carries a total → show as "Ước tính"; if discount-only → cart subtotal labeled "Tạm tính" + server discount + derived estimate explicitly labeled "Ước tính"). Binding total = `order.total` on `order-success`. Never author totals into the payload.
4. **Coupon wiring (§1/§2):** preview calls must send `items` + `basis` in the shape the server validator accepts (GET per-entry URL-encoded ≤50 chars per `validators/coupon.ts:25-27` vs POST top-level — implementer reads server route and picks the correct call; do not invent a shape).
5. **409 (§4):** global toast (`apiClient.ts:32-34`) is the ONLY 409 surface — drop page-level 409 handlers in checkout/order flows (the known double-toast).
6. **Single completion surface:** `order-success` PAGE replaces any competing in-checkout success modal.
7. **Design gaps → honest behavior, logged deviations:** no forgot/reset-password (absent), no social login (absent), no register screen (register rebuilds on the `login` screen pattern), no customer order-detail screen (orders list shows detail inline/expand per existing behavior, restyled), no addresses screen (address = checkout form only; profile keeps existing address fields if server has them — verify, else omit).
8. **Server expected UNTOUCHED** (all endpoints exist from legacy + Plan 1 backend track). Any needed server change = STOP and report to planner (scope gate) — except none should be needed.
9. **Out of scope:** Plan 5 (news/contact/chat content), Plan 6 (admin), storefront rework (done).

## Global Constraints

- Branch `dev`; commit per task; no force-push; **`demo` = owner gate**; GitHub default branch untouched; **zero new dependencies** (dep need = mandatory pause).
- **C2** Vietnamese UI verbatim from screens · **C4** cookie auth mechanism untouched (login/register/logout API calls unchanged — only client UX/guards change) · **C5** contexts (Auth/Cart) logic untouched — read via hooks only · **C7** `resolveImageUrl` for all DB images · tokens-only (no hex/dark:).
- **Owner mandates:** zero fabricated business info/statistics (contact rows settings-driven; totals server-derived).
- Verification per task: `cd client && npx.cmd tsc --noEmit -p tsconfig.app.json` + `npm.cmd run build`; live browser checks (servers `:5173`/`:5000`, demo accounts `admin@store3d.com/admin123`, `khach@store3d.com/khach123`); server suite baseline **88/88** (`cd server && npm.cmd test`) if server touched (expected not).
- Screens = reference; existing working API behavior (submit payloads, polling, eligibility checks) PRESERVED unless a screen mandates change — deviations logged, never invented.

## Review Focus (likely failure modes)

1. **Guard regression** (race fix breaks admin/account redirects or logout) → Pinned: T1 review live-tests ALL guard paths.
2. **Coupon shape drift** (items/basis format mismatch vs server validator → silent 400 or ignored params) → Pinned: T5 review verifies byte-shape against `validators/coupon.ts` + live preview 200.
3. **Checkout submit regression** (payload fields changed during 716-LOC rebuild) → Pinned: T4 review byte-compares payload keys.
4. **Totals regression to client-computation** (§3 breach sneaks back) → Pinned: T5 + T6 reviews grep payload + labels.
5. **QR polling lifecycle** (interval leak on unmount, missed webhook state) → Pinned: T6 review code-traces cleanup.
6. **Scope bleed** (account tasks rewriting logic instead of restyling) → Pinned: per-task scope lines + diff audit.

---

### Task 1: Auth race fix — single redirect owner

**Files:** Modify `client/src/lib/guards.tsx` (GuestOnlyRoute :46-49), `client/src/pages/login-page.tsx` (remove self-navigation :41,47-48 only).

**Steps:**
- [ ] Read guards + login-page + AuthContext (read-only) and reproduce the race live first: login from `/admin` → observe landing `/` (survey diagnosis: two redirect owners; `guards.tsx:49` hard-codes `/` and ignores `state.from`).
- [ ] Fix: `GuestOnlyRoute` → `<Navigate to={(location.state as any)?.from?.pathname ?? "/"} replace />` when authed; keep its loading state behavior (AUTH_START loader) — but ensure the guard does NOT redirect during loading, only after success (single owner). Remove LoginPage's post-success `navigate(...)` calls (both success paths) — guard owns redirect.
- [ ] Verify ALL guard paths live (P0): login from `/admin` → `/admin`; login from `/dang-nhap` (no state) → `/`; login from checkout (guest at `/thanh-toan` → prompt → login) → returns `/thanh-toan` (this also proves the T4 overlay contract); `ProtectedRoute` page with expired session → login → back to that page; logout → `/`; admin login does NOT leak into customer-only routes and vice versa. Console clean.
- [ ] `cd client && npx.cmd tsc --noEmit -p tsconfig.app.json` + `npm.cmd run build` clean.
- [ ] Commit `fix(client): single redirect owner in guards — post-login race (Plan 4 T1)`.

### Task 2: Login + register to `login` screen

**Files:** Modify `client/src/pages/login-page.tsx` + register page (find exact path), their styles only.

**Steps:**
- [ ] Study `login.html` (+png): layout, brand panel, form fields/labels/placeholders, CTAs, links (register/forgot?) — VN verbatim; note responsive (mobile form-only?).
- [ ] Rebuild both pages to the screen (register = same visual pattern, deviation logged per decision #7; forgot-password link only if the screen shows it — survey says no reset screen → no reset flow, so omit link unless server supports it AND screen shows it — verify server: no reset endpoint surveyed → omit entirely).
- [ ] PRESERVE: form submit → existing authApi calls unchanged (C4), server validation error display (existing mapping), loading states, `AuthContext` dispatches untouched (C5).
- [ ] A11y: labels tied to inputs, password toggle aria, autofocus sensible, error `role=alert`.
- [ ] Verify: live login/logout both roles; wrong password → server message shown; register flow works (create+cleanup test user); tsc/build clean; screenshots desktop+mobile → `review-artifacts/plan4/` (untracked).
- [ ] Commit `feat(client): login/register to approved design (Plan 4 T2)`.

### Task 3: Per-page `<title>` mechanism

**Files:** Create `client/src/hooks/useDocumentTitle.ts` (or `lib/` — match existing conventions); Modify each public page for ONE-line application (home, PLP, PDP, 404, contact, auth pages, and later Plan-4 pages apply in their own tasks).

**Steps:**
- [ ] Tiny hook: sets `document.title` = `<Page> | STORE 3D` (match whatever suffix the current static `<title>` in `index.html` uses — verify), restores previous on unmount (or not — judge simplicity; SPA title per route is the goal).
- [ ] Apply to Plan-3 public pages (one-line each, zero logic change) + login/register from T2 + checkout/account pages apply in their own tasks.
- [ ] Verify: live — navigate home→PLP→PDP→404→login, `document.title` changes per route; tsc/build clean.
- [ ] Commit `feat(client): per-page document titles (Plan 4 T3)`.

### Task 4: Checkout structure to `checkout` + `checkout-states`

**Files:** Modify `client/src/pages/checkout-page.tsx` (716 LOC) + its children.

**Steps:**
- [ ] Study `checkout.html` + `checkout-states.html` (+pngs): layout/steps/sections, address form fields (labels verbatim), order summary block, payment selection (COD/VietQR labels+icons), coupon block placement, states (empty-cart redirect? loading? error?) — inventory exactly.
- [ ] Rebuild layout/structure to screens; **byte-preserve the submit payload field set** (`checkout-page.tsx:266-278` — reads product/qty/address/payment/coupon; NEVER add total/discount — §3); preserve CartContext reads (C5), address field semantics, payment method values.
- [ ] Guest handling (decision #1): unauthenticated at `/thanh-toan` → login-prompt overlay per `overlays-spec` (verbatim copy) → navigate to login with `state.from=/thanh-toan` (works via T1).
- [ ] Single completion surface (decision #6): remove in-checkout success modal if present → order flow ends at `order-success` route (T6 styles it; wire navigation only).
- [ ] Coupon block: PLACEHOLDER wiring only in this task (structure per screen; items/basis + estimate copy = T5 — keep current coupon API calls working as today until T5 swaps them; do not break apply/remove).
- [ ] Verify: live guest → prompt → login → returns checkout; logged-in checkout renders with cart items; empty-cart state per screen; submit path UNCHANGED (code-compare payload); tsc/build; screenshots 3 viewports.
- [ ] Commit `feat(client): checkout structure to approved design (Plan 4 T4)`.

### Task 5: Coupon items/basis + estimate totals (§1/§2/§3/§4)

**Files:** Modify checkout children (coupon component + totals rows); possibly `client/src/services` coupon service method signatures (client-side only).

**Steps:**
- [ ] Read server truth first: coupon preview route + `server/src/validators/coupon.ts:25-27` (items URL-encoded JSON ≤50) + preview response shape (does it return discount only or totals?) — cite exact shape.
- [ ] Wire preview calls with `items` + `basis` per the REAL server shape (GET per-entry with URL-encoded items or POST top-level with basis — whichever the route accepts; if BOTH exist, use the one matching current call sites): every price change (qty, item add/remove, coupon set) refreshes the preview.
- [ ] Totals rows per screens + decision #3: server values labeled per verbatim copy ("Ước tính" / "Tạm tính" from screens/contract §2); derived estimate only if response lacks total, ALWAYS labeled estimate.
- [ ] 409 (§4): remove any page-level 409 toast/handling in checkout coupon/order paths (global toast owns it — grep the file for 409/specific messages).
- [ ] §6 e2e check live: apply coupon (a real eligible coupon in seed — find one) → preview shows server discount → create COD order → `order-success` total MATCHES preview estimate (within the estimate/total relationship the server defines — document what matched); bad/expired coupon → server error surfaces via global toast only (no double).
- [ ] Verify: tsc/build; live flows above; screenshots coupon-applied checkout.
- [ ] Commit `feat(client): coupon items/basis + server estimate totals (Plan 4 T5)`.

### Task 6: QR payment + order-success

**Files:** Modify `client/src/pages/qr-payment-page.tsx`, create/modify order-success page (find existing; screen = `order-success.html`).

**Steps:**
- [ ] Study `qr-payment.html` + `order-success.html` (+pngs): QR display block, amount/orderCode, countdown/status copy, actions (copy code? check status? back to home?) — verbatim.
- [ ] Rebuild both to screens; PRESERVE: 3s poll of `GET /orders/:id` (verify cleanup on unmount — fix leak if present), webhook-only paid state (UI waits honestly — status copy per screen), min-1000₫ error path (§4 mapping shows server message, no fabrication), COD flow skips QR → success.
- [ ] `order-success`: server `order.total` + orderCode + next actions per screen; NO client-recomputed totals anywhere (§3).
- [ ] Verify: live COD order → success (total = server); VietQR order → QR page renders QR (200), polling ticks (watch network), cancel/back unmounts cleanly (no further polls in network tab); tsc/build; screenshots.
- [ ] Commit `feat(client): QR payment + order-success to approved design (Plan 4 T6)`.

### Task 7: Account dashboard + orders + profile

**Files:** Modify `client/src/pages/account/*` (find exact set: dashboard, orders, profile — survey: all legacy).

**Steps:**
- [ ] Study `account-dashboard.html`, `account-orders.html`, `account-profile.html` (+pngs): nav/sidebar structure shared across account pages (tabs? sidebar links verbatim), dashboard stats/widgets (REAL data only — inventory what API provides: orders count? points? — omit unbacked widgets + log), orders list rows (status badges, actions), profile form fields (labels verbatim; only fields the server profile API supports — `authApi` profile method).
- [ ] Rebuild the 3 pages to screens; PRESERVE: fetch logic, status mapping (server enums), order actions that exist today (cancel? — if a cancel action exists, its confirmation = cancel-dialog per `overlays-spec`, verbatim); order detail = no design screen → keep existing detail access inline/expand, restyled (decision #7).
- [ ] Account shared layout/sidebar: build per screens (reused by T8 pages — design the shared shell so T8 slots in).
- [ ] Verify: live login customer → visit all 3 (data renders real: one order exists in seed — cite), profile edit saves + reflects, cancel flow (if exists) dialog per screen; tsc/build; screenshots 3 viewports.
- [ ] Commit `feat(client): account dashboard/orders/profile to approved design (Plan 4 T7)`.

### Task 8: Wishlist + my-coupons account pages

**Files:** Modify `client/src/pages` wishlist + my-coupons (routes `/tai-khoan/yeu-thich`, `/tai-khoan/ma-giam-gia` — find files).

**Steps:**
- [ ] Study `account-wishlist.html` + `account-coupons.html` (+pngs): grid/rows, coupon card fields (code, discount, expiry, status), copy/apply actions, empty states — verbatim.
- [ ] Rebuild to screens inside the T7 shared account shell; PRESERVE: data fetch (`/rewards/my-coupons`, wishlist context/API), copy-to-clipboard behavior if exists, remove-from-wishlist.
- [ ] Empty states per screens (hide-on-empty patterns like Plan 3).
- [ ] Verify: live both pages + empty states; tsc/build; screenshots.
- [ ] Commit `feat(client): wishlist + my-coupons to approved design (Plan 4 T8)`.

### Task 9: Review form

**Files:** Modify `client/src/pages/review-form-page.tsx` (254 LOC, legacy).

**Steps:**
- [ ] Study `review-form.html` (+png): rating input (stars? numeric?), textarea label/placeholder, product context block, submit — verbatim.
- [ ] Rebuild to screen; PRESERVE: eligibility check `GET /reviews/me/:id` (403 → honest message per §4), POST payload shape, success navigation behavior.
- [ ] Verify: live — eligible product review submit (then DELETE the test review from DB to keep data clean); ineligible → 403 path shows message (global toast or inline per §4 — no double); tsc/build; screenshot.
- [ ] Commit `feat(client): review form to approved design (Plan 4 T9)`.

### Task 10: Mini-game modal

**Files:** Modify the mini-game modal component + `useGameSession` usage surface (find via survey paths; logic hook = read-only per C5 — modify only the modal UI file unless hook change is unavoidable (report if so)).

**Steps:**
- [ ] Study `mini-game-modal.html` (+png): modal structure, game visuals (spin/gacha?), rewards display, actions (play/claim/close) — verbatim; check `overlays-spec` for modal a11y conventions.
- [ ] Rebuild modal UI to screen; PRESERVE: session start/complete API calls (`/rewards/game/{start,complete}`), coupon-claim behavior, close/escape, a11y per Plan 2 overlay standards (aria-modal, Escape, focus return).
- [ ] Verify: live — play a game round (start→complete→reward shown), claim → coupon appears in my-coupons; close paths clean; tsc/build; screenshot.
- [ ] Commit `feat(client): mini-game modal to approved design (Plan 4 T10)`.

### Task 11: Docs sync

**Files:** Modify `.ai/CURRENT_STATE.md` (Plan 4 section between Plan 3 and Design Track).

**Steps:**
- [ ] Record tasks+SHAs, race-fix outcome, contract touchpoints now real (§1/§2/§3/§4/§6), deviations, residuals for Plans 5–6.
- [ ] Commit `docs: CURRENT_STATE Plan 4 progress (Plan 4 T11)`.

### Task 12: Playwright auth/checkout gate (decision 7) + quality checklist

**Prereqs:** T1–T10 green. Servers `:5173`/`:5000`.

**Steps:**
- [ ] Gate matrix ×3 viewports (desktop 1920 / tablet 834 / mobile 390): login, register, checkout (logged-in with items, guest prompt overlay), coupon-applied checkout, QR payment page, order-success, account (dashboard/orders/profile/wishlist/coupons), review form, mini-game modal. Screenshots each → `review-artifacts/plan4/gate/`.
- [ ] Console ZERO unexpected; network: no polling leaks (QR unmount check), auth endpoints 200s; overflow 0 at 375/390 on every page.
- [ ] Flows: **race proof** (login from `/admin` → `/admin`; guest checkout→prompt→login→back to checkout); checkout e2e COD (cart→checkout→coupon preview→order→success total = server) + VietQR (QR renders, poll ticks, unmount stops); **§6 preview≡order totals consistency**; 409 single-toast proof (expired coupon at submit); profile edit save; review submit+cleanup; game round.
- [ ] Evidence `review-artifacts/plan4/gate/REPORT.md` (URLs, inventory, console/network, overflow, flows, deviations, AC table) → commit `test(client): Plan 4 auth/checkout Playwright gate (Plan 4 T12)` (gate dir only, force-add PNGs).
- [ ] Run `frontend-quality-checklist-store3d` (UI Change profile) on changed pages → fix Critical/High in-scope, log rest; record in REPORT.md.

---

## Acceptance criteria (Plan 4 gate)

- **AC1:** tsc + client build clean every task; `client/package.json` byte-identical (zero deps); server suite stays 88/88 (server untouched — if touched, planner-authorized + tests added).
- **AC2:** Post-login race FIXED — live proof from `/admin` AND from a protected account page AND from checkout prompt; single redirect owner (LoginPage contains no post-success navigate).
- **AC3:** Coupon preview calls carry `items`+`basis` in the server-accepted shape (byte-verified vs validator); totals displayed = server-derived, labeled per §2 ("Ước tính"/"Tạm tính"); payload still omits total/discount (§3).
- **AC4:** 409 surfaces ONLY via global toast (grep proof in checkout/order files + live expired-coupon test).
- **AC5:** All Plan-4 screens match designs (VN verbatim, tokens); zero fabricated business info/statistics; omitted design widgets logged.
- **AC6:** `document.title` reflects route on all public + Plan-4 pages.
- **AC7:** Guest at `/thanh-toan` → login-prompt overlay → login → returns to checkout.
- **AC8:** Playwright gate: matrix + flows (incl. §6 preview≡order consistency, QR lifecycle) clean, overflow 0, evidence committed.
- **AC9:** Quality checklist (UI Change) run; Critical/High in-scope fixed.

## Self-review record

- Coverage: survey's candidate breakdown honored (race, login, checkout+coupon contract, QR/success, account×5, review, game, titles, gate); splits chosen to isolate contract-critical work (T5) and guard work (T1) for focused adversarial review. ✓
- Contract embedding: §1/§2 in T5, §3 in T4/T5/T6, §4 in T4/T5/T6/T9, §5 profile/checkout contact rows (settings-driven — verify in T7), §6 in T5+T12. ✓
- Decisions #1–#9 recorded with rationale; design gaps → honest omissions, never invented flows (reset-password/social/guest-checkout all absent by evidence). ✓
- C4/C5 respected: auth mechanism + contexts logic untouched; guards/pages only. ✓
- No guessed paths: survey is path-cited; implementers re-verify before editing. ✓
