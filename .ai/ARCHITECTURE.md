# Store3D — Architecture

## Client Architecture

### Framework
React 19 + TypeScript + Vite 8. Single Page Application with lazy-loaded routes.

### Component Structure
```
client/src/
├── components/
│   ├── ui/            # 20 shadcn/ui primitives (button, card, dialog, form, input, table, tabs, etc.)
│   ├── layout/        # navbar.tsx, footer.tsx
│   ├── common/        # breadcrumb, empty-state, error-state, pagination
│   ├── product/       # product-card, product-card-skeleton
│   ├── cart/          # cart-drawer
│   ├── auth/          # login-prompt-dialog
│   ├── admin/         # image-upload
│   ├── home/          # hot-sale-section
│   ├── order/         # order-status-badge
│   └── review/        # review-action
├── contexts/          # AuthContext, CartContext, WishlistContext, ThemeContext
├── hooks/             # useDebounce, useLocalStorage, useReviewEligibility
├── layouts/           # main-layout, account-layout, admin-layout
├── pages/             # All page components (lazy-loaded)
├── routes/            # guards.tsx (ProtectedRoute, AdminRoute, GuestOnlyRoute)
├── utils/             # cn() class utility, api client, helpers
├── App.tsx            # Root component with providers and route definitions
├── main.tsx           # Entry point with ThemeProvider and BrowserRouter
└── index.css          # Tailwind CSS with design tokens (oklch colors)
```

### Routing
React Router DOM v7. All routes defined in `App.tsx`. Pages lazy-loaded with `React.lazy()`.

**Route groups:**
- Public: `/`, `/san-pham`, `/san-pham/:slug`, `/lien-he`, `/tin-tuc`, `/tin-tuc/:slug`
- Guest-only: `/dang-nhap`, `/dang-ky`
- Protected: `/thanh-toan`, `/thanh-toan-thanh-cong/:id`, `/thanh-toan-qr/:id`, `/danh-gia/:slug`, `/tai-khoan/*`
- Admin: `/admin/*` (requires admin role)

**Route guards:**
- `ProtectedRoute` — requires authenticated user
- `AdminRoute` — requires authenticated user with `role === 'admin'`
- `GuestOnlyRoute` — redirects authenticated users away

### State Management
React Context + useReducer (no Redux/Zustand).

| Context | State Mechanism | Persistence |
|---------|----------------|-------------|
| AuthProvider | useReducer (AUTH_START, AUTH_SUCCESS, AUTH_LOGOUT, AUTH_ERROR) | JWT httpOnly cookie |
| CartProvider | useReducer (ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY, CLEAR) | localStorage |
| WishlistProvider | useState + API calls | Server-side (MongoDB) |
| ThemeProvider | useState + localStorage | localStorage, toggles `.dark` class |

Provider nesting: StrictMode → ThemeProvider → BrowserRouter → AuthProvider → CartProvider → WishlistProvider → Suspense → Routes

### HTTP Client
Axios with `withCredentials: true` for cookie-based auth. Base URL from `VITE_API_URL` env var.

---

## Server Architecture

### Framework
Express 4 + TypeScript. Layered architecture: Routes → Controllers → Services → Models.

### Directory Structure
```
server/src/
├── config/            # index.ts (env vars), cors.ts, rateLimit.ts, cloudinary.ts
├── controllers/       # 11 controller files (thin, delegate to services)
├── database/          # connect.ts (Mongoose connection)
├── middleware/        # auth.ts, validate.ts, errorHandler.ts, notFound.ts
├── models/            # 10 Mongoose models + barrel export
├── routes/            # 13 route files (mount under /api/)
├── services/          # 16 service files (business logic)
├── utils/             # AppError, apiResponse, apiFeatures, asyncHandler, slugify, token, etc.
├── validators/        # 8 Zod schema files
├── app.ts             # Express app setup (middleware, routes, error handlers)
├── server.ts          # Server entry (listen on PORT)
└── vercel-connect.ts  # Vercel serverless connection wrapper
```

### Request Flow
```
Request → Express Router → Validate (Zod) → Controller → Service → Model (Mongoose) → MongoDB
                              ↓
                         errorHandler → Standard error response
```

