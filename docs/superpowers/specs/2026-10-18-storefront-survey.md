# Storefront Survey (Plan 3 grounding) — 2026-10-18

Branch `dev` @ 01bec7d (verified `git branch --show-current`). Read-only survey; one artifact = this file.
Scope: home/PLP/PDP/cart/search screens + page reality + AO BING asset + data sources + contract touchpoints. Plan 2 foundation (tokens/navbar/footer/404/error-mapping) NOT re-surveyed.

## 1. Design screens inventory (storefront set)

All in `.stitch/designs/`, all have both HTML + PNG (verified `Get-ChildItem`). Slugs/ids in `.stitch/metadata.json`.

| Slug | Files | Device | Structure notes |
|---|---|---|---|
| home-desktop | home-desktop.html/png | DESKTOP | "2. HERO SECTION – CINEMATIC AO BING DRAGON" 2-col, figure frame right (l.250, l.300–317); "Danh mục nổi bật" category cards (l.155+); "Sản phẩm bán chạy nhất"; "Góc 3D & Tin tức sáng tạo" |
| home-tablet | home-tablet.html/png | TABLET | same sections, 1024 breakpoint |
| home-mobile | home-mobile.html/png | MOBILE | same sections stacked, 390 |
| plp | plp.html/png | DESKTOP | quick-filter input "Lọc nhanh theo tên mô hình, mã sản phẩm" (l.237); sort select incl "Đánh giá cao nhất" (l.242–250); active-filter chips row (l.271–281); filter sidebar = 5 groups: Danh mục (l.303), Vật liệu in chips (l.347), Công nghệ in 3D (l.366), Khoảng giá range slider+input (l.384), Tình trạng hàng & Thuộc tính độc bản (l.411) |
| plp-search-states | plp-search-states.html/png | DESKTOP | search-results + "Không tìm thấy sản phẩm nào" empty state |
| pdp | pdp.html/png | DESKTOP | gallery + purchase panel ("Mua ngay — Thanh toán nhanh" l.374); tabs "Thông số kỹ thuật" (l.412/456), "Đánh giá (128)" reviews w/ date+variant lines (l.416, 528, 563) |
| mobile-pdp | mobile-pdp.html/png | MOBILE | PDP w/ sticky bottom buy bar; hero product "Tượng Thần Long Ao Bing 1/8" |
| cart-drawer | cart-drawer.html/png | DESKTOP | cart drawer (items, qty, totals) — **no standalone cart page screen exists** |
| review-form | review-form.html/png | DESKTOP | star+photo review form, success state "Gửi đánh giá thành công!" |

Related (touch storefront): `overlays-spec` (lightbox/dialog/toast — PDP gallery lightbox), `navbar-footer-spec` (search box in navbar), `account-wishlist` (move-to-cart). **No quick-view screen; no category-landing screen** (category = PLP filter param). Checkout/order-success/qr-payment screens = Plan 4.

## 2. Current page reality (`client/src/pages/`)

- **Home** — `client/src/pages/home-page.tsx` (408 LOC). HeroShowcase floating cards (l.14–125), gradient hero w/ **fabricated stats '500+'/10K+/'4.9' hardcoded (l.243–247)**, HotSaleSection, categories grid, "Sản phẩm bán chạy" section renders `productApi.featured` data (featured ≠ best-selling — mislabeled), CTA band. APIs: `productApi.featured({limit:8})`, `categoryApi.all()`, `productApi.hotSale(8)`. State: local `useState` per section, no react-query.
- **Product list** — `product-list-page.tsx` (387 LOC). URL-param driven: page/search/categorySlug/featured/material/printerType/minPrice/maxPrice/sort(default `newest`) (l.92–100); debounced 200ms search; mobile filter Sheet + desktop sidebar; active-filter chips; EmptyState; Pagination. APIs: `productApi.list`, `categoryApi.all`.
- **Product detail** — `product-detail-page.tsx` (255 LOC). ProductGallery + ProductGalleryMobile + PurchasePanel + `usePurchasePanel` + ProductTabs + MobilePurchaseBar; `productApi.getBySlug/related(4)`; `reviewApi.listByProduct(limit:6)` + eligibility; `?review=<id>` highlight (l.32).
- **Cart** — NO cart page (no route in `App.tsx`); only drawer `client/src/components/cart/cart-drawer.tsx` (218 LOC): custom fixed drawer, Escape close, qty ±→`updateQuantity`, `removeItem`, client `subtotal`, CTA→navigate('/thanh-toan'). `client/src/contexts/CartContext.tsx` (145 LOC): reducer + localStorage `store3d-cart`; `addItem` clamps to stock & opens drawer; `UPDATE_QUANTITY` clamps [1, stock]; **subtotal = Σ stale localStorage price×qty, client-side only, never server-validated at cart stage** (server authoritative only at order create — contract §3).
- **Search** — no dedicated page; `/san-pham?search=` on PLP (linked from `not-found-page.tsx:18`). Navbar search box (Plan 2 shell) also routes there.
- Known legacy issues in scope (per `.ai/CURRENT_STATE.md:30`): fabricated home stats + old hero (AO BING pending), `product-card.tsx` nested-interactive (Link wraps cart/wishlist buttons), chat launcher overlaps cart on mobile, static SPA `<title>`, 409 double-toast page handlers to drop on rebuild.

