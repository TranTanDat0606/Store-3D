import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Star } from 'lucide-react'
import { memo } from 'react'
import { useCart } from '@/contexts/CartContext'
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

  const wishlisted = isWishlisted(product._id)
  const discountPercent = calculateDiscountPercent(product.originalPrice, product.salePrice)
  const isOutOfStock = product.stock <= 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isOutOfStock) return
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: (index % 4) * 0.05 }}
    >
      <Link
        to={`/san-pham/${product.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="bg-muted relative aspect-square overflow-hidden">
          <img
            src={resolveImageUrl(product.images?.[0] ?? '')}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discountPercent > 0 && (
              <Badge className="bg-destructive text-white">-{discountPercent}%</Badge>
            )}
            {product.featured && (
              <Badge className="bg-primary text-primary-foreground">Nổi bật</Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleWishlist}
            className={cn(
              'absolute top-3 right-3 size-9 rounded-full bg-background/90 backdrop-blur transition-transform hover:scale-110',
              wishlisted && 'text-destructive'
            )}
            aria-label={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
          >
            <Heart className={cn('size-4', wishlisted && 'fill-current')} />
          </Button>

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
              <Badge variant="secondary" className="text-sm">
                Hết hàng
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Star className="fill-amber-400 text-amber-400 size-3.5" />
            <span>{product.rating > 0 ? product.rating.toFixed(1) : 'Mới'}</span>
          </div>
          <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>
          <div className="mt-auto flex items-end justify-between pt-2">
            <div>
              <p className="font-bold">{formatCurrency(product.salePrice)}</p>
              {discountPercent > 0 && (
                <p className="text-muted-foreground text-xs line-through">
                  {formatCurrency(product.originalPrice)}
                </p>
              )}
            </div>
            {!hideAddToCart && (
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-full"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                aria-label="Thêm vào giỏ hàng"
              >
                <ShoppingBag className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
})
