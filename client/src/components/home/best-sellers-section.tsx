import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { productApi } from '@/services'
import { ProductCard } from '@/components/product/product-card'
import { ProductGridSkeleton } from '@/components/product/product-card-skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib'
import type { Category, Product } from '@/types'

interface BestSellersSectionProps {
  categories: Category[]
}

/**
 * "Sản phẩm bán chạy nhất" theo màn hình `home-*` (Plan 3 T2).
 *
 * Data thật: `GET /api/products?sort=best-selling` — productService.
 * listBestSelling aggregate số lượng đã bán từ collection orderitems, sắp
 * xếp giảm dần. Vì thứ hạng là số liệu bán thật, huy hiệu TOP 1/2/3 là trung
 * thực (featured KHÔNG phải bán chạy — đây là sửa lỗi label).
 *
 * Chip danh mục lấy tên THẬT từ categoryApi.all(); chọn chip → refetch server
 * với categorySlug (không filter client-side giả tạo).
 */
export function BestSellersSection({ categories }: BestSellersSectionProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSlug, setActiveSlug] = useState<string>('')

  const chips = categories.slice(0, 3)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params: { sort: string; status: string; limit: number; categorySlug?: string } = {
      sort: 'best-selling',
      status: 'active',
      limit: 8,
    }
    if (activeSlug) params.categorySlug = activeSlug
    productApi
      .list(params)
      .then((result) => {
        if (!cancelled) setProducts(result.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeSlug])

  return (
    <section className="border-b border-foreground/5 bg-muted/20 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header + quick filter chips */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1 hidden text-xs font-bold tracking-widest text-primary uppercase sm:block">
              ĐƯỢC YÊU THÍCH NHẤT
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              Sản phẩm<span className="sm:hidden"> bán chạy</span>
              <span className="hidden sm:inline"> bán chạy nhất</span>
            </h2>
          </div>
          <div className="scrollbar-none -mx-4 flex flex-wrap items-center gap-2 px-4 sm:mx-0 sm:px-0">
            <Chip active={activeSlug === ''} onClick={() => setActiveSlug('')}>
              Tất cả
            </Chip>
            {chips.map((cat) => (
              <Chip key={cat._id} active={activeSlug === cat.slug} onClick={() => setActiveSlug(cat.slug)}>
                {cat.name}
              </Chip>
            ))}
          </div>
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <EmptyState
            title="Chưa có sản phẩm bán chạy"
            description="Hiện chưa có sản phẩm nào trong danh mục này. Hãy chọn danh mục khác nhé."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {products.map((product, i) => (
              <ProductCard
                key={product._id}
                product={product}
                index={i}
                rank={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}
              />
            ))}
          </div>
        )}

        {/* View all */}
        <div className="mt-10 text-center">
          <Button variant="outline" size="lg" className="rounded-xl border-primary/40 font-semibold text-foreground hover:border-primary hover:bg-primary/10" asChild>
            <Link to="/san-pham?sort=best-selling">
              <span className="sm:hidden">Xem thêm sản phẩm bán chạy</span>
              <span className="hidden sm:inline">Xem tất cả sản phẩm bán chạy</span>
              <ArrowRight className="size-4 hidden sm:block" />
              <ChevronDown className="size-4 sm:hidden" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
          : 'border border-foreground/10 text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
