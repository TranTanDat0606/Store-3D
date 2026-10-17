# Client Foundation Survey — 2026-10-17 (branch `dev`, read-only audit)

Grounds the "Full Frontend Rebuild" plan (40 Stitch screens in `.stitch/designs/`, Obsidian Gold
system in `.stitch/DESIGN.md`) in the actual `client/` code. Every claim path-cited.

## 1. Build / style stack

- `client/package.json:49-57` — **Vite ^8.2.0**, `@vitejs/plugin-react ^6`, **Tailwind CSS v4.3.3** via
  `@tailwindcss/vite` (dev), TypeScript ~6.0.2, oxlint (no ESLint). **No `tailwind.config.*` file exists**
  (glob `client/tailwind.config.*` → only `index.html`, `components.json` matched): styling is 100%
  Tailwind v4 CSS-based config.
- React ^19.2.8, react-dom ^19.2.8 (`package.json:39-40`); **react-router-dom ^7.18.2** (`:42`);
  **sonner ^2.0.7** is the toast lib (`:44`) — no react-hot-toast;
  **framer-motion ^13** (`:34`), **pixi.js ^8.20.1 + pixi-filters ^6.1.5** (`:37-38`, mini-game only),
  recharts ^3.10.1 (`:43`), lucide-react ^1.29.0 (`:35`), react-hook-form ^7.84 + @hookform/resolvers + zod ^4 (`:14,41,46`),
  axios ^1.19.0 (`:31`), @ai-sdk/react ^4.0.87 (`:13`, AI chat).
- **⚠️ NOT in package.json (absent): `@tanstack/react-query` and `@hey-api/*`.** Grep for
  `hey-api|openapi-ts|@tanstack/react-query|createClient` across the repo matches only docs
  (`docs/superpowers/specs/2026-10-17-backend-survey.md:38`, `2026-10-17-full-rebuild-spec.md:86`).
  The client today is **axios services + React Context + `useState`/`useEffect`** — TanStack Query and
  a generated hey-api client are *plan assumptions, not existing code*.
- shadcn: `client/components.json:3-11` — style **new-york**, `css: src/index.css`, baseColor neutral,
  cssVariables true, empty tailwind config, lucide icons, `@/` aliases.
- Fonts today: `client/index.html:12-17` — Google Fonts link loading **Be Vietnam Pro (400-800)** and
  **Orbitron (400-900)**. This already matches `.stitch/DESIGN.md:26-27` (Be Vietnam Pro body, Orbitron
  display) — **no font change needed**, only add weights usage discipline.
- Theme tokens: `client/src/index.css` — `@import "tailwindcss"` (`:1`), `@custom-variant dark (&:is(.dark *))`
  (`:4`, class-based dark). `:root` block `:6-40` (light) and `.dark` block `:42-75` define the usual
  shadcn oklch vars; primary is a **blue**: light `--primary: oklch(0.58 0.165 250)` (`:14`), dark
  `oklch(0.75 0.14 245)` (`:49`); `--ring` mirrors primary (`:26,61`). `@theme inline` maps them to
  Tailwind colors `:77-114` (incl. sidebar + chart-1..5 + radius scale from `--radius: 0.625rem`).
  Base layer sets body font `'Be Vietnam Pro', …` (`:122-123`). Extras: `html.theme-transition` animation
  (`:128-135`), `.scroll-slim` (`:141-155`), `float-glow` (`:158-171`), a **hardcoded blue**
  `oklch(0.58 0.165 250)` in `.toc-item-active::before` (`:192`).
  → Obsidian Gold (`#EDB84C` gold primary, `#3E8BFF` blue secondary, bg `#07090F`, `.stitch/DESIGN.md:14-23`)
  requires rewriting both var blocks + removing light/dark duality; the `@theme inline` map can stay.

## 2. Routing & shell

- `client/src/App.tsx:62-110` — providers `AuthProvider > CartProvider > WishlistProvider > ChunkErrorBoundary >
  Suspense`, all pages `lazy()`; route table:
  - Public (`MainLayout`): `/` home, `/san-pham`, `/san-pham/:slug`, `/lien-he`, `/tin-tuc`,
    `/tin-tuc/:slug` (`:64-69`); `*` → NotFound (`:92`).
  - GuestOnly: `/dang-nhap`, `/dang-ky` (`:71-74`).
  - Protected: `/thanh-toan`, `/thanh-toan-thanh-cong/:id`, `/thanh-toan-qr/:id`, `/danh-gia/:slug` (`:76-80`);
    nested `AccountLayout` at `/tai-khoan` with 7 children: index, `don-hang`, `don-hang/:id`, `yeu-thich`,
    `ho-so`, `mat-khau`, `ma-giam-gia` (`:81-89`).
    **Storefront leaf routes = 19** (20 incl. 404) — matches "expect 19".
  - Admin: `/admin` wrapped by `AdminRoute` then `AdminLayout` (`:95-108`) — **11 routes**: index,
    `san-pham`, `san-pham/:id`, `danh-muc`, `don-hang`, `ma-giam-gia`, `danh-gia`, `khach-hang`,
    `bai-viet`, `ho-tro`, `mini-game`.
  - Guards: `client/src/routes/guards.tsx` (`ProtectedRoute`, `GuestOnlyRoute`, `AdminRoute`).
