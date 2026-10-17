import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Layers, Sparkles } from 'lucide-react'
import { productApi, categoryApi } from '@/services'
import { ProductCard } from '@/components/product/product-card'
import { ProductGridSkeleton } from '@/components/product/product-card-skeleton'
import { HotSaleSection } from '@/components/home/hot-sale-section'
import { Button } from '@/components/ui/button'
import type { Category, Product } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, resolveImageUrl } from '@/lib'
import { motion } from 'framer-motion'

function HeroShowcase({ products }: { products: Product[] }) {
  const showcase = products.slice(0, 3)
  return (
    <div className="relative mx-auto mt-14 hidden h-[420px] w-full max-w-lg md:block lg:mt-0">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-[100px]" />
      <div className="absolute top-1/3 left-1/4 h-40 w-40 rounded-full bg-accent/20 blur-[60px]" />
      <div className="absolute bottom-1/3 right-1/4 h-32 w-32 rounded-full bg-accent/15 blur-[50px]" />

      {/* Floating grid lines */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-foreground/5 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Main product - centered */}
      {showcase[0] && (
        <motion.div
          className="absolute top-[18%] left-1/2 z-30 w-52 -translate-x-1/2"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          whileHover={{ scale: 1.05, y: -4 }}
        >
          <Link
            to={`/san-pham/${showcase[0].slug}`}
            className="block overflow-hidden rounded-2xl border border-foreground/10 bg-muted/60 shadow-2xl shadow-accent/20 backdrop-blur-xl transition-shadow duration-300 hover:shadow-accent/30 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            tabIndex={0}
          >
            <div className="bg-gradient-to-br from-accent/20 to-accent/10 aspect-square">
              <img
                src={resolveImageUrl(showcase[0].images?.[0] ?? '')}
                alt={showcase[0].name}
                fetchPriority="high"
                decoding="async"
                className="size-full object-contain transition-transform duration-500 hover:scale-110"
              />
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-xs font-semibold text-foreground">{showcase[0].name}</p>
              <p className="text-sm font-bold text-accent">{formatCurrency(showcase[0].salePrice)}</p>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Left floating card - centered vertically */}
      {showcase[1] && (
        <motion.div
          className="absolute top-[40%] left-0 z-20 w-36 -translate-y-1/2 rotate-[-8deg]"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ scale: 1.08, rotate: -4, y: -4 }}
        >
          <Link
            to={`/san-pham/${showcase[1].slug}`}
            className="block overflow-hidden rounded-xl border border-foreground/10 bg-muted/50 shadow-xl shadow-accent/10 backdrop-blur-md transition-shadow duration-300 hover:shadow-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            tabIndex={0}
          >
            <div className="aspect-square bg-gradient-to-br from-accent/20 to-accent/10">
              <img src={resolveImageUrl(showcase[1].images?.[0] ?? '')} alt={showcase[1].name} decoding="async" className="size-full object-contain transition-transform duration-500 hover:scale-110" />
            </div>
            <div className="p-2">
              <p className="line-clamp-1 text-[10px] font-medium text-foreground">{showcase[1].name}</p>
              <p className="text-xs font-bold text-accent">{formatCurrency(showcase[1].salePrice)}</p>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Right floating card - centered vertically */}
      {showcase[2] && (
        <motion.div
          className="absolute top-[55%] right-0 z-20 w-36 -translate-y-1/2 rotate-[6deg]"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          whileHover={{ scale: 1.08, rotate: 3, y: -4 }}
        >
          <Link
            to={`/san-pham/${showcase[2].slug}`}
            className="block overflow-hidden rounded-xl border border-foreground/10 bg-muted/50 shadow-xl shadow-accent/10 backdrop-blur-md transition-shadow duration-300 hover:shadow-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            tabIndex={0}
          >
            <div className="aspect-square bg-gradient-to-br from-accent/20 to-destructive/10">
              <img src={resolveImageUrl(showcase[2].images?.[0] ?? '')} alt={showcase[2].name} decoding="async" className="size-full object-contain transition-transform duration-500 hover:scale-110" />
            </div>
            <div className="p-2">
              <p className="line-clamp-1 text-[10px] font-medium text-foreground">{showcase[2].name}</p>
              <p className="text-xs font-bold text-accent">{formatCurrency(showcase[2].salePrice)}</p>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Floating particles */}
      <motion.div
        className="absolute top-[15%] right-12 size-2 rounded-full bg-accent"
        animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[20%] left-8 size-1.5 rounded-full bg-accent"
        animate={{ y: [0, 10, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.div
        className="absolute top-1/2 left-16 size-1 rounded-full bg-accent"
        animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
    </div>
  )
}

export default function HomePage() {
  const { user } = useAuth()
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
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-card via-accent/80 to-background">
        {/* Glowing orbs - light mode */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full blur-[120px] bg-accent/15" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full blur-[100px] bg-accent/10" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] bg-accent/8" />

        {/* Grid overlay - light mode */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm backdrop-blur-sm border-accent/20 bg-accent/10 text-accent"
            >
              <Sparkles className="size-4" />
              {user ? `Chào mừng trở lại, ${user.fullname}!` : 'Công nghệ in 3D tiên tiến'}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground"
            >
              Mô hình in 3D{' '}
              <span className="bg-gradient-to-r bg-clip-text text-transparent from-accent via-accent to-accent">
                độc đáo
              </span>{' '}
              cho mọi không gian
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 max-w-xl text-lg leading-relaxed text-foreground"
            >
              Khám phá bộ sưu tập figurine, đồ trang trí, mô hình kiến trúc và phụ kiện in 3D với
              chi tiết tuyệt hảo. Chất lượng cao, giao hàng toàn quốc.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Button
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-accent to-accent px-8 text-base font-semibold text-foreground shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30"
                asChild
              >
                <Link to="/san-pham">
                  <span className="relative z-10 flex items-center gap-2">
                    Mua ngay
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="backdrop-blur-sm transition-all border-foreground/15 bg-foreground/5 text-foreground hover:border-foreground/25 hover:bg-foreground/10"
                asChild
              >
                <Link to="/san-pham?sort=best-selling">Sản phẩm bán chạy</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex gap-8 border-t pt-6 border-foreground/10"
            >
              {[
                { value: '500+', label: 'Sản phẩm' },
                { value: '10K+', label: 'Khách hàng' },
                { value: '4.9', label: 'Đánh giá' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <HeroShowcase products={featured} />
        </div>
      </section>

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
                <p className="mt-1 text-sm text-foreground">Khám phá theo danh mục bạn yêu thích</p>
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
                      <Layers className="size-6 text-foreground" />
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
                      <Layers className="size-8 text-foreground" />
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