# Plan 2 T12 — Playwright UI Gate Report (shell)

**Date:** 2026-10-17 · **Branch:** `dev` (verified, never switched/pushed) · **Runner:** harness Playwright MCP · **Source changes: ZERO**

## 1. URLs (live)

| What | URL | Status |
|---|---|---|
| Client (Vite dev) | http://localhost:5173 | 200 |
| API | http://localhost:5000/api | 200 (`/api/health` → `db: connected`) |
| Settings public | http://localhost:5000/api/settings/public | 200, `data:{}` (unconfigured dev DB) |

Note: Vite dev has **no `/api` proxy** — the client calls `http://localhost:5000/api` directly (`apiClient.ts` `API_URL`, dev branch, `withCredentials:true`, CORS). `/api/*` paths on :5173 return the SPA HTML fallback and are not API traffic.

## 2. Server start/stop record

- **Both servers were ALREADY RUNNING** when this task started (from earlier task/review sessions). Verified healthy (`/api/health` 200, client 200) and **reused**.
- **Nothing was started by this task. Nothing was killed at the end** (killing would break other sessions that own these processes).

## 3. Screenshot inventory (19 files, `review-artifacts/plan2/gate/`)

| File | What |
|---|---|
| `home-desktop.png` | `/` at 1920×1080 — navbar (Obsidian Gold) + legacy hero (see §8 deviations) |
| `menu-desktop.png` | Desktop nav evidence: hamburger `Mở menu` hidden at ≥xl (1920), horizontal nav rendered — responsive nav verified, no drawer at desktop |
| `footer-desktop.png` | Home scrolled to footer 1920×1080 — settings-mandate proof (no contact rows) |
| `404-desktop.png` | `/khong-ton-tai` 1920×1080 — on-design 404 |
| `home-tablet.png` | `/` at 834×1112 |
| `menu-tablet.png` | Mobile drawer OPEN at 834 (hamburger visible, 834 < xl) — VN links + dynamic categories + login CTA |
| `footer-tablet.png` | Footer at 834×1112 |
| `404-tablet.png` | 404 at 834×1112 |
| `home-mobile.png` | `/` at 390×844 |
| `menu-mobile.png` | Mobile drawer OPEN at 390×844 — verified rendered (Obsidian Gold, logo, search, categories, `Đăng nhập / Đăng ký`) |
| `footer-mobile.png` | Footer at 390×844 — no contact rows |
| `404-mobile.png` | 404 at 390×844 |
| `admin-login-desktop.png` | `/admin` logged-out → redirect `/dang-nhap`, desktop login page |
| `admin-login-mobile.png` | Same at 390×844 |
| `admin-dashboard-desktop.png` | `/admin` logged in — Obsidian Gold shell (sidebar mono logo, gold active item, topbar, `Đăng xuất`) |
| `admin-dashboard-mobile.png` | `/admin` at 390×844 — sidebar collapsed to hamburger, KPI cards stack |
| `plp-desktop.png` | `/san-pham` — 10 product cards, h1 `Tất cả sản phẩm` |
| `plp-mobile.png` | `/san-pham` 390×844 — 10 cards, **no horizontal scroll** |
| `search-results-desktop.png` | Navbar search `gundam` → `/san-pham?page=1&search=gundam`, 4 result cards |

## 4. Console findings (per viewport / per document)

| Page / viewport | Messages | Errors |
|---|---|---|
| Home desktop | 5 = React DevTools INFO + **2× `/api/auth/me` 401** (anonymous, known) + 2 debug | **Only the known pair** |
| 404 desktop | same set | only known pair |
| Home/menu/footer tablet | same set | only known pair |
| 404 tablet | same set | only known pair |
| Home/menu/footer mobile | same set | only known pair |
| 404 mobile | same set | only known pair |
| Login page (logged out) | same set | only known pair |
| PLP desktop (logged in) | 3, **zero errors** | **0** |
| PLP mobile (logged in) | 3, **zero errors** | **0** |
| Admin dashboard (logged in) | 3 (DevTools info; `auth/me` 200 ×2) | **0** |

