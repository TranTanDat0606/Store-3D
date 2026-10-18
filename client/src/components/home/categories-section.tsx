import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, Layers } from 'lucide-react'
import type { Category } from '@/types'
import { resolveImageUrl } from '@/lib'

interface CategoriesSectionProps {
  categories: Category[]
}

/**
 * "Danh mục nổi bật" theo màn hình `home-*` (Plan 3 T2).
 *
 * Data thật: `GET /api/categories/all` — categoryService.all() aggregate
 * productCount thật từ collection products (KHÔNG bịa "1.250+ sản phẩm").
 *
 * Deviation: màn hình desktop ghi "1.250+ sản phẩm" (số mẫu); ở đây hiển thị
 * đúng productCount từ API. Số tile: max 6 (desktop screen) / carousel 6 trên
 * mobile (screen mobile minh hoạ 5 — lấy dữ liệu thật nhiều hơn không sai).
 */
export function CategoriesSection({ categories }: CategoriesSectionProps) {
  if (categories.length === 0) return null

  const shown = categories.slice(0, 6)

  return (
    <section className="border-b border-foreground/5 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 hidden text-xs font-bold tracking-widest text-secondary uppercase sm:block">
              KHÁM PHÁ THEO CHỦ ĐỀ
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              Danh mục nổi bật
            </h2>
            <p className="mt-1 text-sm text-muted-foreground sm:hidden">
              Bộ sưu tập vật phẩm in 3D theo chủ đề
            </p>
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
              Lựa chọn từ thư viện mô hình in 3D phong phú được tinh chỉnh tỉ mỉ
            </p>
          </div>
          <Link
            to="/san-pham"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            <span className="sm:hidden">Xem tất cả</span>
            <span className="hidden sm:inline">Xem tất cả danh mục</span>
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-1 sm:hidden" />
            <ArrowUpRight className="hidden size-4 transition-transform group-hover:translate-x-1 sm:block" />
          </Link>
        </div>

        {/* Mobile: horizontal tiles */}
        <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:hidden">
          {shown.map((cat) => (
            <CategoryTileMobile key={cat._id} category={cat} />
          ))}
        </div>

        {/* sm+: image tiles grid */}
        <div className="hidden grid-cols-1 gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((cat) => (
            <CategoryTileDesktop key={cat._id} category={cat} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoryTileMobile({ category }: { category: Category }) {
  return (
    <Link
      to={`/san-pham?categorySlug=${category.slug}`}
      className="group relative flex h-36 w-28 shrink-0 snap-start flex-col justify-end overflow-hidden rounded-xl border border-foreground/10 p-2.5 transition-colors hover:border-primary/40"
    >
      <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
        <Layers className="size-6 text-muted-foreground" />
      </div>
      {category.image ? (
        <img
          src={resolveImageUrl(category.image)}
          alt={category.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <span className="relative z-10 line-clamp-2 text-xs font-bold text-foreground transition-colors group-hover:text-primary">
        {category.name}
      </span>
    </Link>
  )
}

function CategoryTileDesktop({ category }: { category: Category }) {
  return (
    <Link
      to={`/san-pham?categorySlug=${category.slug}`}
      className="group relative block h-64 overflow-hidden rounded-2xl border border-foreground/10 transition-colors hover:border-primary/40"
    >
      <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
        <Layers className="size-8 text-muted-foreground" />
      </div>
      {category.image ? (
        <img
          src={resolveImageUrl(category.image)}
          alt={category.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between">
        <div>
          {typeof category.productCount === 'number' && (
            <span className="text-xs font-medium text-primary">
              {category.productCount.toLocaleString('vi-VN')} sản phẩm
            </span>
          )}
          <h3 className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">
            {category.name}
          </h3>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full border border-foreground/10 bg-background/60 text-foreground backdrop-blur transition-all group-hover:bg-primary/15 group-hover:text-primary">
          <ArrowUpRight className="size-5" />
        </div>
      </div>
    </Link>
  )
}