## 3. AO BING hero asset (critical)

- **Location:** worktree `C:\Users\Dat\Documents\IT\FPOLY\React\store3d-aobing` on branch `feat/aobing-hero` (tip `7a5a05c`, merge-base w/ dev `1645394`; dev is **42 commits ahead** — `git log feat/aobing-hero..dev` = 42).
- **Assets (file-only, trivially copyable):**
  - `client/public/assets/video/banner-aobing.mp4` — 4,544,981 B (~4.5 MB; re-encoded CRF20/GOP12/faststart per `.ai/CURRENT_STATE.md:60`; duration ≈5.04 s derived from "ct cap 3.277s = 0.65×5.0417" CURRENT_STATE:67)
  - `client/public/assets/video/banner-aobing-poster.jpg` — 161,501 B
  - original (not deployed) `client/assets/source/banner-aobing-original.mp4` — 12,159,370 B (`git show --stat e16462e`)
- **Component:** `store3d-aobing/client/src/components/home/aobing-hero.tsx` (220 LOC). Plain `<video>` + **framer-motion scroll-driven scrub** — NOT ~3s autoplay: `useScroll` pinned section (`-mt-16`, 160svh mobile/190svh desktop, box `sticky top-16`), rAF-coalesced `video.currentTime` seek, `SCRUB_END=0.65` (l.17), dwell→CTA fade at 0.93 (l.22, 122), reduced-motion → static 100svh + immediate CTA, video error → poster, CTA runtime-resolves real AO BING product via `productApi.list({search:'AO BING'})` else `/san-pham` (l.104–119). Hardcoded cyan `#00E5FF` CTA (l.200) ≠ token gold.
- **⚠ Directive conflict:** `.ai/CURRENT_STATE.md:36` owner directive says "AO BING hero ≈3 s cinematic (**NO scroll-driven**)" — the branch implementation IS scroll-driven. Plan 3 must confirm which behavior ships.
- **Merge complexity verdict: MEDIUM — do NOT git-merge; copy assets + port/adapt component.** Reasons: branch 42 commits behind dev; its `home-page.tsx` edit targets the pre-rebuild page; commit `7a5a05c` also patched `navbar.tsx` (coupling: navbar `h-16` must match hero `-mt-16`/`top-16`); dev navbar was rebuilt in Plan 2; hardcoded cyan + scroll-driven behavior contradict current design tokens/directive. Video+poster are dependency-free file copies.

## 4. Data sources for home / PLP / PDP / cart

- **Stats:** **No public stats endpoint exists.** `server/src/routes/stats.ts:7` — `router.use(requireAuth, requireAdmin)` over all of `/api/admin/stats/*` (`app.ts:66`). `overview` shape (`server/src/services/statsService.ts:47–56`): `{ totalRevenue, todayRevenue, monthRevenue, totalOrders, totalProducts, totalCustomers, pendingOrders, completedOrders }`. **No `home-stats`; no rating/customer-count fields.** Current home stats are hardcoded (home-page.tsx:243–247) → Plan 3 needs a new public endpoint or settings-driven/omitted stats (backend task).
- **Products (public):** `server/src/routes/product.ts` — `GET /api/products` (optionalAuth + `productQuerySchema`: page≥1, limit 1–100, sort, search, category, categorySlug, material, printerType, status, featured `'true'|'false'`, minPrice≥0, maxPrice≥0 — `server/src/validators/product.ts:31–44`); `GET /products/featured`; `GET /products/:slug`; `GET /products/:id/related?limit`. **No `/new-arrivals` endpoint** — "new" = default sort; hot-sale is client-side `GET /products?sort=discount&status=active` (`client/src/services/productApi.ts:62–68`). No rating filter param exists.
- **Reviews (PDP):** `server/src/routes/review.ts` — public `GET /reviews/product/:productId`; auth `GET /reviews/me/:productId` (eligibility), `POST /`, `PUT /:id`, `DELETE /:id`. Client `reviewApi` at `client/src/services/index.ts:97–123`.
- **Coupon preview (cart drawer totals):** `couponApi.apply/available/eligible` send `{code, subtotal}` only (`services/index.ts:88–94`) — **no `items` yet → contract §1 gap** (Plan 4 owns checkout, but drawer/PLP copy rules per §2 may land in Plan 3).
- **Category:** `categoryApi.all()` → `GET /api/categories/all`; `getBySlug` (`productApi.ts:80–91`).