### Key Patterns
- **asyncHandler:** Wraps async route handlers to catch rejected promises
- **validate:** Zod schema validation middleware (req.body, req.query, req.params)
- **successResponse / errorResponse:** Standard envelope `{ success, message, data, pagination, errors }`
- **apiFeatures:** Generic search, filter, sort, pagination for Mongoose queries
- **AppError:** Custom error class with statusCode and isOperational flag

---

## Database Architecture

### MongoDB (via Mongoose 8.5.1)

**Collections and Models:**

| Model | Collection | Key Fields |
|-------|-----------|------------|
| User | users | fullname, email (unique), password (bcrypt, select:false), phone, avatar, role (admin/customer), address, active |
| Product | products | name, slug (unique), description, images[], category (ref), material, printerType, size, stock, originalPrice, salePrice, rating, reviewCount, status, featured |
| Category | categories | name, slug (unique), image, description |
| Order | orders | user (ref), items[] (ref OrderItem), customer {name, phone, email, address}, subtotal, discount, shipping, total, coupon, payment {method, status, orderCode, qrExpiresAt}, status |
| OrderItem | orderitems | order (ref), product (ref), name, image, price, quantity |
| Wishlist | wishlists | user (ref, unique), products[] (ref) |
| Review | reviews | user (ref), product (ref), order (ref), rating (1-5), comment, images[]. Unique index on (user, product). |
| Coupon | coupons | code (unique, uppercase), discount, type (percent/fixed), expiredDate, quantity, usedCount, minOrder |
| News | news | title, slug (unique), excerpt, content, thumbnail, category, author, status (draft/published), publishedAt |
| ContactRequest | contactrequests | userId (optional ref), fullname, email, phone, subject, message, status (new/in_progress/resolved/rejected), adminNote |

**Indexes:**
- Product: text index on name + description
- Review: unique compound index on (user, product)
- User: unique index on email
- Slug fields: unique indexes on Product.slug, Category.slug, News.slug

---

## API Architecture

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://<vercel-domain>/api`

### Route Map

