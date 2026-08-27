# Design: Horizontal product suggestions in search bar

**Date:** 2026-08-14

## Problem

The navbar search bar only shows suggestions after typing ≥ 2 characters, renders vertical list suggestions, and the mobile menu search has no suggestions at all. Technique: typing one letter ("T", "h") should surface matching products as a horizontally scrollable row of image cards beneath the search bar.

## Current State

- `client/src/components/layout/navbar.tsx` owns the search UI.
- Suggestions are disabled below 2 characters (`debouncedSearch.trim().length < 2`).
- Desktop suggestions render as a vertical list (`{name, slug}`), navigates to `/san-pham/{slug}` on click.
- Mobile search form (navbar menu) has no suggestion dropdown.
- Server supports case-insensitive substring regex on `name` + `description` (`productService.list`), so typing one letter already matches broadly. No server change needed.

## Solution (Approach A: client-only navbar change)

1. **Trigger:** drop the `< 2` gate; fetch suggestions from the 1st keystroke (`productApi.list({ search, limit: 5 })`), preserving the 300ms debounce and cancel-on-unmount behavior.
2. **Data:** store suggestions as `Product[]` (full objects) instead of `{name, slug}` so image + price are available. Render via `resolveImageUrl(p.images[0])` with a fallback icon.
3. **Desktop UI:** replace the vertical list with a horizontal scroll row (`flex gap-2 overflow-x-auto`, scroll-snap) inside a `bg-popover` panel. Each item is a `Link` to `/san-pham/{slug}` showing a square thumbnail (~72px) with product name + sale price below.
4. **Mobile UI:** add the same horizontal suggestion row under the mobile search form, sharing the same `search`/`searchResults`/`debouncedSearch` state.
5. **Dismissal:** keep `onBlur` close (200ms) so clicking a suggestion still lands; suggestions clear on submit and when input empties.
6. **Behavior:** clicking a suggestion navigates to product detail; Enter still navigates to `/san-pham?search=...`. Max 5 results.

## Out of Scope

- No server endpoint or schema changes.
- No change to `/san-pham` search-results page behavior.
- No pagination or keyboard-navigation in the dropdown (YAGNI; single-word incremental search).

## Testing

- `client`: `npm run build` (tsc + vite) and `npm run lint` (oxlint) must pass.
- Manual on `http://localhost:5173`: type one letter in desktop bar → horizontal row appears; scroll; click navigates; mobile menu shows the same row; Enter still navigates to results page.