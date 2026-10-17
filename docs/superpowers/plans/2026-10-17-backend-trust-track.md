# Backend Trust Track — Implementation Plan (Full Rebuild Plan 1/series)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every business rule the (rebuilt) UI promises hold server-side — fix all 15 verified gaps and add config-driven site settings — with zero new dependencies.

**Architecture:** Keep Routes→Controllers→Services→Models (thin controllers, asyncHandler, Zod, envelope). Testable decisions are extracted into small pure functions/modules (the unit-test seam, matching existing `orderStatus.test.ts` style); wiring stays thin and is verified by the later Playwright journey phase. New test files are appended to the server `test` script.

**Tech Stack:** Express + TypeScript + Mongoose + Zod; tests via `node:test` + `node:assert/strict` run by `tsx --test` (existing infra — NO new dependencies, NO supertest, NO mongodb-memory-server).

**Spec:** `docs/superpowers/specs/2026-10-17-full-rebuild-spec.md` (+ evidence: `docs/superpowers/specs/2026-10-17-backend-survey.md`)

**Plan series:** Plan 1 = this document (backend, self-contained). Plan 2+ (client foundation/shell → storefront features → account/checkout → content → admin) are written after this track lands, since they consume its error semantics, settings API, and coupon preview contract (see "Cross-plan contract" below).

## Global Constraints

- Branch: implement on `dev`; commit per task; no force-push; no history rewrite.
- C1 no 3D libs · C2 Vietnamese user-facing copy (correct diacritics) · C4 cookie auth only · C6 client never controls payment status · C7 images via resolveImageUrl (client-side).
- API envelope `{success,message,data,pagination,errors}` unchanged; Zod validation at route boundary; asyncHandler; thin controllers.
- Error codes: 404 missing resource · 403 forbidden · 409 state/duplicate conflict · 400 business-rule violation. Vietnamese messages.
- **Errors:** always `new AppError(<message>, <status>)` — existing class at `server/src/utils/AppError.ts` (message first, status second). Never add a second error class or a duplicate `errors.ts` helper module; Task 9's factories go into `AppError.ts` itself.
- **Naming:** follow the existing repo convention (`*Service.ts`, camelCase helpers) — it wins over CANONICAL_CONTEXT §11's illustrative `*.service.ts` pattern, per AGENTS.md "ALWAYS follow existing patterns".
- **Test titles:** every "Failing tests:" bullet is written as the literal `test()` title it will get (quote it) — external behaviour, never internal structures.
- OrderStatus `pending|confirmed|shipping|completed|cancelled`; ALLOWED_NEXT_STATUS stays the single transition source; shipping=0; bank-transfer rejected <1.000₫; MAX_DISCOUNT_VND=200.000 (game coupons); REWARD_TIERS 50→5,60→10,70→15,80→20,90→25,100→30 (%), expiry 14 days, MAX_GAME_SCORE=200.
- Tests: `node:test`+`assert/strict`, pure-logic seams; every new test file added to server package.json `test` script in the same task.
- Commit messages: `fix(server): …` / `feat(server): …` scoped per task.
- No new npm dependencies. No changes to client code in this plan.

## Review Focus (failure modes most likely to bite)

1. **Concurrent cancel double-restore** (GAP-7): two admins cancel the same order → stock restored twice. Pinned by T5 `transitionGuardQuery` tests + denied-transition path.
2. **Webhook resurrecting cancelled orders** (GAP-9/10): forged/legit webhook on cancelled/completed order. Pinned by T6 `canMarkPaid` + simulate-route production tests.
3. **Coupon permanently burned on failed order** (GAP-5): usedAt set before validation throws. Pinned by T3 redemption-order tests.
4. **Inactive user keeps access** (GAP-11): existing session survives deactivation. Pinned by T7 `assertUserActive` + middleware rejection tests.
5. **Preview lies about discount** (GAP-2/14): client fakes subtotal/minOrder. Pinned by T2 `computeDiscount` (single source, all 4 sites) + `computePreviewSubtotal` basis tests (DB-priced wins when items given; claimed subtotal is estimate-only but still minOrder/cap-enforced).

## Cross-plan contract (binding on Plan 2+ client plans)

