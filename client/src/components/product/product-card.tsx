import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Star } from 'lucide-react'
import { memo, useState, lazy, Suspense } from 'react'
import { useCart } from '@/contexts/CartContext'
const LoginPromptDialog = lazy(() => import('@/components/auth/login-prompt-dialog').then(m => ({ default: m.LoginPromptDialog })))
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, calculateDiscountPercent, resolveImageUrl } from '@/lib'
import { toast } from 'sonner'
import type { Product } from '@/types'
import { motion } from 'framer-motion'

interface ProductCardProps {
  product: Product
  index?: number
  hideAddToCart?: boolean
}

export const ProductCard = memo(function ProductCard({
  product,
  index = 0,
  hideAddToCart = false,
}: ProductCardProps) {
  const { addItem } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()

  const [loginOpen, setLoginOpen] = useState(false)

  const wishlisted = isWishlisted(product._id)
  const discountPercent = calculateDiscountPercent(product.originalPrice, product.salePrice)
  const isOutOfStock = product.stock <= 0

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

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng này')
      return
    }
    try {
      await toggleWishlist(product._id)
      toast.success(wishlisted ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích')
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    }
  }

  const categoryName =
    typeof product.category === 'object' && product.category ? product.category.name : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: (index % 4) * 0.05 }}
      className="h-full"
    >
      <Link
        to={`/san-pham/${product.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 dark:border-white/10"
      >
        {/* Image: digital showroom */}
        <div className="relative aspect-square overflow-hidden">
          {/* glow + grid backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-primary/20" />
          <div className="bg-grid absolute inset-0 opacity-40" />
          {/* soft radial glow following hover */}
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="absolute top-1/2 left-1/2 size-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-2xl" />
          </div>

          <img
            src={resolveImageUrl(product.images?.[0] ?? '')}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="relative size-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
          />

          {/* light reflection */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/40" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

          {/* badges */}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {discountPercent > 0 && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.08 }}
              >
                <Badge className="bg-destructive text-white shadow-md shadow-destructive/30">
                  -{discountPercent}%
                </Badge>
              </motion.span>
            )}
            {product.featured && (
              <Badge className="bg-primary text-primary-foreground shadow-md shadow-primary/30">
                Nổi bật
              </Badge>
            )}
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
              <Badge variant="secondary" className="text-sm">
                Hết hàng
              </Badge>
            </div>
          )}

        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-1 p-3.5">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span>{product.rating > 0 ? product.rating.toFixed(1) : 'Mới'}</span>
            {categoryName && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="line-clamp-1">{categoryName}</span>
              </>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm leading-snug font-medium">{product.name}</h3>
          <div className="mt-auto pt-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-end gap-2">
                <p className="font-bold text-primary">{formatCurrency(product.salePrice)}</p>
                {discountPercent > 0 && (
                  <p className="text-muted-foreground text-xs line-through">
                    {formatCurrency(product.originalPrice)}
                  </p>
                )}
              </div>
              {!hideAddToCart && (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs font-medium"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                  >
                    <ShoppingBag className="size-3.5" />
                    {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      'size-8 shrink-0 rounded-full border-border/60 bg-background/60 backdrop-blur-sm dark:border-white/10',
                      wishlisted && 'border-destructive/50 text-destructive'
                    )}
                    onClick={handleWishlist}
                    aria-label={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                  >
                    <Heart className={cn('size-3.5', wishlisted && 'fill-current')} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
      <Suspense fallback={null}>
        <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </Suspense>
    </motion.div>
  )
})