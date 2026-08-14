# Design: Admin Product Management Page redesign

**Date:** 2026-08-14

## Problem

The admin product page is a card grid that is hard to scan for hundreds of products. It lacks a proper header, quick stats, a professional filter toolbar, and dense table layout. It has excessive whitespace and weak visual hierarchy.

## Current State

- Single file `client/src/pages/admin/products-page.tsx`: card grid (2/3/4 cols), search input, preview dialog, delete confirm dialog, `Pagination` component, `PRODUCT_STATUS_META` export, fetch via `productApi.list({ page, limit: 12, search })`.
- Admin shell (`admin-layout.tsx`): dark navy (`bg-slate-950`), radial cyan/blue glows, `dark` class wrapper.
- API `productApi.list` already supports `status`, `category`, `categorySlug`, `minPrice`, `maxPrice`, `search`, pagination meta. No new API needed.
- Product model has **no SKU or brand** — the "SKU" column will display the product `slug` in small monospace type.
- Status enum: `active` / `inactive` / `out-of-stock`. Stock is a separate numeric field.
- Shared `Table`, `Select`, `Badge`, `Skeleton`, `AlertDialog`, `Dialog` components exist.

## Solution (single-file refactor, dark premium dashboard)

All changes confined to `client/src/pages/admin/products-page.tsx`. Three local sub-components in the same file, existing fetch/CRUD logic untouched.

### 1. Header
- Breadcrumb: `Dashboard / Sản phẩm` (text-xs, muted).
- Title "Sản phẩm" (2xl bold) + subtitle "Quản lý kho hàng và trạng thái sản phẩm".
- Right: existing `+ Thêm sản phẩm` gradient button (unchanged).

### 2. Stat cards (4 across; 1–2 on mobile)
Computed from `meta.total` of parallel `productApi.list({ limit: 1, ...filter })` calls — no backend change:
- **Tổng sản phẩm** — icon Package, cyan accent, all products.
- **Đang bán** — icon CheckCircle, emerald, `status: 'active'`.
- **Sắp hết** — icon AlertTriangle, amber, `status: 'active'` + low stock. Approximation via separate query: `status: 'active'` then fall back to `out-of-stock`-independent logic is not possible without an API param for `stock<=10`; therefore **Sắp hết = count of active products returned with stock ≤ 10** by fetching `list({ limit: 100, status: 'active' })` and counting in memory, **Hết hàng = out-of-stock count + active-with-stock-0**.
  - Simpler fallback: Sắp hết counts products where `stock > 0 && stock <= 10` from the same in-memory active sample; Hết hàng uses `status: 'out-of-stock'` `meta.total` plus zero-stock active items. Stats are best-effort, labeled with the same meaning as the table's stock coloring.
- Each card: dark surface (`bg-slate-900/60`), subtle border (`border-white/10`), small tinted icon tile, large bold number, small label. Compact height.

### 3. Filter toolbar
One row on desktop; wraps/stack on small screens:
- **Search** (wide, flex-1): matches name + slug, debounced 400ms (existing pattern), keeps `search` state.
- **Danh mục**: `Select` populated from `categoryApi.all()`, value = category id.
- **Trạng thái**: `Select` — Tất cả / Đang bán (active) / Ẩn (inactive) / Hết hàng (out-of-stock).
- **Khoảng giá**: `Select` — Tất cả / Dưới 500.000 ₫ / 500.000 – 1.000.000 ₫ / 1.000.000 – 3.000.000 ₫ / Trên 3.000.000 ₫ (maps to minPrice/maxPrice).
- **Reset**: ghost button; clears search + all selects, returns to page 1.

### 4. Product table (single large card)
- One card `bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden`; table uses the shared `Table` primitives; `overflow-x-auto` wrapper with min-width for mobile.
- Columns:
  - **Sản phẩm**: 56px rounded image (dark bg, object-cover, `resolveImageUrl`) + name (font-medium, line-clamp-1) + slug below (text-xs mono, muted). Missing image → placeholder tile with icon.
  - **Danh mục**: light badge with category name (muted).
  - **Giá**: right-aligned `formatCurrency` (e.g. `1.250.000 ₫`); original price strikethrough if discounted.
  - **Tồn kho**: number, colored — emerald `>10`, amber `1–10`, rose `0`.
  - **Trạng thái**: existing `PRODUCT_STATUS_META` badges (Đang bán / Ẩn / Hết hàng), dark-background style.
  - **Thao tác**: three icon buttons — Xem (opens existing preview dialog), Sửa (navigate to edit), Xóa (existing AlertDialog confirm).
- Row hover: `bg-white/5`, transition 150ms; action buttons remain subtle until row hover.

### 5. Pagination
- Keep shared `Pagination` on the right; add left-side text `Hiển thị {start}–{end} trong tổng số {total} sản phẩm`. No trailing whitespace after the table.

### 6. Loading / empty states
- Loading: skeleton table rows (image tile + text lines per column) using shared `Skeleton`.
- Empty: icon + "Không tìm thấy sản phẩm" + "Thử thay đổi từ khóa hoặc bộ lọc của bạn." + `Xóa bộ lọc` button (calls reset).

## Invariants (must NOT change)

- API calls, routing, CRUD, preview dialog, delete confirmation, `PRODUCT_STATUS_META` export, `productApi`/`categoryApi`.
- No new backend endpoints, models, or mock data.

## Testing

- `client`: `npm run build` (tsc + vite) and `npm run lint` (oxlint) pass.
- Manual on dev server: 4 stat cards render, filters change the table, reset clears, pagination + range text, hover/actions work, delete confirm works, responsive at mobile width, empty state with filters that match nothing, loading skeletons appear.