- Shells: `client/src/layouts/main-layout.tsx:21-41` (Navbar + Outlet + Footer, lazy CartDrawer,
  ChatLauncher/ChatPanel, OrderCompletionModal); `client/src/layouts/account-layout.tsx`;
  `client/src/layouts/admin-layout.tsx` (see §7).
- Navbar `client/src/components/layout/navbar.tsx`: consumes contexts (`useAuth/useCart/useWishlist/useTheme`,
  `:85-88`); **live search** — debounced 300ms then dynamically imports `productApi.list({search, limit:8})`
  (`:98-118`); URL `?search=` sync (`:120-132`); logo is a lucide `Box` in a colored square + text
  "Store**3D**" (`:159-166`) — **no logo image file today**; no category dropdown (DESIGN.md:40 wants one
  fed from DB). **Theme toggle = `navbar.tsx:208-210`** (`onClick={toggleTheme}`, Sun/Moon icons).
- Footer `client/src/components/layout/footer.tsx` — pure static (imports only `Link`, lucide, `cn`),
  fetches nothing.

## 3. API layer

- **Axios, not hey-api**: `client/src/services/apiClient.ts:10-14` — `axios.create({ baseURL: API_URL,
  withCredentials: true, timeout: 20000 })`. `API_URL = import.meta.env.VITE_API_URL || (DEV ?
  'http://localhost:5000/api' : '/api')` (`:4`).
- Single response interceptor (`:16-25`) only rejects non-object payloads; **it does not toast**.
- Error → UI today is **manual, per-call-site**: `getErrorMessage(error)` (`apiClient.ts:28-37`) unwraps
  `error.response.data.message` (Vietnamese strings from the server envelope), falls back to
  "Không thể kết nối tới máy chủ"/generic. Used in ~12 call sites, e.g. `pages/checkout-page.tsx:184,238,288`,
  `pages/auth/login-page.tsx:50`, `pages/account/order-detail-page.tsx:75` (`toast.error(getErrorMessage(err))`),
  `pages/contact-page.tsx:55`. Others set inline `setError(...)`. Sonner `<Toaster position="top-right"
  richColors closeButton />` mounted in `client/src/main.tsx:14`.
- **HTTP status is available but unused**: `error.response?.status` is never read (grep for `response?.status`
  → no matches); consumers only see `message`. Envelope type `ApiResponse<T>` = `{success, message, data,
  pagination?, meta?, errors?}` (`client/src/types/index.ts:224-231`).
  → For the plan's 404/403/409/400 mapping, injection points are: (a) a new global axios interceptor in
  `apiClient.ts`, and/or (b) an `getApiErrorInfo()` returning `{status, message}`; every `getErrorMessage`
  import is a replacement site.
- Service modules: hand-written in `client/src/services/` — `apiClient.ts`, `productApi.ts` (product+category),
  `authApi.ts`, `addressApi.ts`, `rewardApi.ts`, `gameAssetApi.ts`, `aiChatApi.ts`, plus `index.ts`
  defining `orderApi` (`:34-58`), `wishlistApi` (`:60-72`), `couponApi` (`:74-95`), `reviewApi` (`:97-124`),
  `userApi` (`:130-146`), `statsApi` (`:148-163`), `uploadApi` (`:165-171`), `paymentApi` (`:181-187`),
  `contactApi` (`:189-219`), `newsApi` (`:221-251`). All unwrap `r.data.data`.
- **No generated types**: `client/src/types/index.ts` is a hand-written ~400-line model file; no
  `client/src/client/` (hey-api) dir exists.

## 4. State

- Contexts (C5-constraint files): `client/src/contexts/AuthContext.tsx` — `{user, isLoading,
  isAuthenticated, login, register, logout, refreshUser, updateUser}` (`:14-51`);
  `CartContext.tsx` — `{items, totalItems, subtotal, isOpen, openCart, closeCart, addItem, removeItem, …}`
  (`:81-100`), persists to localStorage key **`store3d-cart`** (`:33,100`);
  `WishlistContext.tsx` — `{products, isLoading, isWishlisted, toggleWishlist, moveToCart}` (`:14-20`),
  server-backed via `wishlistApi`, no persistence;
  `ThemeContext.tsx` — `{theme, mode, setTheme, toggleTheme}` (`:6-11`), key **`store3d-theme`** (`:15`),
  default `'system'` (`:24`), toggles `document.documentElement.classList.toggle('dark', …)` (`:43`) +
  300ms `theme-transition` (`:46`).
