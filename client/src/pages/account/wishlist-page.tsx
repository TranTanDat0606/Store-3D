import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Heart, ShoppingCart, ShoppingBag, Star, Upload } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn, formatCurrency, calculateDiscountPercent, resolveImageUrl } from '@/lib'
import type { Product } from '@/types'

/**
 * Plan 4 T8 — wishlist → `.stitch/designs/account-wishlist.html` (VN verbatim),
 * mounted inside the shared T7 account shell (sidebar/breadcrumb untouched).
 *
 * PRESERVED (logic untouched):
 *  - Data source: `WishlistContext` (`GET /wishlist` via context), loading state.
 *  - Remove-from-wishlist: `toggleWishlist(id)` (server `DELETE /wishlist/:productId`),
 *    same toast copy the product cards use today.
 *  - Per-card add-to-cart: the existing move-to-cart handler byte-for-byte
 *    (`CartContext.addItem` + `wishlistApi.moveToCart` + same success/error toasts).
 *
 * Screen-driven, honest behavior (logged deviations):
 *  - Sort select shows 3 of the screen's 4 options — "Được quan tâm nhất" omitted
 *    (no backing metric on `Product` for "quan tâm"; price sorts are real client-side
 *    sorts, default = server order = "Mới thêm gần nhất").
 *  - "Thêm tất cả vào giỏ hàng" (screen CTA) = `CartContext.addItem` per in-stock
 *    product; the wishlist is NOT emptied (label says "thêm"; removal stays the
 *    explicit heart action = existing `toggleWishlist`).
 *  - Stock status copy derived from real `stock`: >3 "Còn hàng", 1–3 "Sắp hết: còn N
 *    bản" (threshold 3 = presentation only), ≤0 "Tạm hết (Nhận in 48h)" + "Hết hàng"
 *    badge. "Đặt in 48h" card CTA omitted (no on-demand order flow — same call T7
 *    made for the dashboard's "Đặt in theo yêu cầu").
 *  - Card material badge = raw `product.material` enum; the screen's marketing
 *    variants ("Resin SLA", "PLA Silk Gold", "PETG Carbon") have no field backing.
 *  - Banner "Bạn có file 3D muốn in riêng?" kept verbatim; its "Gửi file in 3D"
 *    action routes to `/lien-he` (no file-upload flow exists — same destination the
 *    shell's "Cần hỗ trợ in 3D riêng?" CTA uses). Banner + controls hidden on empty.
 *  - Empty state = the page's existing copy (the screen defines no empty state).
 */

type SortKey = 'recent' | 'price-asc' | 'price-desc'

function stockLabel(stock: number): string {
  if (stock <= 0) return 'Tạm hết (Nhận in 48h)'
  if (stock <= 3) return `Sắp hết: còn ${stock} bản`
  return 'Còn hàng'
}

