import { useState } from 'react'
import { Heart, Minus, Plus, ShoppingBag, Truck, Zap } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib'
import type { Product } from '@/types'
import type { PurchasePanelState } from './use-purchase-panel'

interface MobilePurchaseBarProps {
  product: Product
  purchaseState: PurchasePanelState
}

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

            {/* Actions */}
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
                className="flex-1 bg-red-600 text-white shadow-lg shadow-red-600/25 text-sm font-semibold hover:bg-red-700 active:bg-red-800"
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

      {/* Bottom bar */}
      <div className="bg-background border-t px-4 pb-[env(safe-area-inset-bottom)] pt-3">
        {/* Row 1: Price + stock info */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-primary">{formatCurrency(displayPrice)}</span>
            {product.originalPrice > product.salePrice && (
              <span className="text-muted-foreground text-sm line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          <span className="text-muted-foreground text-xs">
            {isOutOfStock ? (
              <span className="text-destructive font-medium">Hết hàng</span>
            ) : (
              <>Còn <span className="font-semibold text-foreground">{product.stock}</span></>
            )}
          </span>
        </div>

        {/* Row 2: Shipping hint + action buttons */}
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Truck className="size-3.5 shrink-0" />
          <span>Giao toàn quốc 2-5 ngày</span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setExpanded(!expanded)}
            disabled={isOutOfStock}
            className="flex-1"
            variant="outline"
          >
            <ShoppingBag className="size-4" />
            {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
          </Button>
          <Button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 bg-red-600 text-white shadow-lg shadow-red-600/25 text-sm font-semibold hover:bg-red-700 active:bg-red-800"
          >
            <Zap className="size-4" />
            Mua ngay
          </Button>
        </div>
      </div>
    </div>
  )
}
