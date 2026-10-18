# Plan 3 — Task 10 · Playwright Storefront Gate (owner decision 7)

**Date:** 2026-10-18 · **Branch:** `dev` (verified; no branch ops, no merge/push/deploy) · **Runner:** Playwright MCP (Playwright 1.63.0) + Chromium, scripted through `browser_run_code_unsafe` with persistent `console` / `response` / `requestfailed` / `pageerror` listeners attached to the page.

---

## 1. URLs + boot record

| Service | URL | How obtained | Started by this task? |
|---|---|---|---|
| Client (Vite) | `http://localhost:5173` | **Reused** — `Invoke-WebRequest HEAD` → `200` at session start (booted by Plan 3 T9b) | **No** |
| API (Express) | `http://localhost:5000` | **Reused** — `HEAD` → `200` at session start (Plan 3 T8 fixed code) | **No** |
| MongoDB | `mongodb://127.0.0.1:27017/store3d` | pre-existing local process | **No** |

No server was started or stopped by this task → nothing to stop at the end.

**Routes exercised:** `/` · `/san-pham` · `/san-pham?search=robot` · `/san-pham?search=khong-ton-tai-xyz` · `/san-pham/robot-gundam-rx-78` · `/san-pham/san-pham-khong-ton-tai-xyz` (nonexistent) · cart drawer overlay (opened from any route) · `/admin` → redirect `/dang-nhap` → login → `/admin`.
**Viewports:** desktop 1920×1080 · tablet 834×1112 · mobile 390×844 · overflow probe 375×812.

---

## 2. Screenshot inventory — `review-artifacts/plan3/gate/` (30 PNG, 9.83 MB)

| File | What it proves |
|---|---|
| `home-desktop.png` | `/` full-page 1920 — AO BING hero (playing) + all home sections |
| `home-tablet.png` | `/` full-page 834 |
| `home-mobile.png` | `/` full-page 390 |
| `home-mobile-reduced-motion.png` | `prefers-reduced-motion: reduce` → hero static at first frame |
| `plp-desktop.png` | `/san-pham` 1920 — filter sidebar (4 groups) + sort select + active-chips row |
| `plp-tablet.png` | `/san-pham` 834 |
| `plp-mobile.png` | `/san-pham` 390 |
| `plp-mobile-filter.png` | `/san-pham` 390 with mobile filter **Sheet open** ("Bộ Lọc Tìm Kiếm", 4 groups, chips, "Áp dụng mức giá") — visually verified |
| `search-desktop.png` | `?search=robot` 1920 — heading `Kết quả tìm kiếm cho "robot" (2 sản phẩm)` |
| `search-tablet.png` | same 834 |
| `search-mobile.png` | same 390 |
| `search-empty-desktop.png` | `?search=khong-ton-tai-xyz` 1920 — `Không tìm thấy sản phẩm nào` |
| `search-empty-tablet.png` | same 834 |
| `search-empty-mobile.png` | same 390 |
| `pdp-desktop.png` | PDP `robot-gundam-rx-78` 1920 (gallery / panel / spec / reviews / related) |
| `pdp-tablet.png` | same 834 |
| `pdp-mobile.png` | same 390 incl. sticky buy bar |
| `pdp-404-desktop.png` | nonexistent slug → `Không tìm thấy sản phẩm` + `Sản phẩm có thể đã bị xóa hoặc không tồn tại.` |
| `pdp-404-tablet.png` | same 834 |
| `pdp-404-mobile.png` | same 390 |
| `cart-desktop.png` | cart drawer **with items** 1920 — item card, qty stepper, `Tạm tính` estimate row |
| `cart-tablet.png` | same 834 |
| `cart-mobile.png` | same 390 — visually verified: qty `- 2 +`, line `1.360.000 ₫`, `TẠM TÍNH (2 SẢN PHẨM) 1.360.000 ₫`, shipping/coupon note |
| `cart-empty-desktop.png` | drawer empty state — `Giỏ hàng của bạn đang trống` + `Khám phá sản phẩm` CTA |
| `cart-empty-tablet.png` | same 834 |
| `cart-empty-mobile.png` | same 390 |
| `admin-login-desktop.png` | `/admin` logged-out → redirected login page `/dang-nhap` 1920 |
| `admin-login-mobile.png` | same 390 |
| `admin-dashboard-desktop.png` | logged in `admin@store3d.com` → `/admin` dashboard (menu + KPI widgets) 1920 |
| `admin-dashboard-mobile.png` | same 390 |

