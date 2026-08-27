# Product Detail Redesign — Implementation Plan

> **Date:** 2026-08-28
> **Spec:** `docs/superpowers/specs/2026-08-28-product-detail-redesign.md`
> **Status:** Ready for implementation

---

## 1. Files to Create

| # | File Path | Purpose | Est. Lines |
|---|---|---|---|
| 1 | `client/src/components/product/use-purchase-panel.ts` | Shared purchase state/logic hook | ~80 |
| 2 | `client/src/components/product/product-gallery.tsx` | Desktop gallery (thumbs + hero) | ~120 |
| 3 | `client/src/components/product/product-gallery-mobile.tsx` | Mobile carousel with dots | ~100 |
| 4 | `client/src/components/product/product-lightbox.tsx` | Full-screen lightbox with zoom | ~150 |
| 5 | `client/src/components/product/purchase-panel.tsx` | Sticky info panel (desktop) | ~180 |
| 6 | `client/src/components/product/mobile-purchase-bar.tsx` | Fixed bottom bar (mobile) | ~120 |
| 7 | `client/src/components/product/product-tabs.tsx` | Tab bar + content switching | ~160 |
| 8 | `client/src/components/review/rating-summary.tsx` | Rating bar chart + CTA | ~100 |
| 9 | `client/src/components/review/review-card.tsx` | Individual review display | ~80 |
| 10 | `client/src/components/common/star-rating.tsx` | Extracted StarRating component | ~30 |

**Total new files:** 10
**Total estimated lines:** ~1,120

---

## 2. Files to Modify

| # | File Path | Changes | Risk |
|---|---|---|---|
| 1 | `client/src/pages/product-detail-page.tsx` | Complete rewrite — compose new child components, remove all inline logic, call `usePurchasePanel` once, pass state down | HIGH — this is the core file |

**Total files to modify:** 1

---

## 3. Files That Must Remain Unchanged

| File Path | Reason |
|---|---|
| `client/src/components/product/product-card.tsx` | Reused as-is for related products |
| `client/src/components/product/product-card-skeleton.tsx` | Reused as-is for loading state |
| `client/src/components/common/breadcrumb.tsx` | Works as-is |
| `client/src/components/auth/login-prompt-dialog.tsx` | Works as-is |
| `client/src/pages/review-form-page.tsx` | Separate page, no changes |
| `client/src/contexts/CartContext.tsx` | Behavior preserved |
| `client/src/contexts/WishlistContext.tsx` | Behavior preserved |
| `client/src/contexts/AuthContext.tsx` | No changes |
| `client/src/services/index.ts` | No API changes |
| `client/src/types/index.ts` | No type changes |
| `client/src/lib/utils.ts` | No utility changes |
| `client/src/lib/format.ts` | No format changes |
| `client/src/App.tsx` | No route changes |
| `client/package.json` | No new dependencies |

---

## 4. Component Implementation Order

### Phase 1: Shared Foundation (no dependencies)

**Step 1: `StarRating` component**
- Extract from `product-detail-page.tsx` local `StarRating` function
- Create `client/src/components/common/star-rating.tsx`
- Export: `StarRating({ rating, size? })`
- Reused by: PurchasePanel, RatingSummary, ReviewCard

**Step 2: `usePurchasePanel` hook**
- Create `client/src/components/product/use-purchase-panel.ts`
- **Called by:** `ProductDetailPage` exactly once per render
- **NOT called by** PurchasePanel or MobilePurchaseBar — they receive state as props
- Owns: quantity state, displayPrice, subtotal, isOutOfStock, wishlisted
- Owns: handleAddToCart, handleBuyNow, handleWishlist handlers
- Depends on: CartContext, WishlistContext, AuthContext (all existing)
- No UI — pure logic hook
- Returns a `PurchasePanelState` type that both presentation components accept

### Phase 2: Gallery Components

**Step 3: `ProductLightbox`**
- Create `client/src/components/product/product-lightbox.tsx`
- Props: `images: string[]`, `activeIndex: number`, `onClose: () => void`, `onNavigate: (index: number) => void`
- Features: full-screen overlay, arrow navigation, keyboard support, double-click zoom
- Uses: `resolveImageUrl()`, `AnimatePresence` from framer-motion

