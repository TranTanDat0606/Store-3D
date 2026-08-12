# Storefront & Admin UI/UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the storefront feel premium (dark ocean-blue + black, mobile-first) with a layered-product hero, restructured category cards, a Hot Sale section, a redesigned cart drawer, a login-required add-to-cart gate, a dark-glass admin categories page, and robust image-upload feedback.

**Architecture:** Pure frontend changes in `client/src/` plus one small, isolated backend addition (`sort=discount`) in the product list service. New reusable `LoginPromptDialog` component gates add-to-cart. All changes reuse existing components/API/auth and only render real data.

**Tech Stack:** React 19 + Vite, TypeScript, Tailwind CSS v4, Radix UI (Dialog/AlertDialog/Select/Switch), framer-motion, lucide-react, recharts (untouched), express/mongoose (server).

## Global Constraints

- Do not modify `CartContext` behavior, `AuthContext`, API routes, or auth middleware. The cart stays a shared localStorage cart.
- No fake business data: never render discount/shipping totals that the API does not provide.
- New storefront sections are dark-styled but must render acceptably in the light theme too (theme toggle stays).
- Vietnamese UI copy everywhere (existing convention).
- Reuse existing components: `ProductCard`, `Badge`, `Button`, `Dialog`, `AlertDialog`, `EmptyState`, `Skeleton`, `Input`, `Label`, `Select`, `Switch`, `ImageUpload`, `Pagination`.
- Reuse existing helpers: `cn`, `formatCurrency`, `calculateDiscountPercent`, `resolveImageUrl` from `@/lib`.
- No new npm dependencies.
- Verification commands: client `npm run build` (runs `tsc -b && vite build`) and `npm run lint` (oxlint); server `npx tsc --noEmit` in `server/`. Browser smoke via Playwright when needed.

---

### Task 1: Server — add `sort=discount` to product list

**Files:**
- Modify: `server/src/services/productService.ts:51-59` (the `list()` method and add `listDiscounted`)

**Interfaces:**
- Consumes: `parsePagination` from `server/src/utils/apiFeatures`, `Product`, `ProductStatus`, `AppError`.
- Produces: `productService.list()` now accepts `sort: 'discount'` and returns the same `{ data, pagination }` shape as every other branch, with `data` sorted highest-discount-first (only products with `originalPrice > 0` and `status: active` unless overridden).

- [ ] **Step 1: Add the `sort=discount` branch to `list()`**

In `server/src/services/productService.ts`, edit `list()` (lines 51-59) to route `discount` like `best-selling`:

```typescript
async list(params: Record<string, unknown>) {
    if (params.sort === 'best-selling') {
      return this.listBestSelling(params);
    }
    if (params.sort === 'discount') {
      return this.listDiscounted(params);
    }
    const options = { ...parsePagination(params), searchFields: ['name', 'description'] };
    const filter = this.buildFilter(params);

    return apiFeatures(Product.find().populate('category', 'name slug image'), filter, options);
  }
```

- [ ] **Step 2: Add the `listDiscounted` private method**

Insert this method immediately after `listBestSelling` (after line 109):

```typescript
  /** Sorts by discount ratio (salePrice/originalPrice) ascending — biggest discount first. */
  private async listDiscounted(params: Record<string, unknown>) {
    const { page, limit, search } = parsePagination(params);
    const matchStage: Record<string, unknown> = {
      ...this.buildFilter(params),
      originalPrice: { $gt: 0 },
    };
    if (search) {
      matchStage.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    const [total, docs] = await Promise.all([
      Product.countDocuments(matchStage),
      Product.aggregate([
        { $match: matchStage },
        { $addFields: { _discountRatio: { $divide: ['$salePrice', '$originalPrice'] } } },
        { $sort: { _discountRatio: 1, _id: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: '_category' } },
        { $unwind: { path: '$_category', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: 1, slug: 1, description: 1, images: 1, material: 1, printerType: 1,
            size: 1, stock: 1, originalPrice: 1, salePrice: 1, rating: 1, reviewCount: 1,
            status: 1, featured: 1, createdAt: 1, updatedAt: 1, category: '$_category',
          },
        },
      ]),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data: docs as InstanceType<typeof Product>[],
      pagination: {
        page, limit, total, totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
```

