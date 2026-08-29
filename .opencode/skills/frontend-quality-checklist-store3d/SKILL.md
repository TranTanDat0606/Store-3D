---
name: frontend-quality-checklist-store3d
description: Store3D-specific frontend quality gate — delegates to the global frontend-quality-checklist skill with project-specific context for this Vietnamese e-commerce platform
---

# Frontend Quality Checklist — Store3D Adapter

## Overview

This is a project-local adapter for the global `frontend-quality-checklist` skill. It adds Store3D-specific context so the global skill can apply appropriate checks for this project.

**Global skill:** `~/.config/opencode/skills/frontend-quality-checklist/SKILL.md`

## Project Context

Read `.ai/CANONICAL_CONTEXT.md` before running checks. Key project facts:

- **Type:** Vietnamese e-commerce platform for 3D-printed models
- **Framework:** React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Deployment:** Vercel (client) + Render (server)
- **UI language:** Vietnamese (all user-facing text)
- **Auth:** JWT in httpOnly cookies
- **Images:** Cloudinary (handles WebP/optimization)

## Project-Specific Profile Overrides

### Default Profile: UI Change
For Store3D, a UI change also implies:
- **Accessibility:** CRITICAL (e-commerce product pages must be accessible)
- **SEO:** HIGH for public product pages (product titles, descriptions, images)
- **Performance:** HIGH (image-heavy catalog, Cloudinary assets)

### Skip Rules (not applicable to Store3D)

| Rule | Reason |
|------|--------|
| SSR/SSG checks | Pure SPA on Vercel, no SSR |
| Service worker | Not a PWA |
| Font optimization | Uses Google Fonts (Be Vietnam Pro) — CDN handles optimization |
| Structured data | Not implemented yet (Q3 in CANONICAL_CONTEXT.md) |
| Open Graph | Not implemented yet |
| Analytics | Not implemented — no tracking scripts |

### Hard Constraints (from CANONICAL_CONTEXT.md §4)

These override any checklist recommendation:
- **C1:** No 3D libraries (images only)
- **C2:** Vietnamese UI text only
- **C3:** No client-side tests exist (do not require tests)
- **C4:** Cookie-based auth only
- **C7:** All DB images must use `resolveImageUrl()`

### Performance Budget (from CANONICAL_CONTEXT.md)

- CLS < 0.1
- FCP < 1.0s
- LCP < 2.0s

### Existing Quality Tools

```bash
# Build
cd client && npm run build

# TypeScript
cd client && npx tsc --noEmit

# Lint
npx oxlint client/src/

# Server tests
cd server && npm test
```

## Workflow Integration

When the global `frontend-quality-checklist` skill is invoked on Store3D:

1. The global skill runs first (categories, checks, severity)
2. This adapter provides project context:
   - E-commerce profile → stronger a11y, SEO, performance
   - Skip rules that don't apply
   - Apply hard constraints (C1-C7)
   - Use existing verification tools

## Safety

This adapter must never:
- Duplicate the global checklist rules
- Override the global skill's severity system
- Add requirements not in CANONICAL_CONTEXT.md
- Replace the global skill — only extend it
