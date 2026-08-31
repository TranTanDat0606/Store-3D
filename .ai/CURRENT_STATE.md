# Store3D — Current State

> Last updated: 2026-08-31

## Current Project Status

**Stable and working.** Fully functional Vietnamese e-commerce store for 3D-printed models. Client + API on Vercel, server on Render.

## Implemented Features

### Fully Implemented
- **Product catalog:** List, search, filter by category, sort, pagination, featured products, related products
- **Product detail:** Immersive gallery-first layout with lightbox (double-click zoom, keyboard nav), desktop sticky purchase panel, mobile fixed bottom bar, tabbed content (Mô tả / Thông số / Đánh giá), rating summary bar chart, review cards, related products
- **Shopping cart:** Add/remove/update quantity, persisted to localStorage, cart drawer UI
- **Checkout:** Shipping info form, payment method selection (cash on delivery / bank transfer), coupon application
- **QR payment:** VietQR code generation with countdown timer, bank info display, copy-to-clipboard
- **Order management:** Create order (atomic stock decrement), order history, order detail, cancel order
- **User authentication:** Register, login, logout, profile update, password change (JWT httpOnly cookies)
- **Wishlist:** Add/remove products, move to cart, server-side persistence
- **Review system:** Purchase-gated reviews (must have completed order), CRUD, rating aggregation
- **Admin dashboard:** KPI cards (revenue, orders, products, customers), revenue charts (Recharts)
- **Admin products:** CRUD with Cloudinary image upload, stock management, status toggle
- **Admin categories:** CRUD with product count, deletion protection
- **Admin orders:** List with status filter, status workflow (pending → confirmed → shipping → completed)
- **Admin coupons:** CRUD (percent/fixed), min order, expiry, usage tracking
- **Admin reviews:** List, delete
- **Admin users:** List, role update, activate/deactivate, delete (protects last admin)
- **Admin Excel export:** 4-sheet XLSX (overview, daily revenue, monthly revenue, product sales with stock), excludes cancelled orders
- **News/blog:** Full CRUD (admin), public listing by category, slug-based detail pages
- **Contact form:** Submit, admin list/status/note management
- **Dark/light theme:** Toggle with localStorage persistence, smooth CSS transitions
- **Search with suggestions:** Horizontal scrollable product cards with images
- **Responsive design:** Mobile-first with drawer navigation, responsive grids
- **Image upload:** Cloudinary integration with 5MB limit, memory storage
- **Rate limiting:** Global (300/15min) and auth-specific (20/15min)
- **Error handling:** Central error handler, Vietnamese error messages
- **Database seeding:** Idempotent seed script with sample data
- **Mini-game (frog-catcher):** 3 difficulty tiers, boss with phase 2, mobile touch controls, invincibility frames (400ms), score validation, server-side reward distribution, UserCoupon persistence
- **AI chat:** Mock provider (ai/test MockLanguageModelV4), per-user/guest localStorage scoping, debounced streaming persistence (500ms), product recommendation cards from markdown, 20-message server limit, MAX_MESSAGES=18 client guard

### Partially Implemented
- **Email/SMTP:** Config exists in env vars but no email sending code is implemented
- **Payment webhook:** Endpoint exists but relies on external webhook configuration

## Chat History Persistence (verified 2026-08-31)

### Guest users
- History scoped by stable guest session ID (`store3d_guest_xxx` stored in localStorage)
- Survives F5/page refresh
- Different browsers get different guest IDs

### Authenticated users
- History scoped by user ID (`store3d_chat_{userId}`)
- User A never sees User B's history
- Login/logout transitions: `storageKeyRef` updates immediately, `chatId` recomputes via `useMemo`

### Streaming persistence
- Debounced save at 500ms during streaming (not every token)
- `beforeunload` handler flushes pending saves
- Cleanup on component unmount
- `onFinish` does immediate final save (overwrites debounced partial)
- `clearChat` cancels pending saves before clearing

### History size
- Client: MAX_MESSAGES = 18 (kept in localStorage)
- Server: max 20 messages validated by Zod schema
- Older messages trimmed from localStorage on save

## AI Token/Tool Optimization Rules (verified 2026-08-31)

All 10 rules verified in `aiChatService.ts`:
1. **Greeting** → direct response, no DB query
2. **Budget request** → parse budget, targeted product query
3. **No matching product** → fallback to nearest-price products
4. **General conversation** → no DB query
5. **Product-specific** → targeted query
6. **No guessing** → uses actual DB data
7. **Context minimization** → only selects name/slug/salePrice/originalPrice/images
8. **No double tool calls** → parseBudget in mutually exclusive branches
9. **Mock mode preserved** → `config.ai.provider === 'mock'`
10. **Security** → no secrets exposed

## Known Bugs / Issues

- **No critical bugs.** Application is stable.
- Hidden demo credentials in `client/README.md` — potential security concern if repo is public
- `store3d.vercel.app` custom domain points to wrong project (needs dashboard fix)

## Known Technical Debt

1. **No client-side tests.** Zero test files in `client/`. No vitest/jest configuration
2. **Limited server tests.** Only 3 unit tests (15 test cases total)
3. **No root README.md**
4. **CORS permissive in development** (`*` when `NODE_ENV !== 'production'`)
5. **No request logging** (no morgan)
6. **No API documentation** (no Swagger/OpenAPI)
7. **No CI/CD pipeline**
8. **No environment validation** beyond MONGODB_URI and JWT_SECRET
9. **TypeScript strict mode not enabled** in server
10. **No database migrations** (Mongoose schemaless)

## Database Seed Data

Demo accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@store3d.com | admin123 |
| Customer | khach@store3d.com | khach123 |