export default function WishlistPage() {
  useDocumentTitle('Sản phẩm yêu thích')
  const { products, isLoading, toggleWishlist, moveToCart } = useWishlist()
  const { addItem } = useCart()
  const [sort, setSort] = useState<SortKey>('recent')

  const sorted = useMemo(() => {
    if (sort === 'recent') return products
    const arr = [...products]
    arr.sort((a, b) => (sort === 'price-asc' ? a.salePrice - b.salePrice : b.salePrice - a.salePrice))
    return arr
  }, [products, sort])

  const handleMoveToCart = async (product: Product) => {
    try {
      addItem(product)
      await moveToCart(product._id)
      toast.success('Đã chuyển vào giỏ hàng', { description: product.name })
    } catch {
      toast.error('Không thể chuyển vào giỏ hàng')
    }
  }

  const handleRemove = async (product: Product) => {
    try {
      await toggleWishlist(product._id)
      toast.success('Đã xóa khỏi yêu thích', { description: product.name })
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    }
  }

  const inStockCount = products.filter((p) => p.stock > 0).length

  const handleAddAll = () => {
    if (inStockCount === 0) return
    products.forEach((p) => {
      if (p.stock > 0) addItem(p)
    })
    toast.success(
      inStockCount === 1
        ? 'Đã thêm 1 sản phẩm vào giỏ hàng'
        : `Đã thêm ${inStockCount} sản phẩm vào giỏ hàng`
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted h-72 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ================= TITLE & CONTROLS CARD ================= */}
      <div className="border-border bg-card rounded-xl border p-4 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-foreground flex flex-wrap items-center gap-2.5 text-xl font-bold md:text-2xl">
              <span>Sản phẩm yêu thích</span>
              <span className="border-primary/30 bg-primary/10 text-primary rounded-full border px-2.5 py-0.5 text-sm font-normal">
                {products.length}
              </span>
            </h1>
            <p className="text-muted-foreground mt-1 max-w-xl text-xs md:text-sm">
              Bộ sưu tập các mô hình Resin 8K Ultra và FDM độc bản bạn đang quan tâm và theo dõi giá.
            </p>
          </div>

          {/* Hide-on-empty: controls only exist when there is a list to sort/add */}
          {products.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative inline-block text-left">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sắp xếp danh sách yêu thích"
                  className="border-border bg-background text-foreground cursor-pointer appearance-none rounded-lg border py-2 pr-8 pl-3 text-xs focus:border-primary focus:ring-primary/40 focus:outline-none focus:ring-1"
                >
                  <option value="recent">Mới thêm gần nhất</option>
                  <option value="price-asc">Giá: Thấp đến cao</option>
                  <option value="price-desc">Giá: Cao đến thấp</option>
                  {/* Omitted (no backing metric — logged): "Được quan tâm nhất" */}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2" />
              </div>
              <button
                type="button"
                onClick={handleAddAll}
                disabled={inStockCount === 0}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                <ShoppingCart className="size-4" />
                <span>Thêm tất cả vào giỏ hàng</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Danh sách yêu thích trống"
          description="Hãy thêm những sản phẩm bạn thích vào danh sách yêu thích."
          icon={<Heart className="size-7" />}
          action={
            <Button asChild>
              <Link to="/san-pham">Khám phá sản phẩm</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* ================= PRODUCT GRID ================= */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 xl:grid-cols-4">
            {sorted.map((product) => {
              const discountPercent = calculateDiscountPercent(product.originalPrice, product.salePrice)
              const isOutOfStock = product.stock <= 0
              return (
                <article
                  key={product._id}
                  className="border-border bg-card group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                >
                  {/* Media box: the ONE link (image → PDP) */}
                  <div className="bg-muted relative aspect-square overflow-hidden">
                    <Link
                      to={`/san-pham/${product.slug}`}
                      aria-label={product.name}
                      className="block size-full"
                    >
                      <img
                        src={resolveImageUrl(product.images?.[0] ?? '')}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1">
                      {discountPercent > 0 && (
                        <span className="bg-destructive text-destructive-foreground rounded px-2 py-0.5 text-[10px] font-bold shadow-sm">
                          -{discountPercent}%
                        </span>
                      )}
                      <span className="border-border/40 bg-background/90 text-muted-foreground rounded border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                        {product.material}
                      </span>
                      {isOutOfStock && (
                        <span className="bg-muted-foreground/90 text-background rounded px-2 py-0.5 text-[10px] font-bold">
                          Hết hàng
                        </span>
                      )}
                    </div>

                    {/* Unsave (screen: "Bỏ khỏi yêu thích") — existing remove logic */}
                    <button
                      type="button"
                      onClick={() => void handleRemove(product)}
                      title="Bỏ khỏi yêu thích"
                      aria-label={`Bỏ ${product.name} khỏi yêu thích`}
                      className="border-primary/40 bg-background/80 text-primary absolute top-2.5 right-2.5 z-10 flex size-8 items-center justify-center rounded-full border backdrop-blur-sm shadow-md transition-all hover:scale-110 active:scale-95"
                    >
                      <Heart className="size-4 fill-current" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col justify-between gap-2.5 p-3.5">
                    <div>
                      <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Star className="fill-warning text-warning size-3" />
                          <span className="text-foreground font-bold">
                            {product.rating > 0 ? product.rating.toFixed(1) : 'Mới'}
                          </span>
                          <span className="text-muted-foreground">({product.reviewCount})</span>
                        </span>
                        <span
                          className={cn(
                            'truncate font-medium',
                            product.stock > 3 ? 'text-success' : 'text-warning'
                          )}
                        >
                          {stockLabel(product.stock)}
                        </span>
                      </div>
                      <Link
                        to={`/san-pham/${product.slug}`}
                        className="text-foreground line-clamp-2 text-sm leading-snug font-bold transition-colors hover:text-primary"
                      >
                        {product.name}
                      </Link>
                    </div>

                    {/* Price + per-card action (existing move-to-cart, screen button) */}
                    <div className="border-border/60 flex items-end justify-between gap-2 border-t pt-2">
                      <div className="min-w-0">
                        {discountPercent > 0 && (
                          <div className="text-muted-foreground text-[11px] line-through">
                            {formatCurrency(product.originalPrice)}
                          </div>
                        )}
                        <div className="text-primary text-base font-extrabold">
                          {formatCurrency(product.salePrice)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleMoveToCart(product)}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                        aria-label={
                          isOutOfStock
                            ? `${product.name} hết hàng`
                            : `Chuyển ${product.name} vào giỏ hàng`
                        }
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90',
                          isOutOfStock
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-primary text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20'
                        )}
                      >
                        <ShoppingBag className="size-4" />
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {/* ================= ON-DEMAND 3D PRINTING BANNER ================= */}
          <section className="border-primary/30 bg-muted/40 relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 shadow-md sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div className="flex items-center gap-4">
              <div className="border-primary/40 bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl border">
                <Upload className="size-5" />
              </div>
              <div>
                <h3 className="text-foreground text-base font-bold">Bạn có file 3D muốn in riêng?</h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Gửi file STL / OBJ ngay để nhận báo giá tự động công nghệ Resin &amp; FDM trong 2h.
                </p>
              </div>
            </div>
            {/* No file-upload flow exists → routes to the contact page (logged). */}
            <Link
              to="/lien-he"
              className="bg-primary text-primary-foreground hover:brightness-110 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all active:scale-95"
            >
              <Upload className="size-4" />
              <span>Gửi file in 3D</span>
            </Link>
          </section>
        </>
      )}
    </div>
  )
}
