import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Box, Layers, Printer, Sparkles, Truck } from 'lucide-react'
import { productApi, categoryApi } from '@/services'
import { ProductCard } from '@/components/product/product-card'
import { ProductGridSkeleton } from '@/components/product/product-card-skeleton'
import { HotSaleSection } from '@/components/home/hot-sale-section'
import { Button } from '@/components/ui/button'
import type { Category, Product } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { cn, formatCurrency, resolveImageUrl } from '@/lib'
import { motion } from 'framer-motion'

function HeroShowcase({ products }: { products: Product[] }) {
  const showcase = products.slice(0, 2)
  return (
    <div className="relative mx-auto mt-14 hidden h-80 w-full max-w-md md:block lg:mt-0">
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/30 via-blue-600/20 to-transparent blur-3xl" />
      {showcase.map((p, i) => (
        <motion.div
          key={p._id}
          className={cn(
            'absolute w-44 overflow-hidden rounded-2xl border border-white/20 bg-slate-900/70 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl',
            i === 0 ? 'top-6 left-0 z-10 rotate-[-6deg]' : 'top-16 right-0 z-20 rotate-[5deg]'
          )}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: i * 0.15 }}
          whileHover={{ scale: 1.05, rotate: 0 }}
        >
          <img src={resolveImageUrl(p.images?.[0] ?? '')} alt={p.name} className="aspect-square w-full object-cover" />
          <div className="p-3">
            <p className="line-clamp-1 text-xs font-semibold text-slate-100">{p.name}</p>
            <p className="text-sm font-bold text-cyan-300">{formatCurrency(p.salePrice)}</p>
          </div>
        </motion.div>
      ))}
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
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-black" />
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
              <Sparkles className="text-cyan-400 size-4" />
              {user ? `Chào mừng trở lại, ${user.fullname}!` : 'Sản phẩm in 3D chất lượng cao'}
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Mô hình in 3D{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                độc đáo
              </span>{' '}
              cho mọi không gian
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              Khám phá bộ sưu tập figurine, đồ trang trí, mô hình kiến trúc và phụ kiện in 3D với
              chi tiết tuyệt hảo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/san-pham">
                  Khám phá sản phẩm
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" asChild>
                <Link to="/san-pham?featured=true">Sản phẩm nổi bật</Link>
              </Button>
            </div>
          </div>
          <HeroShowcase products={featured} />
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {[
            { icon: Printer, title: 'In 3D chất lượng cao', desc: 'Chi tiết sắc nét từ máy in FDM và Resin' },
            { icon: Box, title: 'Sản phẩm độc quyền', desc: 'Thiết kế độc đáo không đụng hàng' },
            { icon: Truck, title: 'Giao hàng toàn quốc', desc: 'Đóng gói chắc chắn, giao nhanh' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
                <f.icon className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Danh mục sản phẩm</h2>
              <p className="text-muted-foreground mt-1">Khám phá theo danh mục bạn yêu thích</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat) => {
              
              return (
                <Link
                  key={cat._id}
                  to={`/san-pham?categorySlug=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-4 text-center transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="bg-muted relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg">
                    {cat.image ? (
                      <img
                        src={resolveImageUrl(cat.image)}
                        alt={cat.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <Layers className="text-muted-foreground size-8" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{cat.name}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Sản phẩm nổi bật</h2>
              <p className="text-muted-foreground mt-1">Những mô hình được yêu thích nhất</p>
            </div>
            <Button variant="ghost" asChild>
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

      {/* Hot Sale */}
      {!hotLoading && <HotSaleSection products={hotSale} />}
    </div>
  )
}