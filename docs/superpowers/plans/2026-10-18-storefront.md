# Storefront — Implementation Plan (Full Rebuild Plan 3/series)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Continuous execution; only mandatory owner approval gates (demo sync, GitHub default branch, destructive ops, dep additions) may pause it.

**Goal:** Rebuild the storefront feature pages (home w/ AO BING hero, PLP + filters/sort/search states, PDP + sticky mobile buy bar, cart drawer) onto the approved Obsidian Gold design, with honest data (no fabricated numbers/business info) and the cross-plan contract honored.

**Architecture:** Existing stack only (Vite 8 + React 19 + Router 7 + Tailwind v4 + shadcn + axios services + Contexts). Zero new dependencies. Foundation from Plan 2 (tokens, Logo, navbar/footer, error mapping, overlays, empty-state) is the base — do not re-do it.

**Design source of truth:** `.stitch/designs/` screens: `home-desktop|home-tablet|home-mobile`, `plp`, `plp-search-states`, `pdp`, `mobile-pdp`, `cart-drawer` (all html+png per survey) + `.stitch/DESIGN.md`. VN copy verbatim from screens.

**Grounding docs:** `docs/superpowers/specs/2026-10-18-storefront-survey.md` (facts, path-cited) · contract in `docs/superpowers/plans/2026-10-17-backend-trust-track.md` §Cross-plan contract · spec `docs/superpowers/specs/2026-10-17-full-rebuild-spec.md`.

**Plan series:** Plan 2 (foundation/shell) DONE. Plan 3 = this. Plan 4 (auth/checkout/account/payment/review-WRITE) → Plan 5 (news/contact/AI chat) → Plan 6 (admin pages).

## Planner scope decisions (binding — from owner directives + survey risks)

