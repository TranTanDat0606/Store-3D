# Storefront & Admin UI/UX Improvements — Design Doc

Date: 2026-08-12
Status: Approved

## Problem

The storefront home page (hero, categories, featured products) and cart look
functional but plain; there is no "hot sale" section; guests can add to cart
without logging in; the admin categories page is still light-themed; and the
user reported image-upload problems in the admin product form. This pass makes
the storefront feel premium (dark ocean-blue + black, mobile-first) while
reusing existing components, logic, API, and auth — no new business logic and
no fake discount/shipping data.

## Constraints (user-mandated)

- Keep existing structure/layout/colors/components/logic/API/routes wherever
  possible. This is a refinement pass, not a rewrite.
- Design language: dark ocean blue + black, premium/modern/clean/minimal,
  mobile-first.
- Only render real data. No invented discount or shipping logic in the cart.
- Add-to-cart login gate must reuse existing auth (`useAuth`, guest-only
  `/dang-nhap` route). No new auth system.
- Reuse existing assets and components (ProductCard, Badge, Dialog, etc.).
- Inspect code before editing; no guessing.

## Scope (decided with user)

1. Home hero: layered product showcase (replaces gradient blobs).
2. Category section: 1 large featured card + grid of smaller cards.
3. New Hot Sale section below Featured Products, sorted by discount %.
4. Cart drawer: keep right-side drawer, redesign contents; real-data summary.
5. Add-to-cart requires login → reusable login-prompt dialog.
6. Admin: restyle categories page to dark glass; polish product grid/editor.
7. Image upload: reproduce the reported bug in the browser and fix any real
   client issue; improve error feedback in ImageUpload.

Theme decision: new sections are dark-styled but the light/dark toggle stays.

## Architecture

All changes are in `client/` except one small server change (discount sort).

### 1. Home hero — layered product showcase

`client/src/pages/home-page.tsx` (hero block only).

- Replace the two gradient-blob `<div>`s with a dark ocean-blue + black panel.
- Pull 2-3 product images (reuse the existing `featured`/product data already
  fetched on the page) and arrange them as floating cards with glow rings and
  a subtle hover/parallax effect (framer-motion, already a dependency).
- Keep existing hero heading, subtitle, and CTA buttons and their layout.
- Images render via existing `resolveImageUrl()`.
- Works on mobile (stacked/smaller floating cards).

### 2. Category section — featured + supporting cards

`client/src/pages/home-page.tsx` (categories block only).

- Layout: one large featured card (first category, e.g. Mô hình nhân vật)
  with a richer visual, then a responsive grid of the remaining categories as
  smaller cards.
- Each category card gets a distinct accent gradient derived from existing
  category data (reuse the per-category image/color already available) so the
  cards no longer look identical.
- Keep existing category fetch (`categoryApi.all()`), navigation, and empty
  states.

### 3. Hot Sale section

New section below the Featured Products block on `home-page.tsx`.

- Server: add a `sort=discount` branch to `productService.list()`
  (`server/src/services/productService.ts`) that sorts active products with
  `originalPrice > 0` by `salePrice / originalPrice` ascending (highest
  discount first; guards against division by zero). No validator change needed:
  `productQuerySchema.sort` is `z.string().optional()` (already permissive).
- Client: new `productApi.hotSale(limit?)` that calls
  `GET /api/products?sort=discount&limit=8&status=active` (mirrors the
  existing `featured()` helper).
- Render with the existing `ProductCard` (already shows discount badge,
  strikethrough original price, sale price). Header + "Xem thêm" link like the
  Featured section. Empty state: hide the section when no discounted products.

### 4. Cart drawer redesign

`client/src/components/cart/cart-drawer.tsx` (contents only; drawer shell,
open/close wiring, `CartContext`, and `/thanh-toan` link stay).

- Item rows: image (via `resolveImageUrl`), name, unit price, quantity
  stepper (existing +/- controls), remove button — clearer spacing and
  hierarchy.
- Summary: subtotal only, from existing `CartContext.subtotal`. No discount,
  shipping, or total unless real data exists (it does not).
- Empty state: reuse existing `EmptyState` ("Giỏ hàng trống") with a "Mua
  ngay" / browse CTA.
- Mobile-first: full-width rows on small screens, comfortable tap targets.

### 5. Add-to-cart login gate

- New reusable component `client/src/components/auth/login-prompt-dialog.tsx`:
  a `Dialog` with "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng" and two
  buttons — Đăng nhập and Hủy. Đăng nhập navigates to `/dang-nhap` passing
  `location.state.from = <current-path>`; the existing guest-only login page
  already reads `location.state.from` and navigates back after login
  (`login-page.tsx:41,48`), so no login-page change is needed.
- Wire into `client/src/components/product/product-card.tsx` and
  `client/src/pages/product-detail-page.tsx` `handleAddToCart`: when
  `!isAuthenticated`, open the dialog instead of adding. Reuse the wishlist
  pattern (`useAuth`, existing guest-only handling) already in those files.
- CartContext stays a shared localStorage cart (unchanged).

### 6. Admin categories restyle

`client/src/pages/admin/categories-page.tsx` (UI only, keep all logic/API).

- Restyle to the dark-glass theme used by the product grid/editor
  (`border-white/10 bg-slate-900/60 backdrop-blur-xl`, cyan accents, etc.).
- Add visual hierarchy: header + spacing consistent with products-page; cards
  with category image thumbnails (via `resolveImageUrl`), name, description,
  edit/delete actions in the existing Dialog/AlertDialog pattern.
- Light polish on product grid/editor spacing if needed (no redesign).

### 7. Image upload investigation & feedback

- Backend `/api/upload` and the upload→create flow are already verified working
  end-to-end via API tests. The reported bug is expected to be client/UX:
  reproduce in the browser (admin → add product → upload file), fix any real
  issue found.
- Improve `client/src/components/admin/image-upload.tsx` error handling:
  per-file failure toast with the server message, disabled state while
  uploading, and clear success (new thumbnail appears). Keep `max`/type
  filtering as-is.

## Data flow

- Hot Sale: client `productApi.hotSale()` → `GET /api/products?sort=discount`
  → server sorts by discount → ProductCard renders existing discount UI.
- Login gate: tap add → `LoginPromptDialog` → Đăng nhập →
  `/dang-nhap` (with `state.from`) → after login, back to the same page.
- Upload: `ImageUpload` → `uploadApi.uploadImage(f)` → `/api/upload` →
  `/uploads/<file>` → stored in `images[]` → rendered via `resolveImageUrl()`.

## Error handling

- Hot Sale fetch failure: hide the section silently (same as other sections).
- Login prompt: Hủy closes; Đăng nhập always navigates to login.
- Upload: toast per failed file with the server's Vietnamese message; no
  partial state mutation on failure.

## Testing

- Client `tsc` (npm run typecheck / build) and server `tsc` pass.
- `npm run lint` (client) has no new errors (react-refresh warnings are
  pre-existing; PRODUCT_STATUS_META export stays a known trade-off).
- Browser smoke: home page (hero, categories, featured, hot sale render with
  real data, 0 console errors); add-to-cart while logged out opens the dialog,
  login returns to the page, then add succeeds; cart drawer shows items and
  subtotal; admin categories page renders in dark glass; admin add/edit product
  image upload works and persists after reload.
- API: `GET /api/products?sort=discount` returns highest-discount-first.

## Out of scope

- No per-user carts, no cart clear on logout, no inline login modal.
- No storefront forced-dark-mode.
- No fake discount/shipping data anywhere.
- No backend changes beyond the discount sort.
