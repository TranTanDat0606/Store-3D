# Store3D — Current State

> Last updated: 2026-10-18

## Current Project Status

**Stable and working.** Fully functional Vietnamese e-commerce store for 3D-printed models. Client + API on Vercel, server on Render.

## FULL REBUILD — Backend Trust Track (2026-10-17, COMPLETE on `dev`, demo sync awaiting owner approval)

Plan `docs/superpowers/plans/2026-10-17-backend-trust-track.md` (13 tasks + 3 review-fix subtasks) executed via subagent-driven development; every task implementer + independent review, all APPROVED (Task 10 required one review-fix cycle: idempotent rating refresh).

- **Branch `dev` @ `d59cec9`** (18 track commits `53eb80e..097662b` + 3 refactor commits `2ede062..d59cec9`), 46+3 files; **`origin/dev` pushed = `d59cec9` (fast-forward, owner-approved backup; no force)**; **`demo` untouched (owner approval gate — sync explicitly NOT approved)**.
- **All 15 verified gaps fixed:** GAP-1 public product status (public forced `active`, admin via `optionalAuth` passthrough) · GAP-2 + GAP-14 single `computeDiscount` over all 4 coupon sites + trusted preview (`items` optional → DB-priced `basis:'server-priced'`, legacy `subtotal` = estimate; cap 200.000₫ now at order time) · GAP-3/5 coupon restore shared `executeCouponRelease` + mark-after-validation + failure release · GAP-4 step-tagged compensating rollback (reverse-order, best-effort, original error preserved) · GAP-7/8 atomic `findOneAndUpdate` transition guard (single-winner 409) + conditional quantity increment · GAP-9/10 webhook: production boot-fails without `PAYMENT_WEBHOOK_SECRET`, simulate route unregistered in prod, `canMarkPaid` pending|confirmed only (+ atomic `$in` filter) · GAP-11 `User.active` at login + every `requireAuth` (optionalAuth degrades to anonymous) · GAP-12 news drafts 404 by slug · GAP-13 unified 404/403/409 factories in `AppError.ts` (business rules stay 400) · GAP-15 user deletion cascade (5 collections deleted, Orders kept; idempotent rating refresh) · GAP-6 game sessions validated server-side (ownership/expiry/status/range; documented residual: score client-chosen within verified session).
- **Site settings API:** `GET /api/settings/public` (only configured keys; unconfigured ⇒ `{}`, NO placeholders ever), `PUT /api/settings` admin-only (Zod ≤200); optional `SITE_*` env fallbacks documented in `.env.example`.
- **Tests:** `server npm test` = **83/83 pass** (3 original suites untouched + 12 new files), `npm run build` (tsc) clean; zero new dependencies; AC1–AC10 gate walked.
- **Contract for Plan 2:** plan §Cross-plan contract (coupon `items`/`basis`, authoritative totals, error-code handling, settings §7 socialLinks full-object PUT rule).
- **Known residuals (non-blocking):** webhook signature compare not timing-safe (follow-up); `rewardService`/`paymentService` keep bespoke 403 copy (outside Task 9 file list); reward happy-path coupon creation unpinned by test (pre-existing); `quantity:0` coupon = sold-out in guard vs unlimited in list filter (pre-existing); create-compensation vs admin-cancel race window (narrow, no transactions on standalone Mongo); AppError.ts comment lists wishlist 403 that doesn't exist (comment drift).

## FULL REBUILD — Refactor Debt Track (2026-10-17, COMPLETE on `dev`, review APPROVED)

