# Reference Example — Store3D Project Overview & Technical Architecture

> **Reference Example** for PPT Master workflow.
> Demonstrates how to create a Coursework + Showcase hybrid deck following `docs/ppt/PPT_MASTER.md`.
> Deck type: Coursework + Showcase hybrid (16 slides)
> Source: `.ai/CANONICAL_CONTEXT.md` ONLY
> Language: Vietnamese

---

## Slide 1: Cover

- **Purpose:** Introduce the project
- **Key message:** Store3D là nền tảng thương mại điện tử mô hình in 3D
- **Visual type:** Title
- **Content density:** Low

### Content
- Store3D — Nền tảng thương mại điện tử mô hình in 3D
- Trải nghiệm "digital showroom" cao cấp
- TBD / CẦN DỮ LIỆU: Tên sinh viên, mã số, giảng viên, khóa học

### Evidence
- CANONICAL_CONTEXT.md §2 OBJECTIVE: "Store3D is a Vietnamese e-commerce platform for selling 3D-printed models"

---

## Slide 2: Problem Context

- **Purpose:** Explain why this project exists
- **Key message:** Thị trường mô hình in 3D Việt Nam cần nền tảng chuyên biệt
- **Visual type:** Content
- **Content density:** Medium

### Content
- Store3D bán mô hình in 3D: figurine, đồ trang trí, mô hình kiến trúc, phụ kiện
- Trải nghiệm "digital showroom" — premium, futuristic, cyber-premium aesthetic
- Khách hàng cần: duyệt, đặt hàng, thanh toán QR, đánh giá
- Admin cần: quản lý sản phẩm, đơn hàng, mã giảm giá, khách hàng, đánh giá, tin tức

### Evidence
- CANONICAL_CONTEXT.md §2 OBJECTIVE
- CANONICAL_CONTEXT.md §3 REQUIREMENTS (Functional)

---

## Slide 3: Target Users

- **Purpose:** Define who uses the system
- **Key message:** Hai loại người dùng chính: Khách hàng và Admin
- **Visual type:** Comparison
- **Content density:** Medium

### Content
**Khách hàng:**
- Duyệt sản phẩm, tìm kiếm, lọc danh mục, sắp xếp
- Xem chi tiết sản phẩm với gallery ảnh
- Thêm vào giỏ hàng, thanh toán (COD / chuyển khoản)
- Thanh toán QR VietQR
- Đánh giá sản phẩm (yêu cầu đã mua hàng)
- Quản lý tài khoản, danh sách yêu thích

**Admin:**
- Dashboard với KPI và biểu đồ (Recharts)
- CRUD sản phẩm, danh mục, mã giảm giá, đơn hàng, khách hàng, đánh giá, tin tức
- Quản lý liên hệ

### Evidence
- CANONICAL_CONTEXT.md §3 REQUIREMENTS (Functional)

---

## Slide 4: Solution Overview

- **Purpose:** Present the product vision
- **Key message:** Store3D giải quyết bằng nền tảng web hoàn chỉnh
- **Visual type:** Content
- **Content density:** Medium

### Content
- Nền tảng web hoàn chỉnh cho thương mại điện tử mô hình in 3D
- Trải nghiệm "digital showroom" — dark luxurious backgrounds, glassmorphism, cyan/blue glow
- Responsive: desktop + mobile
- Dark/light theme với localStorage persistence
- Tất cả UI text bằng tiếng Việt

### Evidence
- CANONICAL_CONTEXT.md §2 OBJECTIVE
- CANONICAL_CONTEXT.md §6 DESIGN DIRECTION

---

## Slide 5: Architecture

- **Purpose:** Show system design
- **Key message:** Monorepo với separation rõ ràng giữa frontend và backend
- **Visual type:** Diagram
- **Content density:** Low

### Content
```text
store3D/
├── client/          React SPA (Vite)
│   ├── components/  20 shadcn/ui primitives
│   ├── contexts/    Auth, Cart, Wishlist, Theme
│   ├── hooks/       useDebounce, useLocalStorage, useReviewEligibility
│   ├── layouts/     main-layout, account-layout, admin-layout
│   ├── pages/       All page components (lazy-loaded)
│   └── utils/       cn(), apiClient, resolveImageUrl
├── server/          Express API
│   ├── controllers/ 11 controllers (thin)
│   ├── models/      10 Mongoose models
│   ├── routes/      13 route files
│   ├── services/    16 service files (business logic)
│   └── validators/  8 Zod schema files
└── .ai/             AI context documentation
```

### Evidence
- CANONICAL_CONTEXT.md §7 INFORMATION ARCHITECTURE

---

## Slide 6: Tech Stack

- **Purpose:** Show technology choices
- **Key message:** Stack hiện đại với React 19 + Vite 8 + Express + MongoDB
- **Visual type:** Content
- **Content density:** High