---

## 3. Console / Network results per page group

Allowed noise per brief: React DevTools `info` line + `auth/me` **401** pair. Everything else is listed explicitly.

### Console — errors/warnings, uncaught page errors, transport failures

| Page group | Viewports | Console errors/warnings | pageerror | transport failure |
|---|---|---|---|---|
| `/` home | 1920 / 834 / 390 (+ final cache-cleared revisit) | **0 / 0 / 0** — only `[vite] connecting…/connected` (debug) + React DevTools `info` | **0** | **0** |
| `/san-pham` PLP + filter/sort/chip/reload flow | 1920 / 834 / 390 | **0** | **0** | **0** |
| `?search=robot` results | 1920 / 834 / 390 | **0** | **0** | **0** |
| `?search=khong-ton-tai-xyz` empty | 1920 / 834 / 390 | **0** | **0** | **0** |
| PDP real slug (clean re-run) | 1920 / 834 / 390 | **0** | **0** | **0** |
| PDP nonexistent slug → 404 | 1920 / 834 / 390 | **2 — expected**: `Failed to load resource: 404` ×2 for `/api/products/san-pham-khong-ton-tai-xyz` (the visit *is* the 404 probe); no other messages | **0** | **0** |
| Cart drawer (add / qty± / Escape / remove / empty) | 1920 / 834 / 390 / 375 | **0** | **0** | **0** |
| Navbar search flow | 1920 | **0** | **0** | **0** |
| Reduced-motion spot | 390 | **0** | **0** | **0** |
| `/admin` logged-out → login page | 1920 / 390 | **2 — known noise**: `401 Unauthorized` ×2 for `/api/auth/me` (the exact pair the brief allows) | **0** | **0** |
| `/admin` dashboard (logged in) | 1920 / 390 | **0** | **0** | **0** |

**Total unexpected console errors across the gate: 0.** No `pageerror`, no failed (aborted/DNS) requests on any visit.

### Network evidence

