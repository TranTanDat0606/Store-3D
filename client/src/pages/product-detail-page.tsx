import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { productApi, reviewApi } from '@/services'
import { useAuth } from '@/contexts/AuthContext'
import { LoginPromptDialog } from '@/components/auth/login-prompt-dialog'
import { ProductCard } from '@/components/product/product-card'
import { ProductCardSkeleton } from '@/components/product/product-card-skeleton'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Button } from '@/components/ui/button'
import { ProductGallery } from '@/components/product/product-gallery'
import { ProductGalleryMobile } from '@/components/product/product-gallery-mobile'
import { PurchasePanel } from '@/components/product/purchase-panel'
import { MobilePurchaseBar } from '@/components/product/mobile-purchase-bar'
import { ProductTabs } from '@/components/product/product-tabs'
import { usePurchasePanel } from '@/components/product/use-purchase-panel'
import type { Product, Review, ReviewEligibility } from '@/types'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility | null>(null)

  const purchaseState = usePurchasePanel(product)

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
    setNetworkError(false)
    setProduct(null)
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
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const category = typeof product?.category === 'object' ? product.category : null

  // Loading state
  if (loading) {
    return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Desktop skeleton */}
        <div className="hidden gap-8 lg:grid lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="bg-muted aspect-square animate-pulse rounded-2xl" />
            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-muted size-20 animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
            <div className="bg-muted h-8 w-2/3 animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-12 w-48 animate-pulse rounded-xl" />
          </div>
        </div>
        {/* Mobile skeleton */}
        <div className="block space-y-4 lg:hidden">
          <div className="bg-muted aspect-square animate-pulse rounded-2xl" />
          <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          <div className="bg-muted h-8 w-2/3 animate-pulse rounded" />
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
        </div>
        {/* Tabs skeleton */}
        <div className="mt-12 space-y-4">
          <div className="flex gap-4 border-b pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted h-4 w-20 animate-pulse rounded" />
            ))}
          </div>
          <div className="bg-muted h-40 animate-pulse rounded-xl" />
        </div>
        {/* Related skeleton */}
        <div className="mt-8">
          <div className="bg-muted mb-6 h-8 w-48 animate-pulse rounded" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Not found (404)
  if (notFound && !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <AlertTriangle className="size-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Không tìm thấy sản phẩm</h1>
          <p className="text-muted-foreground">Sản phẩm có thể đã bị xóa hoặc không tồn tại.</p>
          <Button asChild>
            <Link to="/san-pham">Quay lại cửa hàng</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Network error
  if (networkError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <AlertTriangle className="size-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Đã có lỗi xảy ra</h1>
          <p className="text-muted-foreground">
            Không thể tải thông tin sản phẩm. Vui lòng thử lại.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
            <Button asChild>
              <Link to="/san-pham">Quay lại cửa hàng</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 lg:pb-0">
      <Breadcrumb
        className="mb-6"
        items={[
          { label: 'Sản phẩm', href: '/san-pham' },
          ...(category
            ? [{ label: category.name, href: `/san-pham?categorySlug=${category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="gap-8 lg:grid lg:grid-cols-5">
        {/* Desktop gallery — hidden on mobile */}
        <div className="hidden lg:block lg:col-span-3">
          <ProductGallery product={product} />
        </div>

        {/* Mobile gallery — hidden on desktop */}
        <div className="block lg:hidden">
          <ProductGalleryMobile product={product} />
        </div>

        {/* Desktop purchase panel — hidden on mobile */}
        <div className="hidden lg:block lg:col-span-2">
          <PurchasePanel product={product} purchaseState={purchaseState} />
        </div>
      </div>

      {/* Tabs */}
      <ProductTabs
        product={product}
        reviews={reviews}
        reviewEligibility={reviewEligibility}
        isAuthenticated={isAuthenticated}
        hasMoreReviews={reviews.length < product.reviewCount}
        onLoadMoreReviews={() => {
          if (!product) return
          const page = Math.floor(reviews.length / 6) + 1
          reviewApi
            .listByProduct(product._id, { limit: 6, page })
            .then((revs) => {
              setReviews((prev) => [...prev, ...revs.data])
            })
            .catch(() => {})
        }}
        onLoginClick={() => purchaseState.setLoginOpen(true)}
      />

      {/* Related products */}
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

      {/* Mobile purchase bar — hidden on desktop */}
      <div className="block lg:hidden">
        <MobilePurchaseBar product={product} purchaseState={purchaseState} />
      </div>

      <LoginPromptDialog open={purchaseState.loginOpen} onOpenChange={purchaseState.setLoginOpen} />
    </div>
  )
}
