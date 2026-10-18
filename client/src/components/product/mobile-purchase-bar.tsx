import { useState } from 'react'
import { ChevronUp, Heart, Minus, Plus, ShoppingBag, Zap } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib'
import type { Product } from '@/types'
import type { PurchasePanelState } from './use-purchase-panel'

interface MobilePurchaseBarProps {
  product: Product
  purchaseState: PurchasePanelState
}

/*
 * Plan 3 T6 — IS the `mobile-pdp` sticky bar component (T3-edited
 * MobilePurchaseBar được restyle theo screen, KHÔNG tạo component trùng):
 * - Screen: fixed bottom-0, backdrop-blur, 1 hàng: [Tư vấn hotline][Thêm vào
 *   giỏ][Mua ngay]. Nút "Tư vấn" (tel:1900 1234) bị BỎ — hotline là thông tin
 *   doanh nghiệp bịa (owner mandate; không có settings/API hotline).
 * - Theo task: bar = giá (thật từ API) + primary actions, labels verbatim
 *   "Thêm vào giỏ" / "Mua ngay", gọi thẳng handler có sẵn.
 * - Sheet "Số lượng" (qty stepper + wishlist) giữ nguyên behavior hiện có —
 *   mở bằng chip giá; wishlist dùng handleWishlist cũ nguyên vẹn.
 * - safe-area-inset-bottom + trang PDP có pb-32 mobile để không che footer.
 */
export function MobilePurchaseBar({ product, purchaseState }: MobilePurchaseBarProps) {
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

  const [expanded, setExpanded] = useState(false)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-background border-t px-4 pb-4 pt-3 shadow-lg"
            role="dialog"
            aria-label="Mua hàng"
          >
            {/* Quantity */}
            <div className="mb-3 flex items-center gap-3">
              <span className="text-muted-foreground text-sm">Số lượng:</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Giảm số lượng"
                >
                  <Minus className="size-3" />
                </Button>
                <span className="flex size-9 items-center justify-center border-y text-sm font-medium">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  aria-label="Tăng số lượng"
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>

            {/* Actions — handlers unchanged */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  handleAddToCart()
                  setExpanded(false)
                }}
                disabled={isOutOfStock}
              >
                <ShoppingBag className="size-4" />
                Thêm vào giỏ
              </Button>

              <Button
                className="flex-1 bg-destructive text-foreground shadow-lg shadow-destructive/25 text-sm font-semibold hover:bg-destructive active:bg-destructive"
                onClick={() => {
                  handleBuyNow()
                  setExpanded(false)
                }}
                disabled={isOutOfStock}
              >
                <Zap className="size-4" />
                Mua ngay
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleWishlist}
                className={cn(wishlisted && 'text-destructive border-destructive/50')}
                aria-label={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
              >
                <Heart className={cn('size-4', wishlisted && 'fill-current')} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar — single compact row per mobile-pdp screen */}
      <div className="bg-background/95 border-t px-3.5 pt-2.5 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          {/* Price chip (thật từ API) — bấm để mở sheet Số lượng/wishlist */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex min-w-0 shrink-0 flex-col items-start rounded-xl border px-2.5 py-1.5 text-left transition-colors hover:border-primary/60"
            aria-expanded={expanded}
            aria-label={`Giá ${formatCurrency(displayPrice)} — chỉnh số lượng`}
          >
            <span className="text-primary truncate text-base font-black tracking-tight">
              {formatCurrency(displayPrice)}
            </span>
            <span className="text-muted-foreground flex items-center gap-0.5 text-[10px] font-medium">
              Số lượng: {quantity}
              <ChevronUp className={cn('size-3 transition-transform', expanded && 'rotate-180')} />
            </span>
          </button>

          {/* Secondary CTA — label verbatim "Thêm vào giỏ" (screen: handleAddToCart) */}
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="border-primary/80 bg-primary/10 text-primary hover:bg-primary/20 h-11 flex-1 border text-xs font-bold"
            variant="outline"
          >
            <ShoppingBag className="size-4" />
            {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
          </Button>

          {/* Primary CTA — label verbatim "Mua ngay" (screen: handleBuyNow) */}
          <Button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="bg-primary text-primary-foreground h-11 flex-1 text-xs font-bold shadow-[0_0_18px_rgba(244,190,81,0.35)]"
          >
            <Zap className="size-4" />
            Mua ngay
          </Button>
        </div>
      </div>
    </div>
  )
}