- **TanStack Query: absent** (§1). No `QueryClient`, no query keys, no `useQuery` anywhere. Data fetching
  is per-page `useEffect` + service promise + `setState` (e.g. navbar `:104-118`). Adding Query means
  installing + a `query-client.ts` + hooks layer from scratch.
- localStorage keys in use: `store3d-theme` (ThemeContext:15), `store3d-cart` (CartContext:33),
  `store3d-guest-session` + per-chat key via `hooks/useChat.ts:18-56`, order-completion shown-list
  `components/order-completion-modal.tsx:20-30`, game best-score `components/mini-game/game-state.ts:153-158`,
  game asset cache `services/gameAssetApi.ts:15-24`, generic `hooks/useLocalStorage.ts`.

## 5. Reusable inventory

- shadcn `client/src/components/ui/` (17): alert, alert-dialog, avatar, badge, button, card, checkbox,
  dialog, dropdown-menu, form, input, label, popover (in pkg, no file), scroll-area (pkg, no file),
  select, separator, sheet, skeleton, switch, table, tabs, textarea. (Files present: alert, alert-dialog,
  avatar, badge, button, card, checkbox, dialog, dropdown-menu, form, input, label, select, separator,
  sheet, skeleton, switch, table, tabs, textarea.)
- Domain components: `product/` (product-card, product-card-skeleton, product-gallery,
  product-gallery-mobile, product-lightbox, product-tabs, purchase-panel + `use-purchase-panel.ts`,
  mobile-purchase-bar), `cart/cart-drawer.tsx`, `checkout/coupon-input.tsx`, `review/` (review-card,
  review-action, rating-summary), `common/` (breadcrumb, empty-state, error-state, pagination,
  star-rating), `layout/` (navbar, footer), `chat/` (4 files), `mini-game/` (9 files incl. pixi renderer),
  `auth/login-prompt-dialog.tsx`, `order/order-status-badge.tsx`, `admin/image-upload.tsx`,
  `home/hot-sale-section.tsx`, `order-completion-modal.tsx`.
- Hooks `client/src/hooks/`: useChat, useDebounce, useGameSession, useLocalStorage, useReviewEligibility —
  **no data-fetching/query hooks, no `use-settings`, no `use-stats`** (stats are called directly in
  `pages/admin/dashboard-page.tsx` via `statsApi`, `services/index.ts:148-163`).
- Lib: `client/src/lib/utils.ts` — `cn()` (`:5-7`) and
  **`resolveImageUrl(src?: string | null): string`** (`:9-24`): passes through data:/absolute URLs,
  appends webp params to unsplash, and prefixes relative `/…` paths with the API origin derived from
  `API_URL` (`:19-21`). `lib/format.ts` — `formatCurrency` (vi-VN VND), `formatDate`, `formatDateTime`,
  `calculateDiscountPercent`, `formatAccountNumber`. Also `lib/toast-progress.tsx`, `lib/markdown.ts`, `lib/index.ts` re-exports.
- Toast/dialog pattern: `toast.error(getErrorMessage(err))` (sonner) or inline `setError` string + shadcn
  `Alert`/`Dialog`. No central error boundary for API errors (only `ChunkErrorBoundary` for lazy chunks,
  `routes/chunk-error-boundary.tsx`).

## 6. Assets / branding

- `client/public/`: `favicon.svg`, `game-thumbnail.png`, `game-thumbnail.svg`, `robots.txt`, `sitemap.xml`,
  `assets/payment/tpbank-qr.png`. **No logo file, no AO BING video** (grep `.mp4|\.webm|AO BING` in
  `.stitch/` → only DESIGN.md text + HTML comments; hero video is spec-only, `.stitch/DESIGN.md:36`).
- `.stitch/designs/navbar-footer-spec.html` has **zero `<svg>` tags** (grep → no match) — the navbar/footer
  spec renders the logo some other way; the extractable logo lives in **`.stitch/designs/logo-system.html`
  = 13 inline `<svg>` occurrences**, first one a self-contained
  `<svg viewBox="0 0 100 100" fill="none">` with `<linearGradient id="topFacet">/#EDB84C` gold facets
  (polygon-based isometric cube), plus white monochrome variants. → **Logo IS extractable as clean inline
  SVG** (vector polygons + gradients, no embedded rasters); no external `.svg` file provided by Stitch.
- Product/category imagery in HTML exports is **remote**: every `src` in `home-desktop.html` points to
  `https://lh3.googleusercontent.com/aida-public/…` (12 unique matches) — these are Stitch preview URLs,
  not local assets; they must be replaced by DB/upload images via `resolveImageUrl`.

