import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Layers } from 'lucide-react'
import { productApi, categoryApi } from '@/services'
import { ProductCard } from '@/components/product/product-card'
import { ProductGridSkeleton } from '@/components/product/product-card-skeleton'
import { HotSaleSection } from '@/components/home/hot-sale-section'
import { AobingHero } from '@/components/home/aobing-hero'
import { Button } from '@/components/ui/button'
import type { Category, Product } from '@/types'
import { resolveImageUrl } from '@/lib'


export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [hotSale, setHotSale] = useState<Product[]>([])
  const [hotLoading, setHotLoading] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      productApi.featured({ limit: 8 }),
      categoryApi.all(),
      productApi.hotSale(8),
    ]).then(([featuredResult, cats, hot]) => {
      if (cancelled) return
      setFeatured(Array.isArray(featuredResult?.data) ? featuredResult.data : [])
      setCategories(Array.isArray(cats) ? cats : [])
      setHotSale((Array.isArray(hot?.data) ? hot.data : []).filter((p) => p.originalPrice > p.salePrice))
    }).catch(() => {
      // errors rendered via empty states
    }).finally(() => {
      if (!cancelled) { setLoading(false); setHotLoading(false) }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      {/* Hero - AO BING cinematic (Plan 3 T1) */}
      <AobingHero />

      {/* Hot Sale */}
      <div className={hotLoading ? 'min-h-[400px]' : ''}>
        {!hotLoading && <HotSaleSection products={hotSale} />}
      </div>

      {/* Categories */}
      <section className="py-16 bg-transparent">
        {categories.length > 0 ? (
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl text-foreground">Danh mục sản phẩm</h2>
                <p className="mt-1 text-sm text-muted-foreground">Khám phá theo danh mục bạn yêu thích</p>
              </div>
            </div>

            {/* Mobile: horizontal scroll */}
            <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:hidden">
              {categories.slice(0, 10).map((cat) => (
                <Link
                  key={cat._id}
                  to={`/san-pham?categorySlug=${cat.slug}`}
                  className="group flex w-28 shrink-0 flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 border-foreground/5 bg-foreground/[0.02] hover:border-accent/20 hover:bg-foreground/[0.04]"
                >
                  <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-foreground/5 bg-muted/60">
                    {cat.image ? (
                      <img
                        src={resolveImageUrl(cat.image)}
                        alt={cat.name}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <Layers className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-foreground transition-colors line-clamp-2">{cat.name}</span>
                </Link>
              ))}
            </div>

            {/* Desktop: grid, max 6 */}
            <div className="hidden grid-cols-6 gap-4 lg:grid">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat._id}
                  to={`/san-pham?categorySlug=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 border-foreground/5 bg-foreground/[0.02] hover:border-accent/20 hover:bg-foreground/[0.04]"
                >
                  <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-foreground/5 bg-muted/60">
                    {cat.image ? (
                      <img
                        src={resolveImageUrl(cat.image)}
                        alt={cat.name}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <Layers className="size-8 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">{cat.name}</span>
                </Link>
              ))}
            </div>

            {categories.length > 6 && (
              <div className="mt-6 flex justify-center">
                <Button variant="ghost" className="text-foreground hover:text-foreground" asChild>
                  <Link to="/san-pham">
                    Xem tất cả danh mục
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8">
              <div className="h-8 w-48 rounded bg-muted" />
              <div className="mt-2 h-4 w-64 rounded bg-muted/50" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3 rounded-xl border p-4 border-foreground/5 bg-foreground/[0.02]">
                  <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Best selling products */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl text-foreground">Sản phẩm bán chạy</h2>
            </div>
            <Button variant="ghost" className="text-foreground hover:text-foreground" asChild>
              <Link to="/san-pham?sort=best-selling">
                Xem tất cả
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} rank={i < 3 ? (i + 1) as 1 | 2 | 3 : undefined} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA / Liên hệ — Light 3D Aurora */}
      <section className="relative overflow-hidden bg-gradient-to-br py-20 sm:py-24 from-card via-card to-accent/40">
        {/* Subtle grid — barely visible */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Aurora blobs — soft atmospheric color */}
        <div className="pointer-events-none absolute -top-20 right-[15%] h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-16 left-[10%] h-56 w-56 rounded-full bg-accent/15 blur-[80px]" />
        <div className="pointer-events-none absolute top-1/3 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-[90px] bg-accent/10" />

        {/* Floating glass shapes */}
        {/* Translucent rounded cube — top right */}
        <div className="pointer-events-none absolute top-6 right-[10%] h-20 w-20 rotate-12 rounded-2xl border shadow-sm backdrop-blur-sm sm:h-28 sm:w-28 border-foreground/10 bg-foreground/5" />
        {/* Glass sphere — bottom left */}
        <div className="pointer-events-none absolute bottom-10 left-[12%] h-14 w-14 rounded-full border bg-gradient-to-br shadow-sm backdrop-blur-sm sm:h-16 sm:w-16 border-foreground/10 from-foreground/5 to-accent/5" />
        {/* Rotated thin plane — mid left */}
        <div className="pointer-events-none absolute top-1/2 left-[6%] h-8 w-24 -rotate-6 rounded-lg border backdrop-blur-sm sm:h-10 sm:w-28 border-foreground/10 bg-foreground/5" />
        {/* Small ring — bottom right */}
        <div className="pointer-events-none absolute bottom-16 right-[18%] h-10 w-10 rounded-full border-2 sm:h-12 sm:w-12 border-foreground/10" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl text-foreground">
            Sẵn sàng tạo mô hình của riêng bạn?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-foreground/60">
            Liên hệ với chúng tôi để được tư vấn miễn phí và báo giá chi tiết.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              className="bg-primary px-8 text-base font-semibold text-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
              asChild
            >
              <Link to="/lien-he">
                Liên hệ ngay
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}