Owner decision 4 (necessary refactor BEFORE Plan 2 touches orderService). 3 commits `2ede062`, `38eed22`, `d59cec9` — behavior-preserving consolidation only: `restoreStockForItems` single seam (3 sites), `runCouponReleaseActions` single release executor (cancel + compensation), dead product-404 removed, `BANK_TRANSFER_MIN_VND=1000` single-sourced (`config/payment.ts`), `COUPON_EXHAUSTED_MESSAGE` single message across guard + both pre-checks. Tests unchanged: `server/tests/` diff EMPTY, **83/83 green**, tsc clean; independent review walked all 5 items + union exhaustiveness + ordering invariants → **APPROVED**. Out-of-scope (deferred to backend pass 2, own plan+review): splitting `orderService.ts` god-module (564 lines), moving `create()`.

## FULL REBUILD — Plan 2 "Client Foundation & Shell" (2026-10-17→18, T1–T11 COMPLETE on `dev` — T12 Playwright gate PENDING)

Plan `docs/superpowers/plans/2026-10-17-client-foundation-shell.md` via subagent-driven development. **T1–T10 landed, each task independently reviewed:** T1 tokens `e1821e8` · T2 logo `fdef731` · T3 color sweep `bc2824e` (+fix `c0884d4`) · T4 dark-only `2d05e69` · T5 navbar `0dbf9c5` · T6 footer+settings `e90cfef` · T7 error mapping `a46cd2c` · T8 404 `25679c6` · T9 admin shell `31cd749` · T10 overlays `4974b09` (+fix `57c4ba1`); T11 docs = this commit. T3 and T10 each needed one review-fix cycle, both APPROVED after.

- **Scope amendments / deviations (logged per task):** T3 sweep extended from layout/ui/admin-layout to ALL of `client/src` including elimination of Tailwind `dark:` variants (0 hits remaining); T5 hamburger breakpoint `xl` vs screen's `lg`, category dropdown single-column; T6 hours render as own footer row, social links FB/ZL/IG only, no policy routes; T8 "Tư vấn trực tuyến" chat entry omitted; T9 decorative dashboard widgets deferred to Plan 6. T10 Step-2 plan wording corrected in place: **richColors ON** (overlays-spec shows type-colored toasts).
- **Known items for Plans 3–6:** 409 conflict can double-toast (global mapping + page-level handler — page handlers to drop when pages are rebuilt); skeleton default `bg-muted-foreground/20` advisory resolved at T10-fix. **Zero new dependencies** throughout (`client/package.json` byte-identical). AC1–AC7 evidenced by per-task build/tsc + reviews; **AC8/AC9 = T12 gate (Playwright + frontend-quality-checklist-store3d) still pending**. Series: Plan 3 (storefront) → 4 (auth/checkout) → 5 (content) → 6 (admin).

## FULL REBUILD — Design Track v2 "Obsidian Gold" (2026-10-16, GATE 1 v2 APPROVED 2026-10-17)

