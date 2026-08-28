# CANONICAL_CONTEXT — Store3D AI Development Pipeline

> **Source of Truth.** When this file conflicts with other `.ai/` docs, prefer this file.
> Last updated: 2026-08-28

---

## 1. TASK

Establish a single canonical reference document for the Store3D project that all AI coding agents consult before any code change. This document consolidates project identity, goals, architecture, constraints, decisions, and open questions from scattered `.ai/` files into one authoritative source.

---

## 2. OBJECTIVE

Store3D is a Vietnamese e-commerce platform for selling 3D-printed models (figurines, decorative items, architectural models, accessories). It delivers a premium **"digital showroom"** experience with a futuristic/cyber-premium aesthetic.

- **Target users:** Customers (browse, order, pay via QR, review) and Admins (manage products, orders, coupons, users, reviews, news)
- **Deployment:** Vercel (client + serverless API) + Render (Express server)
- **Status:** Stable and working. Both client and server deployed to production.

---

## 3. REQUIREMENTS

### Functional
- Product browsing: list, search (case-insensitive), filter by category, sort, pagination, featured, related
- Product detail: immersive gallery-first layout with lightbox, sticky purchase panel (desktop), fixed bottom bar (mobile), tabbed content, rating summary, review cards
- Shopping cart: add/remove/update quantity, persisted to localStorage, cart drawer UI
- Checkout: shipping info, payment method (COD / bank transfer), coupon application
- QR payment: VietQR code generation with countdown timer, polling status every 3 seconds
- User auth: register, login, logout, profile, password change (JWT httpOnly cookies)
- Wishlist: add/remove, move to cart, server-side persistence
- Reviews: purchase-gated (completed order required), CRUD, rating aggregation
- Admin: dashboard (KPI + Recharts), CRUD products/categories/coupons/orders/users/reviews/news/contacts
- News/blog: CRUD (admin), public listing, slug-based detail
- Contact form: submit, admin management
- Dark/light theme: toggle with localStorage persistence
- Search suggestions: horizontal scrollable product cards from 1 character input

### Non-Functional
- All UI text in Vietnamese
- Route slugs in Vietnamese without diacritics (`/san-pham`, `/thanh-toan-qr`)
- Cookie-based auth (JWT in httpOnly cookie, `withCredentials: true`)
- Zod validation at both client and server boundaries
- Standard API response envelope: `{ success, message, data, pagination, errors }`
- Atomic stock decrement with rollback on order creation
- One-way order status workflow: `pending → confirmed → shipping → completed`
- Rate limiting: global 300/15min, auth 20/15min

---

## 4. CONSTRAINTS

### Hard Constraints (NEVER violate)
| # | Constraint | Source |
|---|-----------|--------|
| C1 | **No 3D libraries.** Never install Three.js, React Three Fiber, `<model-viewer>`, or any 3D rendering library. Store3D uses 2D image galleries only. | [PROJECT.md, ARCHITECTURE.md] |
| C2 | **Vietnamese UI.** All user-facing labels, error messages, and notifications must be in Vietnamese. | [PROJECT.md] |
| C3 | **No client-side tests exist.** Zero test files in `client/`. Do not assume test infrastructure exists. | [CURRENT_STATE.md] |
| C4 | **Cookie-based auth only.** JWT stored in httpOnly cookie named `token`. Do not switch to Authorization header pattern. | [ARCHITECTURE.md] |
| C5 | **Do not modify context state files.** Do not alter `AuthContext`, `CartContext`, `WishlistContext`, `ThemeContext` logic unless explicitly tasked. | [AGENTS.md] |
| C6 | **Client must not control payment status.** All financial state changes must go through backend API/webhook. | [AGENTS.md] |
| C7 | **Image rendering.** All images from DB must pass through `resolveImageUrl(img)` utility. | [ARCHITECTURE.md] |

### Soft Constraints (Prefer, but exceptions allowed)
| # | Constraint | Source |
|---|-----------|--------|
| S1 | Follow existing layered architecture: Routes → Controllers → Services → Models | [PROJECT.md] |
| S2 | Use shadcn/ui components from `components/ui/` | [AGENTS.md] |
| S3 | Use `cn()` utility for class merging | [AGENTS.md] |
| S4 | Lazy-load page components with `React.lazy()` | [AGENTS.md] |
| S5 | Use React Hook Form + Zod for form validation | [AGENTS.md] |
| S6 | Do not refactor unrelated code while working on a feature | [AGENTS.md] |

---

## 5. RESEARCH

