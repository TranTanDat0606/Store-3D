# Store 3D — Design Spec

> E-commerce website for selling 3D printed models. Full-stack, production-ready.

## Decisions (confirmed with client)

- **MongoDB:** Local Community Edition, connection string `mongodb://127.0.0.1:27017/store3d`. DB auto-created on first connect.
- **UI language:** Vietnamese.
- **Images:** Stored inside MongoDB as Base64 data-URIs. No Cloudinary, no filesystem uploads, no local uploads.
  - `Product.images: string[]` (array to support gallery + multi-image upload)
  - `Review.images: string[]`
  - Frontend renders directly with `<img src={product.images[0]} />`.
- **Repo layout:** Monorepo with `client/` (React + TS + Vite) and `server/` (Express + TS + Mongoose).

## Tech Stack

**Frontend:** React, TypeScript, Vite, TailwindCSS, React Router DOM, Axios, React Hook Form, Zod, Context API + useReducer (no Redux), shadcn/ui, Radix UI, Lucide React, Framer Motion, Sonner.

**Backend:** Node, Express, TypeScript, MongoDB + Mongoose, JWT, bcrypt, dotenv, cors, helmet, express-rate-limit.

## Architecture

- REST API. Standard response envelope:
  ```json
  { "success": true, "message": "...", "data": {}, "pagination": {}, "errors": [] }
  ```
- Frontend talks to API only through Axios service modules. No mock data.
- JWT stored in httpOnly cookie; bcrypt password hashing; role-based admin guard.
- Lazy-loaded routes, skeletons, empty/error states, dark mode via shadcn.

## Server Structure

```
server/src/
  config/       env, cors, rate-limit
  database/     mongoose connection
  middleware/   auth, admin, errorHandler, notFound, validate
  models/       User, Category, Product, Order, OrderItem, Wishlist, Review, Coupon
  controllers/  auth, category, product, order, wishlist, review, coupon, user, stats
  routes/       mirrors controllers
  services/     business logic (auth, order, stats, seed)
  validators/   zod schemas per route
  utils/        AppError, asyncHandler, token, apiFeatures, seedData
  server.ts / app.ts
```

## Client Structure

```
client/src/
  assets/
  components/{ui, common, layout, product, cart}
  contexts/    AuthContext, CartContext, ThemeContext, WishlistContext
  hooks/
  layouts/     MainLayout, AdminLayout
  pages/       customer + admin (lazy loaded)
  routes/      ProtectedRoute, AdminRoute
  services/    axios + API modules
  types/  utils/  constants/
```

## Database Collections

Users, Categories, Products, Orders, OrderItems, Wishlist, Reviews, Coupons — schemas per the project brief (fields for User, Category, Product, Order statuses, Coupon fields).

## API Surface

- Auth: register, login, me, logout
- Categories: full CRUD
- Products: full CRUD, search/filter/sort/pagination, `GET /:slug`, featured, related
- Wishlist: add/remove/move-to-cart
- Coupons: admin CRUD, apply (validate against order)
- Orders: customer create/list/detail; admin all/status/search/filter
- Reviews: rate + review + upload images
- Users: admin management
- Stats: revenue/orders/products/customers + charts (revenue, orders, best sellers)

## Standards

- TypeScript strict mode, SOLID/DRY/KISS, clean code
- Zod validation on both client and server
- Security: JWT, bcrypt, Helmet, rate limiting, env vars, CORS
- Performance: lazy loading, code splitting, memoization, pagination, debounce search

## Phases

1. Requirement Analysis, Architecture, Folder Structure ✅ (approved)
2. MongoDB Schema, Backend Setup
3. Authentication
4. Products API
5. Categories API
6. Orders API
7. Frontend Layout
8. Customer Features
9. Admin Dashboard
10. Testing
11. Performance Optimization
12. Deployment

Stop after each phase and wait for approval.