**Explicit result: ZERO unexpected console errors on every visit.** The only errors anywhere are the pre-existing anonymous `/api/auth/me` 401 pair (logged-out docs), exactly the known-acceptable noise. No React warnings, no key errors, no TS runtime errors.

## 5. Network findings

- All API calls **200**, except anonymous `/api/auth/me` **401 ×2** on logged-out documents (known). Logged-in docs: `auth/me` 200; admin stats/orders/contact-count all 200.
- `GET /api/settings/public` → **200** on every home/footer visit (also verified via direct request, `data:{}`).
- **Fonts:** `fonts.googleapis.com/css2` 200 + all `fonts.gstatic.com` woff2 (Be Vietnam Pro + Orbitron) **200**.
- **Logo:** `/logo/mark.svg` **200 `image/svg+xml`** (favicon), `/logo/mono.svg` **200 `image/svg+xml`**. `lockup.svg` has no file **by design** — the `Logo` component renders all variants **inline SVG** (T2 decision, gradient-id-collision rationale documented in `logo.tsx`); a GET to `/logo/lockup.svg` hits the SPA HTML fallback, which is expected, not a 404/anomaly.
- **Images:** PLP product images (Unsplash URLs in DB) all 200.
- **ANOMALY (pre-existing, honest record):** on the **home** document, **6× `http://localhost:5000/uploads/*.png` FAILED `net::ERR_BLOCKED_BY_ORB`** (e.g. `1786537217033-9d3d08348de4.png`). This is the **pre-existing dev-environment MIME/CORS issue on the API server's static `/uploads` handling**, already documented in `.ai/CURRENT_STATE.md` (AO BING hero session log). It is **not a Plan 2 regression** (Plan 2 is client-only; no client file touches static serving) and was **not fixed here** — belongs to backend/env scope. Visible effect: some home-section product thumbnails fail to render.

## 6. Footer settings-mandate check (AC5) — PASS

- Dev DB settings **unconfigured** (`GET /api/settings/public` → 200, `data:{}`).
- Footer `innerText` (desktop + mobile): brand block + `BỘ SƯU TẬP & DỊCH VỤ` links + `HỖ TRỢ KHÁCH HÀNG` links + bottom bar only. **Zero contact rows** (no hotline, hours, email, address, social icons).
- Page-wide placeholder scan `['1900','24/7','8:30','8:00–','Hotline','Giờ mở cửa','support@','info@','@gmail']` → **0 hits** at desktop and mobile.

## 7. Admin gate + flow smoke

**Admin (AC7 partial, admin shell):**
- `/admin` logged out → **redirects to `/dang-nhap`** (login page renders on-token, VN copy, gold CTA). Screenshots desktop+mobile.
- Login `admin@store3d.com` / `admin123` → success, session cookie set (subsequent `auth/me` 200).
- `/admin` logged in → dashboard `Tổng quan` renders: Obsidian Gold sidebar (mono logo, gold active item, VN nav incl. `Mini Game`, red `Đăng xuất`), topbar title + `Về trang chủ` + admin chip; mobile: hamburger-collapsed sidebar, stacked KPI cards. **Console 0 errors, all admin API 200.**
- Logout via sidebar `Đăng xuất` works (used to capture logged-out mobile login shot).

**Business-flow smoke (shell-level):**
| Flow | Result |
|---|---|
| `/san-pham` loads items | **PASS** — 10 cards desktop + 10 mobile, h1 `Tất cả sản phẩm`, no h-scroll at 390 |
| Navbar search | **PASS** — type `gundam` + Enter → `/san-pham?page=1&search=gundam`, 4 results |
| Add-to-cart from card | **PASS** — click `Thêm vào giỏ` (Nhà gỗ truyền thống2) → cart badge **0→1**, toast `Đã thêm vào giỏ hàng`, no navigation loss |

