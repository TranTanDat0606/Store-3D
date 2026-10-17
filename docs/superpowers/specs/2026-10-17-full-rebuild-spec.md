# STORE 3D — Full Rebuild Specification (Obsidian Gold)

Date: 2026-10-17 · Status: **owner-approved design (GATE 1 v2) → feeds writing-plans → implementation**
Grounding: 3 codebase surveys + backend survey `2026-10-17-backend-survey.md` (15 verified gaps) + approved Stitch design (40 screens, project `15214270922225987910`, DS "Obsidian Gold").

## Problem Statement

Store3D works but is dated and inconsistent: light/dark toggle with Ocean Blue identity, no logo system, an unverified scroll-driven hero, UI patterns that drifted from the real business (fake payment badges, fake VIP tiers, fake 24/7/SSL claims), admin modules designed around shared patterns that were never proven, and 15 confirmed backend logic gaps (stock/coupon/order-state bugs, forgeable webhook, inactive users/products still active, draft news leaking). The owner wants a full rebuild of storefront + admin with one approved dark identity, complete business-accurate UX for every route, and a backend that enforces the rules the UI promises — without breaking the parts that already work (auth model, API envelope, deployment topology).

## Solution

Rebuild the client UI in place against the approved 40-screen Obsidian Gold design (dark-only, black/gold/blue/white, Be Vietnam Pro + Orbitron accents, new logo system, fixed ~3s AO BING cinematic hero band — no scroll-driven choreography), covering every storefront route (19) and admin route (11) plus all states/overlays. Keep the server architecture and API contract, and fix the 15 verified logic gaps so business rules hold server-side. All business information (hotline, support hours, addresses, statistics) becomes configuration/API-driven with safe fallbacks and is never fabricated in code.

## User Stories

