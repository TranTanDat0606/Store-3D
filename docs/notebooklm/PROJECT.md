# Store3D — Project Overview

## Purpose

Store3D is a Vietnamese e-commerce platform for selling 3D-printed models (figurines, decorative items, architectural models, accessories). It provides a premium "digital showroom" experience with a futuristic aesthetic.

## Main Users

- **Customers (Khach):** Browse products, manage wishlist, place orders, pay via QR/bank transfer, leave reviews
- **Admins (Quan tri):** Manage products, categories, orders, coupons, reviews, users, news/blog, support tickets, view dashboard statistics

## Main Features

### Customer-facing
- Product browsing with search, filter by category, sort, pagination
- Product detail pages with image gallery, ratings, related products
- Shopping cart (persisted to localStorage)
- Checkout with shipping info and payment method selection
- QR code payment via VietQR (bank transfer with countdown timer)
- User account: profile, order history, wishlist, password change
- Review system (purchase-gated: must have completed order)
- News/blog section
- Contact form
- Dark/light theme toggle

### Admin
- Dashboard with KPI cards (revenue, orders, products, customers) and charts
- Product management (CRUD with image upload to Cloudinary)
- Category management
- Order management with status workflow (pending → confirmed → shipping → completed)
- Coupon management (percent/fixed, min order, expiry)
- Review moderation
- User management (role assignment, activate/deactivate)
- News/blog management
- Support ticket management

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.2.8 |
| Build | Vite | 8.2.0 |
| Language | TypeScript | 6.0.2 (client), 5.5.4 (server) |
| Styling | Tailwind CSS | 4.3.3 |
| UI Components | shadcn/ui (New York style) + Radix UI | Various |
| Animations | Framer Motion | 13.0.0 |
| Charts | Recharts | 3.10.1 |
| Forms | React Hook Form + Zod | 7.84.0 / 4.4.3 |
| HTTP Client | Axios | 1.19.0 |
| Routing | React Router DOM | 7.18.2 |
| Backend | Express | 4.19.2 |
| Database | MongoDB (Mongoose) | 8.5.1 |
| Auth | JWT (jsonwebtoken) | 9.0.2 |
| Password Hashing | bcryptjs | 2.4.3 |
| Image Upload | Cloudinary | 2.10.1 |
| Validation | Zod | 3.23.8 (server) |
| Linting | oxlint | 1.75.0 |
| Deployment | Vercel (client + API) + Render (server) | — |

## Important Constraints

- **Language:** All UI text is in Vietnamese. Route slugs are Vietnamese (`/san-pham`, `/lien-he`, `/tai-khoan`).
- **Payment:** QR bank transfer only (VietQR via img.vietqr.io CDN). No credit card integration.
- **Roles:** Two roles only — `admin` and `customer`. Last admin cannot be deleted or demoted.
- **Image storage:** Product images stored in Cloudinary. Placeholder SVGs generated locally.
- **Database:** MongoDB with Mongoose ODM. Schemaless but uses validation schemas.
- **No client-side tests.** Server has 3 unit tests only.
- **Cookie-based auth:** JWT stored in httpOnly cookies, not Authorization headers (primary method).

## Development Principles

- **Layered architecture:** Routes → Controllers → Services → Models
- **Validation at boundary:** Zod schemas validate all inputs at the route level
- **Standard response envelope:** `{ success, message, data, pagination, errors }`
- **Error handling:** Central errorHandler middleware, custom AppError class
- **Idempotent operations:** Seed script is idempotent (inserts only missing data)
- **Atomic stock management:** Order creation decrements stock atomically with rollback on failure
- **One-way status workflow:** Order statuses can only move forward (pending → confirmed → shipping → completed), with cancellation allowed at earlier stages
- **Vietnamese-aware slug generation:** Custom slugify handles diacritics and special characters (d/d)
