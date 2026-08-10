import { Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { ProductCard } from '@/components/product/product-card'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Product } from '@/types'

export default function WishlistPage() {
  const { products, isLoading, moveToCart } = useWishlist()
  const { addItem } = useCart()

  const handleMoveToCart = async (product: Product) => {
    try {
      addItem(product)
      await moveToCart(product._id)
      toast.success('Đã chuyển vào giỏ hàng', { description: product.name })
    } catch {
      toast.error('Không thể chuyển vào giỏ hàng')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Danh sách yêu thích</h2>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-72 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
            <div key={product._id} className="relative">
              <ProductCard product={product} index={i} hideAddToCart />
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-3 bottom-3"
                onClick={() => handleMoveToCart(product)}
                disabled={product.stock <= 0}
              >
                <ShoppingBag className="size-4" />
                Chuyển vào giỏ
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