1. **AO BING hero = ~3s cinematic, NOT scroll-driven** (owner directive from design track; the worktree's scroll-scrub implementation is superseded). Copy assets file-only from worktree `C:\Users\Dat\Documents\IT\FPOLY\React\store3d-aobing` (`client/public/assets/video/banner-aobing.mp4` 4.5MB + poster); PORT the component logic, converting to autoplay/loop ~3s intro per `home-*` screens. **No git merge** of `feat/aobing-hero` (42 commits behind, navbar-coupled).
2. **Fabricated statistics removed, not replaced:** the approved home screens have no stats section (survey §1) → delete the hardcoded `500+/10K+/4.9` block. NO public stats endpoint (stats stay admin-only per backend survey). If an implementer discovers a numeric-stats strip in the home screens that the survey missed: STOP that step, record it in the report — do not invent or wire numbers.
3. **Rating filter:** conditional — inspect `Product` model first; only if a schema rating field exists add a public `minRating` query param (server + validator + test); else implement the filter UI disabled/omit per screen fallback and log deviation.
4. **Cart totals:** drawer subtotal = labeled estimate from cart data (contract §3: server-authoritative totals happen at checkout = Plan 4; coupon `items`/`basis` = Plan 4). No checkout in this plan.
5. **Reviews:** READ (list on PDP) = Plan 3; WRITE form (`review-form` screen, auth-gated) = Plan 4. Out of scope here.
6. **ORB legacy uploads:** additive fix only — mount a read-only static route for `server/uploads/` (Content-Type correctness fixes ORB; no DB migration, no file moves). Alternative (DB path migration to Cloudinary) logged for owner, NOT executed.
7. **Out of scope:** auth flows, checkout/payment, game, news content pages, admin inner pages, AI chat.

## Global Constraints

- Branch `dev`; commit per task; no force-push; **`demo` = owner gate (never auto-push/merge/deploy)**; GitHub default branch untouched; **zero new dependencies** (any dep need = mandatory owner gate → pause and report).
- **C1** no 3D libs (hero = plain `<video>`, no new animation lib; `framer-motion` already a dep may be used) · **C2** Vietnamese UI, correct diacritics · **C4** cookie auth untouched · **C5** contexts logic untouched (CartContext read-only usage; if cart semantics must change, STOP and report) · **C7** all DB images via `resolveImageUrl`.
- **Owner mandates:** zero fabricated business info (contact/hours/addresses) AND zero fabricated statistics — settings-driven with hide-on-absent (already global), stats only from API (none public → none shown).
- **Contract (binding):** §1/§2 coupon preview `items`+`basis` copy rule = Plan 4 checkout (not touched here, but cart must NOT compute its own totals as authoritative) · §3 server-authoritative totals → drawer subtotal labeled estimate per screen wording · §4 error mapping live from T7 (404/403/409/400; remember: 409 global toast exists — page handlers must not double-toast) · §5 settings hide-on-absent (footer/any contact rows).
- Verification per task: `cd client && npx.cmd tsc --noEmit -p tsconfig.app.json` + `npm.cmd run build` (real check — bare tsc no-ops); live browser spot-check for interaction tasks (servers :5173/:5000 pattern from Plan 2); backend subtasks: `cd server && npm.cmd test` (baseline **83/83**) + `npm.cmd run build`.
- Screens are reference; existing working behavior (URL-param filters, cart qty logic, review fetch) is PRESERVED unless a screen mandates change — deviations logged honestly, not invented.

## Review Focus (likely failure modes)

1. **Hero directive violation** (scroll-scrub sneaks in) → Pinned: grep hero file for scroll listeners + live scroll test in T1 review; reduced-motion respected.
2. **Fabricated content surviving** (stats, mislabeled featured="bán chạy", invented specs/news) → Pinned: T3 grep (`500\+|10K\+|4\.9` + stats literals) + label-vs-API checks + design copy comparison.
3. **Filter/URL regressions** (existing working URL-param search broken by UI rewrite) → Pinned: T4 must keep URL as source of truth; live filter→URL→reload round-trip test.
4. **Cart contract breach** (client-computed totals presented as final, or coupon logic creeping in) → Pinned: T7 review checks labels + no total computation changes.
5. **Backend drift** (minRating param without model field; static route mis-mounted in prod or overriding Cloudinary) → Pinned: T9 conditional logic + tests + route mount order review.
6. **Responsive regressions** (home/PLP/PDP at 3 viewports) → Pinned: T11 Playwright gate + horizontal-overflow checks.

---

### Task 1: AO BING hero (~3s cinematic, ported)

**Files:** Create `client/src/components/home/aobing-hero.tsx` (ported+converted), copy assets → `client/public/assets/video/banner-aobing.mp4` + poster; Modify `client/src/pages/home-page.tsx` (hero region only).

**Steps:**
- [ ] Read `home-desktop.html` hero region (structure, headline/CTA copy verbatim) + current worktree component `C:\Users\Dat\Documents\IT\FPOLY\React\store3d-aobing\client\src\components\home\aobing-hero.tsx` (220 LOC: plain `<video>` + framer-motion scroll-scrub SCRUB_END 0.65) + survey §3.
- [ ] Copy the 2 asset files (PowerShell Copy-Item from the worktree — file copy only, no git ops). Verify sizes match (4.5MB video / 161KB poster).
- [ ] Port component → **remove ALL scroll-driven logic** (no window scroll listener, no useScroll/useTransform scrub): autoplay muted loop playsInline, poster fallback, ~3s cinematic intro per screens (entrance animation ≤3s then stable loop; if the screen implies a static hero frame, a subtle fade-in + slow video loop is acceptable — judge from screen), `prefers-reduced-motion` honored (pause/first-frame), z-index vs navbar sane, VN copy verbatim from screen. Frugal framer-motion use (already a dep) or pure CSS.
- [ ] Wire into `home-page.tsx` hero region (replace existing hero only; do not touch other sections yet — T3 owns data sections).
- [ ] Verify: build+tsc clean; live: video request 200 (`/assets/video/banner-aobing.mp4`), autoplay actually plays (muted), no scroll handlers in hero (grep + scroll page down → hero unaffected), console clean; screenshots desktop/tablet/mobile → `review-artifacts/plan3/` (untracked).
- [ ] Commit `feat(client): AO BING ~3s cinematic hero, ported from aobing worktree (Plan 3 T1)`.

### Task 2: Home structure to `home-*` screens

**Files:** Modify `client/src/pages/home-page.tsx` (+ `client/src/components/home/*` as they exist).

**Steps:**
- [ ] Study `home-desktop|home-tablet|home-mobile`: section order, headings, card styles, responsive behavior — list sections in commit body. Map each design section to a data source (categories → `categoryApi.all()`; best-selling → the API that REALLY provides best-sellers (survey: featured mislabeled — find the true endpoint in `server/src/routes/product*`; if only `featured` exists, label per what the API returns OR per screen only if truthful); news corner → news API public list; products grids → existing product APIs). Sections with no real source → omit + log, never fabricate.
- [ ] Rebuild section layout/typography/tokens per screens (VN verbatim), preserve existing fetch behavior where correct.
- [ ] Verify: build+tsc; live screenshots 3 viewports; console/network clean (auth/me 401 known noise).
- [ ] Commit `feat(client): home sections to approved responsive screens (Plan 3 T2)`.

### Task 3: Data-honesty pass (stats removal + label/API truth)

**Files:** Modify home files as needed.

**Steps:**
- [ ] **Re-verify** home screens for any numeric-stat strip (survey says none — confirm yourself): absent → delete the hardcoded stats block (`500+`, `10K+`, `4.9` etc. ~:243 + siblings) entirely; present → STOP, report.
- [ ] Grep client/src for remaining fabricated statistics (`500\+|10K\+|4\.9(?!.*rating)|[0-9]+ KH` — judge hits) → remove/replace with real API values or omit.
- [ ] Audit every home label vs its actual API: "Bán chạy" only on genuinely best-selling data (verify endpoint semantics in server code); any settings-driven info uses `usePublicSettings` hide-on-absent.
- [ ] Verify: greps output (target 0 fabricated stats), build+tsc, live home 3 viewports screenshots, console clean.
- [ ] Commit `fix(client): remove fabricated stats, align home labels to real APIs (Plan 3 T3)`.

### Task 4: PLP filters/sort to `plp` screen (URL-param preserved)

**Files:** Modify `client/src/pages/product-list-page.tsx`; possibly server: `server/src/validators/product.ts` (or existing validator file) + `server/src/services/productService.ts`/`productQuery.ts` + route — ONLY for the conditional rating param.

**Steps:**
- [ ] Study `plp.html`: 5-filter sidebar (inventory exactly which 5), sort options (incl. rating), price-range slider, active-filter chips, VN labels verbatim.
- [ ] **Rating-filter branch:** inspect `server/src/models/Product*` for a rating schema field. EXISTS → add public `minRating` param: validator (enum/safe number) → query filter → `cd server && npm.cmd test` still 83/83 + add ONE literal-titled test for the new param (same node:test style as `server/tests/*`) → `npm.cmd run build`. Field ABSENT → UI filter omitted per screen fallback + log deviation (do NOT aggregate reviews).
- [ ] Rebuild filter sidebar/sort/chips per screen: **URL params remain the single source of truth** (existing mechanism — read current code first; preserve categorySlug/search/page keys; add new keys only as the screen dictates).
- [ ] Verify: live round-trips — set filters → URL updates → RELOAD restores → results match; sort works; price slider (debounce) works; empty-result state via T5 (or existing); build+tsc (+server tests if backend touched); screenshots 3 viewports.
- [ ] Commit `feat(client): PLP filter/sort sidebar to approved design (Plan 3 T4)` (+ `test(server): ...` content in body if backend touched — separate backend commit allowed: `feat(server): public minRating product filter (Plan 3 T4)`).

### Task 5: PLP search/empty states (`plp-search-states`)

**Files:** Modify `client/src/pages/product-list-page.tsx` (+ shared empty-state `client/src/components/common/empty-state.tsx` ONLY if screen copy needs it passed through props).

**Steps:**
- [ ] Study `plp-search-states.html`: empty state copy (search no-results), suggestion actions, VN verbatim.
- [ ] Implement no-results/no-match states per screen using existing `EmptyState` (pass screen copy as props); search-results heading reflects query; suggestions = existing routes/categories (no invented products).
- [ ] Verify: live `?search=khongcotrongdb` → screen state matches; build+tsc; screenshot.
- [ ] Commit `feat(client): PLP empty/search states to approved design (Plan 3 T5)`.

### Task 6: PDP to `pdp` + `mobile-pdp` screens

**Files:** Modify `client/src/pages/product-detail-page.tsx` (255 LOC) + its components; sticky bar component per `mobile-pdp`.

**Steps:**
- [ ] Study `pdp.html` (gallery layout, info panel, spec+review tabs, related section) + `mobile-pdp.html` (sticky buy bar: contents, position, VN copy verbatim).
- [ ] Rebuild layout per screens (gallery with existing image data via `resolveImageUrl` C7; price/discount display per screen; rating from real product data — no invented averages). Spec tab: content from REAL product fields only (description/attributes present in API response — inventory what exists; missing spec rows omitted, never fabricated). Review tab = READ list from existing reviews API (write form = Plan 4, omit). Related products = existing related/featured endpoint (verify exists; else omit + log).
- [ ] Error handling: nonexistent product id → contract §4 404 page/message (404 mapping live); add-to-cart + wishlist behaviors preserved (read current logic first).
- [ ] Mobile: sticky buy bar per `mobile-pdp` (add-to-cart/wishlist actions wired to existing handlers), doesn't overlap footer/navbar.
- [ ] Verify: build+tsc; live PDP desktop+tablet+mobile + nonexistent-id 404 path; add-to-cart works; console clean; screenshots.
- [ ] Commit `feat(client): PDP + mobile sticky buy bar to approved design (Plan 3 T6)`.

### Task 7: Cart drawer to `cart-drawer` screen (estimate-labeled)

**Files:** Modify the cart drawer component (navbar drawer, survey: 218 LOC — verify path).

**Steps:**
- [ ] Study `cart-drawer.html`: layout, item card, qty stepper, remove, subtotal row wording (verbatim — must convey estimate/tạm tính per §3; if screen says "Tổng cộng" style final wording, label per screen BUT never compute discounts/totals client-side), empty-cart state, checkout CTA (route = Plan 4 target — wire to whatever route exists for checkout/login per current app; if none, CTA per screen only).
- [ ] Restyle to screen; PRESERVE qty update/remove/Escape/overlay logic (read first); C7 image resolver; token classes.
- [ ] Verify: live — open drawer, qty ±, remove, empty state, subtotal label; keyboard Escape; build+tsc; screenshots desktop+mobile.
- [ ] Commit `feat(client): cart drawer to approved design (Plan 3 T7)`.

### Task 8: Legacy uploads static route (ORB fix, additive backend)

**Files:** Modify `server/src/app.ts` (or wherever static mounts live — verify current mounts incl. Cloudinary upload flow).

**Steps:**
- [ ] Confirm root cause (survey/AC9): no `/uploads` mount; DB references `uploads/*.png`; 404 JSON → ORB. Confirm `server/uploads/` exists with files.
- [ ] Mount READ-ONLY `app.use('/uploads', express.static(path, {index:false, dotfiles:'deny'}))` — after/beside existing static handling, NOT replacing Cloudinary flow; ensure prod-safe (folder may be absent in prod → mount must not crash: check dir exists at boot or let express.static no-op safely). No other server change.
- [ ] Verify: `cd server && npm.cmd test` = **83/83** + `npm.cmd run build` clean; live: a previously-ORB'd URL returns 200 + `image/png` (curl/HEAD); homepage images render in browser (screenshot before/after evidence in `review-artifacts/plan3/`).
- [ ] Commit `feat(server): read-only static route for legacy uploads, fixes ORB (Plan 3 T8)`.

### Task 9: Docs sync

**Files:** Modify `.ai/CURRENT_STATE.md` (Plan 3 section), append Plan-3 note to survey file if decisions landed there (optional).

**Steps:**
- [ ] Record: tasks+SHAs, deviations, conditional-branch outcomes (rating filter taken/cut, stats removed, ORB fixed), known items for Plans 4–6.
- [ ] Commit `docs: CURRENT_STATE Plan 3 progress (Plan 3 T9)`.

### Task 10: Playwright storefront gate (owner decision 7) + quality checklist

**Prereqs:** T1–T8 green. Servers: API `:5000` (`$env:MONGODB_URI='mongodb://127.0.0.1:27017/store3d'; npx.cmd tsx src/server.ts`), client `:5173`.

**Steps:**
- [ ] Visit ×(desktop 1920 / tablet 834 / mobile 390): `/` (hero plays, sections), `/san-pham` (filters+sort+chips), search results + empty state, a PDP (+ nonexistent-id 404), cart drawer (qty/remove/empty) — screenshots each → `review-artifacts/plan3/gate/`.
- [ ] Console ZERO unexpected errors (known noise only: React DevTools + `auth/me` 401); network: hero video 200 + images 200 (ORB gone), fonts/logo 200; no horizontal overflow at 375/834/1920 on each page.
- [ ] Flow smoke: filter→URL→reload round-trip; add-to-cart from PDP → drawer badge; qty update subtotal changes; search no-results state.
- [ ] Evidence `review-artifacts/plan3/gate/REPORT.md`: URLs, screenshot inventory, console/network per page, flows, deviations, AC table. Commit `test(client): Plan 3 storefront Playwright gate (Plan 3 T10)` (gate dir only).
- [ ] Run `frontend-quality-checklist-store3d` (UI Change profile) on changed pages → fix Critical/High in-scope, log rest; record AC9-style results in REPORT.md.

---

## Acceptance criteria (Plan 3 gate)

- **AC1:** tsc + client build clean every task; `client/package.json` byte-identical (zero deps); server tests 83/83+ (if T4/T8 backend touched, + new literal-titled tests for added params/routes).
- **AC2:** Hero = plain video, ~3s cinematic, **NO scroll-driven code** (grep proof), reduced-motion honored, video 200 + autoplays in browser.
- **AC3:** Zero fabricated statistics client-wide (grep) AND zero fabricated business info (grep placeholders) — stats block gone.
- **AC4:** PLP filters/sort/search URL-param round-trip verified live; rating filter = conditional branch executed honestly (param+test OR omitted+logged).
- **AC5:** PDP spec/review/related sections show ONLY real API data; nonexistent id → 404 per contract.
- **AC6:** Cart drawer matches screen, subtotal labeled estimate, qty/remove/Escape preserved, no client-side discount/total computation added.
- **AC7:** Legacy `/uploads` URLs return 200 + image MIME; home images render; server suite green.
- **AC8:** Playwright gate: 3 viewports × (home/PLP/search/PDP/cart drawer) + flows, console/network clean, overflow 0, evidence REPORT committed.
- **AC9:** Quality checklist (UI Change) run; Critical/High in-scope fixed.

## Self-review record

- Coverage: hero (directive-corrected), home structure+honesty, PLP (filters/sort/empty), PDP (2 screens), cart drawer, backend ORB additive fix, docs, gate — matches survey's candidate breakdown; review-WRITE/auth/checkout explicitly deferred (Plan 4), news corner sourced from real news API. ✓
- Each task: 1 action + checkable result; verification = tsc+build+live-browser for interaction tasks, server tests for backend tasks (C3: no client test infra — gate = Playwright + checklist). ✓
- Contract embedding: §1/§2/checkout-§3 → Plan 4 explicitly; §3 estimate-labels in T7; §4 error paths in T6; §5 settings in T3; 409-double-toast awareness in review focus. ✓
- Decisions recorded above supersede worktree implementation where in conflict (scroll-scrub) — directive source cited. ✓
- No guessed paths: survey is path-cited; implementers re-verify before editing. ✓
