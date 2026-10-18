import { Link } from 'react-router-dom'
import {
  Cpu,
  Heart,
  Minus,
  Package,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Zap,
} from 'lucide-react'
import { StarRating } from '@/components/common/star-rating'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, calculateDiscountPercent } from '@/lib'
import type { Product } from '@/types'
import type { PurchasePanelState } from './use-purchase-panel'

/*
 * Plan 3 T6 — data-honesty audit (pdp/mobile-pdp screens vs Product model).
 * Các dòng/screen rows KHÔNG có trường API backing → BỎ, không bịa giá trị:
 * - "Đã bán 85 chiếc" / "342 đã bán" — model Product KHÔNG có trường `sold`.
 * - Promo khan hiếm "Giá ưu đãi giới hạn cho 20 đơn hàng đặt in đầu tiên..." — copy bịa.
 * - Chip "Độ hoàn thiện: Son bóng thủ công" — không có trường hoàn thiện/sơn.
 * - Spec "Trọng lượng tượng", "Thời gian in & xử lý tia UV", "Quy trình sơn
 *   hoàn thiện", "Nơi sản xuất (Xưởng chế tác ...)" — không có field tương ứng.
 * - USP chính sách "Giao toàn quốc/Miễn phí từ 500k", "Bảo hành chi tiết sắc
 *   nét", "COD & VietQR 0₫" + hotline "1900 1234 (8:30–21:00)" — không có
 *   settings/API nào chứa chính sách vận chuyển/bảo hành/hotline (owner mandate).
 * - "Sẵn sàng xuất xưởng trong 24h" — không có dữ liệu ETA.
 * - Mobile screen: chọn biến thể "Vật liệu in"/"Lớp phủ bề mặt" — API không có
 *   variant data → không render.
 * Rows CHỈ dùng field thật: salePrice/originalPrice (Tiết kiệm = hiệu số),
 * stock, rating, reviewCount, material, printerType, size, category.
 */
interface PurchasePanelProps {
  product: Product
  purchaseState: PurchasePanelState
  /** 'mobile' = khối thông tin dưới gallery trên mobile (không CTA — sticky bar sở hữu actions). */
  variant?: 'desktop' | 'mobile'
}

export function PurchasePanel({ product, purchaseState, variant = 'desktop' }: PurchasePanelProps) {
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

  const isMobile = variant === 'mobile'
  const category = typeof product.category === 'object' ? product.category : null
  const discountPercent = calculateDiscountPercent(product.originalPrice ?? 0, product.salePrice ?? 0)
  const savings = (product.originalPrice ?? 0) - (product.salePrice ?? 0)

  // Quick-spec chips — real API fields only; chip ẩn khi giá trị rỗng (size có default '').)
  const quickSpecs = [
    { icon: Package, label: 'Vật liệu', value: product.material },
    { icon: Cpu, label: 'Công nghệ', value: product.printerType },
    { icon: Ruler, label: 'Kích thước', value: product.size },
  ].filter((s) => Boolean(s.value))

  return (
    <div
      className={cn(
        'flex flex-col',
        !isMobile && 'lg:sticky lg:top-24 lg:self-start'
      )}
    >
      {/* Rating & social proof row (real rating/reviewCount only — "Đã bán" omitted, see audit log) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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

      <h1 className={cn('mt-2 font-bold', isMobile ? 'text-xl leading-snug' : 'text-3xl')}>
        {product.name}
      </h1>

      {/* Price block — salePrice + originalPrice strike + real computed savings badge */}
      <div
        className={cn(
          'mt-4 rounded-lg border bg-card/60',
          isMobile ? 'p-3' : 'p-4'
        )}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={cn('font-extrabold text-primary', isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl')}>
            {formatCurrency(displayPrice)}
          </span>
          {product.originalPrice > product.salePrice && (
            <span className="text-muted-foreground text-base line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
          {discountPercent > 0 && savings > 0 && (
            <span className="border-primary/30 bg-primary/10 text-primary rounded-md border px-2 py-0.5 text-xs font-semibold">
              Tiết kiệm {formatCurrency(savings)}
            </span>
          )}
        </div>
      </div>

      {/* Quick specs — real fields only (Độ hoàn thiện chip omitted, see audit log) */}
      {quickSpecs.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
          {quickSpecs.map((spec) => (
            <div
              key={spec.label}
              className="bg-muted/40 flex items-center gap-2.5 rounded-lg border p-2.5"
            >
              <spec.icon className="text-primary size-4 shrink-0" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">{spec.label}</span>
                <span className="font-semibold">{spec.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock — real stock field ("Sẵn sàng xuất xưởng trong 24h" omitted, see audit log) */}
      <div className="mt-4 text-sm">
        {isOutOfStock ? (
          <span className="font-medium text-destructive">Hết hàng - Liên hệ để đặt trước</span>
        ) : (
          <span className="text-emerald-500 font-medium">
            Còn <span className="font-semibold">{product.stock}</span> sản phẩm trong kho
          </span>
        )}
      </div>

      {/* Quantity stepper — shared by both variants (CTAs below are desktop-only;
          mobile actions live in the sticky buy bar per mobile-pdp screen) */}
      <div className={cn('flex items-center gap-3', isMobile ? 'mt-4' : 'mt-6')}>
        <span className="text-muted-foreground text-xs font-semibold">Số lượng:</span>
        <div className="border-input flex items-center rounded-lg border p-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Giảm số lượng"
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-10 text-center text-sm font-bold">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            disabled={quantity >= product.stock}
            aria-label="Tăng số lượng"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Desktop CTAs — labels verbatim from pdp screen; handlers = existing usePurchasePanel */}
      {!isMobile && (
        <div className="mt-6 space-y-3">
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
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10 w-full border-2 text-sm font-bold tracking-wide"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
          >
            <Zap className="size-5" />
            Mua ngay - Thanh toán nhanh
          </Button>
        </div>
      )}

      {/* Generic trust line (pre-existing copy from T3; policy-specific USP rows
          with fabricated shipping/warranty/hotline detail were omitted — audit log) */}
      {!isMobile && (
        <div className="mt-8 space-y-3 border-t pt-6">
          <div className="flex items-center gap-3 text-sm">
            <ShieldCheck className="text-primary size-5 shrink-0" />
            <span className="text-muted-foreground">Thanh toán an toàn, bảo mật</span>
          </div>
        </div>
      )}
    </div>
  )
}