## 7. Admin shell

- Single file: `client/src/layouts/admin-layout.tsx` — left `navLinks` array of 10 items (`:10-21`) +
  `PAGE_TITLES` map (`:23-34`); desktop sidebar `<aside>` (`:70-107`), topbar `<header>` (`:112-143`),
  mobile slide-out drawer (`:146-203`); polls `contactApi.adminCountNew()` every 60s (`:48-54`);
  applies `theme === 'dark' && 'dark'` locally on the wrapper (`:61`) — redundant with ThemeContext but
  a second place dark mode is toggled. Branding again lucide `Box` (`:73-75,124-126,155-157`).

## 8. Env / config

- Only **`VITE_API_URL`** is read, in one place: `services/apiClient.ts:4,6` (with dev/prod fallbacks and a
  console.error guard). No `.env*` files referenced in code beyond that; no other `import.meta.env.VITE_*`
  usage in `client/src` (grep → 2 matches, both apiClient.ts).

## 9. Test / build tooling reality

- **No vitest, no playwright**: no `vitest.config.*` / `playwright.config.*` anywhere (glob → 0 files);
  no test script in `client/package.json:6-11` (only dev/build/lint/preview). `react-component-testing`
  skill exists as prior art but nothing is wired.
- `client/public/qa/` — **does not exist** (Test-Path → False; 0 files).
- `review-artifacts/` — 7 dirs: `b1`, `b2-gate-b2`, `b2-gate1`, `b2-preview`, `full-site-redesign`,
  `full-system-audit`, `logo-s-exploration`.
- 40 approved screens confirmed present in `.stitch/designs/` as paired `.html`+`.png` (56 files + specs),
  incl. `home-desktop|tablet|mobile`, `plp`, `pdp`, `checkout`, `checkout-states`, `cart-drawer`,
  `admin-*` (12), `account-*` (5), `logo-system`, `navbar-footer-spec`, `overlays-spec`, `ai-chat`,
  `mini-game-modal`, `not-found`, `qr-payment`, `review-form`.

## Plan-2 implications (foundation work clearly needed)

1. **Token rewrite, dark-only**: replace `:root` + `.dark` oklch blocks (`index.css:6-75`) with Obsidian
   Gold values (bg `#07090F`, surface `#0E1219`, gold `#EDB84C` primary, blue `#3E8BFF` secondary); keep
   the `@theme inline` mapping; also fix the hardcoded blue at `index.css:192` and
   `admin-layout.tsx:61`.
2. **Dark-only = theme machinery removal**: delete `ThemeContext.tsx`, `ThemeProvider` in `main.tsx:11`,
   toggle button `navbar.tsx:208-210`, `useTheme` in `admin-layout.tsx:5,38,61`, `html.theme-transition`
   CSS `index.css:128-135`, localStorage key `store3d-theme`.
3. **Fonts**: already correct (Be Vietnam Pro + Orbitron in `index.html:12-17`) — only enforce Orbitron
   for Latin/numerals per DESIGN.md:27.
4. **Data layer**: TanStack Query + hey-api client must be **introduced** (nothing to migrate); wrap the
   existing hand-written services (`services/index.ts` + 7 modules) or regenerate from OpenAPI.
5. **Error-mapping injection**: add a global axios interceptor in `apiClient.ts:16-25` (or an
   `getApiErrorInfo()` beside `getErrorMessage`, `:28-37`) exposing `status` for 404/403/409/400 routing;
   replace ~12 `getErrorMessage` call sites.
6. **Settings & stats hooks**: `statsApi` exists (`services/index.ts:148-163`); **no settings/system-config
   API exists on the client** (grep `/settings|settingsApi` → 0 matches) — backend survey should confirm
   before Plan-2 assumes it.
7. **Logo**: extract the gold cube SVG from `.stitch/designs/logo-system.html` (13 inline SVGs, vector-only)
   into a `client/src/components/brand/logo.tsx`; navbar/admin/footer currently use lucide `Box`
   (`navbar.tsx:159-166`, `admin-layout.tsx:73-75`). Favicon `public/favicon.svg` should be regenerated
   from the same shape.
8. **AO BING hero video**: no video asset exists anywhere in the repo — Plan-2 must source/produce it or
   fall back to the Stitch remote still image (all export imagery is remote `lh3.googleusercontent.com`).
9. **Testing**: vitest + Testing Library + MSW and Playwright must be scaffolded from zero; no existing
   config or tests to preserve.
10. **Route parity is cheap**: 19 storefront + 11 admin routes already exist and can be reused as the
    routing skeleton (`App.tsx:62-110`), with page bodies replaced by the 40 Stitch screens.
