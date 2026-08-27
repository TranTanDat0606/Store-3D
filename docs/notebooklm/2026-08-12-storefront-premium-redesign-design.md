# Storefront Premium Redesign — Design Doc

Date: 2026-08-12
Status: Approved

## Problem

After the first storefront pass (hero showcase, category feature cards, Hot
Sale, basic cart drawer restyle), the storefront still reads like a standard
e-commerce template. The goal now is to elevate it to a **futuristic 3D
marketplace / premium digital showroom**: dark ocean blue + black, glass,
depth, subtle glow, clean and professional — while keeping all existing data,
API contracts, auth, and business logic unchanged.

## Constraints (user-mandated)

- Do NOT change backend/API logic unless strictly required (none required here).
- Keep every existing feature working: add-to-cart + login gate, quantity,
  remove, subtotal, product navigation, category navigation.
- Reuse existing data/API/components/types/helpers (`ProductCard`,
  `ProductGridSkeleton`, `Badge`, `Button`, `EmptyState`, `resolveImageUrl`,
  `formatCurrency`, `calculateDiscountPercent`, `cn`, `motion`).
- No new npm dependencies (framer-motion already installed).
- Light/dark theme toggle must keep working; new sections must render well in
  both themes.
- Responsive: mobile-first priority, desktop must still look premium.
- Avoid: neon overuse, cyberpunk, too many gradients, too many animations,
  identical cards, border-heavy UI, e-commerce-template look.

## Design language

- Keywords: Futuristic, 3D Marketplace, Premium, Digital Showroom, Modern
  E-commerce, Dark Ocean, Glass, Depth, Subtle Glow, Clean, Professional.
- Palette: dark ocean blue + black base; restrained cyan/blue accent + glow.
- Emphasis: visual hierarchy, whitespace, depth, typography.

## Design decisions (approved)

### 0. Shared foundation

- Refactor `--primary`/`--ring` hue from violet to ocean blue (~250 deg) in
  `client/src/index.css` so navbar, badges, buttons, and links stay cohesive
  across the whole app in both light and dark themes.
- Add two small CSS utilities in `index.css`:
  - `.bg-grid` — subtle technical grid line pattern driven by `--border` so it
    adapts to light/dark.
  - `.scroll-slim` — thin, unobtrusive scrollbar for scroll areas.
  - Optional minimal keyframes for soft floating glow.

### A. Categories section — asymmetric mosaic

`client/src/components/home/categories-section.tsx` (new), consumed by
`home-page.tsx` with the existing `categories` state.

- Layout: `grid grid-cols-2 lg:grid-cols-4` mosaic; card size/composition
  varies per index pattern (spotlight large / tall image / glass numbered /
  wide horizontal) so cards never look identical.
- Card treatment: glass surface (`bg-card/50 backdrop-blur-xl`), soft border,
  per-card accent glow behind the artwork, `.bg-grid` micro-grid, floating
  index "01/02/…", big typographic index.
- Hover: lift, image zoom, glow intensifies. Subtle, not exaggerated.
- Data/navigation unchanged: `to=` `/san-pham?categorySlug=${cat.slug}`,
  image via `resolveImageUrl`, fallback `Layers` icon.

### B. Featured Products — 3D showroom card

`client/src/components/product/product-card.tsx` (redesign; shared with
product list/detail/wishlist so all benefit).

- Image is the focal point: layered glow backdrop, `.bg-grid`, top light
  reflection line.
- Badges: discount `-xx%` (destructive), "Nổi bật" (ocean accent); "Hết hàng"
  overlay kept; wishlist button kept.
- Hover (desktop): gentle image zoom, card lift + elevation, glow border, and
  a **CTa bar slides up** over the image bottom ("Thêm vào giỏ").
- Mobile: keep the always-visible round add-to-cart button (no hover).
- Info block, kept compact: rating → name (2 lines) → price (+ strikethrough
  original). Login gate & wishlist handlers unchanged.
- `hideAddToCart` prop still respected (wishlist page).

### C. Second product section (Hot Sale) — editorial deal list

`client/src/components/home/hot-sale-section.tsx` (new), consumed by
`home-page.tsx` with the existing `hotSale` state.

- Visually distinct from Featured: asymmetric two-column editorial layout.
- Right/spotlight: first product as a large spotlight card — big artwork,
  circular "-xx%" deal badge, glow, name/rating/price, gradient CTA.
- Left/side column: numbered deal rows "01…06" — compact glass horizontal
  cards (small thumbnail, name, price + discount, add button).
- Uses up to 8 real discounted products; hides entirely when empty (existing
  `hotSale.length > 0` guard preserved).

### D. Cart drawer — premium glass drawer

`client/src/components/cart/cart-drawer.tsx` (rewrite of the panel contents;
`CartContext` untouched).

- Replace Radix `Dialog` shell with a framer-motion `AnimatePresence` panel:
  slides in from right, blurred overlay, fade/scale exit. Escape closes,
  body scroll is locked while open.
- Header: brand icon chip + "Giỏ hàng" + count badge + close button.
- Item rows: glass cards, glow behind thumbnail, name, unit price, framed
  quantity stepper, remove action; animated with `motion.div layout` so
  add/remove/quantity changes animate smoothly.
- Footer: glass summary panel, subtotal highlighted, gradient "Thanh toán"
  CTA + "Tiếp tục mua" secondary.
- Empty state: designed illustration — shopping bag icon inside a glowing
  ring over grid + gradient, plus CTA "Khám phá sản phẩm".
- Same functions/data: `items`, `isOpen`, `closeCart`, `updateQuantity`,
  `removeItem`, `subtotal`, `goToCheckout` (`/thanh-toan`).
- No fake discount/shipping lines (only real `subtotal`).

## Files

- Modify `client/src/index.css`
- Modify `client/src/components/product/product-card.tsx`
- Modify `client/src/components/product/product-card-skeleton.tsx`
- Modify `client/src/components/cart/cart-drawer.tsx`
- Modify `client/src/pages/home-page.tsx` (use new section components)
- Create `client/src/components/home/categories-section.tsx`
- Create `client/src/components/home/hot-sale-section.tsx`

## Verification

- `npm.cmd run build` (client) — tsc + vite build pass.
- `npm.cmd run lint` (client) — no new errors (only pre-existing warnings).
- Browser smoke: home sections render with real data, cart drawer
  open/close/add/remove/quantity/subtotal, login gate intact, featured/hot
  sale navigation intact; responsive at mobile + desktop; acceptable in light
  and dark themes; zero console errors.

## Out of scope

- No API / server changes.
- No CartContext / AuthContext changes.
- No product-list / product-detail page rewrites (they inherit the new
  ProductCard visual by design).