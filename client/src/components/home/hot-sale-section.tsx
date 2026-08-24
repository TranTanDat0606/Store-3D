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
    <section className="relative overflow-hidden border-t py-16">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-destructive/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="bg-grid absolute inset-0 opacity-[0.05]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-xl border border-destructive/20">
                <Flame className="size-5" />
              </span>
              <h2 className="text-2xl font-bold sm:text-3xl">Hot Sale</h2>
            </div>
            <p className="text-muted-foreground mt-1">Ưu đãi giảm giá tốt nhất đang diễn ra</p>
          </div>
          <Button variant="ghost" asChild>
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
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-destructive/30 hover:shadow-2xl hover:shadow-destructive/10 dark:border-white/10 sm:flex-row">
      <div className="relative aspect-square overflow-hidden sm:aspect-auto sm:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-cyan-500/10" />
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
              className="bg-destructive text-destructive-foreground flex size-16 flex-col items-center justify-center rounded-full border border-white/20 shadow-xl shadow-destructive/30 sm:size-20"
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
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span>{product.rating > 0 ? product.rating.toFixed(1) : 'Mới'}</span>
          {product.reviewCount > 0 && <span>· {product.reviewCount} đánh giá</span>}
        </div>
        <h3 className="mt-2 line-clamp-2 text-lg leading-snug font-bold sm:text-xl">{product.name}</h3>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          {product.description || 'Mô hình in 3D chất lượng cao với chi tiết tuyệt hảo.'}
        </p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-destructive text-2xl font-extrabold tabular-nums sm:text-3xl">
            {formatCurrency(product.salePrice)}
          </span>
          {discountPercent > 0 && (
            <span className="text-muted-foreground text-sm line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-5">
          <Button
            size="lg"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-blue-500"
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
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 dark:border-white/10"
    >
      <span className="text-muted-foreground/40 w-4 shrink-0 text-sm font-extrabold tabular-nums group-hover:text-destructive">
        {String(index).padStart(2, '0')}
      </span>

      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-primary/10" />
        <img
          src={resolveImageUrl(product.images?.[0] ?? '')}
          alt=""
          loading="lazy"
          className="relative size-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="line-clamp-1 text-sm font-semibold">{product.name}</h4>
          {discountPercent > 0 && (
            <span className="bg-destructive/10 text-destructive shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-sm font-bold tabular-nums">{formatCurrency(product.salePrice)}</span>
          {discountPercent > 0 && (
            <span className="text-muted-foreground text-xs line-through">{formatCurrency(product.originalPrice)}</span>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="size-8 shrink-0 rounded-full border-border/60 dark:border-white/10"
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