1. **Coupon preview request** — all three preview endpoints (`POST /api/coupons/apply`, `GET /api/coupons/available`, `GET /api/coupons/eligible`) accept optional `items: [{product, quantity}]` (POST: body; GET: URL-encoded JSON query param, Zod-validated) alongside the legacy `subtotal`. Plan 2's rebuilt checkout/cart **must send `items`** so previews are server-priced; until then `subtotal`-only keeps working (estimate mode). *(Authorized by spec addendum 2026-10-17.)*
2. **Preview response** — includes `basis: 'server-priced' | 'client-claimed'`. Plan 2 renders exact-discount copy for `server-priced`, and an explicit `Ước tính` (estimate) copy for `client-claimed` — never presenting a claimed-subtotal discount as final.
3. **Authoritative total** — order creation prices items from DB records only; preview output is never an input to create, and create recomputes line totals and the order total server-side — any client-sent `total`/`discount` field is ignored (code-path verification at Task 2 Step 3). Plan 2 must not compute a "final total" client-side for display as authoritative — totals come from API responses.
4. **Error codes** — Plan 2 distinguishes 404/403/409/400 (Task 9): notably 409 → "Dữ liệu đã thay đổi bởi người khác, vui lòng tải lại" (admin transition conflict, duplicate), 403 → forbidden copy, 404 → empty-state copy.
5. **Settings** — Plan 2 contact page/footer reads `GET /api/settings/public` and hides unset keys (no placeholders).
6. **Test seam** — preview-vs-order consistency is asserted pure-level in Plan 1 (Task 2) and end-to-end in Plan 2's Playwright suite: apply coupon in preview → create order → order.discount === preview.discount.

---

### Task 1: Public product status enforcement (GAP-1)

**Files:**
- Create: `server/src/services/productQuery.ts` (pure filter builders), `server/tests/productStatus.test.ts`
- Modify: `server/src/services/productService.ts` (list/getBySlug use builder), `server/src/services/orderService.ts` (create validates items active), `server/package.json` (test script)

