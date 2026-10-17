# Client Foundation & Shell — Implementation Plan (Full Rebuild Plan 2/series)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Continuous execution; only mandatory owner approval gates may pause it.

**Goal:** Stand up the Obsidian Gold foundation and shell on the existing client (dark-only tokens, branding/logo, navbar/footer to design, settings-driven business info, error-status mapping per the cross-plan contract, admin shell restyle) so Plans 3–6 build screens on a stable base.

**Architecture:** Keep the existing stack exactly as surveyed — Vite 8 + React 19 + Router 7 + Tailwind v4 (CSS `@theme inline`) + shadcn new-york + hand-written axios services + Contexts + useEffect. **NO TanStack Query, NO hey-api client, NO test frameworks** (survey `docs/superpowers/specs/2026-10-17-client-foundation-survey.md`; C3; zero-new-dependency rule — adding deps is an owner approval gate, not this plan's choice).

**Design source of truth:** `.stitch/designs/` (40 approved screens) + `.stitch/DESIGN.md` (Obsidian Gold) + `.stitch/metadata.json`. Key screens for this plan: `logo-system.html`, `navbar-footer-spec.html`, `overlays-spec.html`, `not-found.html`, admin shell screens (per metadata).

**Spec:** `docs/superpowers/specs/2026-10-17-full-rebuild-spec.md` · **Contract:** plan 1 §"Cross-plan contract" (§1–7) · **Survey:** `docs/superpowers/specs/2026-10-17-client-foundation-survey.md`

**Plan series:** Plan 1 = backend (done, SHIP). Plan 2 = this. Plan 3 (storefront: home w/ AO BING hero, PLP/PDP, cart) → Plan 4 (auth/checkout/account/payment/game) → Plan 5 (news/contact/AI chat) → Plan 6 (admin pages). Each later plan writes after its predecessor's gate.

## Global Constraints

- Branch `dev`; commit per task; no force-push; **`demo` = owner approval gate (never auto-push/merge/deploy)**; GitHub default branch untouched.
- **Zero new dependencies** in this plan (runtime or dev). New deps (vitest/RTL/MSW/@playwright/test) = separate owner approval item reported at the gate.
- **C1** no 3D libs · **C2** Vietnamese UI everywhere (correct diacritics) · **C4** cookie auth (axios must send credentials as today) · **C5** DO NOT modify Auth/Cart/Wishlist/Theme **context logic** — toggle UI removal is a UI-layer removal; contexts stay dormant-able · **C7** all DB images via existing `resolveImageUrl` (`client/src/lib/utils.ts:9-24`).
- **Dark mode only:** no toggle anywhere in the rebuilt UI. Keep `ThemeContext.tsx` file untouched (dormant); Obsidian Gold values live in `:root` so rendering is dark regardless of html class.
- Design token mapping (from `.stitch/DESIGN.md`): bg `#07090F`, surface `#0E1219`, surface-2 `#151A24`, gold `#EDB84C`, blue `#3E8BFF`, text `#FFFFFF` / muted `#94A3B8`, success `#34D399`, warning `#FBBF24`, destructive `#F43F5E`, radius ≈10px, fonts Be Vietnam Pro (body) + Orbitron (Latin/numeric accents only — no Vietnamese diacritics in Orbitron text).
- **Business info (owner mandate):** footer/contact rows come from `GET /api/settings/public` — key absent ⇒ row hidden, zero placeholders (no "1900 1234", no hours). Statistics only from `statsApi` — never literals.
- **Cross-plan contract (binding):** §2 `basis` (top-level on POST apply; per-entry on GET available/eligible) → estimate copy `Ước tính` only for `client-claimed`; §3 totals come from API responses only; §4 status mapping 404/403/409/400; §5 settings hide-on-absent; §7 admin settings PUT sends ALL socialLinks (settings UI is Plan 6 — record there).
- **Verification per task:** `npm.cmd run build` + `cd client && npx.cmd tsc --noEmit` (client has no unit-test infra — C3; visual truth via the Plan-2 Playwright task). Existing behavior must not regress: run the same page flows you touched in the browser when a task changes interaction.
- Screens are reference, not pixel-perfect law where the surveyed DOM contradicts them (e.g. navbar existing search logic stays, restyled).
- No commits to `demo`; no pushes unless the owner approved that exact push.

## Review Focus (failure modes most likely to bite)

1. **Light-mode leak:** stale `:root`/`.dark` oklch values or a component with hardcoded light color → mixed theme. Pinned by T1 grep (`grep -rE '#fff|#ffffff|bg-white|text-gray-|oklch'` on `src/`) + Playwright light-screenshot check.
2. **Hardcoded old blue** (`oklch 250` primary) surviving in components/config → wrong brand color. Pinned by T3 grep + visual pass on navbar/footer.
3. **Placeholder contact info sneaking into footer** (design copy habit) → violates owner mandate. Pinned by T6 (settings-driven only, absent ⇒ hidden) + Playwright check with unconfigured settings.
4. **Credential/cookie regression in axios** while touching `apiClient.ts` → logged-out storefront. Pinned by T7 (credentials unchanged, existing flows smoke-tested) + Playwright login-adjacent smoke in T12.
5. **ThemeToggle removal breaks C5/ThemeContext or leaves dead imports** → build errors or accidental context edits. Pinned by T4 (file list: ThemeContext untouched — reviewer diffs it byte-identical).

---

### Task 1: Obsidian Gold tokens in `index.css` (dark-only)

**Files:** Modify `client/src/index.css` only.

**Steps:**
- [ ] **Step 1:** Inventory: read current `:root` (light, :6-75), `.dark` (:42-75), `@theme inline` map (:77-114), transition block (:128-135). Map every shadcn variable NAME to an Obsidian Gold value (keep NAMES — shadcn components reference them; change VALUES). Define semantic tokens: `--background:#07090F`, `--card/--popover/--input` surfaces `#0E1219`/`#151A24`, `--primary:#EDB84C` (gold) + `--primary-foreground:#07090F`, `--secondary` surface-2, `--muted` `#151A24` + `--muted-foreground:#94A3B8`, `--accent:#3E8BFF` (blue) + accent-foreground, `--destructive:#F43F5E`, `--success:#34D399`, `--warning:#FBBF24`, `--border` `#1E2532`, `--ring` gold at same opacity as current, radius tokens ≈10px.
- [ ] **Step 2:** Replace the LIGHT `:root` block with these values; DELETE the `.dark` override block (no second theme); keep `@theme inline` var NAMES mapped (Tailwind utilities like `bg-background`, `text-primary` must now resolve to gold/dark automatically); keep/adjust the transition block only if it references removed vars.
- [ ] **Step 3:** `cd client && npx.cmd tsc --noEmit` → clean; `npm.cmd run build` (root or client per repo scripts — verify which builds client) → clean.
- [ ] **Step 4:** Commit `style(client): Obsidian Gold dark-only token base (Plan 2 T1)`.

### Task 2: Logo assets + `Logo` component

**Files:** Create `client/src/components/brand/logo.tsx`, `client/public/logo/*.svg` (extracted); Modify `client/index.html` (favicon), possibly `client/src/components/layout/navbar.tsx` + footer import (wire AFTER T5/T6 restyle — if T2 lands before them, only add the component + favicon; note it).

**Steps:**
- [ ] **Step 1:** Read `.stitch/designs/logo-system.html` — inventory all 13 inline SVGs (name them: mark/wordmark/mono/favicon variants by aspect + fill usage; note gold `#EDB84C` gradients are `url(#…)` defs — each exported file MUST carry its `<defs>` inside, standalone). Decide mapping: primary mark (nav/favicon), horizontal lockup (footer), mono white (admin sidebar/dark-on-gold spots).
- [ ] **Step 2:** Export chosen SVGs to `client/public/logo/` with kebab names (e.g. `mark.svg`, `lockup.svg`, `mono.svg`) — copy EXACT vector data (global Stitch asset rule: use the original, no re-drawing); inline `<defs>` per file; no rasterization.
- [ ] **Step 3:** Create `Logo` component (props: `variant: 'mark'|'lockup'|'mono'`, `className`) rendering via `<img src={import.meta.env.BASE_URL + 'logo/…'}>` or inline SVG (prefer inline for gradient id-collision safety across instances — pick one approach and document; if inline, render the component's own defs with unique ids).
- [ ] **Step 4:** Wire favicon (`<link rel="icon" type="image/svg+xml" href="/logo/mark.svg">`), replacing existing. Build + tsc clean. Commit `feat(client): logo system from approved Stitch design (Plan 2 T2)`.

### Task 3: Global hardcoded-color sweep (foundation scope)

**Files:** Modify components with hardcoded light/blue colors: layout (`navbar.tsx`, `footer*`, `admin-layout.tsx`), `components/ui/*` overrides — NOT feature pages (those get per-screen treatment in Plans 3–6).

**Steps:**
- [ ] **Step 1:** Grep inventory: `grep -rn -E "#[0-9a-fA-F]{3,8}|oklch|bg-white|text-white|border-gray|blue-[0-9]" client/src/components/layout client/src/components/ui client/src/pages/admin/_layout* 2>/dev/null` — write the hit list into the commit message.
- [ ] **Step 2:** Replace with token utilities (`bg-card`, `text-muted-foreground`, `text-primary`, `bg-primary/10`, etc.) per DESIGN.md; where a screen needs a literal not in tokens, add a `@theme` token in T1 file instead of a new literal (note: requires one more `index.css` edit — allowed).
- [ ] **Step 3:** build + tsc clean; eyeball grep again for `oklch(0.45 0.011 250…)` (old blue) → 0 hits in scope dirs. Commit `style(client): replace hardcoded light/blue palette with Obsidian Gold tokens (Plan 2 T3)`.

### Task 4: Dark-only — remove theme toggle UI (C5-safe)

**Files:** Modify `client/src/components/layout/navbar.tsx` (remove toggle button :208-210 ± its label/handlers); DO NOT modify `client/src/contexts/ThemeContext.tsx` (byte-identical requirement), `main.tsx` provider wiring untouched unless it renders toggle UI directly (verify).

**Steps:**
- [ ] **Step 1:** Locate every UI affordance that changes theme: navbar toggle; any settings-menu toggle; admin sidebar toggle (grep `setTheme|toggleTheme|theme=` in `client/src` outside ThemeContext). List them in commit message.
- [ ] **Step 2:** Remove the affordances (buttons/menus), keeping imports/dead-code clean. Confirm `ThemeContext.tsx` untouched: `git diff --stat` excludes it.
- [ ] **Step 3:** build + tsc clean; in browser (manual or Playwright later): page renders dark with `html` having any/no `dark` class (values now in `:root`). Commit `feat(client): dark-only UI — remove theme toggle affordances (Plan 2 T4, C5 preserved)`.

### Task 5: Navbar to design (`navbar-footer-spec.html`)

**Files:** Modify `client/src/components/layout/navbar.tsx` (+ its subcomponents e.g. mega-menu/search/user-menu as they exist).

**Steps:**
- [ ] **Step 1:** Study `navbar-footer-spec.html` + its PNG (`navbar-footer-spec.png`): structure (top strip? main bar height, logo slot, nav items incl. dynamic categories, search field style, icons: account/wishlist/cart with badge, mobile hamburger), colors/typography from tokens.
- [ ] **Step 2:** Restyle existing navbar (keep ALL current behaviors: debounced search + suggestions, dynamic categories fetch, auth-aware user menu, cart count, mobile menu, sticky behavior). Replace toggle remnants (T4), insert `Logo` (T2). VN copy per design (check screen for nav labels — use screen text, not invented).
- [ ] **Step 3:** build + tsc clean; screenshot checkpoint deferred to T12 (note any known deviation from screen in commit message). Commit `feat(client): navbar rebuilt to approved Obsidian Gold design (Plan 2 T5)`.

### Task 6: Footer to design + settings-driven contact

**Files:** Create `client/src/services/settings.ts` (settingsApi: `getPublic()` → `GET /api/settings/public`, envelope-typed like existing services), `client/src/hooks/usePublicSettings.ts` (fetch-once + in-memory module cache; no context), Modify footer component (`client/src/components/layout/footer.tsx` or equivalent — verify actual path).

**Steps:**
- [ ] **Step 1:** Study `navbar-footer-spec.html` footer region: columns (brand + logo, dynamic category links, news/policy links, contact block: hotline/hours/email/address/social icons), bottom bar (copyright, VN copy exactly as screen).
- [ ] **Step 2:** Implement footer: contact block renders EACH row only if key present in settings payload (`hotline`, `supportHours`, `email`, `address`, `socialLinks.*` icons) — absent ⇒ row hidden entirely; NO default values anywhere. Links to dynamic categories/news from existing APIs.
- [ ] **Step 3:** build + tsc clean; manual check with unconfigured settings (dev DB has none): footer shows no contact rows — zero placeholders. Commit `feat(client): design footer with settings-driven business info (Plan 2 T6)`.

### Task 7: API error-status mapping layer (Cross-plan §4)

**Files:** Modify `client/src/services/apiClient.ts` (extend, don't rewrite: keep credentials + existing malformed-payload reject), Create `client/src/lib/apiError.ts`.

**Steps:**
- [ ] **Step 1:** Implement `getApiErrorInfo(err): {status?: number; message: string; kind: 'validation'|'forbidden'|'not-found'|'conflict'|'network'|'unknown'}` reading `err.response.status` + envelope `message`; export helper `conflictToastMessage()` = plan-verbatim `'Dữ liệu đã thay đổi bởi người khác, vui lòng tải lại'` for 409, and kind→friendly default VN copies for 404/403 (fallbacks only — server messages take precedence when present).
- [ ] **Step 2:** Add ONE response interceptor: for status 401 → let existing auth flow handle (verify current handling — do not double-toast); for 409 → surface the conflict copy via sonner (single point); other statuses → NO global toast (call sites decide — avoids double-toasts). Keep `getErrorMessage()` behavior for existing 12 call sites (back-compat: implement it via `getApiErrorInfo` so messages stay identical for 400s).
- [ ] **Step 3:** build + tsc clean; verify credentials flag untouched (grep `withCredentials`). Commit `feat(client): API error status mapping per cross-plan contract (Plan 2 T7)`.

### Task 8: `not-found` 404 page

**Files:** Create page component per `.stitch/designs/not-found.html` (path follows existing page conventions e.g. `client/src/pages/not-found-page.tsx`), Modify `client/src/App.tsx` only if the catch-all route needs pointing (verify current 404 handling first).

**Steps:**
- [ ] **Step 1:** Study screen: VN copy verbatim (headline, subtext, CTA labels), layout, search box + suggested links if present (wire search → existing search route; product suggestions → only if an existing cheap API supports it — otherwise the screen's static link row to categories; NO invented products).
- [ ] **Step 2:** Implement + route catch-all (`*`). build + tsc clean. Commit `feat(client): 404 page to approved design (Plan 2 T8)`.

### Task 9: Admin shell restyle (foundation)

**Files:** Modify `client/src/components/layout/admin-layout.tsx` (or actual admin layout path from survey).

**Steps:**
- [ ] **Step 1:** Study the admin shell screens in `.stitch/designs/` (per metadata: admin dashboard/products show sidebar + topbar): sidebar dark surface, gold active item, logo (mono variant), topbar with page title/breadcrumb + admin user menu; remove the redundant hardcoded `dark` class (:61) only if T3 didn't already.
- [ ] **Step 2:** Restyle layout shell ONLY (routes' inner pages are Plan 6): colors/typography/spacing to tokens, keep ALL current behavior (nav links, active states, logout, responsive collapse).
- [ ] **Step 3:** build + tsc clean. Commit `feat(client): admin shell restyled to Obsidian Gold (Plan 2 T9)`.

### Task 10: Overlays foundation (`overlays-spec.html`)

**Files:** Verify + adjust theming of existing `components/ui/*`: dialog, alert-dialog, dropdown, sheet/drawer, sonner Toaster setup (global config — where? verify `main.tsx`), skeleton, empty-state component if missing (create `components/ui/empty-state.tsx` + `loading` skeleton per design if absent).

**Steps:**
- [ ] **Step 1:** Study `overlays-spec.html`: dialog radius/border/surface, button styles, toast style, confirm-destructive pattern (red), empty/loading states.
- [ ] **Step 2:** Align Toaster config (dark, position top-right, duration 4000, closeButton; **richColors ON** — T10 review verified overlays-spec shows 3 type-colored toasts emerald/rose/amber :434/:458/:482, not neutral; the earlier "richColors off" wording was wrong) + any ui overrides needed; create missing primitives. No feature-page dialogs (Plans 3–6).
- [ ] **Step 3:** build + tsc clean. Commit `feat(client): overlay/toast foundation to design (Plan 2 T10)`.

### Task 11: Docs sync (spec §C-series truth)

**Files:** Modify root `DESIGN.md` (replace superseded Precision/Ocean content with a pointer to `.stitch/DESIGN.md` + this plan + token table), `.ai/CURRENT_STATE.md` (Plan 2 progress section).

**Steps:**
- [ ] **Step 1:** Rewrite root `DESIGN.md` as the Obsidian Gold pointer + token reference (no duplication of `.stitch/DESIGN.md` — link it).
- [ ] **Step 2:** Update `.ai/CURRENT_STATE.md` (Plan 2 in-progress/complete state). Commit `docs: root DESIGN.md → Obsidian Gold pointer; CURRENT_STATE Plan 2 (Plan 2 T11)`.

### Task 12: Playwright UI gate — shell (owner decision 7, MANDATED evidence)

**Prereqs:** T1–T11 green. Local run: API `cd server && npx.cmd tsx src/server.ts` with process env `MONGODB_URI=mongodb://127.0.0.1:27017/store3d` (port 5000); client `cd client && npx.cmd vite --port 5173 --strictPort` (verify proxy config targets the API).

**Steps:**
- [ ] **Step 1:** Boot both; confirm live: storefront shell + one admin URL (login page) reachable; record exact URLs (`http://localhost:5173/...`, API base).
- [ ] **Step 2:** Using the harness Playwright tools (browser MCP): for EACH of **desktop (1920×1080), tablet (834×1112), mobile (390×844)**: visit home, open navbar mobile menu, footer (settings rows absent ⇒ hidden), 404 route; capture screenshots to `review-artifacts/plan2/` (name `<page>-<vp>.png`).
- [ ] **Step 3:** Console/Network: assert zero console errors on each visit; network: no failed requests (esp. fonts, logo SVGs, `/api/settings/public` 200, images via `resolveImageUrl`), no 404 assets; note any warning.
- [ ] **Step 4:** Admin shell: visit `http://localhost:5173/admin` (login gate) — screenshot login page desktop+mobile; verify brand styling renders dark/gold (full admin flows = Plan 6 gate).
- [ ] **Step 5:** Evidence report appended to CURRENT_STATE or a `review-artifacts/plan2/REPORT.md`: URLs, screenshot list, console/network results, any deviation from screens.
- [ ] **Step 6:** Run frontend quality gate skill `frontend-quality-checklist-store3d` (profile: UI Change) — fix Critical issues before completing; justify or fix High. Commit evidence + docs `test(client): Plan 2 shell Playwright gate + quality checklist (Plan 2 T12)`.

---

## Acceptance criteria (Plan 2 gate — checked in T12/report)

- **AC1:** `npx.cmd tsc --noEmit` + client production build clean after every task; zero new dependencies (`client/package.json` byte-identical).
- **AC2:** `:root` contains the full Obsidian Gold token set; `.dark`/light second-theme block gone; old primary blue oklch gone from tokens.
- **AC3:** No theme-toggle affordance remains in UI; `ThemeContext.tsx` diff = EMPTY (C5).
- **AC4:** Logo/favicon = original SVG vectors from `logo-system.html` (no redrawn/rasterized substitutes); renders (inspect network: `/logo/*.svg` 200).
- **AC5:** Footer contact rows render ONLY from settings payload; with unconfigured DB: zero contact rows, zero placeholder strings (grep footer source for `1900|8:30|24/7` = 0).
- **AC6:** `getApiErrorInfo` + 409 conflict copy live per Cross-plan §4; `getErrorMessage` back-compat preserved; credentials config unchanged.
- **AC7:** Navbar/footer/admin-shell/404 match approved screens in structure + VN copy (Playwright screenshots as evidence); existing navbar behaviors (search, categories, cart, auth menu) still work.
- **AC8:** Playwright gate evidence complete: 3 viewports × (home, mobile menu, footer, 404) + admin login, all console-clean and network-clean, report committed.
- **AC9:** `frontend-quality-checklist-store3d` run; all Critical fixed.

## Self-review record

- Coverage: foundation (tokens/fonts-verified/logo/colors/dark-only), shell (navbar/footer/admin shell/404/overlays), contract (settings §5/6, error §4), docs (T11), mandated UI gate (T12) — matches Plan-2 scope; feature pages explicitly deferred to Plans 3–6 with per-screen design pass. ✓
- Each task: steps name one action + checkable result; verification = tsc+build (+ Playwright where interaction). TDD absent by design (C3 + zero-dep rule) — compensating control = T12 visual/network gate + per-task build. ✓
- Contract embedding: §2/§3 noted for Plans 3–4 (not touched here); §4 (T7), §5/§6 (T6), §7 (Plan 6 note in Global Constraints). ✓
- Review Focus pins the 5 realistic regressions to tasks. ✓
- No file-path guessed: all cited from the path-cited survey or design dir listing (implementers re-verify before editing). ✓
