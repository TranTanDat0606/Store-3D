import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Box, ChevronRight, Headphones, Home, Printer, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCard } from '@/components/product/product-card'
import { ProductCardSkeleton } from '@/components/product/product-card-skeleton'
import { productApi } from '@/services/productApi'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import type { Product } from '@/types'

/** Orbitron accents only (Latin/numeric) — per design system; Vietnamese stays in Be Vietnam Pro. */
const ORBITRON = { fontFamily: "'Orbitron', sans-serif" }

/** Quick search suggestions from the approved 404 screen (search queries, not products). */
const SEARCH_TAGS = ['Tượng Thần Long', 'Gundam RX-78', 'Chùa Một Cột', 'Kê tay Voronoi']

const searchLink = (q: string) => `/san-pham?search=${encodeURIComponent(q)}`

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { settings } = usePublicSettings()
  const [query, setQuery] = useState('')
  const [suggested, setSuggested] = useState<Product[]>([])
  const [suggestedLoading, setSuggestedLoading] = useState(true)

  // "Có thể bạn quan tâm" = real best-sellers from the existing API (screen cards were decorative).
  useEffect(() => {
    let cancelled = false
    productApi
      .list({ sort: 'best-selling', status: 'active', limit: 3 })
      .then((result) => {
        // Mirror home best-sellers handling: envelope { data }, server order-aggregate ranking.
        if (cancelled) {
          return
        }
        setSuggested(Array.isArray(result?.data) ? result.data : [])
      })
      .catch(() => {
        if (!cancelled) setSuggested([])
      })
      .finally(() => {
        if (!cancelled) setSuggestedLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? searchLink(q) : '/san-pham')
  }

  return (
    <div className="relative flex flex-col items-center overflow-hidden">
      {/* Ambient gold glow (token-based; replaces the screen's radial-gradient hex) */}
      <div className="bg-primary/10 pointer-events-none absolute top-24 left-1/2 size-[42rem] -translate-x-1/2 rounded-full blur-3xl" />
      {/* Faint tech grid backdrop (var(--border) token, per screen's outline-variant grid) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '3.5rem 3.5rem',
        }}
      />

      {/* ============ 404 HERO ============ */}
      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-12 text-center md:py-16">
        {/* Eyebrow pill */}
        <div className="border-border bg-card text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide">
          <span className="bg-primary size-2 animate-pulse rounded-full" />
          <span>LỖI 404 · TRANG KHÔNG TỒN TẠI</span>
        </div>

        {/* Giant numeric 404 with wireframe rings */}
        <div className="my-2 flex select-none items-center justify-center">
          <div className="border-border/40 pointer-events-none absolute size-72 animate-spin rounded-full border border-dashed opacity-40 [animation-duration:40s] md:size-96" />
          <div className="border-primary/20 pointer-events-none absolute size-56 rounded-full border opacity-30 md:size-72" />
          <h1
            className="from-primary via-primary to-muted-foreground bg-gradient-to-b bg-clip-text text-8xl font-black tracking-tighter text-transparent md:text-9xl"
            style={ORBITRON}
          >
            404
            {/* AC9 (#13): sr-only context so screen readers don't announce a bare "404" */}
            <span className="sr-only"> Lỗi 404 — Không tìm thấy trang</span>
          </h1>
        </div>

        {/* Headline */}
        <h2 className="mt-2 mb-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
          Không tìm thấy trang
        </h2>

        {/* Descriptive body (verbatim from approved screen) */}
        <p className="text-muted-foreground mx-auto mb-1 max-w-xl text-sm leading-relaxed sm:text-base">
          Trang bạn tìm không tồn tại hoặc đã được di chuyển.
        </p>
        <p className="text-muted-foreground/70 mx-auto mb-8 max-w-lg text-xs leading-relaxed sm:text-sm">
          Mô hình in 3D hoặc liên kết bạn vừa truy cập có thể đã được cập nhật sang danh mục mới
          hoặc đã thay đổi địa chỉ hiển thị.
        </p>

        {/* Inline search → existing /san-pham?search= route */}
        <div className="mx-auto mb-5 w-full max-w-xl">
          <form
            onSubmit={handleSearch}
            className="border-input bg-card focus-within:border-primary flex items-center rounded-xl border p-1.5 transition-all"
          >
            <div className="text-muted-foreground flex items-center px-3.5">
              <Search className="size-5" />
            </div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm mô hình 3D, figurine, kiến trúc..."
              aria-label="Tìm kiếm sản phẩm"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 md:text-sm"
            />
            <Button
              type="submit"
              size="lg"
              className="h-auto rounded-lg px-5 py-2.5 text-xs sm:text-sm"
            >
              Tìm kiếm
              <ArrowRight className="size-4" />
            </Button>
          </form>

          {/* Quick tag pills */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-muted-foreground mr-1 text-xs font-medium">
              Gợi ý tìm kiếm:
            </span>
            {SEARCH_TAGS.map((tag) => (
              <Link
                key={tag}
                to={searchLink(tag)}
                className="border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary rounded-md border px-2.5 py-1 text-xs transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex w-full flex-col items-center justify-center gap-3.5 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full rounded-xl shadow-lg sm:w-auto">
            <Link to="/">
              <Home className="size-4" />
              Về trang chủ
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-input text-foreground hover:border-primary/60 hover:text-primary w-full rounded-xl sm:w-auto"
          >
            <Link to="/san-pham">
              <Box className="size-4" />
              Xem sản phẩm
            </Link>
          </Button>
        </div>
      </section>

      {/* ============ SUGGESTIONS STRIP (real best-sellers) ============ */}
      {(suggestedLoading || suggested.length > 0) && (
        <section className="border-border/40 relative z-10 mx-auto w-full max-w-7xl border-t px-4 py-10 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="bg-primary h-4 w-1.5 rounded-sm" />
                <h3 className="text-lg font-bold text-foreground sm:text-xl">
                  Có thể bạn quan tâm
                </h3>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Khám phá các tác phẩm in 3D bán chạy nhất tại STORE 3D
              </p>
            </div>
            <Link
              to="/san-pham"
              className="text-primary hover:underline inline-flex items-center gap-1 text-xs font-semibold"
            >
              Xem tất cả
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {suggestedLoading
              ? Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : suggested.map((product, i) => (
                  <ProductCard key={product._id} product={product} index={i} />
                ))}
          </div>
        </section>
      )}

      {/* ============ QUICK ASSIST / SUPPORT STRIP ============ */}
      <section className="bg-card border-border/40 relative z-10 w-full border-y py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row lg:px-8">
          <div className="flex items-center gap-3">
            <div className="border-border bg-background flex size-10 items-center justify-center rounded-xl border text-primary">
              <Headphones className="size-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground sm:text-sm">
                Cần hỗ trợ kỹ thuật hoặc tìm file 3D?
              </div>
              {/* Business info: settings-driven only, hidden when absent (owner mandate). */}
              {(settings.hotline || settings.supportHours) && (
                <div className="text-muted-foreground text-[11px] sm:text-xs">
                  {settings.hotline && (
                    <>
                      Hotline:{' '}
                      <strong className="text-primary font-semibold">{settings.hotline}</strong>{' '}
                    </>
                  )}
                  {settings.supportHours && (
                    <span>(Thời gian hỗ trợ: {settings.supportHours})</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link to="/lien-he">
              <Printer className="size-4" />
              Gửi yêu cầu in 3D
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
