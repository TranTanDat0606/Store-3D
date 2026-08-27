import { Link } from 'react-router-dom'
import {
  Heart,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from 'lucide-react'
import { StarRating } from '@/components/common/star-rating'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib'
import type { Product } from '@/types'
import type { PurchasePanelState } from './use-purchase-panel'

interface PurchasePanelProps {
  product: Product
  purchaseState: PurchasePanelState
}

export function PurchasePanel({ product, purchaseState }: PurchasePanelProps) {
  const {
    quantity,
    displayPrice,
    isOutOfStock,
    wishlisted,
    setQuantity,
    handleAddToCart,
    handleBuyNow,
    handleWishlist,
  } = purchaseState

  const category = typeof product.category === 'object' ? product.category : null

  return (
    <div className="flex flex-col lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold">
            {product.rating > 0 ? product.rating.toFixed(1) : 'Mới'}
          </span>
          <StarRating rating={product.rating} />
        </div>
        <span className="text-muted-foreground text-sm">
          {product.reviewCount > 0 ? `${product.reviewCount} đánh giá` : 'Chưa có đánh giá'}
        </span>
        {category && (
          <span className="text-muted-foreground text-sm">
            ·{' '}
            <Link to={`/san-pham?categorySlug=${category.slug}`} className="hover:text-primary">
              {category.name}
            </Link>
          </span>
        )}
      </div>

      <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>

      <div className="mt-4 flex items-end gap-3">
        <span className="text-3xl font-extrabold text-primary">{formatCurrency(displayPrice)}</span>
        {product.originalPrice > product.salePrice && (
          <span className="text-muted-foreground text-lg line-through">
            {formatCurrency(product.originalPrice)}
          </span>
        )}
      </div>

      {product.description && (
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{product.description}</p>
      )}

      {/* Quantity + CTAs */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-12"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Giảm số lượng"
            >
              <Minus className="size-4" />
            </Button>
            <span className="flex size-12 items-center justify-center border-y text-lg font-medium">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-12"
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock}
              aria-label="Tăng số lượng"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="flex gap-3">
            <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={isOutOfStock}>
              <ShoppingBag className="size-5" />
              {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={handleWishlist}
              aria-label={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
              className={cn(wishlisted && 'text-destructive border-destructive/50')}
            >
              <Heart className={cn('size-5', wishlisted && 'fill-current')} />
            </Button>
          </div>

          <Button
            size="lg"
            className="w-full bg-red-600 text-white shadow-lg shadow-red-600/25 text-base font-semibold hover:bg-red-700 active:bg-red-800"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
          >
            <Zap className="size-5" />
            Mua ngay
          </Button>
        </div>
      </div>

      <div className="text-muted-foreground mt-4 text-sm">
        {isOutOfStock ? (
          <span className="font-medium text-destructive">Hết hàng - Liên hệ để đặt trước</span>
        ) : (
          <span>
            Còn <span className="font-semibold text-foreground">{product.stock}</span> sản phẩm trong kho
          </span>
        )}
      </div>

      <div className="mt-8 space-y-3 border-t pt-6">
        {[
          { icon: Truck, text: 'Giao hàng toàn quốc từ 2-5 ngày' },
          { icon: RefreshCw, text: 'Đổi trả trong 7 ngày nếu sản phẩm lỗi' },
          { icon: ShieldCheck, text: 'Thanh toán an toàn, bảo mật' },
        ].map((f) => (
          <div key={f.text} className="flex items-center gap-3 text-sm">
            <f.icon className="text-primary size-5 shrink-0" />
            <span className="text-muted-foreground">{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
