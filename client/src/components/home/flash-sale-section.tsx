import { useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Bolt, ShoppingCart, Star, Layers } from 'lucide-react'
import type { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency, calculateDiscountPercent, resolveImageUrl } from '@/lib'
import { toastAddedToCart } from '@/lib/toast-progress'
const LoginPromptDialog = lazy(() => import('@/components/auth/login-prompt-dialog').then(m => ({ default: m.LoginPromptDialog })))

interface FlashSaleSectionProps {
  products: Product[]
}

/**
 * "GIẢM GIÁ SỐC — FLASH SALE" theo màn hình `home-*` (Plan 3 T2).
 *
 * Data thật: `GET /api/products?sort=discount` — sản phẩm giảm giá sâu nhất
 * (productService.listDiscounted, xếp hạng theo tỷ lệ salePrice/originalPrice).
 *
 * Deviations có chủ đích (không bịa dữ liệu):
 * - Countdown "Kết thúc trong" BỊ BỎ: không có API thời gian kết thúc
 *   chương trình giảm giá → đồng hồ đếm ngược sẽ là urgency giả.
 * - Thanh tiến độ "Đã bán X%" BỊ BỎ: public API không trả về số lượng đã bán
 *   theo sản phẩm (chỉ admin stats mới có).
 */
export function FlashSaleSection({ products }: FlashSaleSectionProps) {
  if (products.length === 0) return null

  return (
    <section className="border-b border-foreground/5 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-destructive uppercase">
              <Bolt className="size-4 fill-destructive" />
              <span>CƠ HỘI SĂN DEAL CÓ HẠN</span>
            </div>
            {/* Heading responsive: mobile rút gọn "FLASH SALE" (home-mobile.html:261);
                sm+ giữ nguyên "GIẢM GIÁ SỐC — FLASH SALE" (home-desktop/tablet). */}
            <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              <span className="sm:hidden">FLASH SALE</span>
              <span className="hidden sm:inline">GIẢM GIÁ SỐC — FLASH SALE</span>
            </h2>
          </div>
        </div>

        {/* Cards: mobile = horizontal snap carousel; sm+ = grid */}
        <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <FlashCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FlashCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  const discountPercent = calculateDiscountPercent(product.originalPrice, product.salePrice)
  const isOutOfStock = product.stock <= 0
  const lowStock = product.stock > 0 && product.stock <= 10

  const handleAdd = () => {
    if (isOutOfStock) return
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    addItem(product)
    toastAddedToCart(product.name)
  }

  return (
    <article className="group flex w-[210px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 sm:w-auto">
      {/* Thumbnail */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
        <div className="absolute inset-0 flex items-center justify-center">
          <Layers className="size-8 text-muted-foreground" />
        </div>
        {product.images?.[0] ? (
          <img
            src={resolveImageUrl(product.images[0])}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
            className="relative size-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        {discountPercent > 0 && (
          <span className="absolute top-3 left-3 rounded-md bg-destructive px-2 py-0.5 text-xs font-bold text-foreground">
            -{discountPercent}%
          </span>
        )}
        <Link
          to={`/san-pham/${product.slug}`}
          className="absolute inset-0 z-10"
          aria-label={product.name}
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
        <div>
          <div className="mb-1 flex items-center gap-1 text-xs text-warning">
            <Star className="size-3.5 fill-warning text-warning" />
            <span className="font-bold text-foreground">
              {product.rating > 0 ? product.rating.toFixed(1) : 'Mới'}
            </span>
            {product.reviewCount > 0 && (
              <span className="text-muted-foreground">({product.reviewCount} đánh giá)</span>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </div>

        <div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">{formatCurrency(product.salePrice)}</span>
            {discountPercent > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          {lowStock && (
            <p className="mb-3 text-[11px] font-medium text-destructive">Còn {product.stock} sản phẩm</p>
          )}
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="relative z-10 w-full text-xs font-semibold"
          >
            <ShoppingCart className="size-4" />
            {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
          </Button>
        </div>
      </div>
      <Suspense fallback={null}>
        <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </Suspense>
    </article>
  )
}