1. As a visitor, I want a dark premium storefront that loads fast, so that I trust the shop before browsing.
2. As a visitor, I want a compact ~3s AO BING cinematic hero (plays once/loops muted, no scroll hijack), so that I see the brand without losing control of scrolling.
3. As a visitor, I want the hero CTA to open the real AO BING product (or the product list), so that I never hit a dead link.
4. As a visitor, I want dynamic category tiles from the database (uncapped), so that navigation always reflects real catalog data.
5. As a visitor, I want hot-sale / featured / best-seller sections driven by API data, so that no fabricated stats or prices are shown.
6. As a visitor, I want live search with suggestions in the navbar, so that I can find products without leaving the page.
7. As a visitor, I want a PLP with sticky filters (material PLA/PETG/ABS/Resin, printer FDM/Resin, price) and sorting, so that I can narrow the catalog quickly.
8. As a visitor, I want the PLP search mode (horizontal result rows) and an explicit empty state with recovery actions, so that zero-result searches are handled gracefully.
9. As a visitor, I want a PDP with gallery + lightbox zoom, gold pricing with discount %, rating/review count, stock state, material chips, and 3 tabs (Mô tả/Thông số/Đánh giá), so that I can evaluate a product fully.
10. As a mobile visitor, I want a sticky bottom purchase bar on PDP, so that I can buy with one thumb.
11. As a visitor, I want every image to render through the image resolver, so that broken hotlinks never appear.
12. As a customer, I want a cart drawer with quantities, free-shipping (0₫) line and COD/VietQR summary, so that I can adjust my order before checkout.
13. As a customer, I want checkout with saved-address selection plus add/edit-address dialog, so that I can manage shipping without leaving checkout.
14. As a customer, I want only COD and VietQR payment options (no cards/wallets), so that the UI matches what the shop actually supports.
15. As a customer, I want inline error banners for stock/coupon problems surfaced from the API, so that I understand and can fix failed orders.
16. As a customer, I want a VietQR payment page with countdown, QR code, polling status and "I transferred" action, so that I can pay by transfer confidently.
17. As a customer, I want orders under 1.000₫ to be rejected for bank transfer with a clear Vietnamese message, so that I know why.
18. As a customer, I want an order-success page with order code, status timeline, review CTAs and the reward-game entry, so that I know what happens next.
19. As a customer, I want to cancel my order with a reason (only while cancellable per state machine), so that I stay in control pre-shipment.
20. As a customer, I want an order timeline (Chờ xác nhận → Đã xác nhận → Đang giao → Hoàn tất) instead of bare badges, so that I understand fulfillment progress.
21. As a customer, I want to review a product only after its order completes, once per product per order, with star rating and up to 5 photos, so that reviews stay trustworthy.
22. As a customer, I want a verified-purchase badge on reviews, so that I can trust other buyers' opinions.
23. As a customer, I want an account dashboard with real counts (pending orders, completed, available coupons) and recent orders, so that I get an at-a-glance overview.
24. As a customer, I want a wishlist grid with add-to-cart and out-of-stock states, so that I can save and revisit products.
25. As a customer, I want a coupons page with active/used/expired tabs, copy-code and game-reward labels, so that I can use my discounts.
26. As a customer, I want to manage my profile (name, editable email, phone, default address) and change my password, so that my data stays current.
27. As a customer, I want the mini-game modal after a completed order with real tier thresholds and generated REWARD-* coupons (cap 200.000₫), so that rewards feel fair and automatic.
28. As a customer, I want login/register in Vietnamese with cookie-based sessions, so that my cart and account persist securely.
29. As a visitor, I want an AI chat panel with product suggestions and a clear AI disclaimer, so that I get quick answers (mock provider acceptable now).
30. As a reader, I want a news list and article detail (TOC, reading progress, related articles) fed by published articles only, so that drafts never leak.
31. As a visitor, I want a contact page whose hotline/hours/address come from configuration (hidden or neutral fallback when unset), so that no fake contact data is ever shown.
32. As a visitor, I want a styled 404 page with search and product suggestions, so that dead ends recover.
33. As an admin, I want a dark admin shell (fixed sidebar + topbar, dense tables) matching the storefront identity, so that operations feel like one product.
34. As an admin, I want a dashboard with real revenue/order/user statistics and period switching, so that I can steer the business.
35. As an admin, I want product CRUD with image upload, categories, material/printer enums, featured flag and status (active/inactive/out-of-stock), so that the catalog stays accurate.
36. As an admin, I want category CRUD (dialog + image upload + menu visibility) driving the storefront navigation, so that merchandising needs no code changes.
37. As an admin, I want an orders list plus a detail drawer with timeline, customer info, payment state, "mark paid" for VietQR, and state-transition buttons, so that I can fulfill orders correctly.
38. As an admin, I want cancellations to restore stock AND coupon usage atomically, so that inventory and discounts stay correct.
39. As an admin, I want coupon CRUD (percent/fixed, cap, minOrder, expiry, quantity, source system/game), so that promotions are manageable.
40. As an admin, I want review moderation (list, filter, delete with confirm), so that policy violations can be removed.
41. As an admin, I want customer management with role toggle guarded by last-admin protection and an active toggle that actually blocks login/sessions, so that access control is safe.
42. As an admin, I want news CRUD with markdown editor and draft/publish states, so that content publishing is self-service.
43. As an admin, I want the support inbox (contact messages) with status transitions, so that customer questions are tracked.
44. As an admin, I want mini-game configuration (enable flag + tier table + test-play), so that rewards can be tuned without deploys.
45. As an admin, I want consistent error semantics (404 resource-missing, 403 forbidden, 409 duplicate, 400 business rule) in Vietnamese, so that the UI can react predictably.
46. As the owner, I want hotline/hours/address/social links stored in configuration and consumed via a public settings API, so that real business data replaces placeholders without code changes.
47. As the owner, I want zero fabricated business claims (payments, memberships, SSL, 24/7, statistics) anywhere in the UI, so that the shop stays compliant with real operations.
48. As the owner, I want the known backend gaps (stock/coupon/webhook/auth/news/cascade) fixed with tests, so that the rebuilt UI sits on trustworthy logic.
49. As the owner, I want Vietnamese-only UI with correct diacritics and AA contrast in a single dark theme, so that the brand reads professionally.
50. As a developer, I want each phase landing on `dev` with build/tsc/test gates green, so that integration into `main` stays boring.