## 5. Cross-plan contract touchpoints (Plan 3-relevant)

From `docs/superpowers/plans/2026-10-17-backend-trust-track.md` §Cross-plan contract (l.37–45):
1. (l.39) Coupon preview endpoints accept optional `items:[{product,quantity}]` — rebuilt cart **must send `items`** (server-priced); legacy `subtotal`-only = estimate mode.
2. (l.40) Preview response carries `basis: 'server-priced'|'client-claimed'` — render exact copy vs explicit "Ước tính"; never present claimed discount as final.
3. (l.41) Authoritative total — order create recomputes server-side; client must NOT display client-computed totals as authoritative (affects cart subtotal labeling).
4. (l.42) Error codes: 404→empty-state, 403→forbidden, 409→"Dữ liệu đã thay đổi bởi người khác, vui lòng tải lại", 400.
5. (l.43,45) `GET /api/settings/public` — hide unset keys, no placeholders (footer/hotline/contact on home CTA).

## 6. Cart drawer/shell state & plan split

- CartDrawer is functional today: lazy-loaded in `main-layout.tsx:8`; navbar button `openCart` + `totalItems` badge (`navbar.tsx:97,354,360`); drawer open/close/qty/remove/subtotal/Escape all wired (cart-drawer.tsx l.12–212); T12 gate verified add-to-cart badge 0→1 (`.ai/CURRENT_STATE.md:28`).
- **No cart page route** (`App.tsx:65–80`: san-pham, thanh-toan, etc., no `/gio-hang`); design set has only `cart-drawer` screen → drawer is the cart surface.
- **Plan 3 (storefront):** drawer redesign-to-screen, cart data correctness (stale localStorage prices vs server), contract §1–§3 items/basis/subtotal-honesty on drawer, remove fabricated home content, PLP/PDP/home rebuild.
- **Plan 4 (account/checkout):** checkout page, coupon full flow, QR payment, order success, review-form submission page (screen exists; eligibility hook exists).

## Plan-3 implications

Candidate task breakdown:
1. **Home rebuild** — sections per home-desktop/tablet/mobile: cinematic AO BING hero, "Danh mục nổi bật" (categoryApi.all), "Sản phẩm bán chạy" (real best-selling or honestly-labeled featured), news/3D corner teaser (newsApi public), CTA band w/ settings-driven contact. Remove fabricated stats + HeroShowcase + mislabeled sections.
2. **AO BING hero port** — copy `banner-aobing.mp4` + poster (file-only), author new `aobing-hero.tsx` against dev tokens/navbar (h-16 contract), resolve scroll-driven vs ~3s-cinematic directive conflict with owner first.
3. **Stats source** — new public `GET /api/settings`-style or home-stats endpoint (backend sub-task) OR drop numeric stats; do not re-hardcode.
4. **PLP rebuild** — filter sidebar (5 groups incl price range slider), sort incl rating, active-chip row, search-states empty screen; note server has no rating filter param → either add backend param or client-map.
5. **PDP rebuild** — gallery+lightbox (overlays-spec), purchase panel, spec/review tabs, related; mobile sticky bar per mobile-pdp.
6. **Cart drawer rebuild** — match cart-drawer screen; send `items` to coupon preview (contract §1), show basis/estimate copy (§2), label subtotal as estimate until server confirms (§3).
7. **Shared fixes** — product-card nested-interactive, per-page `<title>`, drop 409 page handlers.

Top risks:
- **Hero directive conflict** (scroll-driven branch vs "≈3s NO scroll-driven" owner directive) — blocks task 2 until confirmed.
- **Hero coupling** — branch navbar patch + `-mt-16`/`sticky top-16` contract vs rebuilt dev navbar; naive merge will regress.
- **No public stats/rating-filter endpoints** — home stats + PLP rating sort/filter need backend tasks or honest scope cuts.
- **Stale localStorage cart prices** (CartContext stores price at add-time) vs contract §3 authoritative totals — drawer must not present stale subtotal as final.
- **Review UI scope** — PDP shows reviews read-only; write path is review-form page + eligibility (some belong Plan 4) — scope must be pinned to avoid double work.