- **Scope change (owner directive 2026-10-16):** FULL REBUILD of storefront + admin, **dark-only** premium futuristic collectibles, palette **Black/Gold/Blue/White**, new logo, AO BING hero ≈3 s cinematic (NO scroll-driven). This **supersedes** both the "Precision Showroom" light-first delivery below and CANONICAL_CONTEXT §6 (light+dark toggle, Ocean Blue) — `.ai/` docs to be rewritten after design approval. Workflow: workflow-router → **A**; skills used: web-design-director → enhance-prompt → generate-design → manage-design-system.
- **Workflow evidence:** config comparison (nova-cms-test vs store3D) proved no missing config; behavior difference = project AGENTS.md small-task bias + legacy in-flight work. Full-rebuild classified LARGE/ARCHITECTURAL → full workflow.
- **New Stitch project:** `projects/15214270922225987910` (STORE3D-Full-Rebuild) — https://stitch.withgoogle.com/projects/15214270922225987910
- **Design System:** "Obsidian Gold" `assets/16575537908031701223` (DARK only; bg #07090F, gold #EDB84C, blue #3E8BFF, Be Vietnam Pro, round-8) — owner-approved via checkpoint before upload. Source doc `.stitch/DESIGN.md`; index `.stitch/metadata.json`.
- **GATE 1 v2 (2026-10-17) — full route coverage, awaiting owner approval:**
  - **40 screens** (was 18): +22 new covering every storefront route from `client/src/App.tsx` (QR payment, order success, review form, account dashboard/coupons/wishlist/profile, news detail, PLP search+empty states, mobile PDP, 404, overlays spec, mini-game modal, AI chat) and every admin module (categories, coupons, reviews, users, news CRUD, order-detail drawer, mini-game config). Index: `.stitch/metadata.json`.
  - **Business-accuracy pass (2 rounds, 20 `edit_screens` calls):** removed all Visa/Mastercard/MoMo/Napas badges (COD+VietQR only), all VIP/membership language (RBAC CUSTOMER only), all "24/7" → "8:30–21:00", all "SSL 256-bit" claims, all "Napas247"/"MB Bank" references; hotline standardized to placeholder "1900 1234" (real value from config at implementation). Verified by regex scan of all 40 HTMLs (0 visible violations; only HTML comments mention removed terms) + visual QA of 27 screens this pass.
  - **Git audit (read-only, 2026-10-17):** local = `master` (04bcdb2, ahead 2 of origin/master) + `feat/aobing-hero` (7a5a05c, worktree `..\store3d-aobing`, no upstream); remote = origin/master only; no dev/demo/member/* branches exist yet; 1 worktree; 0 stashes/tags; untracked `review-artifacts/`. Target structure (main/dev/demo/member/{khang,thien,dat,khanh}) requires owner-approved ref renames/creations — **no branch ops executed**.
  - **Blocked on owner:** GATE 1 v2 approval (design + coverage). No app code touched; no merge/push/deploy; no git history changes. Superseded pre-edit screens remain on Stitch canvas (no delete API).

## Full Redesign — Stitch Design Delivery (2026-10-16, awaiting Gate 1 owner approval) — SUPERSEDED by track v2 above

- **Status:** Design complete, delivered in Stitch project `projects/7002135967903808175` ("STORE 3D — Precision Showroom · Full Redesign 2026"). **No app source code was modified; nothing merged or deployed.**
- **Direction:** "Precision Showroom" — light-first retail + equal dark theme, Ocean Blue #3B6EE8 primary, Be Vietnam Pro, Vietnamese-only UI, no glassmorphism/neon.
- **Design systems (uploaded as DESIGN.md assets):** Light `5196906f87fc4e7da713b17a6ba68d77` · Dark `881331f832114c5b952f940de32e6abe`.
- **Inventory:** 45 canonical screens — 24 storefront desktop light, 11 admin light, 4 mobile light, 6 dark representative. Includes PLP-filtered, cart drawer, and checkout step-2 states from brief v2.
- **QA:** 3-pass (visual screenshot review + automated HTML-text regex scan of all 45 screens + fix verification). ~30 `edit_screens` fix rounds; final pass = 0 hard-rule violations (no invented hotlines/ISO/SSL/24-7/promo strips/English UI/garbled text).
- **Delivery report (screen-ID table, superseded mapping, demo-data policy, implementation proposal):** `C:\Users\Dat\AppData\Local\Temp\opencode\redesign\DELIVERY-REPORT-GATE1.md` (canonical screen IDs live there — Stitch `list_screens` does not enumerate generated screens).
- **Blocked on owner:** Gate 1 approval (design direction + nav IA + truthfulness policy), W1 security PR merge, decision on WELCOME10 seed coupon.

## Homepage Upgrade — AO BING Hero + Futuristic Light + Dynamic Categories (2026-10-16)

- **Part 1 — IMPLEMENTED & COMMITTED** on branch `feat/aobing-hero` (worktree `..\store3d-aobing`, commit `e16462e`, based on master `1645394`). **Not merged/deployed** — awaiting user review.
  - Scroll-driven hero (`client/src/components/home/aobing-hero.tsx`): CSS sticky pin (section 190svh mobile / 250svh desktop) + framer-motion `useScroll` progress → rAF-coalesced `video.currentTime` scrub (epsilon 1/24s). Scroll down = Gundam separates, up = reassembles, stop = freeze. Progress clamped to [0..1] (framer returns NaN past pin-end — regression guard). CTA "Mua ngay" fades in at progress 0.80–0.93; reduced-motion = static 100svh + immediate CTA; video error = poster fallback. CTA links to real AO BING product if it exists in DB (runtime search), else `/san-pham` — no fabricated product link.
  - Asset: `client/public/assets/video/banner-aobing.mp4` re-encoded (ffmpeg: CRF20, GOP 12, faststart) 11.6MB→4.5MB; seek latency avg 15ms vs 82ms original (measured in-browser). Poster JPEG extracted. Original kept at `client/assets/source/` (not deployed).
  - Old gradient hero + fabricated stats (500+/10K+/4.9) + HeroShowcase removed. Verified: desktop/tablet/mobile, light/dark, reduced-motion, error fallback, network (206 range), console clean. tsc 0 / oxlint 0 / vite build ✓.
  - Local test: server (main tree) `npx tsx src/server.ts` w/ process-scope `MONGODB_URI=mongodb://127.0.0.1:27017/store3d` (Atlas SRV DNS blocked on this network; local mongod seeded, same DB name) + worktree `vite --port 5174`.
- **Part 1.1 — HERO VISUAL & SCROLL FIX (2026-10-16, same branch, new commit on `feat/aobing-hero`):** fixed 5 user-reported issues per NAVBAR-HERO-SPEC:
  - **Root causes:** ① `object-cover` + full-bleed 100svh box put video bottom 65px below fold at scroll 0 + `from-black/70` gradient darkened feet; ② hero `sticky top-0` == navbar `sticky top-0` (z-40) → video pinned UNDER navbar and slid under translucent navbar during first 65px (the "overlap + one-beat jolt"); ③ scrub mapped 100% duration (80%+ frames clip wing tips).
  - **Fix (`aobing-hero.tsx`):** section `-mt-16` (overlay header, must match navbar `h-16`) + box `sticky top-16 h-[calc(100svh−4rem)]` → box pinned at 64px from pixel 0 (boxT=64 constant, no slide-under, progress aligned w/ pin, no dead zone); video `object-contain` in area `min(100vw×9/16, 100svh−152px)`; separate 88px control band (hint/CTA crossfade + cyan progress hairline) — no UI or gradient over video; section heights **160svh mobile / 190svh desktop**; **SCRUB_END=0.65** (frames 50–80% visually compared; 65% = full symmetric spread, feet+tips inside frame), scrub completes at scroll progress 0.93 (dwell→CTA full→unpin); CTA = cyan `#00E5FF`/text `#070A12` glow.
  - **Also fixed:** ④ stale framer-motion inline style — `style={showStaticCta ? undefined : …}` never cleared `opacity:0` → fallback CTA was invisible (pre-existing); now explicit `{opacity:1,y:0,pointerEvents:'auto'}`. ⑤ pre-existing navbar horizontal overflow at ≤390px (`Đăng nhập` text cluster → docW 424>390): container `gap-4→gap-2 sm:gap-4`, login button shows `User` icon <sm / text ≥sm (mobile menu has no login entry — icon kept visible). Navbar edit is responsive-only, ≥sm unchanged.
  - **Verified (Playwright, fresh):** desktop sweep 21 pts (boxT=64 const, vT≥navB−2, ct cap 3.277s=0.65×5.0417, reverse exact 1.736s, sh stable 4498); mobile+tablet 20/20 asserts; 1920/1536/1024/390 scroll-0 full-frame; reduced-motion (relative box, ct frozen, immediate CTA); fallback poster+CTA; idle & scroll-during-load no scrollY drift; no hscroll 390/768/1440; console only pre-existing 401/ORB. tsc 0 / oxlint 0 / vite build 0. Before/after shots: `store3D\.playwright-mcp\aobing\fix\` (before-*, after-*, final-*).
  - **Pre-existing, NOT changed (out of scope):** nav links wrap to 2 lines at 768–1024 (md..lg compression — fixing needs responsive nav redesign); `/api/auth/me` 401 on cold start; `localhost:5000/uploads/*` ERR_BLOCKED_BY_ORB (env MIME/CORS).
- **Parts 2+3 — DESIGN ONLY (round 2, dark-only "Obsidian Lab"; supersedes round-1 screens):** new DS **"Obsidian Cyan"** `a7dc9e137e704198b8593854991c0d0a` (DESIGN.md 4061B via upload instance `2064099079570118311`). Final 6 screens in project `7002135967903808175`:
  - HOME-DESKTOP `6c3cac09b4ee4927b14de24c8f20edcd` (2560×7974) · HOME-TABLET `4a26cfc78b23430f82a61cb63589c1a7` · HOME-MOBILE `2072901430784e5797120f4b76463d92` (780×7700)
  - NAVBAR-HERO-SPEC `c2938dd146d6404e982b03a8b2a89d04` (proposed: navbar 65px in-flow sticky; hero `min(100svh−64px, 100vw×9/16+128px)` object-contain; pin 190svh desktop/160svh mobile; CTA 0.80→0.93; reduced-motion static)
  - CATEGORIES-DISCOVERY+STATES `79e8fe8a439e453499d001b5c49181e5` (6 real categories, auto-fit no cap, skeleton/error/empty)
  - PLP-DARK-FILTERED `90bf95a1aca64e4fb07958b7503e07bf` (URL bar + chips + exact app sort/filter labels + real empty combo)
  - New IA: Navbar→Hero→Danh mục→Nổi bật(8 API)→Ưu đãi(4)→CTA band→Footer; Aurora section + "Bán chạy" duplicate row removed
  - **QA incidents:** flaky in-place edit corrupted old mobile `08f5c537` (replaced by regen `20729014`; first regen `5831806f` had AI photos with burned-in EN UI — discarded); browser 429 on 5 lh3 images recovered 13/13 after cooldown; desktop screenshots blocked (desktop window not visible) — verified via Stitch full-res + numeric browser checks instead
  - Report: `C:\Users\Dat\AppData\Local\Temp\opencode\redesign\DELIVERY-REPORT-HOMEPAGE-DARK.md` (8-item VN delivery, gate stop). Superseded/raff screen IDs listed there for manual deletion (no delete_screen API). Round-1 screens (Home Light `e647…`, `6429…`, Home Dark `dd4ac66f…`, PLP `26bf…`, `020c…`) superseded.

## Implemented Features

### Fully Implemented
- **Product catalog:** List, search, filter by category, sort, pagination, featured products, related products
- **Product detail:** Immersive gallery-first layout with lightbox (double-click zoom, keyboard nav), desktop sticky purchase panel, mobile fixed bottom bar, tabbed content (Mô tả / Thông số / Đánh giá), rating summary bar chart, review cards, related products
- **Shopping cart:** Add/remove/update quantity, persisted to localStorage, cart drawer UI
- **Checkout:** Shipping info form, payment method selection (cash on delivery / bank transfer), coupon application
- **QR payment:** VietQR code generation with countdown timer, bank info display, copy-to-clipboard
- **Order management:** Create order (atomic stock decrement), order history, order detail, cancel order
- **User authentication:** Register, login, logout, profile update, password change (JWT httpOnly cookies)
- **Wishlist:** Add/remove products, move to cart, server-side persistence
- **Review system:** Purchase-gated reviews (must have completed order), CRUD, rating aggregation
- **Admin dashboard:** KPI cards (revenue, orders, products, customers), revenue charts (Recharts)
- **Admin products:** CRUD with Cloudinary image upload, stock management, status toggle
- **Admin categories:** CRUD with product count, deletion protection
- **Admin orders:** List with status filter, status workflow (pending → confirmed → shipping → completed)
- **Admin coupons:** CRUD (percent/fixed), min order, expiry, usage tracking
- **Admin reviews:** List, delete
- **Admin users:** List, role update, activate/deactivate, delete (protects last admin)
- **Admin Excel export:** 4-sheet XLSX (overview, daily revenue, monthly revenue, product sales with stock), excludes cancelled orders
- **News/blog:** Full CRUD (admin), public listing by category, slug-based detail pages
- **Contact form:** Submit, admin list/status/note management
- **Dark/light theme:** Toggle with localStorage persistence, smooth CSS transitions
- **Search with suggestions:** Horizontal scrollable product cards with images
- **Responsive design:** Mobile-first with drawer navigation, responsive grids
- **Image upload:** Cloudinary integration with 5MB limit, memory storage
- **Rate limiting:** Global (300/15min) and auth-specific (20/15min)
- **Error handling:** Central error handler, Vietnamese error messages
- **Database seeding:** Idempotent seed script with sample data
- **Mini-game (MIU-9 Future Run):** Canvas-based endless runner (1280×720, DPR-aware). Kill-only scoring (no distance points). 3-heart lives system with 2s invincibility frames on damage. Player: Pink cyber cat with arm cannon. Enemies: ground robot (+2 pts), bird robot (+4 pts, flies at jump height, fires red laser every 3s), mouse sword robot (+2 pts, charge/dash with "!" warning at 60% screen width). Controls: W/Space=Jump, S=Duck, F=Straight Laser, A/D disabled. Three game phases: idle→running→gameover. Keyboard input via window keydown/keyup with phase guard. Mobile touch controls (Jump/Duck/Fire). Cyberpunk start screen with enemy previews and kill-only scoring guide. HUD with score + hearts display. Game over overlay with score/best. Gemini integration: server endpoint generates game assets (background, road, player, bird-robot, mouse-robot) via @google/genai + Imagen 3. Client-side asset caching with 24h TTL. Canvas-drawn fallbacks when images unavailable. Admin test mode: admins can start unlimited test games without order requirement via /api/rewards/game/test-start. User play limit: 1 play per completed order (enforced server-side via GameSession unique index).
- **AI chat:** Mock provider (ai/test MockLanguageModelV4), per-user/guest localStorage scoping, debounced streaming persistence (500ms), product recommendation cards from markdown, 20-message server limit, MAX_MESSAGES=18 client guard
- **Product Gallery:** Dedup to show 2 unique Unsplash images per product (thumbnail + main image switching)
- **Checkout address (User):** User.address (profile string) used as default shipping address via synthetic entry; inline edit via profile API; __user_address__ sentinel never sent as addressId
- **Checkout address (Admin):** Address model entries with structured province/district/ward/street; existing behavior preserved
- **Profile email:** Editable email input with Zod validation; backend uniqueness check (409 on duplicate); persists after reload
- **Favorites:** Fixed price/button overlap — pb-12 padding when hideAddToCart prop is true
- **Order creation:** Backend validates address ownership when addressId provided; User.address string used directly when no addressId

### Partially Implemented
- **Email/SMTP:** Config exists in env vars but no email sending code is implemented
- **Payment webhook:** Endpoint exists but relies on external webhook configuration

## Chat History Persistence (verified 2026-08-31)

### Guest users
- History scoped by stable guest session ID (`store3d_guest_xxx` stored in localStorage)
- Survives F5/page refresh
- Different browsers get different guest IDs

### Authenticated users
- History scoped by user ID (`store3d_chat_{userId}`)
- User A never sees User B's history
- Login/logout transitions: `storageKeyRef` updates immediately, `chatId` recomputes via `useMemo`

### Streaming persistence
- Debounced save at 500ms during streaming (not every token)
- `beforeunload` handler flushes pending saves
- Cleanup on component unmount
- `onFinish` does immediate final save (overwrites debounced partial)
- `clearChat` cancels pending saves before clearing

### History size
- Client: MAX_MESSAGES = 18 (kept in localStorage)
- Server: max 20 messages validated by Zod schema
- Older messages trimmed from localStorage on save

## AI Token/Tool Optimization Rules (verified 2026-08-31)

All 10 rules verified in `aiChatService.ts`:
1. **Greeting** → direct response, no DB query
2. **Budget request** → parse budget, targeted product query
3. **No matching product** → fallback to nearest-price products
4. **General conversation** → no DB query
5. **Product-specific** → targeted query
6. **No guessing** → uses actual DB data
7. **Context minimization** → only selects name/slug/salePrice/originalPrice/images
8. **No double tool calls** → parseBudget in mutually exclusive branches
9. **Mock mode preserved** → `config.ai.provider === 'mock'`
10. **Security** → no secrets exposed

## Known Bugs / Issues

- **No critical bugs.** Application is stable.
- Hidden demo credentials in `client/README.md` — potential security concern if repo is public
- `store3d.vercel.app` custom domain points to wrong project (needs dashboard fix)
- News page card heights now equalized via flex layout fix
- Address Book page removed — address management consolidated into Checkout inline edit

## Vercel Deployment — Module Format Fix (verified 2026-08-31)

### Root Cause (confirmed from Vercel runtime logs)
`ReferenceError: exports is not defined in ES module scope` at `api/server.js:2:23`.

- Root `package.json` has `"type": "module"` → Node.js treats `.js` files as ESM by default
- `api/tsconfig.json` has `"module": "CommonJS"` → Vercel compiles `api/server.ts` to CJS (`exports` keyword)
- CJS output loaded as ESM by Node.js → `exports is not defined` crash at line 2, before any handler executes

### Fix Applied
1. **`api/package.json`** (created): `{"type": "commonjs"}` — makes Node.js resolve nearest package boundary for `api/server.js` as CJS
2. **`api/tsconfig.json`**: Kept `"module": "CommonJS"` intentionally — CJS ensures `require()` resolves extensionless relative imports to `../server/src/*` files correctly
3. **`server/src/services/aiChatService.ts`**: Changed static `import from 'ai'` / `import from 'ai/test'` to dynamic `await import('ai')` / `await import('ai/test')` — the `ai` package is ESM-only and cannot be `require()`'d from CJS
4. **`server/src/services/productService.ts`**: Replaced `require('mongoose').Types.ObjectId` with `mongoose.Types.ObjectId` (already imported at top)

### Why Not ESM Output
Changing `api/tsconfig.json` to `"module": "ES2022"` produces ESM output, but ESM requires explicit `.js` extensions in relative imports (`from '../server/src/vercel-connect'`). All server source files would need `.js` extensions added to imports. CJS approach avoids this by letting `require()` resolve extensionless paths natively.

### Verified
- Production endpoints all return correct responses (200 for data, 401 for unauthenticated `/api/auth/me`)
- `/api/health` → 200, `/api/auth/me` → 401, `/api/products` → 200, `/api/products/featured` → 200, `/api/categories/all` → 200

## Known Technical Debt

1. **No client-side tests.** Zero test files in `client/`. No vitest/jest configuration
2. **Limited server tests.** Only 3 unit tests (15 test cases total)
3. **No root README.md**
4. **CORS permissive in development** (`*` when `NODE_ENV !== 'production'`)
5. **No request logging** (no morgan)
6. **No API documentation** (no Swagger/OpenAPI)
7. **No CI/CD pipeline**
8. **No environment validation** beyond MONGODB_URI and JWT_SECRET
9. **TypeScript strict mode not enabled** in server
10. **No database migrations** (Mongoose schemaless)

## Database Seed Data

Demo accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@store3d.com | admin123 |
| Customer | khach@store3d.com | khach123 |
