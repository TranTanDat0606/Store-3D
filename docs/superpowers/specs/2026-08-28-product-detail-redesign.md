# Product Detail Page Redesign — Design Spec

> **Date:** 2026-08-28
> **Status:** Draft — Awaiting User Approval
> **Approach:** Immersive Gallery-First

## 1. Overview

Redesign the Product Detail page (`/san-pham/:slug`) to deliver a premium, futuristic "digital showroom" experience. The current implementation is functional but generic — a standard 2-column layout with a simple image gallery, no zoom/lightbox, no price×quantity preview, and several UX gaps.

**Important clarification:** Store3D is an image-based e-commerce platform. Products have `images: string[]` stored in Cloudinary. There is no 3D model viewer, no Three.js, no `@react-three`, no `model-viewer`. This redesign is an **image gallery redesign**, not a 3D viewer introduction.

### Goals
- Make the product image the hero (gallery-first layout)
- Add lightbox with zoom for detailed image inspection
- Show live price×quantity preview ("Tạm tính")
- Improve information hierarchy and CTA flow
- Maintain all existing functionality (no business logic changes)
- Stay consistent with Store3D design system (Be Vietnam Pro, primary #3b6ee8, rounded 10px, cyan glow)

### Non-Goals
- No new API endpoints
- No new business features (no new review logic, no new payment flows)
- No changes to Cart/Wishlist contexts (behavior preserved)
- No changes to the ReviewFormPage (`/danh-gia/:slug`)
- No 3D model viewer or 3D file support

---

## 2. Verified Existing Functionality

The following features were verified against the actual codebase before finalizing this spec:

| Feature | Status | Evidence |
|---|---|---|
| "Mua ngay" button | **EXISTS** | `product-detail-page.tsx:335` — calls `addItem(product, 1)`, navigates to `/thanh-toan` |
| `/thanh-toan` route | **EXISTS** | `App.tsx:72` — renders `CheckoutPage` |
| `/reviews/me/:productId` | **EXISTS** | `services/index.ts:97` — `reviewApi.me(productId)` |
| Review eligibility logic | **EXISTS** | `types/index.ts:188` (`ReviewEligibility`), `hooks/useReviewEligibility.ts`, inline fetch in product detail page |
| `product.status` | **EXISTS** | `types/index.ts:18` — `ProductStatus = 'active' \| 'inactive' \| 'out-of-stock'` |
| 3D model data/viewer | **DOES NOT EXIST** | No three.js, @react-three, model-viewer in `package.json`. Products only have `images: string[]` |
| Product gallery | **EXISTS** | `product-detail-page.tsx:206-237` — basic image + horizontal thumbnail strip, no lightbox, no zoom |
| Framer Motion | **EXISTS** | `package.json:33` — `framer-motion: ^13.0.0`. Used in `product-card.tsx`, `cart-drawer.tsx`, `home-page.tsx`, `hot-sale-section.tsx` |

---

## 3. Page Structure

### Desktop Layout (`≥ lg` breakpoint)

```
┌─────────────────────────────────────────────────────────┐
│ Breadcrumb (Home > Sản phẩm > [Category] > Product)     │
├──────────────────────────┬──────────────────────────────┤
│                          │                              │
│   IMAGE GALLERY (60%)    │   PURCHASE PANEL (40%)       │
│   [hero image + thumbs]  │   [sticky on scroll]         │
│                          │                              │
├──────────────────────────┴──────────────────────────────┤
│                                                         │
│   TABS: Mô tả │ Thông số │ Đánh giá (N)                │
│   ─────────────────────────────────────                 │
│   Tab content (full width)                              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   SẢN PHẨM LIÊN QUAN (horizontal scroll, 4 cards)      │
└─────────────────────────────────────────────────────────┘
```

- Container: `max-w-7xl mx-auto px-4 sm:px-6`
- Gallery/Panel: `grid grid-cols-1 lg:grid-cols-5 gap-8`
- Gallery spans 3 columns (`lg:col-span-3`), panel spans 2 (`lg:col-span-2`)
- Purchase panel: `lg:sticky lg:top-24 lg:self-start`
- Section spacing: `py-8` between major sections

### Mobile Layout (`< lg` breakpoint)

```
┌─────────────────────────────────────┐
│ Breadcrumb                           │
├─────────────────────────────────────┤
│                                      │
│   IMAGE CAROUSEL (full-width)        │
│   [swipeable, dot indicators]        │
│                                      │
├─────────────────────────────────────┤
│   Product Name + Rating              │
│   Price Block                        │
├─────────────────────────────────────┤
│   Tabs (horizontal scroll)           │
│   Tab content                        │
├─────────────────────────────────────┤
│   RELATED PRODUCTS (scroll)          │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ FIXED BOTTOM BAR: [Price] [Add Cart]│
└─────────────────────────────────────┘
```

---

## 4. Image Gallery

### Desktop Gallery

**Thumbnail strip (left edge):**
- 48×48px squares, `rounded-lg`, `gap-2`
- Active: `ring-2 ring-primary ring-offset-2`
- Inactive: `opacity-60 hover:opacity-100` (200ms transition)
- If >5 images: vertical scroll with hidden scrollbar (`scrollbar-hide`)
- Max 6 visible thumbnails

**Main image:**
- `aspect-square`, `rounded-2xl`
- Background: `bg-gradient-to-br from-cyan-500/15 via-transparent to-primary/20`
- Grid overlay: `bg-grid` class (matches product card pattern)
- Ambient glow: `absolute inset-0 bg-cyan-400/10 blur-3xl rounded-full` (positioned behind image)
- Image: `object-contain p-8`
- Discount badge: top-left corner (absolute, destructive badge)
- "Nổi bật" badge: next to discount if featured
- Click: opens lightbox

### Lightbox

- Full-screen overlay: `fixed inset-0 z-50 bg-black/90 backdrop-blur-sm`
- Main image: `max-w-4xl max-h-[85vh] mx-auto object-contain`
- Close button: top-right, white X icon, `hover:bg-white/10 rounded-full p-2`
- Arrow navigation: left/right chevrons, `hover:bg-white/10 rounded-full p-3`
- Thumbnail strip at bottom: horizontal, same selection behavior as main gallery
- Keyboard: ← → for navigation, Esc to close
- Zoom: double-click to zoom 2×, click again to reset (transform: scale)
- Transition: `animate-in fade-in duration-200` (meaningful state change — lightbox opening)
- Z-index: above navbar (z-50)

### Mobile Gallery

- Full-width image carousel (no thumbnail strip)
- Swipeable: `touch-action: pan-y` with snap points
- Dot indicators: active = `bg-primary w-6`, inactive = `bg-muted-foreground/30 w-2`
- Same gradient background treatment as desktop
- Tap: opens lightbox (scaled for mobile)
- Discount badge overlay preserved

---

## 5. Product Info Panel

### Information Hierarchy (top to bottom)

1. **Category name:** `text-sm text-muted-foreground`, links to category page
2. **Product name:** `text-xl font-bold text-foreground`
3. **Rating:** amber stars + `text-sm text-muted-foreground` count (e.g., "4.5 ★★★★☆ (12 đánh giá)")
4. **Price block:**
   - Sale price: `text-2xl font-extrabold text-primary` (e.g., "₫350.000")
   - Original price: `text-base text-muted-foreground line-through` (e.g., "₫500.000")
   - Discount badge: `bg-destructive text-white text-xs px-2 py-0.5 rounded-full` (e.g., "-30%")
5. **Quantity selector:**
   - Label: "Số lượng:" `text-sm font-medium`
   - Minus button: `disabled opacity-50` when qty=1
   - Number display: `w-12 text-center font-medium`
   - Plus button: `disabled opacity-50` when qty=stock
   - **Live preview:** "Tạm tính: ₫350.000" `text-sm text-muted-foreground` (updates on qty change with brief highlight flash)
6. **CTAs:**
   - "Thêm vào giỏ hàng": full-width `Button size="lg"` primary style, ShoppingBag icon
   - "Mua ngay": full-width `Button size="lg"` destructive outline style
   - Wishlist toggle: small icon button, outline style, Heart icon (filled red when wishlisted)
7. **Stock indicator:**
   - In stock: `text-sm text-green-600 dark:text-green-400` with CheckCircle2 icon — "Còn X sản phẩm trong kho"
   - Out of stock: `text-sm text-red-500` with XCircle icon — "Hết hàng - Liên hệ đặt trước"
8. **Trust badges:** compact row with muted icons — Truck (Miễn phí vận chuyển), RefreshCw (Đổi trả trong 7 ngày), ShieldCheck (Thanh toán an toàn)

### Price × Quantity Calculation

```
displayPrice = product.salePrice || product.originalPrice
subtotal = displayPrice × quantity
```

- Displayed as: "Tạm tính: ₫{subtotal.toLocaleString('vi-VN')}"
- Updates reactively on quantity change

---

## 6. CTAs & Interactions

### "Thêm vào giỏ hàng" (Add to Cart)
- **EXISTS** — current behavior: `addItem(product, quantity)` from CartContext, shows toast
- After add: cart drawer opens (existing behavior preserved)
- Disabled when out of stock

### "Mua ngay" (Buy Now)
- **EXISTS** — current behavior: `addItem(product, 1)` then `navigate('/thanh-toan')` (`product-detail-page.tsx:138-146`)
- **Always adds qty=1** (existing behavior, intentional)
- Hidden when out of stock

### Wishlist Toggle
- **EXISTS** — current behavior: `toggleWishlist(product._id)` from WishlistContext, shows toast
- Auth check: if not authenticated, shows toast error (existing) — spec proposes `LoginPromptDialog` instead (PROPOSAL — requires user approval)
- No optimistic UI (waits for API response, then updates)

### Quantity Selector
- Min: 1, Max: `product.stock`
- Minus disabled at 1, Plus disabled at stock
- Number display: centered, `w-12`
- Change triggers price preview update

---

## 7. Tabs

### Tab Bar
- Full-width below gallery/panel grid
- Three tabs: `Mô tả` | `Thông số` | `Đánh giá (N)` (N = reviewCount)
- Active: `text-foreground font-medium border-b-2 border-primary`
- Inactive: `text-muted-foreground hover:text-foreground`
- Mobile: horizontal scrollable with `-webkit-overflow-scrolling: touch`

### Tab 1: Mô tả (Description)
- Max-width: `max-w-3xl mx-auto`
- Content: product.description (may contain HTML from Cloudinary)
- Styling: `prose prose-sm dark:prose-invert` for rich text
- Expandable: if description >500 chars, show first 500 + "Xem thêm" button (smooth height animation with Framer Motion `AnimatePresence`)
- Empty state: centered "Chưa có mô tả sản phẩm" with muted text

### Tab 2: Thông số (Specs)
- Layout: two-column key-value grid (`grid grid-cols-2 gap-x-8 gap-y-3`)
- Keys: `text-sm text-muted-foreground` (left-aligned)
- Values: `text-sm text-foreground font-medium` (right-aligned)
- Rows: `border-b border-border/50 pb-2`
- Fields to display:
  | Key | Source |
  |-----|--------|
  | Vật liệu | `product.material` |
  | Loại máy in | `product.printerType` |
  | Kích thước | `product.size` |
  | Tình trạng | `product.status` (active → "Đang bán", inactive → "Ngừng bán", out-of-stock → "Hết hàng") |
  | Danh mục | `product.category.name` |
- Empty values: show "—" as placeholder

### Tab 3: Đánh giá (Reviews)

**Rating Summary (left, ~30% width on desktop):**
- Large rating number: `text-4xl font-bold` with star display
- Review count: `text-sm text-muted-foreground`
- Bar chart: 5 rows (★5 → ★1), each with:
  - Star label: `text-sm w-8`
  - Bar: `h-2 flex-1 bg-muted rounded-full overflow-hidden`
  - Fill: `bg-amber-400 h-full rounded-full` (width proportional to count)
  - Count: `text-sm text-muted-foreground w-8 text-right`
- CTA button (contextual):
  - Eligible: "Viết đánh giá" (primary outline, links to `/danh-gia/:slug`)
  - Already reviewed: "Đã đánh giá" (disabled, green, CheckCircle2 icon)
  - Not logged in: "Đăng nhập để đánh giá" (links to `/dang-nhap`)
  - Not purchased: (no button shown)

**Review Cards (right, ~70% width on desktop):**
- Each review:
  - Avatar: 36px circle (user avatar or initial on primary background)
  - Name: `text-sm font-medium`
  - Star rating: amber, `sm` size
  - Date: `text-xs text-muted-foreground` (formatted Vietnamese date)
  - Comment: `text-sm`
  - Images: thumbnail grid (max 3 visible, `w-16 h-16 rounded-lg object-cover`), click to expand. Use `resolveImageUrl()` for review image URLs (consistent with product images).
- Separated by `border-b border-border/50 py-4`
- Load more: "Xem thêm đánh giá" button (loads next 6 reviews)

**Empty Reviews:**
- Centered: `MessageSquare` icon in muted circle
- Text: "Chưa có đánh giá nào"
- Subtext: "Hãy là người đầu tiên đánh giá sản phẩm này"

---

## 8. Related Products

- Section title: "Sản phẩm liên quan" with left border accent (`border-l-2 border-primary pl-3`)
- Horizontal scroll on all viewports (not a wrapping grid)
- 4 product cards visible on desktop, scrollable for more
- Uses existing `ProductCard` component (no modifications needed)
- Navigation: subtle left/right arrow buttons on hover (desktop), native scroll on mobile
- Section spacing: `py-8`

---

## 9. UI States

### Loading State
- Main image: `animate-pulse` rounded square (`aspect-square bg-muted`)
- Thumbnails: 4 small pulse squares (48×48)
- Info panel: 3-4 skeleton text lines of varying widths
- Buttons: skeleton rectangles matching CTA dimensions
- Tabs: skeleton tab bar + content area skeleton
- Related products: 4 `ProductCardSkeleton` instances
- Pattern: matches existing `ProductCardSkeleton` styling

### Error State (404 / Network Error)
- Centered layout (no gallery/panel split): `flex flex-col items-center justify-center py-20`
- Icon: `AlertTriangle` in 48px muted circle
- Title: "Không tìm thấy sản phẩm" (404) or "Đã có lỗi xảy ra" (network)
- Description: muted text explaining the issue
- CTA: "Quay lại trang sản phẩm" button (primary, links to `/san-pham`)
- For network errors: additional "Thử lại" button that re-fetches

### Out-of-Stock State
- Gallery and info panel render normally (user can browse images)
- "Thêm vào giỏ": disabled, `opacity-50 cursor-not-allowed`, text → "Hết hàng"
- "Mua ngay": hidden entirely
- Stock indicator: red "Hết hàng" with XCircle icon
- Quantity selector: hidden
- Wishlist: still functional

### Empty Reviews State
- Centered within reviews tab
- Icon: `MessageSquare` in muted circle
- Text: "Chưa có đánh giá nào"
- Subtext: "Hãy là người đầu tiên đánh giá sản phẩm này"
- CTA: "Viết đánh giá" button (if eligible)

---

## 10. Responsive Behavior

| Breakpoint | Gallery | Purchase Panel | Tabs | Related |
|---|---|---|---|---|
| `< lg` (mobile/tablet) | Full-width swipeable carousel + dot indicators | Fixed bottom bar (price + "Thêm vào giỏ") | Horizontal scrollable | Horizontal scroll |
| `≥ lg` (desktop) | 60% with vertical thumbnail strip | Sticky right panel (40%) | Full tab bar | Horizontal scroll with arrows |

### Mobile-Specific Adaptations

**Gallery:** Full-width carousel, swipeable, dot indicators (no thumbnail strip)

**Purchase Panel (mobile):**
- Fixed bottom bar: `fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border`
- Layout: price (left) + "Thêm vào giỏ" button (right) side by side
- Tapping price area expands a slide-up mini-panel with: quantity selector, "Mua ngay", wishlist toggle
- Mini-panel: `AnimatePresence` slide-up animation, `bg-background border-t border-border p-4`
- Mini-panel closes on tap outside or swipe down
- When mini-panel is open, bottom bar content is replaced by mini-panel content

**Tabs:** Horizontal scroll with `-webkit-overflow-scrolling: touch`

**Related Products:** Same horizontal scroll as desktop

**Breadcrumb:** Same component, works at all sizes

---

## 11. Visual & Design Direction

### Animations & Transitions

**Principle: "Motion should communicate state, not decorate the page."**

| Element | Animation | Duration | Easing | Justification |
|---|---|---|---|---|
| Lightbox open/close | Fade in/out | 200ms | ease-in-out | Meaningful state change — user opened/closed lightbox |
| Gallery image change | Crossfade | 200ms | ease-in-out | Meaningful state change — user selected different image |
| Quantity change | Number slides up/down | 150ms | ease-out | Meaningful state change — user changed quantity |
| Price update | Brief highlight flash | 300ms | ease-out | Meaningful state change — price recalculated |
| Tab switch | Content fade-in | 150ms | ease-out | Meaningful state change — user switched tabs |
| Wishlist toggle | Heart scale up briefly | 150ms | spring | Meaningful state change — user toggled wishlist |
| Add to cart | Button press → success state → cart opens | 600ms total | ease-out | Meaningful feedback — action completed |

**Removed from previous spec:**
- ~~Page-wide staggered fade-in~~ (decorative, not state-communicating)
- ~~Review bar chart width animation~~ (decorative)
- ~~Scroll progress gradient line~~ (decorative)
- ~~Image hover scale-105~~ (decorative — keeping hover opacity on thumbnails only)

### Glow & Gradient Treatments

- Gallery background: `bg-gradient-to-br from-cyan-500/15 via-transparent to-primary/20`
- Grid overlay: `bg-grid` class (white 5% opacity in dark, gray 5% in light)
- Ambient glow: `bg-cyan-400/10 blur-3xl rounded-full` behind main image
- Active thumbnail: `ring-2 ring-primary ring-offset-2`
- Price: primary color, extrabold
- Discount badge: destructive with subtle shadow

### Hover/Focus/Active States

| Element | Hover | Active | Focus |
|---|---|---|---|
| Thumbnails | `opacity-100` from `opacity-60` | — | `ring-2 ring-primary` |
| "Thêm vào giỏ" | `shadow-lg shadow-primary/25` | `scale-[0.98]` | `ring-2 ring-primary ring-offset-2` |
| "Mua ngay" | `bg-destructive/90` | `scale-[0.98]` | `ring-2 ring-primary ring-offset-2` |
| Wishlist heart | — | `scale-95` | `ring-2 ring-primary` |
| Tab items | `text-foreground` | — | `ring-2 ring-primary` |

### Dark Mode

- Gallery background: `from-cyan-500/10 via-transparent to-primary/15` (slightly more subtle)
- Grid overlay: white 5% opacity
- Purchase panel: `bg-card/80 backdrop-blur-sm` (frosted glass effect)
- All other tokens follow existing dark mode system

---

## 12. Component Structure

### Shared Purchase State

Desktop `PurchasePanel` and `MobilePurchaseBar` share a custom hook to avoid duplicating business logic:

```typescript
// components/product/use-purchase-panel.ts
function usePurchasePanel(product: Product) {
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()

  const displayPrice = product.salePrice || product.originalPrice
  const subtotal = displayPrice * quantity
  const isOutOfStock = product.stock <= 0
  const wishlisted = isWishlisted(product._id)

  // ... handlers: handleAddToCart, handleBuyNow, handleWishlist
  return { quantity, setQuantity, displayPrice, subtotal, isOutOfStock, wishlisted, ... }
}
```

Both `PurchasePanel` (desktop) and `MobilePurchaseBar` (mobile) consume this hook. The hook owns all business logic; components only handle presentation.

### New Components to Create

| Component | Location | Purpose |
|---|---|---|
| `ProductGallery` | `components/product/product-gallery.tsx` | Desktop gallery (thumbs + hero) |
| `ProductGalleryMobile` | `components/product/product-gallery-mobile.tsx` | Mobile carousel with dots |
| `ProductLightbox` | `components/product/product-lightbox.tsx` | Full-screen lightbox with zoom |
| `PurchasePanel` | `components/product/purchase-panel.tsx` | Sticky info panel (desktop) |
| `MobilePurchaseBar` | `components/product/mobile-purchase-bar.tsx` | Fixed bottom bar (mobile) |
| `usePurchasePanel` | `components/product/use-purchase-panel.ts` | Shared purchase state/logic hook |
| `ProductTabs` | `components/product/product-tabs.tsx` | Tab bar + content switching |
| `RatingSummary` | `components/review/rating-summary.tsx` | Rating bar chart + CTA |
| `ReviewCard` | `components/review/review-card.tsx` | Individual review display |

### Components to Modify

| Component | Changes |
|---|---|
| `product-detail-page.tsx` | Complete rewrite — use new child components, remove inline logic |
| `StarRating` (local) | Extract to `components/common/star-rating.tsx` for reuse |

### Components Unchanged

| Component | Reason |
|---|---|
| `ProductCard` | Already has the premium showroom aesthetic |
| `ProductCardSkeleton` | Pattern reused as-is |
| `Breadcrumb` | Works as-is |
| `LoginPromptDialog` | Works as-is |
| `ReviewFormPage` | Separate page, no changes |

---

## 13. Data Flow

### Existing API Endpoints Used (no changes)

| Endpoint | Purpose | Verified |
|---|---|---|
| `GET /products/:slug` | Fetch product by slug | Yes |
| `GET /products/:id/related?limit=4` | Fetch related products | Yes |
| `GET /reviews/product/:id?limit=6` | Fetch reviews (paginated) | Yes |
| `GET /reviews/me/:productId` | Check review eligibility | Yes (`services/index.ts:97`) |

### State Management

| State | Mechanism | Notes |
|---|---|---|
| Product data | `useState` + `useEffect` fetch | Existing pattern, no context needed |
| Related products | `useState` + `useEffect` fetch | Parallel with product fetch |
| Reviews | `useState` + `useEffect` fetch | Paginated, "load more" appends |
| Active image index | `useState<number>` | Managed in ProductGallery |
| Quantity | `useState<number>` | Managed in `usePurchasePanel` hook |
| Active tab | `useState<string>` | Managed in ProductTabs |
| Lightbox open/close | `useState<boolean>` | Managed in ProductGallery |
| Review eligibility | `useState` + `useEffect` fetch | Only when authenticated |

### Context Dependencies

| Context | Used For |
|---|---|
| `CartContext` | `addItem(product, quantity)` |
| `WishlistContext` | `isWishlisted(id)`, `toggleWishlist(id)` |
| `AuthContext` | `isAuthenticated` (for review eligibility, wishlist, cart) |

---

## 14. Assumptions

1. Product images are stored in Cloudinary and served via `resolveImageUrl()` utility
2. Products always have at least one image (seed data guarantees this)
3. `product.salePrice` is either a number or null/undefined (not 0)
4. `product.stock` is always a non-negative integer
5. Review images are stored in Cloudinary (same as product images)
6. The existing `ProductCard` component is reused without modification for related products
7. Framer Motion is already installed (v13.0.0) — no new dependencies needed
8. The `bg-grid` CSS class already exists in `index.css`
9. Vietnamese date formatting uses `Intl.DateTimeFormat('vi-VN')` or similar
10. This is an image gallery redesign — no 3D model viewer is being introduced

---

## 15. Open Questions

1. **Wishlist auth behavior:** Current implementation shows a toast error when unauthenticated users try to wishlist. The spec proposes switching to `LoginPromptDialog` for consistency with "Add to Cart". Does the user want this change?
