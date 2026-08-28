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
      <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/25 blur-[100px]" />
      <div className="absolute top-1/3 left-1/4 h-40 w-40 rounded-full bg-blue-500/20 blur-[60px]" />
      <div className="absolute bottom-1/3 right-1/4 h-32 w-32 rounded-full bg-purple-500/15 blur-[50px]" />

      {/* Floating grid lines */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/5 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Main product - centered */}
      <motion.div
        className="absolute top-[18%] left-1/2 z-30 w-52 -translate-x-1/2"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl">
          {showcase[0] && (
            <>
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/10 aspect-square">
                <img
                  src={resolveImageUrl(showcase[0].images?.[0] ?? '')}
                  alt={showcase[0].name}
                  fetchPriority="high"
                  decoding="async"
                  className="size-full object-contain"
                />
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-xs font-semibold text-slate-100">{showcase[0].name}</p>
                <p className="text-sm font-bold text-cyan-300">{formatCurrency(showcase[0].salePrice)}</p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Left floating card - centered vertically */}
      {showcase[1] && (
        <motion.div
          className="absolute top-[40%] left-0 z-20 w-36 -translate-y-1/2 rotate-[-8deg]"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ scale: 1.05, rotate: -4 }}
        >
          <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 shadow-xl shadow-blue-500/10 backdrop-blur-md">
            <div className="aspect-square bg-gradient-to-br from-blue-500/20 to-purple-600/10">
              <img src={resolveImageUrl(showcase[1].images?.[0] ?? '')} alt={showcase[1].name} decoding="async" className="size-full object-contain" />
            </div>
            <div className="p-2">
              <p className="line-clamp-1 text-[10px] font-medium text-slate-200">{showcase[1].name}</p>
              <p className="text-xs font-bold text-blue-300">{formatCurrency(showcase[1].salePrice)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Right floating card - centered vertically */}
      {showcase[2] && (
        <motion.div
          className="absolute top-[55%] right-0 z-20 w-36 -translate-y-1/2 rotate-[6deg]"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          whileHover={{ scale: 1.05, rotate: 3 }}
        >
          <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 shadow-xl shadow-purple-500/10 backdrop-blur-md">
            <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-600/10">
              <img src={resolveImageUrl(showcase[2].images?.[0] ?? '')} alt={showcase[2].name} decoding="async" className="size-full object-contain" />
            </div>
            <div className="p-2">
              <p className="line-clamp-1 text-[10px] font-medium text-slate-200">{showcase[2].name}</p>
              <p className="text-xs font-bold text-purple-300">{formatCurrency(showcase[2].salePrice)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Floating particles */}
      <motion.div
        className="absolute top-[15%] right-12 size-2 rounded-full bg-cyan-400"
        animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[20%] left-8 size-1.5 rounded-full bg-blue-400"
        animate={{ y: [0, 10, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.div
        className="absolute top-1/2 left-16 size-1 rounded-full bg-purple-400"
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
      setFeatured(featuredResult.data)
      setCategories(cats)
      setHotSale((hot.data ?? []).filter((p) => p.originalPrice > p.salePrice))
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
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-cyan-50/30 dark:from-slate-950 dark:via-blue-950/80 dark:to-black">
        {/* Glowing orbs - light mode */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-200/30 blur-[120px] dark:bg-cyan-500/15" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-blue-200/20 blur-[100px] dark:bg-blue-600/10" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-200/15 blur-[80px] dark:bg-purple-500/8" />

        {/* Grid overlay - light mode */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/50 bg-cyan-100/80 px-4 py-1.5 text-sm text-cyan-700 backdrop-blur-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300"
            >
              <Sparkles className="size-4" />
              {user ? `Chào mừng trở lại, ${user.fullname}!` : 'Công nghệ in 3D tiên tiến'}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white"
            >
              Mô hình in 3D{' '}
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400">
                độc đáo
              </span>{' '}
              cho mọi không gian
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300"
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
                className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30"
                asChild
              >
                <Link to="/san-pham">
                  <span className="relative z-10 flex items-center gap-2">
                    Mua ngay
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-300 bg-white/60 text-slate-700 backdrop-blur-sm transition-all hover:border-slate-400 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-white/25 dark:hover:bg-white/10"
                asChild
              >
                <Link to="/san-pham?featured=true">Sản phẩm nổi bật</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex gap-8 border-t border-slate-200 pt-6 dark:border-white/10"
            >
              {[
                { value: '500+', label: 'Sản phẩm' },
                { value: '10K+', label: 'Khách hàng' },
                { value: '4.9', label: 'Đánh giá' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <HeroShowcase products={featured} />
        </div>
      </section>

      {/* Hot Sale */}
      {!hotLoading && <HotSaleSection products={hotSale} />}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-slate-50/80 py-16 dark:bg-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">Danh mục sản phẩm</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Khám phá theo danh mục bạn yêu thích</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/san-pham?categorySlug=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/5 dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-cyan-500/20 dark:hover:bg-white/[0.04]"
                >
                  <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50 dark:border-white/5 dark:bg-slate-900/60">
                    {cat.image ? (
                      <img
                        src={resolveImageUrl(cat.image)}
                        alt={cat.name}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <Layers className="size-8 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white transition-colors">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="bg-white py-16 dark:bg-slate-950/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">Sản phẩm nổi bật</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Những mô hình được yêu thích nhất</p>
            </div>
            <Button variant="ghost" className="text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" asChild>
              <Link to="/san-pham?featured=true">
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
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA / Liên hệ */}
      <section className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 py-16 dark:from-slate-800 dark:to-slate-900">
        <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-300/20 blur-[60px]" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Sẵn sàng tạo mô hình của riêng bạn?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80">
            Liên hệ với chúng tôi để được tư vấn miễn phí và báo giá chi tiết.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              className="bg-white px-8 text-base font-semibold text-cyan-600 shadow-lg shadow-black/10 transition-all hover:bg-slate-100 hover:shadow-xl dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-white"
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