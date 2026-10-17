# Store3D — Backend Survey (2026-10-17, evidence-based, for Full Rebuild spec)

Source: verified in `server/src/` by explore agent. Every gap below confirmed with file/line evidence.

## Enums (verbatim from models)
- OrderStatus = `pending | confirmed | shipping | completed | cancelled`
- PaymentMethod = `cash | bank-transfer`; PaymentStatus = `unpaid | pending_payment | paid`
- Product material = `PLA | PETG | ABS | Resin`; printerType = `FDM | Resin Printer`; ProductStatus = `active | inactive | out-of-stock`
- UserRole = `admin | customer`; CouponType = `percent | fixed`; NewsStatus = `draft | published`
- ContactStatus = `new | in_progress | resolved | rejected`; GameSessionStatus = `active | completed | expired`

## Constants
- Shipping = **0 always** (orderService.create L114). Bank-transfer rejected when total < 1.000₫ (400).
- QR TTL = 5 min default; VietQR confirm via `POST /api/payment/webhook` (signature) or `/webhook/simulate` (non-prod); amount must equal order.total; pay → paid + confirmed.
- MAX_DISCOUNT_VND = 200.000₫ (game coupons, preview-side only — see GAP-2); MAX_GAME_SCORE = 200; REWARD_TIERS 50→5%, 60→10%, 70→15%, 80→20%, 90→25%, 100→30%; reward expiry 14 days; game session timeout 5 min.
- Rate limits: global 300/15min, auth 20/15min, aiChat 30/15min, guestAiChat 15/15min.
- ALLOWED_NEXT_STATUS: pending→[confirmed,cancelled], confirmed→[shipping,cancelled], shipping→[completed], completed/cancelled→[].

## Confirmed logic gaps (GAP-1..15)
1. **GAP-1** Public product `status` not enforced — `productService.list()/getBySlug()` (buildFilter only sets status if ?status passed); order create never checks product.status → inactive products visible AND orderable.
2. **GAP-2** Game-coupon cap in preview but not order — `couponService.apply` L94-97 & `getEligibleCoupons` L163 use Math.min(...,MAX_DISCOUNT_VND) vs `orderService.resolveCoupon` L61 uncapped.
3. **GAP-3** Admin cancel doesn't restore coupon usage — `orderService.updateStatus` L278-290 stock only (vs cancelByUser L352-365).
4. **GAP-4** No DB transaction around order+stock — `orderService.create` L123; crash mid-way → order without items / stock / coupon drift.
5. **GAP-5** Reward-coupon leak on later failure — `resolveCoupon` L55-59 sets UserCoupon.usedAt BEFORE bank-transfer<1.000₫ check L119-121 / Order.create; throws never unset usedAt.
6. **GAP-6** Client-supplied game score trusted — `rewardService.completeGame` L90-107 uses data.score (zod 0..200 only) → POST score=200 = 30% coupon without playing.
7. **GAP-7** Non-atomic admin status transition → stock double-restore — `updateStatus` find L264 → check L269 → findByIdAndUpdate L310; concurrent cancels both pass.
8. **GAP-8** Coupon quantity race — check at `resolveCoupon` L37, increment only L193-198 after stock decrement → oversell last unit.
9. **GAP-9** Payment webhook forgeable — signature checked only if PAYMENT_WEBHOOK_SECRET set (`routes/payment.ts` L13); `/webhook/simulate` open whenever env!=='production' L22-30.
10. **GAP-10** Webhook bypasses order workflow — `paymentService.markOrderPaid` L108-117 forces status=Confirmed with no current-status check → cancelled order resurrected.
11. **GAP-11** `User.active` never enforced — `authService.login` L48-62 + requireAuth middleware never read active → deactivated users keep access.
12. **GAP-12** News drafts leak — `newsService.getBySlug` L25 no status:Published filter (list() has it).
13. **GAP-13** Inconsistent 404/400/403 — product 400 (orderService L87/98) vs 404 (wishlist L22 / review L59); coupon 400 vs 404 (admin); non-owner review→404 vs order→403; address 400 vs 404.
14. **GAP-14** Coupon preview trusts client subtotal — `couponController.apply/eligible/available` read subtotal from body/query → minOrder gate faked in preview.
15. **GAP-15** User deletion has no cascade — `userService.remove` L40-54 leaves dangling refs in Review/Order/Wishlist/Address/UserCoupon/GameSession.

## Canonical context extract (`.ai/CANONICAL_CONTEXT.md`)
- **C1** No 3D libs (no Three.js/R3F/model-viewer) — 2D galleries only. **C2** Vietnamese UI everywhere. **C3** No client test infra exists — don't assume. **C4** Cookie auth only (httpOnly `token`). **C5** Do not modify context-state logic (Auth/Cart/Wishlist/ThemeContext). **C6** Client never controls payment status. **C7** All DB images via `resolveImageUrl`.
- Stack/requirements: Express+Mongo (Routes→Controllers→Services→Models, thin controllers, asyncHandler, Zod both boundaries, envelope {success,message,data,pagination,errors}); client Vite+React+TS, Tailwind v4, shadcn new-york, TanStack Query, @hey-api/openapi-ts client; cart in localStorage; slugs VN diacritic-free; deploy Vercel (client) + Render (server); env MONGODB_URI + JWT_SECRET.
- §10 Verification: client build+tsc; server build+test; Playwright visual QA incl. states + console/a11y; clean git diff.
- §9 AC: builds pass, 0 TS errors, no regressions, VN UI, existing patterns, no unrelated refactor.
- §11 Output: kebab-case components, use-* hooks, *-page pages, envelope, Zod, VN errors.
- **Superseded by 2026-10-16 owner directive:** §6 design direction (Ocean Blue, glassmorphism, light+dark toggle, admin dark-only D14/D15), §3 "theme toggle with localStorage", §9 AC #8 → single dark theme Obsidian Gold (bg #07090F, gold #EDB84C, blue #3E8BFF, no toggle anywhere, Orbitron Latin/numeric only). All other §3/§9/§10/§11 + C1–C7 remain valid.
