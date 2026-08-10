# Store3D Admin UI — Design Spec

> Dark, tech-blue, glassmorphism admin for the 3D-printed model store. Admin-scoped only; storefront untouched.

## Decisions (confirmed with client)

- **Scope:** 4 core screens only — Dashboard, Product grid, Product detail & editor, Orders. The other admin sections (Danh mục, Mã giảm giá, Đánh giá, Khách hàng) stay functional as-is.
- **No three.js.** "3D preview" = rich visual previews using the existing product images (hover zoom, quick-view modal, gallery).
- **Charts:** install `recharts`.
- **Theme:** Dark + tech-blue accent, glassy cards, applied only inside `/admin` (class on AdminLayout wrapper). Storefront stays light.
- **Editor:** dedicated route `/admin/san-pham/:id` (and `:id = new` for create). Replaces the current modal editor.
- **No schema/API changes.** Moderation badge derived from existing `Product.status` (`active|inactive|out-of-stock`). Image gallery management (reorder/remove/add) reuses existing `ImageUpload` + `uploadApi`.
- **Traffic stats skipped** — no tracking data exists. Dashboard uses real data only.

## Data sources (existing, no new backend)

| Screen | Data | API |
|---|---|---|
| Dashboard stats cards | overview | `statsApi.overview()` |
| Revenue area chart (30d) | revenue by day | `statsApi.revenue(30)` |
| Order-status donut | orders by status | `statsApi.ordersByStatus()` |
| Best sellers | top 5 by sold | `statsApi.bestSelling(5)` |
| Recent orders | latest 5 | `orderApi.adminList({ limit: 5 })` |
| Product grid | search + paginate | `productApi.list({ page, limit, search })` |
| Editor save/create/delete | — | `productApi.update/create/remove`, `categoryApi.all()` |
| Orders | search/status + update | `orderApi.adminList(...)`, `orderApi.adminUpdateStatus(...)` |

## Theme tokens

- Admin root: `dark` class scoped to admin wrapper div.
- Panels: `bg-slate-900/60 backdrop-blur border border-white/10 rounded-2xl`.
- Accent gradient: `from-cyan-400 to-blue-500`; primary button + active nav use it.
- Glow: radial cyan/blue glow behind page content (absolutely-positioned blurred divs).
- Text: `text-slate-100` headings, `text-slate-400` muted.
- Fonts/size scale follow existing shadcn tokens.

## Layout (`client/src/layouts/admin-layout.tsx`)

- Full dark wrapper `<div class="min-h-screen dark bg-slate-950 text-slate-100">`.
- **Glass sidebar** (desktop `lg:`): fixed-width 60px icon rail with expandable labels; icons from lucide; active item = gradient pill.
- **Glass topbar:** brand + page breadcrumb/title left; "Về trang chủ" + admin name/avatar right.
- **Mobile:** horizontal scrollable pill nav (existing pattern, restyled dark).
- Entrance animation via framer-motion (fade + slight y on route content).

## Screen 1 — Dashboard (`/admin`)

- Header: "Tổng quan" + date/subtitle.
- 4 stat cards: Doanh thu (emerald), Đơn hàng (cyan), Sản phẩm (violet), Khách hàng (amber) — glass card, gradient icon tile, value + label.
- Revenue chart card: recharts `AreaChart` (30-day revenue, gradient fill, dark grid).
- Orders-by-status card: recharts `PieChart` donut with center total + status legend.
- Bottom grid: Best sellers (ranked list w/ image, sold count, revenue) + Recent orders (code, customer, date, total, status badge). Links to product/orders screens.
- Skeleton loading states.

## Screen 2 — Product grid (`/admin/san-pham`)

- Header + count + "Thêm sản phẩm" button (→ `/admin/san-pham/new`).
- Search input (debounced, existing pattern).
- Card grid (responsive `sm:2 lg:3 xl:4`): image with hover zoom + overlay quick-view (eye) button → modal w/ large image; name, category, material, price; **moderation badge** from `status` (Đang bán=emerald / Ẩn=slate / Hết hàng=amber); edit (→ route) + delete (confirm AlertDialog) actions.
- Pagination (existing `Pagination` component).
- Empty state.

## Screen 3 — Product detail & editor (`/admin/san-pham/:id`)

- Two-column layout. Left: large preview image + gallery thumbnails (click to swap), hover zoom. Right: form fields.
- Fields (extracted from current dialog): name, category select, images (gallery manager: reorder/remove/add via `ImageUpload`), description, material, printerType, size, originalPrice, salePrice, stock, status select, featured switch.
- `:id = new` → empty form; save = create. Otherwise save = update. Delete button + confirm.
- Validation + errors + sonner toasts (existing patterns). Save → navigate back to grid.
- Back button to grid.

## Screen 4 — Orders (`/admin/don-hang`)

- Header + count.
- Search input + status filter Select (existing options).
- Glass list/cards: order code, customer, date, item count, total, payment method + status badge, order status badge; click expands detail (customer info, items w/ thumbnails, totals, discount) + status updater Select + "mark paid" button (existing logic, restyled).
- Pagination + empty state.

## Routing (`App.tsx`)

- Add `path="san-pham/:id"` under the admin layout → lazy `AdminProductEditPage`.
- Keep existing admin routes; no other changes.

## Conventions

- Files in `client/src/pages/admin/`. Reuse shadcn/ui components, `cn`, `formatCurrency`, `formatDateTime`, `OrderStatusBadge`, `PaymentStatusBadge`, `ImageUpload`, `Pagination`.
- framer-motion for subtle panel/route entrance.
- No comments in code. Keep TypeScript strict clean.