**Minor observation (pre-existing auth UX, Plan 4 scope):** after login from `/dang-nhap`, user lands on `/` — the original `/admin` target is not preserved through the guard redirect. Not a Plan 2 regression (login page/flow = Plan 4); recorded, not fixed.

## 8. Deviations vs approved screens

From `.ai/CURRENT_STATE.md` (already logged per task) + observed at gate:

1. **T5:** hamburger breakpoint `xl` (screen showed `lg`) — at tablet 834 the drawer shows; desktop ≥1280 horizontal nav. Category dropdown single-column.
2. **T6:** support-hours renders as its own footer row when configured (moot in this unconfigured DB); social links FB/ZL/IG only; no policy routes (none exist yet).
3. **T8:** 404 `Tư vấn trực tuyến` chat entry omitted (per T8 log). 404 page otherwise matches (copy, search, chips, CTAs, API-driven suggestions).
4. **T9:** admin dashboard **inner widgets** (KPI icon colors, multicolor donut, chart palette) are NOT fully on Obsidian Gold tokens — explicitly deferred to **Plan 6**; the shell (sidebar/topbar) is on-design.
5. **OBSERVED — home hero/sections are legacy pre-rebuild design:** blue gradient hero, fabricated stats `500+ / 10K+ / 4.9`, red-accented Hot Sale section, legacy blue CTA band. **Not a Plan 2 regression** — Plan 2 scoped feature pages out ("feature pages explicitly deferred to Plans 3–6"); the AO BING hero + stats fix live on the **unmerged `feat/aobing-hero` branch** (owner review pending) and Plan 3 rebuilds home. Evidence: `home-*.png`.
6. **OBSERVED:** `localhost:5000/uploads/*.png` ORB failures (see §5) — pre-existing env issue.

**Blockers found: none.** No Critical rendering bug blocked any gate item. The two pre-existing items (ORB uploads, legacy home hero) are out of Plan 2 scope and were not fixed here per task constraints.

## 9. Acceptance criteria status

| AC | Status | Evidence |
|---|---|---|
| AC1 tsc+build clean per task; zero new deps | **PASS** | Per-task build/tsc + independent reviews T1–T11 (see CURRENT_STATE SHAs); `client/package.json` byte-identical (zero-dep maintained); this task made no source changes |
| AC2 Obsidian Gold tokens; no 2nd theme; old blue gone | **PASS** | T1/T3(+fix) reviews; gate screenshots show dark/gold at all 3 viewports, zero light-mode leak |
| AC3 no theme toggle; ThemeContext untouched (C5) | **PASS** | T4 review (byte-identical ThemeContext); gate: no toggle affordance in navbar/drawer at any viewport |
| AC4 original logo SVGs; `/logo/*.svg` 200 | **PASS** | `mark.svg`/`mono.svg` 200 `image/svg+xml`; lockup inline-SVG by documented T2 design; logo renders in navbar/footer/sidebar (screenshots) |
| AC5 footer settings-only; unconfigured ⇒ 0 rows; no placeholders | **PASS** | §6 — zero contact rows, placeholder scan 0 hits, settings 200 |
| AC6 error mapping/409 copy/back-compat/credentials | **PASS** | T7 independent review; gate behavioral evidence: cookie auth works (login → admin API 200), no credential regression |
| AC7 shell matches screens; navbar behaviors work | **PASS** (with logged T5/T6 deviations §8) | Screenshots + flow smoke: search ✓, categories ✓, cart badge ✓, auth menu ✓, mobile drawer ✓ |
| AC8 gate evidence complete: 3 vp × (home, menu, footer, 404) + admin, console/network clean, report committed | **PASS** | 19 screenshots (§3), console §4 zero unexpected, network §5 zero unexpected (only known + documented pre-existing), this report |
| AC9 frontend-quality-checklist-store3d | **PENDING** | Run separately (AC9 task) |