### Content
| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.2.8 |
| Build | Vite | 8.2.0 |
| Language | TypeScript | 6.0.2 (client), 5.5.4 (server) |
| Styling | Tailwind CSS | 4.3.3 |
| UI | shadcn/ui (New York) + Radix UI | Various |
| Animations | Framer Motion | 13.0.0 |
| Forms | React Hook Form + Zod | 7.84.0 / 4.4.3 |
| Backend | Express | 4.19.2 |
| Database | MongoDB (Mongoose) | 8.5.1 |
| Auth | JWT (jsonwebtoken) | 9.0.2 |
| Deployment | Vercel + Render | — |

### Evidence
- CANONICAL_CONTEXT.md §8 TECHNICAL CONTEXT

---

## Slide 7: Data Model

- **Purpose:** Show database design
- **Key message:** 10 Mongoose models phục vụ toàn bộ business logic
- **Visual type:** Diagram
- **Content density:** Medium

### Content
| Model | Mô tả |
|-------|-------|
| User | fullname, email, password (bcrypt), phone, avatar, role (admin/customer) |
| Product | name, slug, description, images[], category, material, printerType, stock, prices |
| Category | name, slug, image, description |
| Order | user, items[], customer, subtotal, discount, total, coupon, payment, status |
| Review | user, product, order, rating (1-5), comment, images[] |
| Coupon | code, discount, type (percent/fixed), expiredDate, minOrder |
| News | title, slug, excerpt, content, thumbnail, category, author |
| Wishlist | user, products[] |
| ContactRequest | fullname, email, phone, subject, message, status |

### Evidence
- CANONICAL_CONTEXT.md §8 TECHNICAL CONTEXT (Database Models)

---

## Slide 8: Key Feature — Product Browsing

- **Purpose:** Showcase product experience
- **Key message:** Trải nghiệm sản phẩm immersive với gallery-first layout
- **Visual type:** Screenshot
- **Content density:** Medium

### Content
- Product listing: danh sách, tìm kiếm (case-insensitive), lọc danh mục, sắp xếp, phân trang
- Product detail: gallery ảnh immersive với lightbox, sticky purchase panel (desktop), fixed bottom bar (mobile)
- Tabbed content: Mô tả / Thông số / Đánh giá
- Rating summary với bar chart, review cards
- Search suggestions: horizontal scrollable product cards từ 1 ký tự

### Evidence
- CANONICAL_CONTEXT.md §3 REQUIREMENTS (Product browsing, Product detail, Search suggestions)

---

## Slide 9: Key Feature — Shopping & Payment

- **Purpose:** Showcase checkout experience
- **Key message:** Thanh toán đa dạng với QR VietQR
- **Visual type:** Content
- **Content density:** Medium

### Content
- Shopping cart: thêm/xóa/số lượng, persisted to localStorage, cart drawer UI
- Checkout: thông tin giao hàng, phương thức thanh toán (COD / chuyển khoản), mã giảm giá
- QR payment: VietQR code generation, countdown timer, polling status mỗi 3 giây
- Order management: atomic stock decrement with rollback, one-way status workflow
- Trạng thái đơn hàng: pending → confirmed → shipping → completed

### Evidence
- CANONICAL_CONTEXT.md §3 REQUIREMENTS (Shopping cart, Checkout, QR payment, Order management)

---

## Slide 10: Key Feature — User System

- **Purpose:** Showcase auth and user features
- **Key message:** Hệ thống người dùng hoàn chỉnh với auth, wishlist, đánh giá
- **Visual type:** Content
- **Content density:** Medium

### Content
- Auth: đăng ký, đăng nhập, đăng xuất, hồ sơ, đổi mật khẩu (JWT httpOnly cookies)
- Wishlist: thêm/xóa, chuyển vào giỏ hàng, server-side persistence
- Reviews: purchase-gated (yêu cầu đơn hàng hoàn thành), CRUD, rating aggregation
- Dark/light theme: toggle với localStorage persistence

### Evidence
- CANONICAL_CONTEXT.md §3 REQUIREMENTS (User auth, Wishlist, Reviews, Dark/light theme)

---

## Slide 11: Key Feature — Admin Panel

- **Purpose:** Showcase admin capabilities
- **Key message:** Admin panel đầy đủ chức năng quản lý
- **Visual type:** Screenshot
- **Content density:** Medium

### Content
- Dashboard: KPI cards (doanh thu, đơn hàng, sản phẩm, khách hàng) + biểu đồ Recharts
- Products: CRUD với Cloudinary image upload, stock management
- Categories: CRUD với product count
- Orders: list với status filter, status workflow
- Coupons: CRUD (percent/fixed), min order, expiry, usage tracking
- Reviews: list, delete
- Users: list, role update, activate/deactivate, delete (protects last admin)
- News/blog: CRUD
- Contact: list, status, adminNote