## Implementation Decisions

- **Branches:** all implementation on `dev`; `demo` synced at milestone previews; `member/*` for parallel members; `main` = integration, updated only after phase verification. No force-pushes; no history rewrites.
- **Client rebuild in place:** same Vite + React + TS app, same routing skeleton (19 storefront + 11 admin routes); pages/components rewritten to the approved screens. Tailwind v4 tokens replaced with Obsidian Gold values (bg `#07090F`, surfaces `#0E1219`/`#151A24`, gold `#EDB84C`, blue `#3E8BFF`, text `#FFFFFF`/`#94A3B8`, semantic `#34D399`/`#FBBF24`/`#F43F5E`, radius ~10px, Be Vietnam Pro body/headings, Orbitron for Latin/numeric accents only). shadcn (new-york) retained, re-themed; **single dark theme, no toggle anywhere** — ThemeContext remains untouched and dormant (C5), toggle UI removed.
- **Hard constraints honored:** C1 no 3D libraries (hero = `<video>` band only); C2 Vietnamese everywhere; C4 cookie auth unchanged; C6 payment state only via backend/webhook; C7 `resolveImageUrl` for all images.
- **Hero:** fixed ≈3s muted cinematic band using the preserved source video asset (from the aobing worktree), plays once with loop fallback, respects `prefers-reduced-motion` (static poster + immediate CTAs), error fallback to poster. **No scroll-scrubbing** (supersedes feat/aobing-hero behavior; that branch stays archived as asset/reference).
- **Component system per design brief:** ProductCard, CategoryTile, FilterSidebar/Sheet, Pagination, ProductGallery+Lightbox, PurchasePanel/MobilePurchaseBar, Tabs, CartDrawer, CheckoutSummary+CouponInput, OrderStatusTimeline, OrderStatusBadge, CouponCard, WishlistButton, StarRating+verified badge, Empty/Error/Skeleton states, form fields+dialogs, Toast; admin: StatCard, charts (recharts), DataTable, Dialog/AlertDialog CRUD, ImageUpload, status-transition controls, sidebar+topbar shell.
- **Business info policy (owner mandate):** hotline, support hours, addresses, social links and the contact email are read from a new **site settings** store (DB collection with env fallback) exposed via a public API; **computed statistics (revenue, order/user counts) come from the existing server stats endpoints — never from settings, never fabricated**. UI renders rows only when values exist; otherwise hidden or neutral fallback text (e.g. no hotline row). The design placeholder "1900 1234" and mock figures must NOT ship as real values — they live only in design mocks and example env files with explicit comments.
- **Backend fixes (all 15 verified gaps):** enforce product status in public queries and order creation; apply 200.000₫ cap at order time; restore coupon usage on admin cancel; introduce transactional/partial-rollback order creation (compensating actions where transactions unavailable); move `usedAt` marking after payment-method validation with cleanup on failure; stop trusting client game score (server-side session validation; score accepted only for verified sessions — pragmatic anti-cheat, documented); make status transitions atomic (guarded findOneAndUpdate); make coupon quantity increment atomic; require webhook secret in production and disable simulate endpoint in production; validate webhook transitions (no resurrection of cancelled/completed orders); enforce `User.active` at login and middleware; filter drafts in news slug view; unify error semantics (404/400/403/409); recompute coupon preview server-side; cascade or nullify refs on user deletion.
- **API:** existing envelope/Zod/asyncHandler patterns unchanged; one new public endpoint family for site settings; admin CRUD for settings. No other contract changes without spec addendum.
  - **Addendum 2026-10-17 (Plan 1):** coupon preview endpoints (`POST /api/coupons/apply`, `GET /api/coupons/available`, `GET /api/coupons/eligible`) gain an optional `items: [{product, quantity}]` request field and a `basis: 'server-priced'|'client-claimed'` response field; legacy `subtotal`-only requests remain supported (backward compatible during rebuild).