### Research Hierarchy (priority order)
1. **`.ai/` project memory** — Read first for project-level knowledge
2. **GitNexus** — Codebase relationships, impact analysis, caller/callee tracing
3. **Context7** — Library/framework documentation (React, Vite, Tailwind, Express, Mongoose, Zod, Framer Motion, Radix/shadcn)
4. **Web Research** — Current/external information, API docs, best practices
5. **Stitch** — UI design exploration, visual references, design system
6. **Playwright** — Browser verification, visual QA, responsive testing

### Decision Tree
```
USER REQUEST
    ↓
Existing project code? → GitNexus
    ↓
Project-specific knowledge? → .ai/
    ↓
Library/framework API? → Context7
    ↓
Current/external info? → Web Research
    ↓
Visual/UI design? → Stitch
    ↓
Browser verification? → Playwright
```

### Research Discipline
- Do not research just because a tool exists
- Use the smallest set of tools needed
- Prefer primary/official sources
- Distinguish facts from assumptions
- Do not invent undocumented project behavior
- After research, apply findings to the actual repository

---

## 6. DESIGN DIRECTION

### Visual Identity
- **Aesthetic:** Premium, futuristic, "digital showroom" — dark luxurious backgrounds, glassmorphism, cyan/blue glow, digital grid overlays, hover lift effects
- **Font:** Be Vietnam Pro (single font family throughout)
- **Primary color:** Ocean Blue (#3b6ee8 / oklch 0.58 0.165 250)
- **Radius:** 10px (0.625rem) standard; `rounded-2xl` for product cards
- **Dark mode:** Toggle with `.dark` class on root, persisted in localStorage. Admin panel is dark-only.

### Color Tokens (Light)
- background: #ffffff, foreground: #111827
- primary: #3b6ee8 (buttons, prices, active states)
- muted: #f7f7f7, card: white, border: #ebebeb
- amber: #fbbf24 (star ratings)
- destructive: #e5484d

### Color Tokens (Dark)
- background: #222222, foreground: #fafafa
- primary: oklch 0.75 0.14 245 (lighter)
- card: #343434, border: white 10% opacity
- muted: #444, muted-foreground: #b4b4b4

### Component Patterns
- **Navbar:** Sticky, backdrop-blur, 64px height, z-40
- **Product card:** rounded-2xl, bg-card/50 + backdrop-blur, hover lift with primary glow
- **Search suggestions:** Horizontal scrollable cards below search input
- **Buttons:** Primary (primary bg, white text, shadow, 10px radius), Outline (border, transparent bg)
- **Inputs:** Muted/50 bg, 10px radius

---

## 7. INFORMATION ARCHITECTURE

### Monorepo Structure
```
store3D/
├── client/          # React SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # 20 shadcn/ui primitives
│   │   │   ├── layout/     # navbar, footer
│   │   │   ├── common/     # breadcrumb, empty-state, error-state, pagination, star-rating
│   │   │   ├── product/    # product-card, product-card-skeleton, product-gallery,
│   │   │   │              # product-gallery-mobile, product-lightbox, purchase-panel,
│   │   │   │              # mobile-purchase-bar, product-tabs, use-purchase-panel
│   │   │   ├── cart/       # cart-drawer
│   │   │   ├── auth/       # login-prompt-dialog
│   │   │   ├── admin/      # image-upload
│   │   │   ├── home/       # hot-sale-section
│   │   │   ├── order/      # order-status-badge
│   │   │   └── review/     # review-action, rating-summary, review-card
│   │   ├── contexts/       # Auth, Cart, Wishlist, Theme
│   │   ├── hooks/          # useDebounce, useLocalStorage, useReviewEligibility
│   │   ├── layouts/        # main-layout, account-layout, admin-layout
│   │   ├── pages/          # All page components (lazy-loaded)
│   │   ├── routes/         # guards.tsx (Protected, Admin, GuestOnly)
│   │   └── utils/          # cn(), apiClient, resolveImageUrl, helpers
│   └── public/             # Static assets, sitemap.xml, robots.txt
├── server/          # Express API
│   └── src/
│       ├── config/         # env, cors, rateLimit, cloudinary
│       ├── controllers/    # 11 controllers (thin)
│       ├── database/       # Mongoose connection
│       ├── middleware/      # auth, validate, errorHandler, notFound
│       ├── models/         # 10 Mongoose models
│       ├── routes/         # 13 route files
│       ├── services/       # 16 service files (business logic)
│       ├── utils/          # AppError, apiResponse, apiFeatures, asyncHandler, slugify, token
│       └── validators/     # 8 Zod schema files
└── .ai/             # AI context documentation
```

### Route Map (Client)
| Group | Routes |
|-------|--------|
| Public | `/`, `/san-pham`, `/san-pham/:slug`, `/lien-he`, `/tin-tuc`, `/tin-tuc/:slug` |
| Guest-only | `/dang-nhap`, `/dang-ky` |
| Protected | `/thanh-toan`, `/thanh-toan-thanh-cong/:id`, `/thanh-toan-qr/:id`, `/danh-gia/:slug`, `/tai-khoan/*` |
| Admin | `/admin/*` (requires `role === 'admin'`) |

### State Management
| Context | Mechanism | Persistence |
|---------|-----------|-------------|
| AuthProvider | useReducer (AUTH_START, AUTH_SUCCESS, AUTH_LOGOUT, AUTH_ERROR) | JWT httpOnly cookie |
| CartProvider | useReducer (ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY, CLEAR) | localStorage |
| WishlistProvider | useState + API calls | Server-side (MongoDB) |
| ThemeProvider | useState + localStorage | localStorage, toggles `.dark` class |

Provider nesting: StrictMode → ThemeProvider → BrowserRouter → AuthProvider → CartProvider → WishlistProvider → Suspense → Routes

---

## 8. TECHNICAL CONTEXT

### Technology Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.2.8 |
| Build | Vite | 8.2.0 |
| Language | TypeScript | 6.0.2 (client), 5.5.4 (server) |
| Styling | Tailwind CSS | 4.3.3 |
| UI Components | shadcn/ui (New York) + Radix UI | Various |
| Animations | Framer Motion | 13.0.0 |
| Charts | Recharts | 3.10.1 |
| Forms | React Hook Form + Zod | 7.84.0 / 4.4.3 |
| HTTP Client | Axios | 1.19.0 |
| Routing | React Router DOM | 7.18.2 |
| Backend | Express | 4.19.2 |
| Database | MongoDB (Mongoose) | 8.5.1 |
| Auth | JWT (jsonwebtoken) | 9.0.2 |
| Password | bcryptjs | 2.4.3 |
| Image Upload | Cloudinary | 2.10.1 |
| Validation | Zod | 3.23.8 (server) |
| Linting | oxlint | 1.75.0 |
| Deployment | Vercel + Render | — |

### API Base URL
- Development: `http://localhost:5000/api`
- Production: `https://<vercel-domain>/api`

### Database Models
| Model | Key Fields |
|-------|-----------|
| User | fullname, email (unique), password (bcrypt, select:false), phone, avatar, role (admin/customer), address, active |
| Product | name, slug (unique), description, images[], category (ref), material, printerType, size, stock, originalPrice, salePrice, rating, reviewCount, status, featured |
| Category | name, slug (unique), image, description |
| Order | user (ref), items[], customer {}, subtotal, discount, shipping, total, coupon, payment {}, status |
| OrderItem | order (ref), product (ref), name, image, price, quantity |
| Wishlist | user (ref, unique), products[] (ref) |
| Review | user (ref), product (ref), order (ref), rating (1-5), comment, images[]. Unique on (user, product) |
| Coupon | code (unique, uppercase), discount, type (percent/fixed), expiredDate, quantity, usedCount, minOrder |
| News | title, slug (unique), excerpt, content, thumbnail, category, author, status, publishedAt |
| ContactRequest | userId (optional ref), fullname, email, phone, subject, message, status, adminNote |

### Deployment
- **Vercel:** Client SPA from `client/dist`, API rewrites to `/api/server` serverless function
- **Render:** Node.js free tier, build `npm install && npm run build`, start `node dist/server.js`
- **Required env:** `MONGODB_URI`, `JWT_SECRET`
- **Optional env:** `PORT`, `CLIENT_URL`, `RATE_LIMIT_*`, `CLOUDINARY_*`, `BANK_*`, `QR_TTL_MINUTES`, `PAYMENT_WEBHOOK_SECRET`, `SMTP_*`

---

## 9. ACCEPTANCE CRITERIA

### For Any Code Change
1. Build passes (`npm run build` in `client/` and `server/`)
2. TypeScript check passes (0 errors)
3. No regressions in existing functionality
4. Vietnamese UI text maintained
5. Existing code patterns followed (layered architecture, response envelope, error handling)
6. No unrelated code refactored

### For UI Changes
7. Responsive behavior verified (desktop + mobile)
8. Dark/light mode both work
9. `resolveImageUrl()` used for all DB images
10. Framer Motion animations consistent with existing patterns

### For API Changes
11. Zod validation at route level
12. Standard response envelope used
13. `asyncHandler` wraps async handlers
14. Vietnamese error messages in Zod schemas and service errors

---

## 10. VERIFICATION

### Build & Lint
```bash
# Client
cd client && npm run build
cd client && npx tsc --noEmit

# Server
cd server && npm run build
cd server && npm test
```

### Browser Verification
- Use Playwright for visual QA when available
- Check: layout, typography, spacing, responsive behavior, navigation, interactions
- Check: loading, empty, error, success, disabled, validation states
- Check: console errors, accessibility basics

### Git Verification
- `git diff` before committing to confirm only intended changes
- `git status` to ensure clean working tree after commit
- Verify no unintended files modified

---

## 11. OUTPUT REQUIREMENTS

### Code Style
- **Server:** Routes → Controllers → Services → Models. Controllers are thin. Services contain business logic.
- **Client:** Lazy-loaded pages, Context + useReducer for state, shadcn/ui components, `cn()` for classes.
- **Database:** Models in `server/src/models/`, validators in `server/src/validators/`, services handle Mongoose operations.

### Response Format
```json
{
  "success": true,
  "message": "Thành công",
  "data": {},
  "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 },
  "errors": []
}
```

### Error Format
```json
{
  "success": false,
  "message": "Lỗi validation",
  "data": null,
  "pagination": null,
  "errors": [{ "field": "email", "message": "Email không hợp lệ" }]
}
```

### File Naming
- Components: `kebab-case.tsx` (e.g., `product-gallery.tsx`)
- Hooks: `use-*.ts` (e.g., `use-purchase-panel.ts`)
- Pages: `*-page.tsx` (e.g., `product-detail-page.tsx`)
- Services: `*.service.ts`
- Validators: `*.validator.ts`

---

## 12. DECISIONS

### Architecture Decisions
| # | Decision | Rationale | Status |
|---|---------|-----------|--------|
| D1 | Monorepo with `client/` and `server/` separation | Clear boundary between frontend and backend | Implemented |
| D2 | Cookie-based JWT auth (httpOnly, secure, sameSite: lax) | XSS protection, consistent with SPA architecture | Implemented |
| D3 | Zod validation at both client and server boundaries | Type-safe validation, shared schemas possible | Implemented |
| D4 | Standard response envelope for all API responses | Consistent API contract for frontend consumption | Implemented |
| D5 | Atomic stock decrement with rollback | Prevent overselling, data integrity | Implemented |
| D6 | One-way order status workflow | Financial data integrity, audit trail | Implemented |
| D7 | Polling (3s) instead of WebSocket for QR payment | Simpler infrastructure, lower server cost on Render free tier | Implemented |
| D8 | usePurchasePanel hook called once, shared via props | Prevent state duplication between desktop/mobile components | Implemented |
| D9 | CSS visibility for responsive switching (not JS breakpoints) | Simpler code, no hydration mismatch risk | Implemented |
| D10 | Remove "Tạm tính" subtotal display from product detail | Simplify UI, reduce redundant price information | Implemented |

### Design Decisions
| # | Decision | Rationale | Status |
|---|---------|-----------|--------|
| D11 | Be Vietnam Pro as sole font family | Consistency, Vietnamese character support | Implemented |
| D12 | Ocean Blue primary palette (#3b6ee8) | Brand identity, premium feel | Implemented |
| D13 | 10px standard radius, rounded-2xl for cards | Visual hierarchy, card distinction | Implemented |
| D14 | Dark mode via `.dark` class + localStorage | Simple toggle, persistence across sessions | Implemented |
| D15 | Admin panel dark-mode only | Scoped dark mode, distinct from customer UI | Implemented |
| D16 | No 3D rendering (images only) | Performance, simplicity, cost | Implemented |

---

## 13. OPEN QUESTIONS

| # | Question | Impact | Status |
|---|---------|--------|--------|
| Q1 | Should SMTP email sending be implemented for contact form and order notifications? | Feature completeness, user experience | Planned but not started |
| Q2 | Should the payment webhook be integrated with a real payment provider? | Production payment capability | Planned but not started |
| Q3 | Should sitemap.xml and robots.txt be dynamically generated? | SEO optimization | Planned but not started |
| Q4 | Should automatic image optimization (WebP, resizing) be added to Cloudinary uploads? | Performance, bandwidth | Planned but not started |
| Q5 | Should client-side testing be introduced (vitest/jest)? | Code quality, regression prevention | UNKNOWN — no test infrastructure exists |
| Q6 | Should TypeScript strict mode be enabled in server tsconfig? | Type safety, catch more bugs at compile time | UNKNOWN |
| Q7 | Should request logging (morgan) and API documentation (Swagger) be added? | Observability, developer experience | UNKNOWN |
| Q8 | Should the CORS configuration be tightened in development? | Security in dev environment | UNKNOWN |
| Q9 | Should the demo credentials in `client/README.md` be removed or obfuscated? | Security if repo is public | UNKNOWN |
| Q10 | Should CI/CD pipeline (GitHub Actions) be set up? | Automated testing, deployment quality | UNKNOWN |
