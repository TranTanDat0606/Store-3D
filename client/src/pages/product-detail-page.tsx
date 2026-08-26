import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from 'lucide-react'
import { productApi, reviewApi } from '@/services'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import { LoginPromptDialog } from '@/components/auth/login-prompt-dialog'
import { ProductCard } from '@/components/product/product-card'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, calculateDiscountPercent, resolveImageUrl } from '@/lib'
import { toast } from 'sonner'
import type { Product, Review, ReviewEligibility } from '@/types'

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'fill-amber-400 text-amber-400',
            size === 'lg' ? 'size-5' : 'size-3.5',
            rating < i - 0.5 && 'fill-muted text-muted'
          )}
        />
      ))}
    </div>
  )
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description')
  const [loginOpen, setLoginOpen] = useState(false)
  const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility | null>(null)

  useEffect(() => {
    if (!product || !isAuthenticated) {
      setReviewEligibility(null)
      return
    }
    let cancelled = false
    reviewApi
      .me(product._id)
      .then((el) => {
        if (!cancelled) setReviewEligibility(el)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [product, isAuthenticated])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setProduct(null)
    setActiveImage(0)
    setQuantity(1)
    setReviews([])

    if (!slug) {
      setNotFound(true)
      setLoading(false)
      return
    }

    productApi
      .getBySlug(slug)
      .then(async (p) => {
        if (cancelled) return
        setProduct(p)
        const [rel, revs] = await Promise.all([
          productApi.related(p._id, 4),
          reviewApi.listByProduct(p._id, { limit: 6 }),
        ])
        if (cancelled) return
        setRelated(rel)
        setReviews(revs.data)
      })
      .catch(() => {
        if (cancelled) return
        setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const discountPercent = useMemo(
    () => calculateDiscountPercent(product?.originalPrice ?? 0, product?.salePrice ?? 0),
    [product]
  )
  const isOutOfStock = (product?.stock ?? 0) <= 0
  const wishlisted = product ? isWishlisted(product._id) : false
  const category = typeof product?.category === 'object' ? product.category : null

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    addItem(product, quantity)
    toast.success('Đã thêm vào giỏ hàng', { description: product.name })
  }

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    addItem(product, 1)
    navigate('/thanh-toan')
  }

  const handleWishlist = async () => {
    if (!product) return
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

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="bg-muted aspect-square animate-pulse rounded-xl" />
          <div className="space-y-4">
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
            <div className="bg-muted h-8 w-2/3 animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-12 w-48 animate-pulse rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Không tìm thấy sản phẩm</h1>
          <p className="text-muted-foreground">Sản phẩm có thể đã bị xóa hoặc không tồn tại.</p>
          <Button asChild>
            <Link to="/san-pham">Quay lại cửa hàng</Link>
          </Button>
        </div>
      </div>
    )
  }

  const images = product.images.length > 0 ? product.images : ['']

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb
        className="mb-6"
        items={[
          { label: 'Sản phẩm', href: '/san-pham' },
          ...(category ? [{ label: category.name, href: `/san-pham?categorySlug=${category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="bg-muted relative flex aspect-square items-center justify-center overflow-hidden rounded-xl">
            <img
              src={resolveImageUrl(images[activeImage])}
              alt={product.name}
              className="size-full object-contain"
            />
            {discountPercent > 0 && (
              <Badge className="bg-destructive absolute top-4 left-4 text-white">
                -{discountPercent}%
              </Badge>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'bg-muted size-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                    activeImage === i ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                  )}
                  aria-label={`Xem ảnh ${i + 1}`}
                >
                  <img src={resolveImageUrl(img)} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">{product.rating > 0 ? product.rating.toFixed(1) : 'Mới'}</span>
              <StarRating rating={product.rating} />
            </div>
            <span className="text-muted-foreground text-sm">
              {product.reviewCount > 0 ? `${product.reviewCount} đánh giá` : 'Chưa có đánh giá'}
            </span>
            {category && (
              <span className="text-muted-foreground text-sm">
                · <Link to={`/san-pham?categorySlug=${category.slug}`} className="hover:text-primary">{category.name}</Link>
              </span>
            )}
          </div>

          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-extrabold text-primary">
              {formatCurrency(product.salePrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-muted-foreground text-lg line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
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

              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingBag className="size-5" />
                {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
              </Button>

              <Button
                size="lg"
                variant="default"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                <Zap className="size-5" />
                Mua ngay
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleWishlist}
                className={cn(wishlisted && 'text-destructive border-destructive/50')}
              >
                <Heart className={cn('size-5', wishlisted && 'fill-current')} />
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
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="border-b">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'description' as const, label: 'Mô tả' },
              { id: 'specs' as const, label: 'Thông số' },
              { id: 'reviews' as const, label: `Đánh giá (${product.reviewCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'text-foreground after:bg-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="py-8">
          {activeTab === 'description' && (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-2xl overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Chất liệu', product.material],
                    ['Loại máy in', product.printerType],
                    ['Kích thước', product.size || '—'],
                    ['Trạng thái', product.stock > 0 ? 'Còn hàng' : 'Hết hàng'],
                    ['Mã sản phẩm', product.slug],
                  ].map(([label, value], i) => (
                    <tr key={label} className={i % 2 ? 'bg-muted/40' : ''}>
                      <td className="text-muted-foreground w-40 px-4 py-3">{label}</td>
                      <td className="px-4 py-3 font-medium">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              {/* Rating summary */}
              <div className="h-fit rounded-xl border p-6 text-center">
                <div className="text-5xl font-extrabold">
                  {product.rating > 0 ? product.rating.toFixed(1) : '—'}
                </div>
                <div className="mt-2 flex justify-center">
                  <StarRating rating={product.rating} size="lg" />
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  {product.reviewCount} đánh giá
                </p>
                {!isAuthenticated ? (
                  <Button className="mt-4 w-full" variant="outline" onClick={() => setLoginOpen(true)}>
                    Đăng nhập để đánh giá
                  </Button>
                ) : reviewEligibility?.canReview ? (
                  <Button className="mt-4 w-full" asChild>
                    <Link to={`/danh-gia/${product.slug}`}>Viết đánh giá</Link>
                  </Button>
                ) : reviewEligibility?.hasReviewed ? (
                  <div className="text-emerald-600 dark:text-emerald-400 mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium">
                    <CheckCircle2 className="size-4" />
                    Đã đánh giá
                  </div>
                ) : (
                  <Button
                    className="mt-4 w-full"
                    disabled
                    title="Chỉ khách hàng đã mua và nhận được sản phẩm này mới có thể đánh giá"
                  >
                    Cần mua hàng để đánh giá
                  </Button>
                )}
              </div>

              {/* Reviews list */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-muted-foreground rounded-xl border border-dashed py-12 text-center text-sm">
                    Chưa có đánh giá nào cho sản phẩm này.
                  </div>
                ) : (
                  reviews.map((review) => {
                    const user = typeof review.user === 'object' ? review.user : null
                    return (
                      <div key={review._id} className="border-b pb-6 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted flex size-10 items-center justify-center rounded-full font-semibold">
                            {user ? user.fullname.charAt(0).toUpperCase() : 'K'}
                          </div>
                          <div>
                            <p className="font-medium">{user?.fullname ?? 'Khách hàng'}</p>
                            <div className="mt-0.5">
                              <StarRating rating={review.rating} />
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground mt-3 whitespace-pre-line text-sm">
                            {review.comment}
                          </p>
                        )}
                        {review.images.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {review.images.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt=""
                                className="bg-muted size-16 rounded-lg object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-6 text-2xl font-bold">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}