**Step 4: `ProductGallery` (desktop)**
- Create `client/src/components/product/product-gallery.tsx`
- Props: `product: Product`
- Features: vertical thumbnail strip, main image, gradient background, discount badge, click → lightbox
- Manages: `activeImage` state, `lightboxOpen` state (gallery-local, not purchase state)
- Uses: `ProductLightbox`, `resolveImageUrl()`, `cn()`

**Step 5: `ProductGalleryMobile`**
- Create `client/src/components/product/product-gallery-mobile.tsx`
- Props: `product: Product`
- Features: full-width swipeable carousel, dot indicators, tap → lightbox
- Manages: `activeImage` state, `lightboxOpen` state (gallery-local, not purchase state)
- Uses: `ProductLightbox`, `resolveImageUrl()`

### Phase 3: Purchase Panel Components

**Step 6: `PurchasePanel` (desktop)**
- Create `client/src/components/product/purchase-panel.tsx`
- Props: `{ product: Product; purchaseState: PurchasePanelState }`
- Does NOT call `usePurchasePanel` — receives all state and handlers via `purchaseState` prop
- Renders: category, name, rating, price block, quantity selector, CTAs, stock indicator, trust badges
- Uses: `StarRating`, `formatCurrency`, `calculateDiscountPercent`, `cn()`

**Step 7: `MobilePurchaseBar`**
- Create `client/src/components/product/mobile-purchase-bar.tsx`
- Props: `{ product: Product; purchaseState: PurchasePanelState }`
- Does NOT call `usePurchasePanel` — receives all state and handlers via `purchaseState` prop
- Renders: fixed bottom bar (price + CTA), expandable mini-panel (quantity, buy now, wishlist)
- Uses: `formatCurrency`, `cn()`, `AnimatePresence`

### Phase 4: Tab & Review Components

**Step 8: `ProductTabs`**
- Create `client/src/components/product/product-tabs.tsx`
- Props: `product: Product`, `reviews: Review[]`, `reviewEligibility: ReviewEligibility | null`, `onLoadMoreReviews: () => void`, `hasMoreReviews: boolean`
- Renders: tab bar, description content, specs content, reviews content
- Uses: `RatingSummary`, `ReviewCard`, `prose` styling

**Step 9: `RatingSummary`**
- Create `client/src/components/review/rating-summary.tsx`
- Props: `rating: number`, `reviewCount: number`, `reviews: Review[]`, `eligibility: ReviewEligibility | null`, `productSlug: string`
- Renders: large rating number, star display, bar chart, contextual CTA button
- Uses: `StarRating`, `CheckCircle2` icon

**Step 10: `ReviewCard`**
- Create `client/src/components/review/review-card.tsx`
- Props: `review: Review`
- Renders: avatar, name, star rating, date, comment, images
- Uses: `StarRating`, `resolveImageUrl()`, `formatDate()`

### Phase 5: Page Composition

**Step 11: Rewrite `product-detail-page.tsx`**
- Remove all inline components (StarRating, skeleton, etc.)
- **Call `usePurchasePanel(product)` exactly once**
- Pass `purchaseState` to both `PurchasePanel` and `MobilePurchaseBar`
- Import and compose: Breadcrumb, ProductGallery, ProductGalleryMobile, PurchasePanel, MobilePurchaseBar, ProductTabs, ProductCard, ProductCardSkeleton
- Manages: product, related, reviews, loading, notFound, networkError, reviewEligibility states
- Uses CSS-based responsive visibility to switch between desktop/mobile gallery and purchase panel
- Data fetching: existing pattern (useEffect + productApi + reviewApi)

---

## 5. Shared State / Data Flow

```
product-detail-page.tsx (orchestrator)
├── State: product, related, reviews, loading, notFound, networkError, reviewEligibility
├── Data fetching: productApi.getBySlug, productApi.related, reviewApi.listByProduct, reviewApi.me
├── usePurchasePanel(product) ← CALLED ONCE HERE
│   ├── State: quantity
│   ├── Derived: displayPrice, subtotal, isOutOfStock, wishlisted
│   └── Handlers: handleAddToCart, handleBuyNow, handleWishlist
│
├── [Desktop ≥ lg — hidden lg:block]
│   ├── ProductGallery (manages own: activeImage, lightboxOpen)
│   │   └── ProductLightbox (rendered in portal/overlay)
│   └── PurchasePanel ← receives purchaseState as prop
│
├── [Mobile < lg — block lg:hidden]
│   ├── ProductGalleryMobile (manages own: activeImage, lightboxOpen)
│   │   └── ProductLightbox
│   └── MobilePurchaseBar ← receives purchaseState as prop
│
├── ProductTabs
│   ├── RatingSummary
│   └── ReviewCard (× N)
│
└── ProductCard (× 4, related products)
```

