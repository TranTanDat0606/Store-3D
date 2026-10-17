import { useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Plus, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Product } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
const LoginPromptDialog = lazy(() => import('@/components/auth/login-prompt-dialog').then(m => ({ default: m.LoginPromptDialog })))
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency, calculateDiscountPercent, resolveImageUrl } from '@/lib'
import { toastAddedToCart } from '@/lib/toast-progress'

interface HotSaleSectionProps {
  products: Product[]
}

export function HotSaleSection({ products }: HotSaleSectionProps) {
  if (products.length === 0) return null

  const spotlight = products[0]
  const rowDeals = products.slice(1, 8)

  return (
    <section className="relative overflow-hidden border-t bg-gradient-to-br py-16 border-foreground/5 from-card via-destructive/40 to-warning/20">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 h-72 w-72 rounded-full blur-[100px] bg-destructive/10" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full blur-[100px] bg-accent/10" />
        <div className="bg-grid absolute inset-0 opacity-[0.02] opacity-[0.03]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
                <Flame className="size-5" />
              </span>
              <h2 className="text-2xl font-bold sm:text-3xl text-foreground">Hot Sale</h2>
            </div>
            <p className="mt-1 text-sm text-foreground">Ưu đãi giảm giá tốt nhất đang diễn ra</p>
          </div>
          <Button variant="ghost" className="text-foreground hover:text-foreground" asChild>
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
    toastAddedToCart(product.name)
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-destructive/10 border-foreground/10 bg-muted/60 hover:border-destructive/20 sm:flex-row">
      <div className="relative aspect-square overflow-hidden sm:aspect-auto sm:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-accent/10" />
        <div className="bg-grid absolute inset-0 opacity-30" />
        <img
          src={resolveImageUrl(product.images?.[0] ?? '')}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="relative size-full object-contain transition-transform duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/50 to-transparent" />

        {discountPercent > 0 && (
          <div className="absolute top-4 left-4">
            <motion.div
              initial={{ scale: 0.6, rotate: -8 }}
              whileInView={{ scale: 1, rotate: -6 }}
              viewport={{ once: true }}
              className="flex size-16 flex-col items-center justify-center rounded-full border border-destructive/30 bg-destructive text-foreground shadow-xl shadow-destructive/30 sm:size-20"
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
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <Star className="size-3.5 fill-warning text-warning" />
          <span>{product.rating > 0 ? product.rating.toFixed(1) : 'Mới'}</span>
          {product.reviewCount > 0 && <span>· {product.reviewCount} đánh giá</span>}
        </div>
        <h3 className="mt-2 line-clamp-2 text-lg leading-snug font-bold sm:text-xl text-foreground">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-foreground">
          {product.description || 'Mô hình in 3D chất lượng cao với chi tiết tuyệt hảo.'}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tabular-nums sm:text-3xl text-destructive">
              {formatCurrency(product.salePrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-sm line-through text-foreground">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          <Button
            size="lg"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="mt-3 w-full bg-gradient-to-r from-accent to-accent font-semibold text-foreground shadow-lg shadow-accent/25 transition-all hover:from-accent hover:to-accent hover:shadow-xl hover:shadow-accent/30"
          >
            Mua ngay
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
      <Suspense fallback={null}>
        <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </Suspense>
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
    toastAddedToCart(product.name)
  }

  return (
    <Link
      to={`/san-pham/${product.slug}`}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5 border-foreground/10 bg-muted/50 hover:border-accent/20 hover:bg-muted/70"
    >
      <span className="w-4 shrink-0 text-sm font-extrabold tabular-nums text-foreground group-hover:text-destructive">
        {String(index).padStart(2, '0')}
      </span>

      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-foreground/5 bg-muted/50">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/10" />
        <img
          src={resolveImageUrl(product.images?.[0] ?? '')}
          alt=""
          loading="lazy"
          decoding="async"
          className="relative size-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="line-clamp-1 text-sm font-semibold text-foreground">{product.name}</h4>
          {discountPercent > 0 && (
            <span className="shrink-0 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(product.salePrice)}</span>
          {discountPercent > 0 && (
            <span className="text-xs text-foreground line-through">{formatCurrency(product.originalPrice)}</span>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="size-8 shrink-0 rounded-full border-foreground/10 text-foreground hover:bg-foreground/10 hover:text-foreground"
        onClick={handleAdd}
        disabled={isOutOfStock}
        aria-label="Thêm vào giỏ hàng"
      >
        <Plus className="size-4" />
      </Button>
      <Suspense fallback={null}>
        <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </Suspense>
    </Link>
  )
}