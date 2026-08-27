# Admin Categories Page — Table Layout Design

**Date:** 2026-08-14
**Status:** Approved

## 1. Goal

Redesign the Admin Categories page to match the Admin Products page table layout (approved Approach A pattern): breadcrumb header, stat cards, filter toolbar, and a single card containing a data table with hover-reveal actions.

## 2. Scope

- `server/src/services/categoryService.ts`: attach `productCount` to each category in `all()`.
- `client/src/types/index.ts`: add `productCount?: number` to `Category`.
- `client/src/pages/admin/categories-page.tsx`: rewrite to table layout. Preserve the existing create/edit dialog (name, image, description) and delete AlertDialog.
- No pagination (categories are few; `categoryApi.all()` returns all).

## 3. Backend Change

`CategoryService.all()` — replace `Category.find().sort({ name: 1 })` with an aggregation that adds a product count:

```
Category.aggregate([
  { $sort: { name: 1 } },
  { $lookup: { from: 'products', localField: '_id', foreignField: 'category', as: '__products' } },
  { $addFields: { productCount: { $size: '$__products' } } },
  { $project: { __products: 0 } },
])
```

Return shape stays `Category[]` plus `productCount`. Existing consumers (nav, filters, home) unaffected — plain objects with same fields.

## 4. Client Page Layout

### Header
- Breadcrumb: `Dashboard / Danh mục` + title "Danh mục" + subtitle "Quản lý danh mục sản phẩm"
- `+ Thêm danh mục` button (same gradient CTA as products page)

### Stat cards (computed from loaded categories — no extra requests)
- **Tổng danh mục** — Layers icon, cyan accent, `categories.length`
- **Có sản phẩm** — Package icon, emerald accent, count where `productCount > 0`
- **Trống** — Inbox icon, rose accent, count where `productCount === 0`

### Filter toolbar
- Search input (name + slug) with icon, debounced 400ms — filters client-side over `all()`
- Select `Tất cả / Có sản phẩm / Trống` (frontend filter)
- Reset ghost button (disabled when no active filters)

### Table card (single `rounded-xl border border-white/10 bg-slate-900/60`)
Columns:
- **Danh mục** — 56px rounded thumbnail (or `Layers` placeholder), name, slug (mono, `text-slate-500`)
- **Mô tả** — `line-clamp-2`, fallback "Chưa có mô tả" (slate-500 italic)
- **Sản phẩm** — number, emerald when > 0, slate-500 when 0
- **Ngày tạo** — `new Date(createdAt).toLocaleDateString('vi-VN')`, slate-400
- **Thao tác** — Sửa / Xóa icon buttons, hover-reveal (`opacity-40 group-hover:opacity-100`)

No pagination footer. Skeleton: table skeleton (same as products page). Empty state: `SearchX` + "Không tìm thấy danh mục" + `Xóa bộ lọc`.

### Preserved behavior
- Create/edit dialog (name required, image upload, description) — dark styled, unchanged.
- Delete AlertDialog — unchanged; backend already blocks deleting categories that have products (toast shows error).
- `toast.success`/`toast.error` via `getErrorMessage`.

## 5. Verification

- `server`: `npm.cmd run build`, `npm.cmd test` (tsx test runner, all pass)
- `client`: `npm.cmd run build` (`tsc -b && vite build`), `npm.cmd run lint` (oxlint)
- Manual: GET `/api/categories/all` includes `productCount`; stats/filter/reset/empty state render.