| Check | Result |
|---|---|
| **Hero video** `/assets/video/banner-aobing.mp4` | `HEAD` → **`200 video/mp4`**; browser media request → `206 video/mp4` (byte-range, normal for `<video>`); poster `banner-aobing…jpeg` → `200 image/jpeg`; playback verified `paused=false`, `currentTime>0` at **1920 / 834 / 390**; after cache clear → `206 video/mp4`, `paused=false` |
| **Legacy category images ORB (T8)** | After `Network.clearBrowserCache` on `/`: **all 6 `/uploads/*.png` → `200 image/png`** (`…8eebb501f68a`, `…9d3d08348de4`, `…611ac814f83f`, `…ab8cc05384e1`, `…27cae141a953`, `…7a462f8a9bac`) · rendered `/uploads` images: **12 total, 0 broken** (`naturalWidth>0`) · direct `curl`: `200 image/png` ×2 · repeat loads later revalidate as `304 Not Modified` (cache hit, **not** 404/ORB) |
| **Fonts / logo** | Google Fonts CSS `200`; all `fonts.gstatic.com` Be Vietnam Pro + Orbitron woff2 `200` (captured on home tablet/mobile visits); logo = inline React component module `200` |
| **API calls** | Clean visits: **all `200`** (`/api/auth/me`, `categories/all`, `products*`, `settings/public`, `wishlist`, `orders/mine`, `news`); admin dashboard: `auth/me`, `admin/stats/overview`, `stats/revenue`, `stats/orders-by-status`, `stats/best-selling`, `stats/revenue-period`, `orders/admin`, `contact/admin/new-count` → **all `200`**; login: `POST /api/auth/login → 200` |
| Expected non-200 | `404 /api/products/<nonexistent>` on the 404 probe · `401 /api/auth/me` ×2 on the logged-out visit (known noise) · `206` video range |
| Other 4xx/5xx / 404 / failures | **none** on any storefront visit (see observation #1 for the rate-limit episode, which was re-run clean) |

---

## 4. Horizontal overflow (AC8) — `documentElement.scrollWidth − clientWidth`

| Page \ viewport | 375×812 | 390×844 | 834×1112 | 1920×1080 |
|---|---|---|---|---|
| `/` home | **0 px** | **0 px** | **0 px** | **0 px** |
| `/san-pham` PLP | **0 px** | **0 px** | **0 px** | **0 px** |
| `?search=robot` (search results) | **0 px** | **0 px** | **0 px** | **0 px** |
| `?search=khong-ton-tai-xyz` (empty) | **0 px** | **0 px** | **0 px** | **0 px** |
| PDP — real slug | **0 px** (re-proven clean) | **0 px** (re-proven) | **0 px** (re-proven) | **0 px** |
| PDP 404 — nonexistent slug | **0 px** (re-proven) | **0 px** (re-proven) | **0 px** (re-proven) | **0 px** |
| Cart drawer **open** (items) | **0 px** | **0 px** | **0 px** | **0 px** |
| Cart drawer **empty** | **0 px** | **0 px** | **0 px** | **0 px** |

Non-matrix extras: login page `/dang-nhap` = 0 px @390 · admin `/admin` = 0 px @1920 but **15 px @390** (admin scope → Plan 6, see observation #6).
All 429-contaminated cells were re-measured after the limiter window reset; the earlier pass measured an error-rendered page and is discarded.

---

## 5. Flow smoke results

| # | Flow | Result |
|---|---|---|
| (a) | PLP filter → URL → F5 → state restored | **PASS** — chip `Nhựa PLA Pro` → URL `…/san-pham?material=PLA&page=1`, results 8 → 5; reload → URL `…?material=PLA`, **same 5 results**, chips row visible (`Bộ lọc đang bật:` + `Vật liệu: Nhựa PLA Pro`) |
| (a) | sort changes order | **PASS** — `Giá: Thấp đến cao` → URL `sort=price-asc`; order changed (`Chậu cây hình robot` moved ahead of `Bộ bàn ghế mini`) |
| (a) | chip removes | **PASS** — `Bỏ lọc: Vật liệu: Nhựa PLA Pro` → `material` gone from URL, 8 results restored |
| (b) | navbar search → results heading with query | **PASS** — type `gundam` → suggestions panel → `Xem tất cả kết quả tìm kiếm cho “gundam”` → URL `/san-pham?search=gundam`, heading `Kết quả tìm kiếm cho "gundam" (1 sản phẩm)`. (Pressing Enter instead only syncs `?search=` onto the *current* route — observation #4) |
| (c) | PDP add-to-cart → badge + drawer | **PASS** — `Thêm vào giỏ hàng` → drawer `role=dialog "Giỏ hàng"` opens, navbar badge shows count (observed `2` after the retry add of the same product), line `680.000 ₫/cái × 2` |
| (c) | qty stepper updates subtotal | **PASS** — `Giảm số lượng`: `Tạm tính (1 sản phẩm) 680.000 ₫`, badge `1`; `Tăng số lượng`: back to `Tạm tính (2 sản phẩm) 1.360.000 ₫`, badge `2`, qty span `2`. `+` is `disabled` at qty 2 — **correct**: API `stock: 2` for `robot-gundam-rx-78` |
| (c) | remove → empty state | **PASS** — `Xóa sản phẩm` → `Giỏ hàng của bạn đang trống` + `Khám phá sản phẩm` CTA, navbar badge hidden |
| (c) | Escape (AC6) | **PASS** — dialog **and** overlay unmount, `body.style.overflow` restored to `''` (verified twice, 1.6 s wait; first check at 0.6 s was still mid-exit-animation) |
| (d) | PDP nonexistent slug → 404 copy | **PASS** at 1920 / 834 / 390 — `h1 = Không tìm thấy sản phẩm`, `Sản phẩm có thể đã bị xóa hoặc không tồn tại.`, `Quay lại cửa hàng` |
| (e) | reduced-motion emulation → hero static | **PASS** — `matchMedia('(prefers-reduced-motion: reduce)') = true` → `video.paused = true`, `currentTime = 0`, `readyState = 4`; emulation cleared → `paused = false`, `currentTime = 1.47` (plays again) |

**Admin (this gate's scope — full admin flows = Plan 6):**
- Logged out (`localStorage` cleared + cookies cleared) → `/admin` → redirected to **`/dang-nhap`**, login form visible; console = only the known `auth/me` 401 pair. Screenshots desktop + mobile.
- Login `admin@store3d.com` / `admin123` → `POST /api/auth/login 200`. The app settled on **`/`** rather than the pending return URL `/admin` (observation #5); navigating to `/admin` then renders the **dashboard** (admin menu, `Tổng quan`, KPIs `Doanh thu Tháng này / Tổng đơn hàng 21 / Tổng sản phẩm 10 / Khách hàng`, all admin stats APIs `200`). Screenshots desktop + mobile.

---

## 6. Deviations / observations

**Honest deltas vs approved screens (source: `.ai/CURRENT_STATE.md` Plan 3 section):**
1. Hero quick-spec counters / spec-tag omitted — no data source.
2. Flash-sale countdown + sold-bars omitted.
3. PLP grid-density toggle + per-group result counts omitted (API has no count data).
4. PDP policy / variant / ETA rows omitted.
5. Cart VAT / free-shipping / coupon blocks omitted (coupon = Plan 4).
6. "Tư vấn trực tuyến" (online-consult) row omitted.

**Known items carried over (same source, gate-relevant):** avatar trigger 39×36 sub-44 px (pre-existing) · navbar search effect drops `page` on empty-search reload (pre-existing) · price inputs `onBlur` race (programmatic-only) · chat launcher panel/FAB stacking acceptable · 409 double-toast (Plan 4) · review WRITE (Plan 4) · news corner renders 0 rows (DB has 0 published) · admin dashboard widgets = Plan 6.

**Observed by this gate (nothing fixed — source changes are forbidden in T10):**
1. **Rate limiter episode (environment/harness):** the local API `globalLimiter` (300 req / 15 min / IP, `config/rateLimit.ts`) was exhausted by the gate's own rapid multi-viewport sweeps → one PDP pass returned `429` bursts (`RateLimit-Limit: 300`, `RateLimit-Remaining: 0`, `Retry-After: 559`). Not an app defect; the affected PDP/404 screenshots + measurements were **discarded and re-run clean** after the window reset. Note for future gate runs: throttle loads or expect the window.
2. **Uploads caching:** repeat home loads revalidate legacy `/uploads/*.png` as `304` (browser cache) rather than `200`; after `Network.clearBrowserCache` all 6 return `200 image/png` (ORB proof above). 304 ≠ ORB: no `404`, correct MIME, images render.
3. **`auth/me` status:** early visits returned `200` because the persistent browser profile still held a session cookie; the documented `401` pair appeared exactly on the logged-out admin visit (matches the known-noise spec either way).
4. **Navbar Enter does not route to PLP:** Enter on the navbar input only syncs `?search=` onto the current route and closes the suggestions panel; the results page is reached through the suggestions link `Xem tất cả kết quả tìm kiếm cho …`. Pre-existing behavior consistent with the already-known "navbar search effect" item.
5. **Post-login landing:** after a successful admin login the app settled on `/` instead of the pending `from = /admin` (likely `GuestOnlyRoute` authenticated→`/` racing login's `navigate(from)`; root cause not verified, not fixed). Direct `/admin` navigation after login works and renders the dashboard. Auth flows = Plan 4 scope.
6. **Admin dashboard horizontal overflow 15 px at 390 px** (admin layout, out of storefront matrix) — recorded for Plan 6; storefront pages are 0 px everywhere.
7. **PLP `page=1` normalization:** applying a filter writes `?…&page=1`, a reload then drops the default `page` param — filter state and results are fully restored (pre-existing normalization, not a regression).
8. **Cart `+` disabled at stock cap:** `stock: 2` verified via `GET /api/products/robot-gundam-rx-78` → correct guard, not a defect.

**Blockers:** **none.** No gate item was stopped as blocking; no source file was modified.

---

## 7. Acceptance criteria status

| AC | Statement | Status |
|---|---|---|
| **AC1** | tsc + client build clean; `client/package.json` byte-identical (zero deps); server tests 88/88 (+ T4/T8 tests) | **MET** — re-verified *in this task*: `tsc --noEmit` exit **0** · `client npm run build` ✓ · `server npm test` **88 pass / 0 fail** · `server npm run build` ✓ · `git status client/package.json` → untouched |
| **AC2** | Hero = plain video, ~3s cinematic, **NO scroll-driven code**, reduced-motion honored, video 200 + autoplays | **MET** — grep `addEventListener\|useScroll\|useTransform\|onScroll\|scrub` in `aobing-hero.tsx` → only the `prefers-reduced-motion` `mq.addEventListener('change')` + a doc comment naming the dropped worktree scrub (0 scroll handlers) · `HEAD → 200 video/mp4` · playback `paused=false` at 1920/834/390 · reduced-motion → `paused=true, ct=0` (spot screenshot) |
| **AC3** | Zero fabricated statistics **and** business info client-wide | **MET** — grep `500\+\|10K\+\|10\.000\+\|3\.500\+\|8K\+\|4\.9/5` over `client/src/**/*.{ts,tsx}` → **0 hits**; stats block removed in T3 |
| **AC4** | PLP filters/sort/search URL round-trip live; rating-filter branch executed honestly | **MET** — filter→URL→F5→restore, sort order change, chip removal all PASS (§5a); `minRating` shipped server-side with literal-titled tests (`7a5941f`; suite 88/88) |
| **AC5** | PDP spec/review/related show only real API data; nonexistent id → 404 per contract | **MET** — PDP renders real product data (title/price/spec/reviews/related from API, 0 console/network errors); nonexistent slug → 404 UI + expected API `404` at all 3 viewports |
| **AC6** | Cart drawer matches screen, subtotal labeled estimate, qty/remove/Escape preserved, no client-side discount/total math | **MET** — `Tạm tính (n sản phẩm)` estimate row + `Phí vận chuyển & mã giảm giá sẽ được áp dụng tại bước thanh toán.` (contract §3 wording), line totals are `price × qty` only, qty±/remove/Escape all verified live, no coupon/discount computation added |
| **AC7** | Legacy `/uploads` returns 200 + image MIME; home images render; server suite green | **MET** — in-browser **6/6 → `200 image/png`** after cache clear (+ `curl 200 image/png` ×2), 12 `/uploads` images rendered / **0 broken**, server suite **88/88** |
| **AC8** | Playwright gate: 3 viewports × (home/PLP/search/PDP/cart drawer) + flows, console/network clean, overflow 0, evidence REPORT committed | **MET** — 30 screenshots across desktop/tablet/mobile (+375 probes), console **0 unexpected errors** on every group (only allowed `401` pair + the intentional 404-probe messages), network clean (video/uploads/fonts/API), overflow **0 px** in all 32 storefront cells, flows (a)–(e) PASS, this REPORT + screenshots committed |
| **AC9** | Quality checklist (UI Change profile) run; Critical/High in-scope fixed | **PENDING** — runs separately from this gate (not part of the T10 Playwright run) |

---
*Plan 3 T10 gate run — evidence directory `review-artifacts/plan3/gate/`.*
