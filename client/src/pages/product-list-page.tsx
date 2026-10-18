import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Search, X, Loader2, ChevronDown, SearchX, FilterX } from 'lucide-react'
import { productApi, categoryApi } from '@/services'
import { ProductCard } from '@/components/product/product-card'
import { ProductGridSkeleton } from '@/components/product/product-card-skeleton'
import { Pagination } from '@/components/common/pagination'
import { EmptyState } from '@/components/common/empty-state'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { Category, PaginationMeta, Product } from '@/types'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn, formatCurrency, calculateDiscountPercent, resolveImageUrl } from '@/lib'

/* Plan 3 T4 — sort labels verbatim from `.stitch/designs/plp.html` (l.245–250).
   "Liên quan nhất" omitted: the API has no relevance ranking (sort keys are
   newest/price/best-selling/rating only) — deviation logged in the T4 report. */
const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất ra lò' },
  { value: 'price-asc', label: 'Giá: Thấp đến cao' },
  { value: 'price-desc', label: 'Giá: Cao đến thấp' },
  { value: 'best-selling', label: 'Bán chạy nhất' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
]

/* Material chips per screen (l.352–363). Values stay the real API enum;
   "Resin 8K Ultra" simplified to "Nhựa Resin" — 8K is a per-product claim the
   material enum cannot back. */
const MATERIALS = [
  { value: 'PLA', label: 'Nhựa PLA Pro' },
  { value: 'PETG', label: 'Nhựa PETG Siêu Bền' },
  { value: 'ABS', label: 'Nhựa ABS Chịu Nhiệt' },
  { value: 'Resin', label: 'Nhựa Resin' },
] as const

/* Printer tech per screen (l.372–376). Screen's third option
   "Hybrid Kỹ Thuật Số (Kết hợp)" omitted — no matching API value;
   "(Nhựa sinh học)" parenthetical dropped (feedstock claim). */
const PRINTER_TYPES = [
  { value: 'Resin Printer', label: 'SLA/DLP Siêu Chi Tiết (Resin)' },
  { value: 'FDM', label: 'FDM Đa Màu Sắc' },
] as const

/* Plan 3 T5 — empty/search-state copy verbatim from
   `.stitch/designs/plp-search-states.html`: empty panel (l.560–561, 565, 578),
   search heading (l.179–182), result summary (l.201). The panel's annotation
   label "Ví dụ kịch bản tham chiếu" (l.559) is a design note, not UI copy. */
const EMPTY_TITLE = 'Không tìm thấy sản phẩm nào'
const EMPTY_DESC =
  'Thử từ khóa khác hoặc xóa bớt bộ lọc đang áp dụng để xem thêm sản phẩm.'
const SUGGESTIONS_LABEL = 'Gợi ý tìm kiếm phổ biến:'
const CLEAR_ALL_LABEL = 'Xóa bộ lọc & Xem tất cả sản phẩm'
/* Screen suggestion chips (l.567–571) — wired as `?search=` routes (existing
   endpoint), never as links to products that may not exist. */
const SEARCH_SUGGESTIONS = [
  'Tượng Thần Long',
  'Gundam RX-78-2',
  'Chùa Một Cột',
  'Kê tay bàn phím Voronoi',
  'Đèn mặt trăng',
] as const

/** Display bound for the dual range slider (UI clamp only, not business data). */
const PRICE_SLIDER_MAX = 20_000_000
const PRICE_STEP = 50_000

const materialLabel = (value: string) => MATERIALS.find((m) => m.value === value)?.label ?? value
const printerLabel = (value: string) => PRINTER_TYPES.find((p) => p.value === value)?.label ?? value
const sliderPercent = (value: number) =>
  Math.min(100, Math.max(0, (value / PRICE_SLIDER_MAX) * 100))