- **Data seeding:** demo data only from real catalog semantics (existing products/news in DB); no invented products/prices/reviews beyond what the DB already contains.
- **Testing seams (decided without owner Q&A per standing instruction):** (1) **HTTP API seam** — supertest against Express app for every changed service/route (server test infra exists); (2) **browser journey seam** — Playwright for critical flows + visual QA vs Stitch screens; (3) **component seam** — a new vitest + RTL + MSW + vitest-axe layer (per repo-specific react-component-testing skill) for key storefront components only (ProductCard, CheckoutSummary, CartDrawer, OrderStatusTimeline) — introduced fresh, per C3, without touching context-state logic. Highest seam preferred: most coverage lands at API + journey level.
  - **Addendum 2026-10-17 (Plan 1):** seam (1) is realized **without supertest** — the no-new-dependency rule (AGENTS.md, owner standing rule) supersedes the tool choice: route-boundary contracts are asserted at the Zod validator level, domain rules via pure service seams, and real HTTP round-trips via the Playwright journeys in Plan 2 (browser → real server). Supertest may only be introduced later with explicit owner approval.

## Testing Decisions

- Good tests assert **external behavior** (responses, rendered output, URLs, visible Vietnamese copy) — never internal implementation details.
- Server: extend existing `npm test` with suites for: order creation (stock decrement, coupon cap, bank-transfer minimum, rollback on failure), status transitions (allowed/denied, atomicity), webhook (signature required, no resurrection), auth (active flag), news draft filter, coupon preview recompute, user deletion cascade. Prior art: existing server test setup. Per the Testing seams addendum: **no supertest** — route contracts at Zod validator level, rules at pure seams, HTTP round-trips in Plan 2 Playwright.
- Client: `npx tsc --noEmit` + `npm run build` as every-phase gate; component tests for the 4 listed components with MSW at the fetch boundary (hey-api client intercepted), QueryClient per test, axe accessibility assertion. Prior art: `react-component-testing` skill (repo-specific).
- Playwright journeys: guest browse→search→PDP→cart→404; login→checkout COD→success→timeline; VietQR flow (page render + countdown + polling states); cancel-order dialog; review eligibility; admin login→product edit→order transition→coupon CRUD→role toggle guard; reduced-motion hero; console-error and horizontal-overflow checks; responsive sweeps (1920/1440/1024/390). Prior art: `.playwright-mcp` runs from hero track.
- Visual QA against `.stitch/designs/*.png` (side-by-side) for every rebuilt page — typography/spacing/color/layout, all states (loading/empty/error/disabled/validation).
- Frontend quality gate: `frontend-quality-checklist-store3d` skill at the end of client phases; Critical issues fixed before phase completion.
- No phase merges to `main` until its gates are green and recorded.

## Out of Scope

- Merging or deleting `feat/aobing-hero` (archived + pushed; superseded by the new hero design — decision deferred to owner).
- Git Phase 3 (default-branch switch, origin/master deletion) — owner handles in GitHub UI.
- Deployment (Vercel/Render) — separate explicit gate after full verification.
- Light mode / theme toggle, English locale, new payment providers, 3D libraries.
- Real AI provider integration (mock stays behind the existing API), real payment gateway (VietQR simulation/webhook stays).
- Rewriting the mini-game engine internals (Pixi kept; only config/tiers UI + server score validation).
- Stitch canvas cleanup (manual by owner).
- Data migrations beyond settings seeding; WELCOME10-style seed coupons (owner decision pending separately).

## Further Notes

- Superseded docs must be rewritten as part of Phase 0: CANONICAL_CONTEXT §6 (+ the §3 toggle bullet + §9 AC #8) → Obsidian Gold dark-only; root `DESIGN.md` → pointer to `.stitch/DESIGN.md` + this spec.
- The design track (`.stitch/metadata.json`, 40 screens) is the visual source of truth; any deviation during implementation must be recorded in the phase report.
- 15 backend gaps are ordered by risk in the plan; GAP-1/2/3/4/5/6/9/10 block trust in checkout and are fixed early in the backend track.
- `review-artifacts/` and `client/public/qa/` remain untracked scratch (never committed).