### Evidence
- CANONICAL_CONTEXT.md §3 REQUIREMENTS (Admin)

---

## Slide 12: Architecture Decisions

- **Purpose:** Explain key technical decisions
- **Key message:** 16 quyết định architecture đã được xác nhận
- **Visual type:** Content
- **Content density:** High

### Content
| # | Quyết định | Lý do |
|---|-----------|-------|
| D1 | Monorepo client/server separation | Boundary rõ ràng |
| D2 | Cookie-based JWT auth | XSS protection |
| D3 | Zod validation cả client và server | Type-safe validation |
| D4 | Standard response envelope | API contract nhất quán |
| D5 | Atomic stock decrement + rollback | Prevent overselling |
| D6 | One-way order status workflow | Financial data integrity |
| D7 | Polling (3s) thay vì WebSocket | Simpler infrastructure, lower cost |
| D8 | usePurchasePanel hook called once | Prevent state duplication |
| D9 | CSS visibility cho responsive | Simpler code, no hydration mismatch |
| D16 | No 3D rendering (images only) | Performance, simplicity, cost |

### Evidence
- CANONICAL_CONTEXT.md §12 DECISIONS (D1-D10, D16)

---

## Slide 13: Verification

- **Purpose:** Show quality assurance
- **Key message:** Verification pipeline đảm bảo chất lượng
- **Visual type:** Content
- **Content density:** Medium

### Content
- Build: `npm run build` client + server
- TypeScript: `npx tsc --noEmit` — 0 errors
- Lint: oxlint — 0 errors
- Browser: Playwright visual QA khi available
- Responsive: desktop + mobile verified
- Dark/light mode: both work
- Acceptance criteria: CANONICAL_CONTEXT.md §9

### Evidence
- CANONICAL_CONTEXT.md §10 VERIFICATION
- CANONICAL_CONTEXT.md §9 ACCEPTANCE CRITERIA

---

## Slide 14: Deployment

- **Purpose:** Show deployment strategy
- **Key message:** Deploy lên Vercel + Render
- **Visual type:** Diagram
- **Content density:** Low

### Content
```text
Vercel:
├── Client SPA from client/dist
└── API rewrites to /api/server (serverless function)

Render:
├── Node.js free tier
├── Build: npm install && npm run build
└── Start: node dist/server.js

Required env: MONGODB_URI, JWT_SECRET
```

### Evidence
- CANONICAL_CONTEXT.md §8 TECHNICAL CONTEXT (Deployment)

---

## Slide 15: Conclusion

- **Purpose:** Summarize and look ahead
- **Key message:** Store3D hoàn chỉnh và đang deploy production
- **Visual type:** Content
- **Content density:** Medium

### Content
**Hoàn thành:**
- Nền tảng TMĐT mô hình in 3D hoàn chỉnh
- Responsive, dark/light theme, Vietnamese UI
- Deploy production (Vercel + Render)

**Tiếp theo (Open Questions):**
- SMTP email notifications (Q1)
- Payment webhook integration (Q2)
- Dynamic sitemap/robots.txt (Q3)
- Image optimization (Q4)
- CI/CD pipeline (Q10)

### Evidence
- CANONICAL_CONTEXT.md §2 OBJECTIVE (Status)
- CANONICAL_CONTEXT.md §13 OPEN QUESTIONS (Q1-Q4, Q10)

---

## Slide 16: Q&A

- **Purpose:** Open for questions
- **Key message:** Cảm ơn và sẵn sàng trả lời câu hỏi
- **Visual type:** Title
- **Content density:** Low

### Content
- Cảm ơn sự lắng nghe
- Store3D — Nền tảng thương mại điện tử mô hình in 3D
- TBD / CẦN DỮ LIỆU: Liên hệ

### Evidence
- CANONICAL_CONTEXT.md §2 OBJECTIVE

---

## Visual QA Checklist

### Content QA
- [x] No unsupported claims — all from CANONICAL_CONTEXT.md
- [x] No invented metrics — TBD marked where data missing
- [x] No missing critical sections — 16 slides cover all major areas
- [x] No contradictory information
- [x] Vietnamese text preserved
- [x] Technical terminology accurate
- [x] Evidence/sources cited on every slide

### Visual QA (for Gamma)
- [ ] Be Vietnam Pro font
- [ ] Ocean Blue (#3b6ee8) primary color
- [ ] 10px radius, rounded-2xl for cards
- [ ] Max 5 bullets per slide
- [ ] Max 20 words per bullet
- [ ] One key message per slide

### Technical QA (after Gamma export)
- [ ] PPTX opens correctly
- [ ] 16 slides (within 12-20 range)
- [ ] Images render correctly
- [ ] Fonts render correctly
- [ ] File size reasonable (< 50MB)