/** Active-filter chip (screen l.272–283): rounded pill + per-chip remove. */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-medium text-primary">
      {label}
      {/* AC9 (#4): 12px X keeps its visual size; negative margins keep the chip's
          outer size identical while the hit area grows to 24×24 (WCAG 2.5.8). */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Bỏ lọc: ${label}`}
        className="-my-1 -mr-1.5 inline-flex size-6 items-center justify-center"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

/** Sidebar filter group with the screen's collapsible header (l.305–308). */
function FilterGroup({
  title,
  collapsed,
  onToggle,
  children,
}: {
  title: string
  collapsed: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="border-t border-border/60 pt-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="mb-3 flex w-full items-center justify-between text-xs font-bold tracking-wider uppercase"
      >
        <span>{title}</span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', collapsed && '-rotate-90')} />
      </button>
      {!collapsed && children}
    </div>
  )
}

/** Horizontal result row used when searching — image left, info right. */
function SearchResultRow({ product }: { product: Product }) {
  const discountPercent = calculateDiscountPercent(product.originalPrice, product.salePrice)
  return (
    <div className="bg-card/60 hover:border-primary/40 flex flex-col gap-4 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-center">
      <Link
        to={`/san-pham/${product.slug}`}
        className="bg-muted relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded-xl sm:w-28 sm:aspect-square"
      >
        {product.images[0] ? (
          <img src={resolveImageUrl(product.images[0])} alt={product.name} loading="lazy" decoding="async" className="size-full object-contain" />
        ) : (
          <span className="text-muted-foreground text-xs">No image</span>
        )}
        {discountPercent > 0 && (
          <span className="bg-destructive absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-bold text-foreground">
            -{discountPercent}%
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link to={`/san-pham/${product.slug}`} className="hover:text-primary line-clamp-1 font-semibold">
          {product.name}
        </Link>
        {product.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{product.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-primary text-lg font-extrabold">{formatCurrency(product.salePrice)}</span>
          {discountPercent > 0 && (
            <span className="text-muted-foreground line-through">{formatCurrency(product.originalPrice)}</span>
          )}
          {product.stock > 0 && <span className="text-muted-foreground text-xs">Còn {product.stock}</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {product.stock <= 0 ? (
          <span className="text-destructive text-sm font-medium">Hết hàng</span>
        ) : (
          <Button asChild>
            <Link to={`/san-pham/${product.slug}`}>Xem sản phẩm</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

export default function ProductListPage() {
  useDocumentTitle('Sản phẩm')
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)

  const page = Number(searchParams.get('page') ?? 1)
  const search = searchParams.get('search') ?? ''
  const categorySlug = searchParams.get('categorySlug') ?? ''
  const featured = searchParams.get('featured') === 'true'
  const material = searchParams.get('material') ?? ''
  const printerType = searchParams.get('printerType') ?? ''
  const minPrice = searchParams.get('minPrice') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''
  const minRating = searchParams.get('minRating') ?? ''
  const sort = searchParams.get('sort') ?? 'newest'
  const bestSelling = sort === 'best-selling'

  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebounce(searchInput, 200)

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    categoryApi.all().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      const next = debouncedSearch.trim()
      const current = params.get('search') ?? ''
      // Only write when the search text actually changed; on first paint (F5)
      // this must NOT clobber other URL keys — `page` stays source of truth.
      if (next === current) return
      if (next) params.set('search', next)
      else params.delete('search')
      params.set('page', '1')
      setSearchParams(params, { replace: true })
    }, 0)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params: Record<string, string | number | boolean> = { page, limit: 12 }
    if (search) params.search = search
    if (categorySlug) params.categorySlug = categorySlug
    if (featured) params.featured = true
    if (material) params.material = material
    if (printerType) params.printerType = printerType
    if (minPrice) params.minPrice = Number(minPrice)
    if (maxPrice) params.maxPrice = Number(maxPrice)
    if (minRating) params.minRating = Number(minRating)
    if (sort !== 'newest') params.sort = sort

    productApi
      .list(params)
      .then((res) => {
        if (cancelled) return
        setProducts(res.data)
        setMeta(res.pagination)
      })
      .catch(() => {
        if (cancelled) return
        setProducts([])
        setMeta(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, search, categorySlug, featured, material, printerType, minPrice, maxPrice, minRating, sort])

  const updateParams = (updates: Record<string, string | null>, options?: { keepPage?: boolean }) => {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '' || value === 'false') params.delete(key)
      else params.set(key, value)
    }
    if (!options?.keepPage) params.set('page', '1')
    setSearchParams(params)
  }

  const activeFilters = useMemo(() => {
    return [
      search,
      categorySlug,
      material,
      printerType,
      minPrice,
      maxPrice,
      minRating,
      featured ? 'featured' : '',
    ].filter((v) => v !== '' && v !== undefined).length
  }, [search, categorySlug, material, printerType, minPrice, maxPrice, minRating, featured])

  const clearAll = () => setSearchParams({})

  const currentCategory = categories.find((c) => c.slug === categorySlug)

  // Price range draft: seeded from the URL (source of truth) and re-synced
  // whenever the URL price keys change (chip removal, clear-all, reload).
  const [priceDraft, setPriceDraft] = useState(() => ({
    min: Number(minPrice) || 0,
    max: Number(maxPrice) || 0,
  }))
  useEffect(() => {
    setPriceDraft({ min: Number(minPrice) || 0, max: Number(maxPrice) || 0 })
  }, [minPrice, maxPrice])

  const applyPrice = () => {
    let { min, max } = priceDraft
    if (min > 0 && max > 0 && min > max) [min, max] = [max, min]
    setPriceDraft({ min, max })
    updateParams({
      minPrice: min > 0 ? String(min) : null,
      maxPrice: max > 0 ? String(max) : null,
    })
  }

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggleGroup = (key: string) => setCollapsed((s) => ({ ...s, [key]: !s[key] }))

  const filterGroups = (
    <div className="space-y-6">
      {/* Filter 1 — screen "Danh mục mô hình" (l.303). Single-select: the API
          takes one `categorySlug`; counts omitted (no count data in API). */}
      <FilterGroup title="Danh mục mô hình" collapsed={!!collapsed.category} onToggle={() => toggleGroup('category')}>
        <div className="space-y-2.5">
          <label className="group flex cursor-pointer items-center gap-2.5 text-xs">
            <input
              type="checkbox"
              checked={!categorySlug}
              onChange={() => updateParams({ categorySlug: null })}
              className="size-3.5 rounded accent-primary"
            />
            <span className={cn('transition-colors group-hover:text-primary', !categorySlug ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              Tất cả
            </span>
          </label>
          {categories.map((cat) => (
            <label key={cat._id} className="group flex cursor-pointer items-center gap-2.5 text-xs">
              <input
                type="checkbox"
                checked={categorySlug === cat.slug}
                onChange={() => updateParams({ categorySlug: categorySlug === cat.slug ? null : cat.slug })}
                className="size-3.5 rounded accent-primary"
              />
              <span
                className={cn(
                  'transition-colors group-hover:text-primary',
                  categorySlug === cat.slug ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Filter 2 — screen "Vật liệu in chế tác" (l.347), chip toggles. */}
      <FilterGroup title="Vật liệu in chế tác" collapsed={!!collapsed.material} onToggle={() => toggleGroup('material')}>
        <div className="flex flex-wrap gap-2">
          {MATERIALS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => updateParams({ material: material === m.value ? null : m.value })}
              aria-pressed={material === m.value}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-xs transition-colors min-h-11',
                material === m.value
                  ? 'border-primary bg-primary font-semibold text-primary-foreground shadow-sm'
                  : 'bg-card font-medium text-muted-foreground hover:border-primary/60 hover:text-primary',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Filter 3 — screen "Công nghệ in 3D" (l.366), radios + "Tất cả" so the
          single-value filter stays removable. */}
      <FilterGroup title="Công nghệ in 3D" collapsed={!!collapsed.printer} onToggle={() => toggleGroup('printer')}>
        <div className="space-y-2">
          <label className="group flex cursor-pointer items-center gap-2.5 text-xs">
            <input
              type="radio"
              name="printer_tech"
              checked={!printerType}
              onChange={() => updateParams({ printerType: null })}
              className="size-3.5 accent-primary"
            />
            <span className={cn('transition-colors group-hover:text-primary', !printerType ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              Tất cả
            </span>
          </label>
          {PRINTER_TYPES.map((p) => (
            <label key={p.value} className="group flex cursor-pointer items-center gap-2.5 text-xs">
              <input
                type="radio"
                name="printer_tech"
                checked={printerType === p.value}
                onChange={() => updateParams({ printerType: p.value })}
                className="size-3.5 accent-primary"
              />
              <span
                className={cn(
                  'transition-colors group-hover:text-primary',
                  printerType === p.value ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {p.label}
              </span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Filter 4 — screen "Khoảng giá (VNĐ)" (l.384): inputs + dual range
          slider + explicit "Áp dụng mức giá" commit to the URL. */}
      <FilterGroup title="Khoảng giá (VNĐ)" collapsed={!!collapsed.price} onToggle={() => toggleGroup('price')}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            applyPrice()
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="plp-min-price" className="mb-1 block text-[10px] text-muted-foreground">
                Từ giá
              </label>
              <Input
                id="plp-min-price"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={priceDraft.min || ''}
                onChange={(e) => setPriceDraft((d) => ({ ...d, min: Number(e.target.value) || 0 }))}
                onBlur={applyPrice}
                className="min-h-11 px-2.5 text-xs font-mono"
              />
            </div>
            <div>
              <label htmlFor="plp-max-price" className="mb-1 block text-[10px] text-muted-foreground">
                Đến giá
              </label>
              <Input
                id="plp-max-price"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={priceDraft.max || ''}
                onChange={(e) => setPriceDraft((d) => ({ ...d, max: Number(e.target.value) || 0 }))}
                onBlur={applyPrice}
                className="min-h-11 px-2.5 text-xs font-mono"
              />
            </div>
          </div>

          {/* Dual-thumb range bar (screen l.398–405). */}
          <div className="relative h-6" data-testid="price-range-slider">
            <div className="bg-muted absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 rounded-full" />
            <div
              className="bg-primary absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
              style={{ left: `${sliderPercent(priceDraft.min)}%`, right: `${100 - sliderPercent(priceDraft.max)}%` }}
            />
            <input
              type="range"
              aria-label="Giá tối thiểu"
              min={0}
              max={PRICE_SLIDER_MAX}
              step={PRICE_STEP}
              value={Math.min(priceDraft.min, PRICE_SLIDER_MAX)}
              onChange={(e) =>
                setPriceDraft((d) => ({
                  ...d,
                  min: Math.min(Number(e.target.value), d.max > 0 ? d.max : PRICE_SLIDER_MAX),
                }))
              }
              className={cn(
                'absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent',
                'pointer-events-none',
                '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow',
                '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow',
              )}
            />
            <input
              type="range"
              aria-label="Giá tối đa"
              min={0}
              max={PRICE_SLIDER_MAX}
              step={PRICE_STEP}
              value={Math.min(priceDraft.max, PRICE_SLIDER_MAX)}
              onChange={(e) =>
                setPriceDraft((d) => ({ ...d, max: Math.max(Number(e.target.value), d.min) }))
              }
              className={cn(
                'absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent',
                'pointer-events-none',
                '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow',
                '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow',
              )}
            />
          </div>

          <button
            type="submit"
            className="border-primary/60 bg-card hover:bg-accent text-primary w-full rounded-lg border py-2 text-xs font-semibold transition-colors active:scale-95 min-h-11"
          >
            Áp dụng mức giá
          </button>
        </form>
      </FilterGroup>
      {/* Screen group 5 "Tình trạng & Phiên bản" (l.411) omitted: none of its
          three options (24h stock / custom print / collector edition) has a
          backing API param or product field — logged as a deviation. */}
    </div>
  )

  const filterHeader = (
    <div className="flex items-center justify-between border-b border-border/60 pb-4">
      <span className="flex items-center gap-2 text-base font-bold">
        <SlidersHorizontal className="size-5 text-primary" />
        Bộ Lọc Tìm Kiếm
      </span>
      <button type="button" onClick={clearAll} className="text-primary text-xs font-medium hover:underline">
        Đặt lại
      </button>
    </div>
  )

  const priceChipLabel = `Khoảng giá: ${
    minPrice ? formatCurrency(Number(minPrice)) : '0đ'
  } - ${maxPrice ? formatCurrency(Number(maxPrice)) : 'Không giới hạn'}`

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {/* Plan 3 T5 — search heading verbatim per plp-search-states l.179–182;
              Plan 3 T3: `featured` = cờ admin-curated (không phải đơn hàng thật) →
              không được ghi nhãn "bán chạy"; best-selling mới là bán chạy. */}
          {search ? (
            <>
              Kết quả tìm kiếm cho <span className="text-primary">&quot;{search}&quot;</span>
              {meta && (
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  ({meta.total} sản phẩm)
                </span>
              )}
            </>
          ) : currentCategory ? (
            currentCategory.name
          ) : featured ? (
            'Sản phẩm nổi bật'
          ) : bestSelling ? (
            'Sản phẩm bán chạy'
          ) : (
            'Tất cả sản phẩm'
          )}
        </h1>
        <p className="text-muted-foreground mt-1">
          {search && meta ? (
            /* Screen toolbar l.201: "Hiển thị <n> trên <n> kết quả phù hợp". */
            <>
              Hiển thị <span className="text-foreground font-semibold">{products.length}</span> trên{' '}
              <span className="text-foreground font-semibold">{meta.total}</span> kết quả phù hợp
            </>
          ) : meta ? (
            `${meta.total} sản phẩm`
          ) : (
            'Đang tải...'
          )}
        </p>
      </div>

      {/* Toolbar card — screen l.229–288: quick search + sort, active chips row */}
      <div className="bg-card border-border/60 mb-8 flex flex-col gap-4 rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative min-w-[240px] max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Lọc nhanh theo tên mô hình, mã sản phẩm..."
              aria-label="Lọc nhanh theo tên mô hình, mã sản phẩm"
              className="pl-9 pr-9"
            />
            {searchInput && (
              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                {searchInput !== debouncedSearch ? (
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                ) : (
                  <button
                    onClick={() => setSearchInput('')}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted-foreground hidden text-xs sm:inline">Sắp xếp:</span>
            <Select value={sort} onValueChange={(v) => updateParams({ sort: v })}>
              <SelectTrigger className="w-[190px]" aria-label="Sắp xếp">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mobile filter drawer (screen is desktop-only; sidebar collapses
                below lg into the existing Sheet overlay pattern). */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal className="size-4" />
                  Lọc
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4 text-primary" />
                    Bộ Lọc Tìm Kiếm
                  </SheetTitle>
                </SheetHeader>
                <div className="flex justify-end px-4">
                  <button type="button" onClick={clearAll} className="text-primary text-xs font-medium hover:underline">
                    Đặt lại
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-6">{filterGroups}</div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active filter chips — labels verbatim per screen (l.271–286). */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs">
            <span className="text-muted-foreground mr-1 font-medium">Bộ lọc đang bật:</span>
            {search && <FilterChip label={`Tìm kiếm: ${search}`} onRemove={() => updateParams({ search: null })} />}
            {featured && <FilterChip label="Nổi bật" onRemove={() => updateParams({ featured: null })} />}
            {categorySlug && (
              <FilterChip
                label={`Danh mục: ${currentCategory?.name ?? categorySlug}`}
                onRemove={() => updateParams({ categorySlug: null })}
              />
            )}
            {material && (
              <FilterChip label={`Vật liệu: ${materialLabel(material)}`} onRemove={() => updateParams({ material: null })} />
            )}
            {printerType && (
              <FilterChip
                label={`Công nghệ in 3D: ${printerLabel(printerType)}`}
                onRemove={() => updateParams({ printerType: null })}
              />
            )}
            {(minPrice || maxPrice) && (
              <FilterChip
                label={priceChipLabel}
                onRemove={() => updateParams({ minPrice: null, maxPrice: null })}
              />
            )}
            {minRating && (
              <FilterChip
                label={`Đánh giá từ ${minRating} sao`}
                onRemove={() => updateParams({ minRating: null })}
              />
            )}
            <button
              type="button"
              onClick={clearAll}
              className="text-muted-foreground hover:text-primary underline ml-2 font-medium transition-colors"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        {/* Sidebar (desktop) — screen l.290–294: sticky, 1 of 4 columns. */}
        <aside className="bg-card hidden lg:col-span-1 lg:block">
          <div className="sticky top-24 space-y-6 rounded-xl border border-border/60 p-5">
            {filterHeader}
            {filterGroups}
          </div>
        </aside>

        {/* Results */}
        <section className="lg:col-span-3">
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            /* Plan 3 T5 — screen empty panel (l.552–582). Search vs filtered
               mismatch share the screen's single copy variant; the suggestion
               chips + "Xóa bộ lọc & Xem tất cả sản phẩm" action come verbatim
               from the panel, the clear action is omitted only when no filter
               is active (nothing to clear). */
            <EmptyState
              title={EMPTY_TITLE}
              description={EMPTY_DESC}
              icon={<SearchX className="size-7" />}
              action={
                <div className="flex flex-col items-center gap-4">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-[11px]">{SUGGESTIONS_LABEL}</p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {SEARCH_SUGGESTIONS.map((term) => (
                        <Link
                          key={term}
                          to={`/san-pham?search=${encodeURIComponent(term)}`}
                          className="border-border hover:border-primary hover:text-primary rounded-full border px-2.5 py-1 text-xs transition-colors"
                        >
                          {term}
                        </Link>
                      ))}
                    </div>
                  </div>
                  {activeFilters > 0 && (
                    <Button variant="outline" onClick={clearAll} className="border-primary text-primary hover:bg-primary/10">
                      <FilterX className="size-4" />
                      {CLEAR_ALL_LABEL}
                    </Button>
                  )}
                </div>
              }
            />
          ) : (
            <>
              {search ? (
                <div className="flex flex-col gap-4">
                  {products.map((product) => (
                    <SearchResultRow key={product._id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {products.map((product, i) => (
                    <ProductCard key={product._id} product={product} index={i} rank={bestSelling && i < 3 ? (i + 1) as 1 | 2 | 3 : undefined} />
                  ))}
                </div>
              )}
              {meta && <Pagination meta={meta} onPageChange={(p) => updateParams({ page: String(p) }, { keepPage: true })} />}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