**Architecture rule:** `usePurchasePanel` is called **exactly once** in `ProductDetailPage`. The returned state object (`purchaseState`) is passed as a prop to both `PurchasePanel` (desktop) and `MobilePurchaseBar` (mobile). Neither presentation component calls the hook themselves.

**Why this architecture:**
- Single source of truth for purchase state
- No state duplication between desktop and mobile
- Presentation components are pure — they receive state, render UI, call handlers
- Easy to test: mock `purchaseState` prop, verify rendering
- If user resizes from desktop to mobile (or vice versa), state persists because it lives in the parent

**Responsive switch approach:** CSS-based visibility toggling via Tailwind:
- Desktop components: `hidden lg:block` — rendered in DOM but hidden on mobile
- Mobile components: `block lg:hidden` — rendered in DOM but hidden on desktop
- No JS breakpoint detection, no `useMediaQuery` hook
- Both desktop and mobile purchase components receive the **same** `purchaseState` prop from `ProductDetailPage`
- Both gallery components mount independently (each manages its own `activeImage` / `lightboxOpen` state — gallery state is NOT shared with purchase state)

**Trade-off:** Both desktop and mobile gallery components are in the DOM. On page load, both mount. This is acceptable because:
- Gallery components are lightweight (no heavy computations)
- The hidden gallery's lightbox is gated by its own `lightboxOpen` state — it won't open when hidden
- Framer Motion's `AnimatePresence` handles mount/unmount efficiently

### Mobile Purchase Bar Z-Index

- Bottom bar: `z-40`
- Lightbox: `z-50`
- Mini-panel (expanded): `z-45` (between bar and lightbox)
- Navbar: `z-40` (existing)

---

## 6. API / Data Dependencies

| Data | Source | Fetched By | Caching |
|---|---|---|---|
| Product | `GET /products/:slug` | `product-detail-page.tsx` | None (fresh on slug change) |
| Related products | `GET /products/:id/related?limit=4` | `product-detail-page.tsx` | None (parallel with product) |
| Reviews | `GET /reviews/product/:id?limit=6` | `product-detail-page.tsx` | None (paginated, append on load more) |
| Review eligibility | `GET /reviews/me/:productId` | `product-detail-page.tsx` | None (only when authenticated) |
| Cart | localStorage | `CartContext` | localStorage persistence |
| Wishlist | `GET /wishlist` | `WishlistContext` | Server-side, loaded on auth |

**No new API endpoints required.** All data comes from existing endpoints.

---

## 7. Responsive Implementation Strategy

### Breakpoint: `lg` (1024px)

**Approach:** CSS-based visibility toggling, not JS breakpoint detection.

```tsx
{/* Desktop gallery — hidden on mobile */}
<div className="hidden lg:block">
  <ProductGallery product={product} />
</div>

{/* Mobile gallery — hidden on desktop */}
<div className="block lg:hidden">
  <ProductGalleryMobile product={product} />
</div>

{/* Desktop purchase panel — hidden on mobile, receives purchaseState */}
<div className="hidden lg:block">
  <PurchasePanel product={product} purchaseState={purchaseState} />
</div>

{/* Mobile purchase bar — hidden on desktop, receives same purchaseState */}
<div className="block lg:hidden">
  <MobilePurchaseBar product={product} purchaseState={purchaseState} />
</div>
```

**Why this approach:**
- No `useMediaQuery` hook needed
- No JS-based breakpoint detection
- Both components are rendered but CSS hides one
- SSR-compatible (if ever needed)
- Simpler, more predictable
- **Both purchase components receive the same `purchaseState` from `ProductDetailPage`** — no hook called twice

**Key clarification:** The gallery components (`ProductGallery`, `ProductGalleryMobile`) manage their own local state (`activeImage`, `lightboxOpen`). This is gallery state, not purchase state. Each gallery component is independent — the desktop gallery's active image does not sync with the mobile gallery's active image. This is acceptable because only one is visible at a time, and state resets on page navigation anyway.

---

## 8. UI States Implementation

### Loading State

