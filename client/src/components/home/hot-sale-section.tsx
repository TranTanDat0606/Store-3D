import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Plus, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Product } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoginPromptDialog } from '@/components/auth/login-prompt-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency, calculateDiscountPercent, resolveImageUrl } from '@/lib'
import { toast } from 'sonner'

interface HotSaleSectionProps {
  products: Product[]
}

export function HotSaleSection({ products }: HotSaleSectionProps) {
  if (products.length === 0) return null

  const spotlight = products[0]
  const rowDeals = products.slice(1, 8)

  return (
    <section className="relative overflow-hidden border-t border-slate-200 bg-gradient-to-br from-slate-50 via-rose-50/30 to-orange-50/20 py-16 dark:border-white/5 dark:from-slate-950 dark:via-rose-950/40 dark:to-orange-950/20">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-rose-200/20 blur-[100px] dark:bg-red-500/10" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-200/15 blur-[100px] dark:bg-cyan-500/10" />
        <div className="bg-grid absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <Flame className="size-5" />
              </span>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">Hot Sale</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ưu đãi giảm giá tốt nhất đang diễn ra</p>
          </div>
          <Button variant="ghost" className="text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" asChild>
            <Link to="/san-pham">
              Xem tất cả
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          {/* Spotlight deal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <SpotlightDeal product={spotlight} />
          </motion.div>

          {/* Numbered deal rows */}
          <div className="flex flex-col gap-3">
            {rowDeals.slice(0, 4).map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <DealRow index={i + 1} product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function SpotlightDeal({ product }: { product: Product }) {
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  const discountPercent = calculateDiscountPercent(product.originalPrice, product.salePrice)
  const isOutOfStock = product.stock <= 0

  const handleAdd = () => {
    if (isOutOfStock) return
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    addItem(product)
    toast.success('Đã thêm vào giỏ hàng', { description: product.name })
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white backdrop-blur-xl transition-all duration-300 hover:border-red-300 hover:shadow-2xl hover:shadow-red-500/10 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-red-500/20 sm:flex-row">
      <div className="relative aspect-square overflow-hidden sm:aspect-auto sm:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-cyan-50/50 dark:from-destructive/10 dark:to-cyan-500/10" />
        <div className="bg-grid absolute inset-0 opacity-30" />
        <img
          src={resolveImageUrl(product.images?.[0] ?? '')}
          alt={product.name}
          loading="lazy"
          className="relative size-full object-contain transition-transform duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        {discountPercent > 0 && (
          <div className="absolute top-4 left-4">
            <motion.div
              initial={{ scale: 0.6, rotate: -8 }}
              whileInView={{ scale: 1, rotate: -6 }}
              viewport={{ once: true }}
              className="flex size-16 flex-col items-center justify-center rounded-full border border-red-500/30 bg-red-500 text-white shadow-xl shadow-red-500/30 sm:size-20"
            >
              <span className="text-xl leading-none font-extrabold sm:text-2xl">-{discountPercent}%</span>
              <span className="text-[9px] uppercase tracking-wider opacity-90 sm:text-[10px]">giảm</span>
            </motion.div>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <Badge variant="secondary" className="text-sm">Hết hàng</Badge>
          </div>
        )}
        <Link
          to={`/san-pham/${product.slug}`}
          className="absolute inset-0 z-10"
          aria-label={product.name}
        />
      </div>

      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span>{product.rating > 0 ? product.rating.toFixed(1) : 'Mới'}</span>
          {product.reviewCount > 0 && <span>· {product.reviewCount} đánh giá</span>}
        </div>
        <h3 className="mt-2 line-clamp-2 text-lg leading-snug font-bold text-slate-900 sm:text-xl dark:text-white">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
          {product.description || 'Mô hình in 3D chất lượng cao với chi tiết tuyệt hảo.'}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tabular-nums text-red-500 sm:text-3xl dark:text-red-400">
              {formatCurrency(product.salePrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-sm text-slate-400 line-through dark:text-slate-500">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          <Button
            size="lg"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="mt-3 w-full bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-xl hover:shadow-cyan-500/30"
          >
            Mua ngay
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}

function DealRow({ index, product }: { index: number; product: Product }) {
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  const discountPercent = calculateDiscountPercent(product.originalPrice, product.salePrice)
  const isOutOfStock = product.stock <= 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isOutOfStock) return
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    addItem(product)
    toast.success('Đã thêm vào giỏ hàng', { description: product.name })
  }

  return (
    <Link
      to={`/san-pham/${product.slug}`}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-slate-50 hover:shadow-lg hover:shadow-cyan-500/5 dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-cyan-500/20 dark:hover:bg-slate-900/70"
    >
      <span className="w-4 shrink-0 text-sm font-extrabold tabular-nums text-slate-400 group-hover:text-red-500 dark:text-slate-500 dark:group-hover:text-red-400">
        {String(index).padStart(2, '0')}
      </span>

      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-white/5 dark:bg-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
        <img
          src={resolveImageUrl(product.images?.[0] ?? '')}
          alt=""
          loading="lazy"
          className="relative size-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="line-clamp-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{product.name}</h4>
          {discountPercent > 0 && (
            <span className="shrink-0 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatCurrency(product.salePrice)}</span>
          {discountPercent > 0 && (
            <span className="text-xs text-slate-500 line-through">{formatCurrency(product.originalPrice)}</span>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="size-8 shrink-0 rounded-full border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        onClick={handleAdd}
        disabled={isOutOfStock}
        aria-label="Thêm vào giỏ hàng"
      >
        <Plus className="size-4" />
      </Button>
      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </Link>
  )
}