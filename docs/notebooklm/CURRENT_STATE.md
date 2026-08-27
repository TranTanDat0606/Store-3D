# Store3D — Current State

> Last updated: 2026-08-28

## Current Project Status

**Stable and working.** The application is a fully functional Vietnamese e-commerce store for 3D-printed models. Both client and server are deployed (Vercel for client + API, Render for server).

## Implemented Features

### Fully Implemented
- **Product catalog:** List, search, filter by category, sort, pagination, featured products, related products
- **Product detail:** Image gallery, ratings, material/printer type/size info, stock display, wishlist toggle, add to cart
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
- **News/blog:** Full CRUD (admin), public listing by category, slug-based detail pages
- **Contact form:** Submit, admin list/status/note management
- **Dark/light theme:** Toggle with localStorage persistence, smooth CSS transitions
- **Search with suggestions:** Horizontal scrollable product cards with images
- **Responsive design:** Mobile-first with drawer navigation, responsive grids
- **Image upload:** Cloudinary integration with 5MB limit, memory storage
- **Rate limiting:** Global (300/15min) and auth-specific (20/15min)
- **Error handling:** Central error handler, Vietnamese error messages
- **Database seeding:** Idempotent seed script with sample data

### Partially Implemented
- **Email/SMTP:** Config exists in env vars but no email sending code is implemented (contact form saves to DB only)
- **Payment webhook:** Endpoint exists but relies on external webhook configuration

## Completed Major Work

| Date | Work |
|------|------|
| 2026-08-07 | Initial Store3D design and project setup |
| 2026-08-08 | Product image upload (Cloudinary), Unsplash product images |
| 2026-08-10 | Admin UI redesign |
| 2026-08-12 | Storefront premium redesign, UI/UX improvements |
| 2026-08-14 | Admin categories/products page redesign, QR payment, search suggestions |
| 2026-08-26 | News/blog backend implementation |
| 2026-08-28 | Vercel deployment fixes, Cloudinary integration, various bug fixes |

## Known Bugs / Issues

- **No critical bugs reported.** Application is stable.
- Hidden demo credentials in `client/README.md` (admin@store3d.com / admin123) — potential security concern if repository is public.

## Known Technical Debt

1. **No client-side tests.** Zero test files in `client/`. No vitest/jest configuration.
2. **Limited server tests.** Only 3 unit tests (VietQR, payment, order status). No integration tests, no API endpoint tests.
3. **No root README.md.** Only `client/README.md` (Vite template) and `server/README.md`.
4. **CORS permissive in development.** Allows all origins (`*`) when `NODE_ENV !== 'production'`.
5. **No request logging.** No morgan or similar request logger.
6. **No API documentation.** No Swagger/OpenAPI spec.
7. **No CI/CD pipeline.** No GitHub Actions or similar.
8. **No environment validation beyond MONGODB_URI and JWT_SECRET.** Other env vars are used with defaults.
9. **TypeScript strict mode not enabled** in server (`strict` not in tsconfig).
10. **No database migrations.** Mongoose is schemaless, but index changes are not tracked.

## Important Unfinished Work

- **Email notifications.** SMTP config exists but no email sending is implemented. Contact form saves to DB but doesn't send emails.
- **Payment webhook.** The `/api/payment/webhook` endpoint exists but requires external webhook configuration from a payment provider.
- **SEO optimization.** `sitemap.xml` and `robots.txt` exist in `client/public/` but are static files, not dynamically generated.
- **Image optimization.** Product images are uploaded as-is to Cloudinary. No automatic resizing or WebP conversion beyond Cloudinary defaults.
- **Admin news/blog.** Backend is complete but admin UI for news management may need refinement.

## Database Seed Data

The seed script creates:
- 2 users (admin + customer)
- 6 categories
- 12 products (with Unsplash images)
- 2 coupons
- Sample wishlist and reviews
- 6 news articles

Demo accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@store3d.com | admin123 |
| Customer | khach@store3d.com | khach123 |