**In `product-detail-page.tsx`:**
```tsx
if (loading) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Desktop: 2-col skeleton */}
      <div className="hidden gap-8 lg:grid lg:grid-cols-5">
        <div className="lg:col-span-3">
          {/* Gallery skeleton: aspect-square pulse + 4 thumb pulses */}
        </div>
        <div className="lg:col-span-2 space-y-4">
          {/* Info skeleton: text lines + button pulses */}
        </div>
      </div>
      {/* Mobile: stacked skeleton */}
      <div className="block lg:hidden space-y-4">
        {/* Image skeleton + text lines */}
      </div>
    </div>
  )
}
```

- Main image: `animate-pulse aspect-square bg-muted rounded-2xl`
- Thumbnails: 4 × `animate-pulse size-12 bg-muted rounded-lg`
- Info: 3-4 `animate-pulse h-4 bg-muted rounded` with varying widths
- Buttons: `animate-pulse h-12 bg-muted rounded-xl`
- Tabs: skeleton tab bar + content area
- Related: 4 × `ProductCardSkeleton`

### Error States

**The plan distinguishes two error types:**

#### Product Not Found (404)
- Triggered when: `productApi.getBySlug` returns null/undefined, or API returns 404
- State: `notFound = true`
- UI:
```tsx
if (notFound) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <AlertTriangle className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Không tìm thấy sản phẩm</h1>
        <p className="text-muted-foreground">Sản phẩm có thể đã bị xóa hoặc không tồn tại.</p>
        <Button asChild>
          <Link to="/san-pham">Quay lại cửa hàng</Link>
        </Button>
      </div>
    </div>
  )
}
```