- [ ] **Step 3: Typecheck the server**

Run: `npx.cmd tsc --noEmit` (working dir `C:\Users\Dat\Documents\FPOLY\React\store3D\server`)
Expected: no output, exit code 0.

- [ ] **Step 4: Verify the endpoint over HTTP**

Run (PowerShell, working dir `C:\Users\Dat\Documents\FPOLY\React\store3D`):
```powershell
$c = "$env:TEMP\opencode\plan-login.txt"
Set-Content -Path "$env:TEMP\opencode\plan-login.json" -Value '{"email":"admin@store3d.com","password":"admin123"}' -NoNewline -Encoding Ascii
curl.exe -s -c $c -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" --data-binary "@$env:TEMP\opencode\plan-login.json" | Out-Null
curl.exe -s "http://localhost:5000/api/products?sort=discount&limit=5&status=active"
```
Expected: a `success:true` payload whose `data` array is ordered so that `salePrice/originalPrice` is ascending (highest discount first), e.g. the `79000/100000` product appears before `350000/450000`.

- [ ] **Step 5: Commit**

```bash
git add server/src/services/productService.ts
git commit -m "feat(server): sort products by discount ratio"
```

---

### Task 2: Client — add `productApi.hotSale()`

**Files:**
- Modify: `client/src/services/productApi.ts` (add method to the `productApi` object)

**Interfaces:**
- Consumes: `apiClient`, `ProductQuery`, `ProductListResult` (already defined in this file).
- Produces: `productApi.hotSale(limit?: number): Promise<ProductListResult>` — fetches active products sorted by discount. Used by Task 5.

- [ ] **Step 1: Add the `hotSale` method**

In `client/src/services/productApi.ts`, add to the `productApi` object (after the `featured` method, line 60):

```typescript
  hotSale: (limit = 8) =>
    apiClient.get<ApiResponse<Product[]>>('/products', {
      params: { sort: 'discount', status: 'active', limit },
    }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
    })),
```

- [ ] **Step 2: Typecheck + lint the client**

