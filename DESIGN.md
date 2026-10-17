# Store3D — Design System Pointer (Obsidian Gold)

> **Status (2026-10-17):** The former "Precision Showroom / Ocean Blue" design direction
> (light-first, primary `#3B6EE8`, light+dark toggle) is **SUPERSEDED**.
> Current approved direction: **"Obsidian Gold"** — dark-only, Black/Gold/Blue/White —
> approved at **GATE 1 v2 (2026-10-17)**.

This file is a **pointer + quick token reference only**. It does NOT duplicate the
canonical design system. When anything here and the canonical doc disagree, the
canonical doc wins.

## Canonical sources (read these)

| What | Where |
|------|-------|
| Full design system (Obsidian Gold — colors, typography, components, patterns) | `.stitch/DESIGN.md` |
| 40 approved screens (storefront + admin + mobile + specs) | `.stitch/designs/` (HTML + PNG per screen) |
| Screen index / manifest | `.stitch/metadata.json` |
| Logo source of truth (all SVG variants) | `.stitch/designs/logo-system.html` |
| Design-track record (decisions, gate history) | `.ai/CANONICAL_CONTEXT.md` · `.ai/CURRENT_STATE.md` |
| Implementation plan that built the foundation | `docs/superpowers/plans/2026-10-17-client-foundation-shell.md` |

## Token reference (as implemented in `client/src/index.css`)

Dark-only, single `:root` theme (no `.dark` override block, no light theme):

| Token | Value |
|-------|-------|
| `--background` | `#07090F` (obsidian) |
| `--card` | `#0E1219` |
| `--popover` / `--secondary` / `--muted` | `#151A24` |
| `--primary` (gold) / `--ring` | `#EDB84C` (primary-foreground `#07090F`) |
| `--accent` (blue) | `#3E8BFF` |
| `--foreground` | `#FFFFFF` |
| `--muted-foreground` | `#94A3B8` |
| `--border` / `--input` | `#1E2532` |
| `--destructive` | `#F43F5E` |
| `--success` | `#34D399` |
| `--warning` | `#FBBF24` |
| `--sidebar` | `#0B0F16` |
| `--radius` | `0.625rem` (10px) |
| Body font | **Be Vietnam Pro** (all Vietnamese UI text) |
| Display/numeric font | **Orbitron** — Latin/numeric accents ONLY; never for Vietnamese-diacritic text |

Chart tokens (`--chart-1..5`) and full sidebar token set live in `client/src/index.css`
— read the file, don't reconstruct from this table.

## Binding rules

1. **Dark mode only.** No theme toggle anywhere in the rebuilt UI. All tokens live in
   `:root`; rendering is dark regardless of any html class.
2. **Vietnamese UI everywhere** (constraint C2) — correct diacritics; Orbitron never
   carries Vietnamese text.
3. **Logo:** original SVG vectors from `.stitch/designs/logo-system.html` →
   `client/public/logo/` + `client/src/components/brand/logo.tsx`. No redrawn or
   rasterized substitutes.
4. **Business info is settings-driven (owner mandate):** footer/contact rows render
   only from `GET /api/settings/public` payload. Key absent ⇒ row hidden.
5. **Zero placeholders.** No fake hotlines, hours, promos, or stats — anywhere.
   Statistics only from the stats API, never literals.
6. **Screens are reference**, not pixel-perfect law where surveyed app DOM
   contradicts them (existing behavior stays; restyle instead).

## Implementation notes

- Tokens implemented by Plan 2 (T1–T10) of the client foundation plan; feature
  pages get per-screen treatment in Plans 3–6.
- To change a color: change the token in `client/src/index.css` (or
  `.stitch/DESIGN.md` first, then here) — never hardcode hex values in components.