| Route | Methods | Auth | Description |
|-------|---------|------|-------------|
| `/api/auth/register` | POST | Public | Register new user |
| `/api/auth/login` | POST | Public | Login |
| `/api/auth/logout` | POST | Auth | Logout |
| `/api/auth/me` | GET | Auth | Get current user profile |
| `/api/auth/profile` | PUT | Auth | Update profile |
| `/api/auth/password` | PUT | Auth | Change password |
| `/api/products` | GET | Public | List/search/filter products |
| `/api/products/featured` | GET | Public | Featured products |
| `/api/products/related/:slug` | GET | Public | Related products |
| `/api/products/:slug` | GET | Public | Product by slug |
| `/api/products` | POST | Admin | Create product |
| `/api/products/:id` | PUT | Admin | Update product |
| `/api/products/:id` | DELETE | Admin | Delete product |
| `/api/categories` | GET | Public | List all categories |
| `/api/categories/:slug` | GET | Public | Category by slug |
| `/api/categories` | POST | Admin | Create category |
| `/api/categories/:id` | PUT | Admin | Update category |
| `/api/categories/:id` | DELETE | Admin | Delete category |
| `/api/orders` | POST | Auth | Create order |
| `/api/orders/mine` | GET | Auth | My orders |
| `/api/orders/:id` | GET | Auth | Order by ID |
| `/api/orders/:id/cancel` | Auth | Cancel order |
| `/api/orders/admin` | GET | Admin | Admin list orders |
| `/api/orders/admin/:id/status` | PUT | Admin | Update order status |
| `/api/orders/:id/payment-qr` | GET | Auth | Generate VietQR |
| `/api/payment/webhook` | POST | Public | Payment webhook |
| `/api/wishlist` | GET | Auth | Get wishlist |
| `/api/wishlist` | POST | Auth | Add to wishlist |
| `/api/wishlist/:productId` | DELETE | Auth | Remove from wishlist |
| `/api/wishlist/:productId/move-to-cart` | POST | Auth | Move to cart |
| `/api/coupons` | GET | Admin | List coupons |
| `/api/coupons/available` | GET | Auth | Available coupons |
| `/api/coupons` | POST | Admin | Create coupon |
| `/api/coupons/:id` | PUT | Admin | Update coupon |
| `/api/coupons/:id` | DELETE | Admin | Delete coupon |
| `/api/coupons/apply` | POST | Auth | Apply coupon to order |
| `/api/reviews/product/:productId` | GET | Public | Reviews by product |
| `/api/reviews/my-eligibility/:productId` | GET | Auth | Check review eligibility |
| `/api/reviews` | POST | Auth | Create review |
| `/api/reviews/:id` | PUT | Auth | Update own review |
| `/api/reviews/:id` | DELETE | Auth | Delete own review |
| `/api/reviews/admin` | GET | Admin | Admin list reviews |
| `/api/reviews/admin/:id` | DELETE | Admin | Admin delete review |
| `/api/users` | GET | Admin | List users |
| `/api/users/:id` | GET | Admin | Get user by ID |
| `/api/users/:id/role` | PUT | Admin | Update user role |
| `/api/users/:id/toggle-active` | PUT | Admin | Toggle active status |
| `/api/users/:id` | DELETE | Admin | Delete user |
| `/api/admin/stats/overview` | GET | Admin | Dashboard overview |
| `/api/admin/stats/revenue-by-day` | GET | Admin | Revenue chart (30 days) |
| `/api/admin/stats/revenue-period` | GET | Admin | Revenue by period |
| `/api/admin/stats/best-selling` | GET | Admin | Best-selling products |
| `/api/admin/stats/orders-by-status` | GET | Admin | Orders by status |
| `/api/upload` | POST | Admin | Upload image to Cloudinary |
| `/api/contact` | POST | Public | Submit contact form |
| `/api/contact/admin` | GET | Admin | Admin list contacts |
| `/api/contact/admin/:id` | GET | Admin | Admin get contact |
| `/api/contact/admin/:id/status` | PUT | Admin | Update contact status |
| `/api/contact/admin/:id/note` | PUT | Admin | Add admin note |
| `/api/contact/admin/count-new` | GET | Admin | Count new contacts |
| `/api/news` | GET | Public | List published news |
| `/api/news/categories` | GET | Public | News categories |
| `/api/news/:slug` | GET | Public | News by slug |
| `/api/news/admin` | GET | Admin | Admin list news |
| `/api/news/admin/:id` | GET | Admin | Admin get news |
| `/api/news` | POST | Admin | Create news |
| `/api/news/:id` | PUT | Admin | Update news |
| `/api/news/:id` | DELETE | Admin | Delete news |

### Rate Limiting
- Global: 300 requests per 15 minutes
- Auth routes: 20 requests per 15 minutes

---

## Authentication/Authorization

### JWT Flow
1. User logs in → server verifies credentials → signs JWT with `{ sub: userId, role }` → sets httpOnly cookie named `token`
2. Subsequent requests → `requireAuth` middleware reads cookie (or `Authorization: Bearer` header) → verifies JWT → looks up user → attaches `{ _id, role }` to `req.user`
3. Admin routes → `requireAdmin` middleware checks `req.user.role === 'admin'`

### Token Settings
- Secret: `JWT_SECRET` env var
- Expiry: `JWT_EXPIRES_IN` (default 7 days)
- Cookie: httpOnly, secure (production), sameSite: lax, maxAge: 7 days

### Password
- bcrypt hashing with pre-save hook
- Password field excluded from queries by default (`select: false`)
- `comparePassword()` method on User model

---

## Deployment Architecture

### Vercel (Client + Serverless API)
- Client SPA built with Vite, served from `client/dist`
- API: `/api/:path*` rewrites to `/api/server` serverless function
- `api/server.ts` wraps Express app for Vercel serverless

### Render (Express Server)
- Node.js service on free tier
- Build: `npm install && npm run build`
- Start: `node dist/server.js`
- Health check: `/api/health`

### Environment Variables
**Required:**
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret

**Optional (with defaults):**
- `PORT` (5000), `CLIENT_URL` (http://localhost:5173)
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `BANK_BIN`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_NAME`, `BANK_ACCOUNT_DISPLAY_NAME`
- `QR_TTL_MINUTES` (5), `PAYMENT_WEBHOOK_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SUPPORT_EMAIL`