**Interfaces:**
- Produces: `buildPublicProductFilter(query: Record<string, unknown>): Record<string, unknown>` — always forces `status: 'active'`; `assertItemsActive(products: Array<{_id: unknown; status: string}>, requested: Array<{product: unknown; quantity: number}>): void` — **missing product** ⇒ `AppError('Không tìm thấy sản phẩm', 404)`; **present but inactive/out-of-stock** ⇒ `AppError('Sản phẩm không khả dụng hoặc đã ngừng kinh doanh', 400)` (consistent with Task 9's 404/400 split; Task 9 later swaps in the shared factories without changing codes/messages).

- [ ] **Step 1:** Write failing tests (literal titles): `'public product filter always forces status active even when query requests another status'`; `'admin product filter passes status through untouched'`; `'assertItemsActive throws 404 when a requested product does not exist'`; `'assertItemsActive throws 400 when a requested product is inactive'`; `'assertItemsActive passes when all requested products are active'`.
- [ ] **Step 2:** Run `npm test` → FAIL (module missing).
- [ ] **Step 3:** Implement pure builders in `productQuery.ts`; wire `productService.list/getBySlug` (public path) and `orderService.create` item validation.
- [ ] **Step 4:** Run `npm test` → PASS; add file to test script.
- [ ] **Step 5:** Commit `fix(server): enforce public product status (GAP-1)`.

### Task 2: Single discount math + trusted preview (GAP-2, GAP-14)

**Files:**
- Create: `server/src/services/discountMath.ts`, `server/tests/discountPreview.test.ts` (math + preview-basis + validator contract)
- Modify: `server/src/services/couponService.ts` (`apply`, `getEligibleCoupons`, `listAvailable` all use computeDiscount — all three subtotal-math sites; add `resolvePreview(input)` supplying the DB product-price lookup), `server/src/services/orderService.ts` (`resolveCoupon` — 4th math site, capped), `server/src/controllers/couponController.ts` (thin: delegates to `couponService.resolvePreview`), `server/src/validators/coupon.ts` (adds optional `items` to `applyCouponSchema`; shared preview-items schema), `server/src/routes/coupon.ts` (optional `items` on GET `/available` + `/eligible`), `server/package.json`

**Interfaces:**
- Produces: `CouponMathInput = {type:'percent'|'fixed'; value:number; minOrder?:number; source?:string}` (defined once in `discountMath.ts`, imported by all call sites); `computeDiscount(coupon: CouponMathInput, subtotalVnd:number): {discountVnd:number; capped:boolean}` — percent capped by MAX_DISCOUNT_VND only when `source==='game'`; throws `AppError('Đơn hàng chưa đạt giá trị tối thiểu để dùng mã giảm giá', 400)` when `subtotalVnd < minOrder`. **Single source of truth** — all four sites call it; no site keeps its own formula.
- Produces: `computePreviewSubtotal(input: {items?: Array<{product:string; quantity:number}>; subtotal?: number}, priceLookup: (ids:string[]) => Promise<Array<{_id:string; price:number; discountPrice?:number}>>): Promise<{subtotalVnd:number; basis:'server-priced'|'client-claimed'}>` — with non-empty validated `items`: subtotal from DB prices (`discountPrice ?? price`, injected lookup → testable without DB), `basis:'server-priced'` (authoritative); without `items`: claimed `subtotal` (floored at 0), `basis:'client-claimed'` (**estimate only**). Preview discount = `computeDiscount` on that subtotal ⇒ preview math ≡ order math.
- Trust model (unchanged, verified): `orderService.create` derives item prices from DB-fetched products — the preview result **never** feeds order creation; verify (grep) that create() reads no client `total`/`discount` fields. Annotate the pricing block with `// authoritative: prices from DB, never from request/preview`.

- [ ] **Step 1:** Write failing tests (literal titles): (a) `'computeDiscount caps game-coupon percent at 200000'` (10% of 5.000.000 → 200.000, capped=true); `'computeDiscount does not cap non-game percent coupons'` (→ 500.000, capped=false); `'computeDiscount returns fixed amount as-is'`; `'computeDiscount rejects subtotal below minOrder with Vietnamese message'`; `'computeDiscount returns 0 for zero subtotal'`. (b) `'computePreviewSubtotal prefers DB prices over claimed subtotal when items given'` (fake lookup 450.000×2 vs claimed 100.000 → 900.000, basis server-priced); `'computePreviewSubtotal treats claimed subtotal as client-claimed estimate when items absent'`; `'preview enforces minOrder and game cap on claimed subtotal exactly like order path'`. (c) Validator contract: `'applyCouponSchema accepts code without items or subtotal (legacy client)'`; `'applyCouponSchema accepts code with items array'`; `'applyCouponSchema rejects malformed items'`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement `discountMath.ts` (`computeDiscount` + `computePreviewSubtotal`); add `couponService.resolvePreview` (service owns the DB price lookup; controller stays thin — no lookups in controllers); replace **all four** formula sites (`apply`, `getEligibleCoupons`, `listAvailable`, `resolveCoupon`); keep `subtotal`-only requests working (items optional — backward compatible, no client change in this plan); add the authoritative-pricing comment anchor and confirm no client `total`/`discount` field is read in create().
- [ ] **Step 4:** `npm test` → PASS; add file to test script.
- [ ] **Step 5:** Commit `fix(server): unify discount math & trusted coupon preview (GAP-2, GAP-14)`.

### Task 3: Coupon redemption lifecycle (GAP-3, GAP-5)

**Files:**
- Create: `server/tests/couponLifecycle.test.ts`
- Modify: `server/src/services/orderService.ts` (extract `releaseOrderCoupon(order): CouponAction[]`; resolveCoupon marks usedAt only after the bank-transfer minimum check; create() failure path releases), `server/package.json`

**Interfaces:**
- Produces: `releaseOrderCoupon(order: {coupon?: unknown; userCoupon?: unknown}): Array<{kind:'coupon-restore'|'usercoupon-release'; id: unknown}>` — empty when no coupon (consumed by T3's cancel branch AND T4's compensation planner).
- Produces: `redemptionPlan(coupon: unknown|null, payment: {method:'cash'|'bank-transfer'; totalVnd:number}): Array<'validate-minimum'|'mark-used'>` — real seam replacing the deleted constant-guard: returns `['validate-minimum','mark-used']` for bank-transfer ≥1.000₫, `['validate-minimum']` when the minimum would fail, `['mark-used']` for cash — ordering test proves `usedAt` marking happens only after validation.

- [ ] **Step 1:** Write failing tests (literal titles): `'releaseOrderCoupon returns restore action for system percent/fixed coupon'`; `'releaseOrderCoupon returns release action for game reward coupon'`; `'releaseOrderCoupon returns nothing for order without coupon'`; `'redemptionPlan validates bank-transfer minimum before marking coupon used'`; `'redemptionPlan omits marking when bank-transfer below 1000 VND'`; `'redemptionPlan marks cash orders immediately'`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement helpers; wire: `resolveCoupon` follows `redemptionPlan` (marking after minimum-check); `create` try/catch releases; `updateStatus` admin-cancel branch calls `releaseOrderCoupon` per item (shared with cancelByUser).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `fix(server): restore/burn coupon correctly on cancel & failure (GAP-3, GAP-5)`.

### Task 4: Order-creation compensation (GAP-4)

**Files:**
- Create: `server/src/services/orderCreation.ts` (pure planner + `CompensationAction` type), `server/tests/orderCompensation.test.ts`
- Modify: `server/src/services/orderService.ts` (step-tagged creation flow + compensation), `server/package.json`

**Interfaces:**
- Produces: `compensationPlanFor(failedStep: 'order-created'|'items-created'|'stock-updated'|'coupon-marked'|'done', ctx: {orderId: unknown; items: Array<{product:unknown; quantity:number}>; couponActions: ReturnType<typeof releaseOrderCoupon>}): CompensationAction[]` — `CompensationAction = {kind:'delete-order'|'delete-items'|'restore-stock'|'release-coupon'; payload: unknown}` defined once in `server/src/services/orderCreation.ts`; inverse actions in reverse order; `'done'` ⇒ empty plan.

- [ ] **Step 1:** Write failing tests (literal titles): `'compensation for items-created failure deletes the created order'`; `'compensation for stock-updated failure restores stock then deletes order'`; `'compensation for coupon-marked failure releases coupon, restores stock, then deletes order'`; `'no compensation actions after the done step'`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement pure planner; wire create() with step tags + try/catch running compensation (best-effort, logged).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `fix(server): compensating rollback for order creation (GAP-4)`.

### Task 5: Atomic transitions & coupon quantity (GAP-7, GAP-8)

**Files:**
- Create: `server/tests/atomicity.test.ts`
- Modify: `server/src/services/orderService.ts` (updateStatus uses guarded findOneAndUpdate), `server/src/services/couponService.ts` (quantity increment via conditional update), `server/package.json`

**Interfaces:**
- Produces: `transitionGuardQuery(orderId: unknown, from: string): {_id: unknown; status: string}` used with `findOneAndUpdate(..., {new:true})` — null result ⇒ throw `AppError('Đơn hàng vừa được thay đổi trạng thái bởi quản trị viên khác', 409)`; `couponQuantityGuardQuery(couponId: unknown): unknown` — `$expr {$lt:['$usedCount','$quantity']}` + `$inc usedCount:1`, null ⇒ `AppError('Mã giảm giá đã hết lượt sử dụng', 400)`.

- [ ] **Step 1:** Write failing tests (literal titles): `'transition guard requires the expected from-status in the update filter'`; `'transition guard targets the given order id'`; `'a guard miss throws 409 with Vietnamese concurrent-edit message'`; `'coupon quantity guard only matches while usedCount below quantity'`; `'coupon quantity guard increments usedCount atomically'`; `'a quantity miss throws 400 with Vietnamese sold-out message'` (semantic predicates — not full object snapshots).
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement + replace non-atomic find-then-update paths (order transition AND coupon increment inside resolveCoupon).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `fix(server): atomic status transition & coupon quantity guard (GAP-7, GAP-8)`.

### Task 6: Payment webhook hardening (GAP-9, GAP-10)

**Files:**
- Create: `server/tests/webhookHardening.test.ts`
- Modify: `server/src/routes/payment.ts` (signature mandatory; simulate route absent in production), `server/src/services/paymentService.ts` (`markOrderPaid` transition-guarded), `server/package.json`

**Interfaces:**
- Produces: `canMarkPaid(currentStatus: string): boolean` — true only for `pending|confirmed`; `webhookRoutePolicy(env: string, hasSecret: boolean): {requireSignature:boolean; simulateEnabled:boolean}` — production ⇒ signature required, simulate disabled (boot throws if secret missing in production).

- [ ] **Step 1:** Write failing tests (literal titles): `'canMarkPaid allows pending and confirmed orders'`; `'canMarkPaid rejects shipping, completed and cancelled orders'`; `'webhook policy requires a signature and disables the simulate route in production'`; `'webhook policy keeps simulate available in development'`; `'boot fails fast in production without PAYMENT_WEBHOOK_SECRET'`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement + wire; `markOrderPaid` rejects non-payable status with `AppError('Đơn hàng không ở trạng thái có thể xác nhận thanh toán', 409)`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `fix(server): harden payment webhook (GAP-9, GAP-10)`.

### Task 7: Enforce User.active (GAP-11)

**Files:**
- Create: `server/tests/userActive.test.ts`
- Modify: `server/src/services/authService.ts` (login rejects inactive), `server/src/middleware/auth.ts` (requireAuth checks active), `server/package.json`

**Interfaces:**
- Produces: `assertUserActive(user: {active?: boolean}): void` — throws `AppError('Tài khoản đã bị vô hiệu hóa', 403)`.

- [ ] **Step 1:** Write failing tests (literal titles): `'login accepts users with active true'`; `'login rejects inactive users with 403 Vietnamese message'`; `'requireAuth rejects sessions whose user has been deactivated'`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement + wire in login and requireAuth (session revalidated per request).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `fix(server): enforce user active flag (GAP-11)`.

### Task 8: News draft isolation (GAP-12)

**Files:**
- Create: `server/tests/newsDraft.test.ts`
- Modify: `server/src/services/newsService.ts` (getBySlug published-only), `server/package.json`

**Interfaces:**
- Produces: `publicNewsSlugQuery(slug: string): {slug: string; status: 'published'}`.

- [ ] **Step 1:** Write failing tests (literal titles): `'public news slug query filters to published articles'`; `'admin news lookups are not status-filtered'`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement + wire (public getBySlug → 404 `Không tìm thấy bài viết` on draft).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `fix(server): drafts no longer public by slug (GAP-12)`.

### Task 9: Error-semantics unification (GAP-13)

**Files:**
- Modify: `server/src/utils/AppError.ts` (add error factories next to the existing `AppError` class — NO new errors module), `server/tests/errorSemantics.test.ts`
- Modify: `server/src/services/{orderService,wishlistService,reviewService,couponService,addressService}.ts` (consistent codes), `server/package.json`

**Interfaces:**
- Produces: `resourceNotFound(kind: 'product'|'order'|'review'|'coupon'|'address'|'article'): AppError` (404 + VN `Không tìm thấy <kind-label>`), `duplicateResource(kind): AppError` (409), factories only — defined in `server/src/utils/AppError.ts` alongside the class; business-rule failures remain 400 with specific VN messages.

- [ ] **Step 1:** Write failing tests (literal titles): `'resourceNotFound returns 404 with Vietnamese label per kind'`; `'duplicateResource returns 409'`; `'accessing another user's review, order, wishlist entry or address is rejected with 403'`; `'missing product during order creation is 404 while inactive product stays 400'`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement + replace mismatched throws (product missing in order create stays 400 business-rule ONLY when it is a rule violation — missing product is 404; non-owner review/order → 403; address foreign → 403).
- [ ] **Step 4:** `npm test` → PASS (existing vietQr/payment/orderStatus suites unaffected).
- [ ] **Step 5:** Commit `fix(server): unify 404/403/409 semantics (GAP-13)`.

### Task 10: User deletion cascade (GAP-15)

**Files:**
- Create: `server/tests/userCascade.test.ts`
- Modify: `server/src/services/userService.ts` (remove cascades), `server/package.json`

**Interfaces:**
- Produces: `userDeletionPlan(): Array<{collection:string; action:'delete'|'unset'; fields:string[]}>` — Reviews/Wishlist/Addresses/UserCoupons/GameSessions deleted; Orders kept with denormalized snapshot (flag `keep:true` documented).

- [ ] **Step 1:** Write failing tests (literal titles): `'user deletion plan covers Reviews, Wishlist, Addresses, UserCoupons and GameSessions for deletion'`; `'user deletion plan keeps Orders as denormalized snapshots'` (membership assertions — not a full-table snapshot).
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement pure plan + wire `remove` to execute it.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `fix(server): cascade user deletion (GAP-15)`.

### Task 11: Game-session anti-cheat (GAP-6)

**Files:**
- Create: `server/tests/gameSession.test.ts`
- Modify: `server/src/services/rewardService.ts` (completeGame validates session; uses REWARD_TIERS mapping), `server/package.json`

**Interfaces:**
- Produces: `validateGameCompletion(session: {user:unknown; status:string; expiresAt:Date; order?:unknown}|null, userId: unknown, score: number, now: Date): {score:number}` — rejects null/not-owner/not-active/expired/out-of-range (0..200) with 400/403/404 per Task 9 semantics; `tierForScore(score:number): {code:string; percent:number}` — mirrors REWARD_TIERS with cap 200.000₫ note.

- [ ] **Step 1:** Write failing tests (literal titles): `'game completion requires an existing session (404 otherwise)'`; `'game completion rejects sessions owned by another user (403)'`; `'game completion rejects expired or non-active sessions (400)'`; `'game completion rejects scores outside 0..200'`; `'tier mapping at score boundaries 49/50/60/99/100'`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement + wire completeGame: session must exist per completed order (one per order), marked completed on success (no replay); document the residual limitation (client-chosen score within a verified session is still unverifiable — bounded by one-session-per-order, 5-min expiry, 0..200 clamp) in a code comment AND the commit message, as the spec's "pragmatic anti-cheat, documented" requires.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `fix(server): validate game sessions server-side (GAP-6)`.

### Task 12: Site settings (config-driven business info)

**Files:**
- Create: `server/src/models/SiteSetting.ts`, `server/src/services/settingsService.ts`, `server/src/controllers/settingsController.ts`, `server/src/routes/settings.ts`, `server/tests/settings.test.ts`
- Modify: `server/src/app.ts` (mount `/api/settings`), `server/package.json`

**Interfaces:**
- Produces: `mergePublicSettings(db: Record<string, unknown>, env: ProcessEnv): PublicSettings` — DB wins, env fallback, empty/missing keys STRIPPED (never nulls, never placeholders); public route `GET /api/settings/public` → `{success, data:{...only configured}}`; admin `PUT /api/settings` (Zod: hotline, supportHours, email — contact channel per spec stories #31/#46 —, address, socialLinks{facebook,zalo,instagram?} — all optional strings, trimmed, ≤200 chars). **No new required env vars** (optional `SITE_*` overrides only).

- [ ] **Step 1:** Write failing tests (literal titles): `'mergePublicSettings strips empty and missing values — no placeholders ever'`; `'database settings override the SITE_* env fallback'`; `'settings Zod schema rejects values longer than 200 chars'`; `'public settings payload contains only whitelisted fields'`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement model/service/routes; singleton doc keyed `'site'`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(server): site settings API with safe fallbacks`.

### Task 13: Backend gate

- [ ] **Step 1:** Full `npm test` (all suites incl. new files listed in test script) + `npm run build` in `server/` → both green (AC1).
- [ ] **Step 2:** Walk **AC1–AC10**: GAP-1..15 ↔ test-file table (AC2); grep `AppError(` in `server/src` → all message-first, no duplicate error module (AC3, AC6); preview/order math + trust tests present (AC4–AC5); legacy `subtotal`-only request path still passes (AC7); VN messages asserted verbatim (AC8); `git diff` on pre-existing tests justified (AC9); validator-contract tests present (AC10). Record results in the commit message checklist.
- [ ] **Step 3:** `git log --oneline dev -13` sanity + `git status` clean (no stray files).
- [ ] **Step 4:** Update `.ai/CURRENT_STATE.md` with this track's outcome (AGENTS.md §8 — mandatory memory update).
- [ ] **Step 5 — OWNER APPROVAL GATED (owner directive 2026-10-17: demo = preview website, sync only with explicit approval; never auto-merge/push/deploy):** do NOT run automatically. The track report ends by *requesting* demo sync; run `git push origin dev:demo` (fast-forward only, from the AC-green state) only after the owner approves. Non-fast-forward → blocker, stop and report.
- [ ] **Step 6:** Commit/announce final: `test(server): backend trust track gate — 15 gaps covered, AC1-AC10 green` (if any doc updates needed).

---

## Acceptance Criteria (track gate — checked in Task 13)

- **AC1:** `npm test` green (existing 3 suites + 12 new files, all listed in the `test` script) and `npm run build` green in `server/`; `package.json` `dependencies`/`devDependencies` unchanged (only the `test` script grows).
- **AC2:** Each GAP-1..15 maps to ≥1 failing-first-written test in its owning task (test-file ↔ gap table verifiable from git history).
- **AC3:** Every thrown error uses `new AppError(message, status)`; exactly one error class module (`server/src/utils/AppError.ts`) — no duplicate helper file exists after the track.
- **AC4:** Preview ≡ order math: same coupon + subtotal yields identical `discountVnd` through preview path and order path (pure test in Task 2; end-to-end assertion scheduled in Plan 2 Playwright per Cross-plan contract §6).
- **AC5:** Preview trust: with `items` given, DB prices beat the claimed subtotal (fake-lookup test); without `items`, claimed subtotal is treated as estimate yet minOrder + game cap still apply (tests).
- **AC6:** Authoritative total: `orderService.create` prices from DB-fetched products only; client-sent `total`/`discount` fields ignored; line totals and order total recomputed server-side; no code path carries preview/subtotal-request values into create (code-path review at Task 2 Step 3 + comment anchor).
- **AC7:** Backward compatibility: legacy subtotal-only preview requests still succeed during Plan 1 (all new request fields optional) — no client change required.
- **AC8:** All new user-facing error strings are Vietnamese with correct diacritics, asserted verbatim in tests.
- **AC9:** Pre-existing suites unchanged except intentional gap fixes; any altered assertion is justified in its commit message.
- **AC10:** Route-boundary contracts asserted at validator level per the spec seam addendum: preview schema accepts legacy and `items` forms and rejects malformed input (Task 2); settings schema rejects >200-char values (Task 12).

## Self-review record

- Coverage: every GAP-1..15 has exactly one owning task (1,2,3,4,5,6,7,8,9,10,11); settings = Task 12; gate = 13. ✓
- Steps: each step names one action + exact checkable result; no TBDs. ✓
- Type consistency: factories/guards names reused across tasks (releaseOrderCoupon in T3/T4; T9's error factories land later and replace earlier inline 404/409 throws with identical codes/messages); `AppError(message, status)` signature pinned in Global Constraints after verification of `utils/AppError.ts`. ✓
- Review Focus: 5 items each pinned to a task's tests. ✓
- Cross-plan consistency: coupon `items` contract, `basis` field, authoritative-total rule, error-code handling and settings consumption documented as binding on Plan 2+; preview fix made contract-honest (optional `items`, legacy `subtotal` fallback) so "no client change in this plan" holds. ✓
- Math-site completeness: all four subtotal-math sites (`apply`, `getEligibleCoupons`, `listAvailable`, `resolveCoupon`) named in Task 2. ✓
- Acceptance criteria: AC1–AC10 added and checkable in Task 13. ✓
- Round-2 review fixes: T1↔T9 code contradiction resolved (missing→404, inactive→400 in T1); spec addendum recorded for the preview contract + no-supertest seam decision; spec statistics bullet corrected (computed stats from stats API, not settings); T3 trivial constants replaced by the `redemptionPlan` seam; T5/T10 tests reframed from object snapshots to external-behaviour predicates; T11 documents the anti-cheat residual limitation; cross-plan §1 ambiguity removed; T13 gained CURRENT_STATE update (AGENTS §8) + guarded demo sync; AC10 added for validator-level route contracts. ✓
- Proportion: pure-planner pattern keeps bodies out of the plan. ✓