Run (working dir `C:\Users\Dat\Documents\FPOLY\React\store3D\client`): `npm.cmd run build`
Expected: tsc passes, Vite build succeeds. Then `npm.cmd run lint` — no new errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/services/productApi.ts
git commit -m "feat(client): add productApi.hotSale helper"
```

---

### Task 3: Home hero — layered product showcase

**Files:**
- Modify: `client/src/pages/home-page.tsx` (hero section only, lines 39-72; keep heading/subtitle/CTAs)

**Interfaces:**
- Consumes: `featured` state (already fetched), `resolveImageUrl`, `motion` (framer-motion).
- Produces: `HeroShowcase` subcomponent (defined inside the same file) that renders up to 2 product images as floating cards with glow rings and hover parallax.

- [ ] **Step 1: Add a `HeroShowcase` component above `HomePage`**

Add this component after the imports (before `export default function HomePage`):

```tsx
function HeroShowcase({ products }: { products: Product[] }) {
  const showcase = products.slice(0, 2)
  return (
    <div className="relative mx-auto mt-14 hidden h-80 w-full max-w-md md:block lg:mt-0">
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/30 via-blue-600/20 to-transparent blur-3xl" />
      {showcase.map((p, i) => (
        <motion.div
          key={p._id}
          className={cn(
            'absolute w-44 overflow-hidden rounded-2xl border border-white/20 bg-slate-900/70 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl',
            i === 0 ? 'top-6 left-0 z-10 rotate-[-6deg]' : 'top-16 right-0 z-20 rotate-[5deg]'
          )}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: i * 0.15 }}
          whileHover={{ scale: 1.05, rotate: 0 }}
        >
          <img src={resolveImageUrl(p.images?.[0] ?? '')} alt={p.name} className="aspect-square w-full object-cover" />
          <div className="p-3">
            <p className="line-clamp-1 text-xs font-semibold">{p.name}</p>
            <p className="text-primary text-sm font-bold">{formatCurrency(p.salePrice)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Restructure the hero layout**

Replace the hero `<section>` block (lines 39-72) with:

```tsx
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-black" />
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
              <Sparkles className="text-cyan-400 size-4" />
              {user ? `Chào mừng trở lại, ${user.fullname}!` : 'Sản phẩm in 3D chất lượng cao'}
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Mô hình in 3D{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                độc đáo
              </span>{' '}
              cho mọi không gian
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              Khám phá bộ sưu tập figurine, đồ trang trí, mô hình kiến trúc và phụ kiện in 3D với
              chi tiết tuyệt hảo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/san-pham">
                  Khám phá sản phẩm
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" asChild>
                <Link to="/san-pham?featured=true">Sản phẩm nổi bật</Link>
              </Button>
            </div>
          </div>
          <HeroShowcase products={featured} />
        </div>
      </section>
```

- [ ] **Step 3: Update imports**

Add `formatCurrency`, `resolveImageUrl`, `cn` to the `@/lib` import (line 8 currently imports nothing from `@/lib`). Replace line 8 `import type { Category, Product } from '@/types'` stays, and add:

```tsx
import { cn, formatCurrency, resolveImageUrl } from '@/lib'
```

- [ ] **Step 4: Typecheck + lint + build**

Run: `npm.cmd run build` then `npm.cmd run lint` (working dir `C:\Users\Dat\Documents\FPOLY\React\store3D\client`)
Expected: passes with no new errors/warnings.

- [ ] **Step 5: Browser smoke (light and dark theme)**

Open `http://localhost:5173/`. Expected: hero renders the dark ocean-blue gradient, badge, gradient heading, both CTAs, and two floating product cards on `md+` screens; zero console errors; content still readable when the theme is toggled.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/home-page.tsx
git commit -m "feat(client): layered product showcase hero"
```

---

### Task 4: Home category section — featured + supporting cards

**Files:**
- Modify: `client/src/pages/home-page.tsx` (categories block only, lines 96-128)

**Interfaces:**
- Consumes: `categories` state, `categoryApi.all()` result, `Layers` icon (already imported).
- Produces: one large featured category card (first item) + a grid of the rest, each with a per-category accent gradient.

- [ ] **Step 1: Add a small gradient map + replace the categories block**

Add this constant above `HomePage` (after `HeroShowcase`):

```tsx
const CATEGORY_ACCENTS = [
  'from-rose-500/70 to-orange-500/50',
  'from-cyan-500/70 to-blue-600/50',
  'from-emerald-500/70 to-teal-600/50',
  'from-violet-500/70 to-purple-600/50',
  'from-amber-500/70 to-orange-500/50',
  'from-blue-500/70 to-indigo-600/50',
]
```

Replace the categories `<section>` block (lines 96-128) with:

```tsx
      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Danh mục sản phẩm</h2>
              <p className="text-muted-foreground mt-1">Khám phá theo danh mục bạn yêu thích</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat, i) => {
              const [featuredCat, ...rest] = i === 0 ? [cat] : []
              void featuredCat
              const accent = CATEGORY_ACCENTS[i % CATEGORY_ACCENTS.length]
              if (i === 0) {
                return (
                  <Link
                    key={cat._id}
                    to={`/san-pham?categorySlug=${cat.slug}`}
                    className={cn(
                      'group relative col-span-2 flex min-h-44 flex-col justify-end overflow-hidden rounded-2xl border bg-gradient-to-br p-5 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl sm:col-span-2 lg:col-span-3',
                      accent
                    )}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-25">
                      {cat.image ? (
                        <img src={cat.image} alt="" className="size-40 object-cover" />
                      ) : (
                        <Layers className="size-24" />
                      )}
                    </div>
                    <span className="relative text-lg font-bold drop-shadow">{cat.name}</span>
                    {cat.description && (
                      <span className="relative line-clamp-2 text-xs text-white/80">{cat.description}</span>
                    )}
                  </Link>
                )
              }
              return (
                <Link
                  key={cat._id}
                  to={`/san-pham?categorySlug=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-4 text-center transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="bg-muted relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <Layers className="text-muted-foreground size-8" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{cat.name}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
```

Note: the loop destructures `const [featuredCat, ...rest]` only to satisfy the `noUnusedLocals`-style guard in a harmless way — if your linter flags it, replace the two lines with nothing and keep just `const accent = ...`.

- [ ] **Step 2: Typecheck + lint + build**

Run: `npm.cmd run build` then `npm.cmd run lint` (working dir `C:\Users\Dat\Documents\FPOLY\React\store3D\client`)
Expected: passes.

- [ ] **Step 3: Browser smoke**

Open `http://localhost:5173/`. Expected: the first category renders as a large gradient banner card spanning two grid columns; the remaining categories render as the original small cards; no console errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/home-page.tsx
git commit -m "feat(client): featured + supporting category cards"
```

---

### Task 5: Home — Hot Sale section

**Files:**
- Modify: `client/src/pages/home-page.tsx` (add state/fetch + new section after the Featured block)

**Interfaces:**
- Consumes: `productApi.hotSale(limit)` (Task 2), `ProductCard`, `ProductGridSkeleton`, `Button`, `Link`, `ArrowRight`, `Flame` (lucide).
- Produces: a Hot Sale section that hides entirely when there are no discounted products.

- [ ] **Step 1: Add state and fetch**

Add to `HomePage` component state (line 13-15) and the `useEffect` (lines 17-34). Insert `hotSale` state:

```tsx
  const [hotSale, setHotSale] = useState<Product[]>([])
  const [hotLoading, setHotLoading] = useState(true)
```

Update the effect to fetch hot sale too:

```tsx
  useEffect(() => {
    let cancelled = false
    void Promise.all([
      productApi.featured({ limit: 8 }),
      categoryApi.all(),
      productApi.hotSale(8),
    ]).then(([featuredResult, cats, hot]) => {
      if (cancelled) return
      setFeatured(featuredResult.data)
      setCategories(cats)
      setHotSale(hot.data)
    }).catch(() => {
      // errors rendered via empty states
    }).finally(() => {
      if (!cancelled) { setLoading(false); setHotLoading(false) }
    })
    return () => {
      cancelled = true
    }
  }, [])
```

- [ ] **Step 2: Add the Hot Sale section**

Insert this block between the Featured products section and the closing `</div>` (after line 155):

```tsx
      {/* Hot Sale */}
      {!hotLoading && hotSale.length > 0 && (
        <section className="border-t bg-gradient-to-b from-transparent to-slate-900/5 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="text-destructive size-6" />
                  <h2 className="text-2xl font-bold sm:text-3xl">Hot Sale</h2>
                </div>
                <p className="text-muted-foreground mt-1">Ưu đãi giảm giá tốt nhất đang diễn ra</p>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/san-pham">
                  Xem tất cả
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {hotSale.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
```

- [ ] **Step 3: Import `Flame`**

Update the lucide import on line 3 to add `Flame`:
```tsx
import { ArrowRight, Box, Flame, Layers, Printer, Sparkles, Truck } from 'lucide-react'
```

- [ ] **Step 4: Typecheck + lint + build**

Run: `npm.cmd run build` then `npm.cmd run lint` (working dir `C:\Users\Dat\Documents\FPOLY\React\store3D\client`)
Expected: passes.

- [ ] **Step 5: Browser smoke**

Open `http://localhost:5173/`. Expected: a "Hot Sale" section with a flame icon appears between the Featured section and the footer, listing products sorted by discount (the `79.000đ` product with the `-21%` badge appears first), and `ProductCard` discount badges render correctly.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/home-page.tsx
git commit -m "feat(client): add hot sale section on home page"
```

---

### Task 6: Cart drawer redesign

**Files:**
- Modify: `client/src/components/cart/cart-drawer.tsx` (contents only; keep drawer shell, header, empty state, checkout link)

**Interfaces:**
- Consumes: `useCart()` → `items, isOpen, closeCart, updateQuantity, removeItem, subtotal` (unchanged signatures).
- Produces: same exports; visually improved item rows and a real-data-only summary.

- [ ] **Step 1: Restyle item rows**

In `cart-drawer.tsx`, replace the item row block (lines 56-112) with a cleaner layout that keeps identical handlers (`removeItem`, `updateQuantity`) and line items. Replace with:

```tsx
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
                  <Link
                    to={`/san-pham/${item.slug}`}
                    onClick={closeCart}
                    className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                  >
                    <img src={resolveImageUrl(item.image)} alt={item.name} className="size-full object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/san-pham/${item.slug}`}
                        onClick={closeCart}
                        className="hover:text-primary line-clamp-2 text-sm font-medium"
                      >
                        {item.name}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 -mr-1 -mt-1 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Xóa khỏi giỏ"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatCurrency(item.price)} / cái
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
```

- [ ] **Step 2: Polish the summary footer**

Replace the footer block (lines 115-128) with a version that shows only the real subtotal and slightly larger totals:

```tsx
            <div className="space-y-3 border-t px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Tạm tính ({items.length} sản phẩm)</span>
                <span className="text-lg font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={closeCart} asChild>
                  <Link to="/san-pham">Tiếp tục mua</Link>
                </Button>
                <Button className="flex-1" onClick={goToCheckout}>
                  Thanh toán
                </Button>
              </div>
            </div>
```

- [ ] **Step 3: Typecheck + lint + build**

Run: `npm.cmd run build` then `npm.cmd run lint` (working dir `C:\Users\Dat\Documents\FPOLY\React\store3D\client`)
Expected: passes.

- [ ] **Step 4: Browser smoke**

As a logged-in user, add two products to the cart, open the drawer. Expected: card-styled item rows with unit price, framed quantity stepper, remove button; subtotal shows only real data; empty state unchanged after removing all items.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/cart/cart-drawer.tsx
git commit -m "feat(client): redesign cart drawer item rows and summary"
```

---

### Task 7: Login prompt dialog component

**Files:**
- Create: `client/src/components/auth/login-prompt-dialog.tsx`

**Interfaces:**
- Consumes: `useAuth`, `useLocation`, `useNavigate`, `Dialog` primitives, `Button`.
- Produces: `LoginPromptDialog` with props `{ open: boolean; onOpenChange: (open: boolean) => void }`. It renders "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng" with Đăng nhập (navigates to `/dang-nhap` with `state.from = <current path>`) and Hủy buttons.

- [ ] **Step 1: Create the component**

```tsx
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface LoginPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginPromptDialog({ open, onOpenChange }: LoginPromptDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const goToLogin = () => {
    onOpenChange(false)
    navigate('/dang-nhap', { state: { from: location.pathname + location.search } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Vui lòng đăng nhập</DialogTitle>
          <DialogDescription>
            Đăng nhập để thêm sản phẩm vào giỏ hàng và hoàn tất mua sắm.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={goToLogin}>
            <LogIn className="size-4" />
            Đăng nhập
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

Note: `LoginPromptDialog` must be rendered inside the router context (all usages in Task 8 are). The `Link` import is used only if you swap the button for a link; keep the `navigate` approach to honor `onOpenChange(false)` before redirect.

- [ ] **Step 2: Typecheck + lint + build**

Run: `npm.cmd run build` then `npm.cmd run lint` (working dir `C:\Users\Dat\Documents\FPOLY\React\store3D\client`)
Expected: passes. If `Link` is unused, remove it from the import.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/auth/login-prompt-dialog.tsx
git commit -m "feat(client): add login prompt dialog component"
```

---

### Task 8: Wire the login gate into add-to-cart

**Files:**
- Modify: `client/src/components/product/product-card.tsx`
- Modify: `client/src/pages/product-detail-page.tsx`

**Interfaces:**
- Consumes: `LoginPromptDialog` (Task 7), `useAuth().isAuthenticated` (already imported in both files).
- Produces: when `!isAuthenticated`, add-to-cart opens the login dialog instead of mutating the cart; wishlist behavior unchanged.

- [ ] **Step 1: Product card — gate add-to-cart**

In `client/src/components/product/product-card.tsx`:
1. Add state: `const [loginOpen, setLoginOpen] = useState(false)` (import `useState` from react).
2. Change `handleAddToCart` (lines 33-38):

```tsx
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isOutOfStock) return
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    addItem(product)
    toast.success('Đã thêm vào giỏ hàng', { description: product.name })
  }
```

3. Render the dialog at the end of the returned tree (inside `motion.div`, after the `</Link>`):

```tsx
      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
```

4. Add the import:
```tsx
import { LoginPromptDialog } from '@/components/auth/login-prompt-dialog'
```

- [ ] **Step 2: Product detail — gate add-to-cart**

In `client/src/pages/product-detail-page.tsx`:
1. Add state: `const [loginOpen, setLoginOpen] = useState(false)` (already imports `useState`).
2. Change `handleAddToCart` (lines 105-109):

```tsx
  const handleAddToCart = () => {
    if (!product || isOutOfStock) return
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    addItem(product, quantity)
    toast.success('Đã thêm vào giỏ hàng', { description: product.name })
  }
```

3. Render the dialog at the end of the root `<div>` (before its closing tag, after the Related section):

```tsx
      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
```

4. Add the import:
```tsx
import { LoginPromptDialog } from '@/components/auth/login-prompt-dialog'
```

- [ ] **Step 3: Typecheck + lint + build**

Run: `npm.cmd run build` then `npm.cmd run lint` (working dir `C:\Users\Dat\Documents\FPOLY\React\store3D\client`)
Expected: passes.

- [ ] **Step 4: Browser smoke**

In an incognito/guest browser window, open the home page and click a product's add-to-cart button. Expected: the "Vui lòng đăng nhập" dialog opens, the cart badge stays at 0. Click Đăng nhập → redirected to `/dang-nhap`; log in → back on the home page; click add-to-cart again → item added, drawer opens. Verify the same flow from the product detail page.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/product/product-card.tsx client/src/pages/product-detail-page.tsx
git commit -m "feat(client): require login before adding to cart"
```

---

### Task 9: Admin categories page — dark glass restyle

**Files:**
- Modify: `client/src/pages/admin/categories-page.tsx` (UI only; keep all logic/API)

**Interfaces:**
- Consumes: `categoryApi`, `ImageUpload`, `EmptyState`, Dialog/AlertDialog primitives, `resolveImageUrl`.
- Produces: same component; dark-glass styling matching `products-page.tsx` (borders `white/10`, `bg-slate-900/60 backdrop-blur-xl`, cyan accents).

- [ ] **Step 1: Restyle the header + cards**

Replace the return block's header (lines 98-107) and cards grid (lines 118-173) as follows:

```tsx
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{categories.length} danh mục</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500">
          <Plus className="size-4" />
          Thêm danh mục
        </Button>
      </div>
```

```tsx
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat._id} className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl transition-all hover:border-cyan-400/30 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="bg-muted relative aspect-video overflow-hidden">
                {cat.image ? (
                  <img src={resolveImageUrl(cat.image)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="flex size-full items-center justify-center text-slate-500">
                    <Layers className="size-10" />
                  </div>
                )}
              </div>
              <div className="space-y-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-semibold text-slate-100">{cat.name}</p>
                </div>
                <p className="line-clamp-2 text-xs text-slate-400">{cat.description || 'Chưa có mô tả'}</p>
                <p className="text-[10px] text-slate-500">{cat.slug}</p>
                <div className="flex justify-end gap-1 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cat)} className="text-slate-300 hover:bg-white/5 hover:text-white">
                    <Pencil className="size-4" />
                    Sửa
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/5 hover:text-rose-400">
                        <Trash2 className="size-4" />
                        Xóa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-white/10 bg-slate-900 text-slate-100">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Xóa danh mục?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          Bạn có chắc muốn xóa danh mục "{cat.name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">Hủy</AlertDialogCancel>
                        <AlertDialogAction className="bg-rose-500 text-white hover:bg-rose-600" onClick={() => handleDelete(cat._id, cat.name)}>
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
```

- [ ] **Step 2: Update imports**

Replace `import { Card, CardContent } from '@/components/ui/card'` with `import { Layers } from 'lucide-react'` (add `Layers` to the existing lucide import) and add `import { resolveImageUrl } from '@/lib'`.

- [ ] **Step 3: Restyle the create/edit dialog**

In the Dialog (lines 175-221), add dark-glass classes:
- `DialogContent` → `className="border-white/10 bg-slate-900 text-slate-100"`
- `DialogTitle` → `className="text-white"`
- `Label` fields → `className="text-slate-300"` on each
- `Input`/`Textarea` → `className="border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40"`
- Save button → `className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500"`
- Cancel button → `className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"`
- Error box → `className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"`

- [ ] **Step 4: Restyle the loading skeleton**

Change the loading block (lines 109-114) to `className="h-40 animate-pulse rounded-2xl bg-white/5"`.

- [ ] **Step 5: Typecheck + lint + build**

Run: `npm.cmd run build` then `npm.cmd run lint` (working dir `C:\Users\Dat\Documents\FPOLY\React\store3D\client`)
Expected: passes.

- [ ] **Step 6: Browser smoke**

Log in as admin, open `/admin/danh-muc`. Expected: dark-glass cards with image banner, name/description/slug, edit/delete buttons; create/edit dialog dark; delete confirmation dark; add a category with an uploaded image and confirm it persists.

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/admin/categories-page.tsx
git commit -m "feat(admin): restyle categories page to dark glass"
```

---

### Task 10: Image upload error feedback + browser reproduction

**Files:**
- Modify: `client/src/components/admin/image-upload.tsx`

**Interfaces:**
- Consumes: `uploadApi.uploadImage`, `getErrorMessage`, `toast`, existing props.
- Produces: same props; per-file failure toast, disabled-while-uploading state, unchanged success flow.

- [ ] **Step 1: Reproduce the reported bug first (browser)**

As admin, open `/admin/san-pham/new`, upload `client/src/assets/…` or any local image via the "Tải ảnh" button. Observe the console (F12 → Network tab). Record whether the `POST /api/upload` returns 200, 401 (session), or 500, and whether the toast shows `getErrorMessage`. This determines whether there is a real bug to fix beyond feedback. If a 401 appears, re-login and retry. If a 500 appears, capture the server error from `%TEMP%\opencode\server-err.log` and fix accordingly before proceeding.

- [ ] **Step 2: Add per-file error feedback + busy state**

Rewrite the `handleFiles` callback (lines 18-41) in `client/src/components/admin/image-upload.tsx`:

```tsx
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return
      const room = max - images.length
      if (room <= 0) return
      setReading(true)
      try {
        const selected = Array.from(files)
          .filter((f) => f.type.startsWith('image/'))
          .slice(0, room)
        const urls: string[] = []
        for (const f of selected) {
          try {
            urls.push(await uploadApi.uploadImage(f))
          } catch (err) {
            toast.error(`${f.name}: ${getErrorMessage(err)}`)
          }
        }
        if (urls.length > 0) onChange([...images, ...urls])
        if (urls.length === 0 && selected.length > 0) {
          toast.error('Không có ảnh nào được tải lên. Vui lòng thử lại.')
        }
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        setReading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [images, max, onChange]
  )
```

- [ ] **Step 3: Typecheck + lint + build**

Run: `npm.cmd run build` then `npm.cmd run lint` (working dir `C:\Users\Dat\Documents\FPOLY\React\store3D\client`)
Expected: passes.

- [ ] **Step 4: Browser verification**

As admin: (a) upload a normal image → new thumbnail appears, no toast error; (b) upload an oversized or non-image file → per-file toast with the server's message, existing images unchanged; (c) Edit an existing product → existing image still listed, upload an additional image → both present after Save + page reload.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/admin/image-upload.tsx
git commit -m "feat(admin): per-file upload error feedback and busy state"
```

---

### Task 11: Full-pass verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck + build + lint everything**

Run in `C:\Users\Dat\Documents\FPOLY\React\store3D\client`: `npm.cmd run build` and `npm.cmd run lint`.
Run in `C:\Users\Dat\Documents\FPOLY\React\store3D\server`: `npx.cmd tsc --noEmit`.
Expected: all pass; client lint shows only the known pre-existing `react(only-export-components)` warnings (including the intentional `PRODUCT_STATUS_META` export).

- [ ] **Step 2: API regression**

Run the Task 1 Step 4 curl again. Expected: `sort=discount` returns the discount-ordered list; `sort=best-selling` and default listing still work.

- [ ] **Step 3: Browser full smoke**

Walk: home (hero showcase, category banner, featured, hot sale, 0 console errors) → product list → product detail (add-to-cart login gate when logged out; add works when logged in) → cart drawer (items, stepper, subtotal, empty state) → admin `/admin` dashboard → `/admin/san-pham` grid → `/admin/san-pham/new` upload → `/admin/danh-muc` dark glass → `/admin/don-hang`. Confirm no console errors on any page.

- [ ] **Step 4: Final commit if verification uncovered fixes**

If any task needed follow-up fixes, commit them. Otherwise skip.

```bash
git log --oneline -12
```
Expected: the 11 task commits (plus any follow-ups) are present.