#### Network / API Failure
- Triggered when: `productApi.getBySlug` throws (network error, 500, timeout)
- State: `networkError = true`
- UI:
```tsx
if (networkError) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <AlertTriangle className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Đã có lỗi xảy ra</h1>
        <p className="text-muted-foreground">Không thể tải thông tin sản phẩm. Vui lòng thử lại.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
          <Button asChild>
            <Link to="/san-pham">Quay lại cửa hàng</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Implementation in data fetch:**
```tsx
useEffect(() => {
  let cancelled = false
  setLoading(true)
  setNotFound(false)
  setNetworkError(false)

  productApi
    .getBySlug(slug)
    .then(async (p) => {
      if (cancelled) return
      if (!p) {
        setNotFound(true)
        return
      }
      setProduct(p)
      // ... fetch related, reviews
    })
    .catch(() => {
      if (!cancelled) setNetworkError(true)
    })
    .finally(() => {
      if (!cancelled) setLoading(false)
    })

  return () => { cancelled = true }
}, [slug])
```

### Out-of-Stock State

**In `usePurchasePanel` hook:**
- `isOutOfStock = product.stock <= 0`
- Returned in `purchaseState`
- PurchasePanel and MobilePurchaseBar read `purchaseState.isOutOfStock`

**In PurchasePanel:**
```tsx
<Button disabled={purchaseState.isOutOfStock} className={cn(purchaseState.isOutOfStock && "opacity-50 cursor-not-allowed")}>
  {purchaseState.isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
</Button>
{purchaseState.isOutOfStock ? null : (
  <Button onClick={purchaseState.handleBuyNow}>Mua ngay</Button>
)}
```

### Empty Reviews State

**In ProductTabs (reviews tab):**
```tsx
{reviews.length === 0 ? (
  <div className="flex flex-col items-center gap-3 py-12 text-center">
    <MessageSquare className="size-10 text-muted-foreground" />
    <p className="text-muted-foreground">Chưa có đánh giá nào</p>
    <p className="text-sm text-muted-foreground">Hãy là người đầu tiên đánh giá sản phẩm này</p>
  </div>
) : (
  // review cards
)}
```

---

## 9. Accessibility Considerations

### Keyboard Navigation
- **Lightbox:** ← → arrows, Esc to close, Tab cycles through controls
- **Thumbnails:** Tab to each, Enter/Space to select
- **Tabs:** Arrow keys to switch tabs (follows WAI-ARIA tabs pattern)
- **Quantity selector:** Tab to minus/number/plus, Enter/Space to adjust
- **Focus management:** When lightbox opens, focus moves inside; when closes, focus returns to trigger

### ARIA Attributes
- **Lightbox:** `role="dialog"`, `aria-label="Ảnh phóng to"`, `aria-modal="true"`
- **Tabs:** `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`
- **Gallery:** `aria-label="Ảnh sản phẩm"`, `aria-current="true"` on active thumbnail
- **Quantity:** `aria-label="Số lượng"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- **Badges:** `aria-hidden="true"` on decorative icons

### Screen Reader
- Image alt text: `alt={product.name}` (already exists)
- Price announced with currency: `aria-label="Giá: 350.000 đồng"`
- Star rating: `aria-label="4.5 sao"` on star container
- Toast notifications: `role="status"` (sonner handles this)

### Color Contrast
- Primary text on background: meets WCAG AA
- Muted text on background: verify contrast ratio ≥ 4.5:1
- Error/destructive text: meets WCAG AA
- Focus rings: visible on all interactive elements

---

## 10. Testing Strategy

### Why No Automated Tests

The `client/` directory has **no existing test infrastructure:**
- No vitest, jest, or mocha in `package.json` dependencies or devDependencies
- No test configuration files (vitest.config.ts, jest.config.js, etc.)
- No `*.test.ts` or `*.test.tsx` files anywhere in `client/src/`
- No `test` script in `client/package.json` (only `dev`, `build`, `lint`, `preview`)

Installing a test framework solely for this task is out of scope (the spec prohibits new dependencies). The verification strategy relies on:

1. **TypeScript type checking** (`npm run build`) — catches type errors
2. **Lint checking** (`npm run lint`) — catches code quality issues
3. **Manual testing checklist** — catches behavioral/visual regressions

### Manual Testing Checklist

**Desktop (≥ lg):**
- [ ] Gallery: click thumbnails to switch main image
- [ ] Gallery: click main image → lightbox opens
- [ ] Lightbox: arrow keys navigate images
- [ ] Lightbox: Esc closes
- [ ] Lightbox: double-click zooms
- [ ] Lightbox: thumbnail strip at bottom works
- [ ] Purchase panel: sticky on scroll
- [ ] Quantity: minus/plus work, disabled states correct
- [ ] Price preview: updates with quantity
- [ ] Add to cart: shows toast, cart drawer opens
- [ ] Buy now: adds qty=1, navigates to /thanh-toan
- [ ] Wishlist: toggle works, heart fills red
- [ ] Wishlist (unauthenticated): shows LoginPromptDialog
- [ ] Tabs: switch between Mô tả / Thông số / Đánh giá
- [ ] Description: "Xem thêm" expands long text
- [ ] Reviews: rating summary shows correct data
- [ ] Reviews: "Xem thêm đánh giá" loads more
- [ ] Related products: horizontal scroll works
- [ ] Loading state: skeleton shows correctly
- [ ] Error state (404): navigate to invalid slug → "Không tìm thấy sản phẩm"
- [ ] Error state (network): disconnect network → "Đã có lỗi xảy ra" + "Thử lại" button
- [ ] Out of stock: CTAs disabled/hidden correctly

**Mobile (< lg):**
- [ ] Gallery: swipeable carousel works
- [ ] Gallery: dot indicators reflect active image
- [ ] Gallery: tap opens lightbox
- [ ] Bottom bar: price + CTA visible
- [ ] Mini-panel: tap price area expands
- [ ] Mini-panel: quantity selector works
- [ ] Mini-panel: "Mua ngay" works
- [ ] Mini-panel: wishlist works
- [ ] Mini-panel: tap outside closes
- [ ] Tabs: horizontal scrollable
- [ ] Related products: horizontal scroll works

**Dark Mode:**
- [ ] All of the above works in dark mode
- [ ] Gallery gradient background adjusts
- [ ] Purchase panel frosted glass effect

**Auth States:**
- [ ] Unauthenticated: "Add to cart" shows LoginPromptDialog
- [ ] Unauthenticated: "Wishlist" shows LoginPromptDialog (changed from toast — see Section 13)
- [ ] Authenticated: all actions work

---

## 11. Verification Steps

After implementation, verify:

1. **Build passes:** `cd client && npm run build` — no TypeScript errors
2. **Lint passes:** `cd client && npm run lint` — no lint errors
3. **Visual check:** Open `/san-pham/:slug` — matches spec layout
4. **Responsive check:** Resize browser — desktop/mobile layouts switch at lg breakpoint
5. **Dark mode:** Toggle theme — all elements adapt
6. **Lightbox:** Open, navigate, zoom, close — all works
7. **Cart flow:** Add to cart → cart drawer opens → checkout works
8. **Buy now flow:** Buy now → navigates to /thanh-toan with item in cart
9. **Wishlist flow:** Toggle wishlist → heart fills/empties
10. **Wishlist auth:** Unauthenticated → LoginPromptDialog appears
11. **Reviews:** Tab switch, rating summary, load more reviews
12. **Loading state:** Refresh page — skeleton shows during load
13. **Error state (404):** Navigate to `/san-pham/nonexistent-slug` → 404 page
14. **Error state (network):** Disable network → refresh → error page with retry
15. **Out of stock:** Find out-of-stock product → CTAs disabled

---

## 12. Potential Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Lightbox z-index conflicts with navbar | Medium | High | Test z-50 against navbar z-40. If conflict, increase lightbox z-index. |
| Mobile purchase bar overlaps content | Medium | Medium | Add `pb-20` to page bottom on mobile to account for fixed bar height. |
| Gallery gradient clashes with certain product images | Low | Medium | Gradient is subtle (15% opacity). Test with multiple product images. If issue, reduce opacity or make gradient optional. |
| Both gallery components mount simultaneously | Low | Low | Both mount but only one is visible via CSS. Acceptable trade-off for CSS-based responsive. |
| Framer Motion `AnimatePresence` causes layout shift | Low | Medium | Use `mode="wait"` on AnimatePresence to prevent layout shift during transitions. |
| Lightbox double-click zoom conflicts with image navigation | Medium | Medium | Implement zoom only on the main lightbox image, not on thumbnails. Use `onDoubleClick` handler. |
| Tab content height changes cause jank | Low | Low | Use `AnimatePresence mode="wait"` for tab content transitions. |
| Review images without `resolveImageUrl()` | Low | Low | Spec explicitly says to use `resolveImageUrl()` for review images. Verify in ReviewCard implementation. |

---

## 13. Design Decisions Resolved

### Wishlist Auth Behavior

**Decision:** Use `LoginPromptDialog` for wishlist when unauthenticated.

**Rationale:**
- Current behavior is inconsistent: cart uses `LoginPromptDialog` (line 516), but wishlist uses `toast.error` (line 151) on the product detail page
- `LoginPromptDialog` is already used for wishlist on `product-card.tsx:180` — the same pattern exists elsewhere in the codebase
- `LoginPromptDialog` provides a clearer UX: user sees a dialog with "Đăng nhập" button that redirects to login with return URL
- A toast error is dismissible and forgettable — user must figure out what to do next
- Consistency: both cart and wishlist auth prompts should behave the same way

**Rejected alternative:** Keep toast error for wishlist.
- Reason: inconsistent with cart behavior on the same page, inconsistent with product-card.tsx behavior, worse UX (no clear action path)

**Implementation change:** In `usePurchasePanel` hook, the `handleWishlist` function will set `loginOpen = true` (via a callback or state lift) instead of calling `toast.error`. The `LoginPromptDialog` is rendered in `ProductDetailPage` and controlled by the same `loginOpen` state.

**This is a UX behavior change from the current implementation** — the wishlist button on the product detail page will now show a login dialog instead of a toast error when the user is not authenticated.

---

## 14. Assumptions Requiring Confirmation

| Assumption | Status | Action if Wrong |
|---|---|---|
| `bg-grid` CSS class exists in `index.css` | Verified in spec (assumption #8) | If missing, add `.bg-grid { background-image: ... }` to `index.css` |
| `product.salePrice` is number or null/undefined | Verified in spec (assumption #3) | If 0 is used instead of null, adjust `displayPrice` calculation |
| `@tailwindcss/typography` is installed (for `prose` class) | Verified in `package.json:29` | Already installed — no action needed |
| Sonner toast has `role="status"` for screen readers | Standard sonner behavior | If not, add `aria-live="polite"` to toast container |
| Framer Motion `AnimatePresence` supports `mode="wait"` | Framer Motion v13 feature | If not available, use `onExitComplete` callback instead |

---

## Implementation Summary

| Phase | Files | Description |
|---|---|---|
| Phase 1 | 2 files | Shared foundation (StarRating, usePurchasePanel) |
| Phase 2 | 3 files | Gallery components (Lightbox, Desktop, Mobile) |
| Phase 3 | 2 files | Purchase panels (Desktop, Mobile) — receive purchaseState as props |
| Phase 4 | 3 files | Tabs & reviews (ProductTabs, RatingSummary, ReviewCard) |
| Phase 5 | 1 file | Page composition (rewrite product-detail-page.tsx) |

**Total: 10 new files + 1 modified file = 11 files touched**
