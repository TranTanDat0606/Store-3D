import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Search, X } from 'lucide-react'
import { productApi, categoryApi } from '@/services'
import { ProductCard } from '@/components/product/product-card'
import { ProductGridSkeleton } from '@/components/product/product-card-skeleton'
import { Pagination } from '@/components/common/pagination'
import { EmptyState } from '@/components/common/empty-state'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá thấp đến cao' },
  { value: 'price-desc', label: 'Giá cao đến thấp' },
  { value: 'best-selling', label: 'Bán chạy nhất' },
  { value: 'rating', label: 'Đánh giá cao' },
]

const MATERIALS = ['PLA', 'PETG', 'ABS', 'Resin'] as const
const PRINTER_TYPES = ['FDM', 'Resin Printer'] as const

export default function ProductListPage() {
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
  const sort = searchParams.get('sort') ?? 'newest'

  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebounce(searchInput, 400)

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    categoryApi.all().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (debouncedSearch) params.set('search', debouncedSearch)
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
  }, [page, search, categorySlug, featured, material, printerType, minPrice, maxPrice, sort])

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
      featured ? 'featured' : '',
    ].filter((v) => v !== '' && v !== undefined).length
  }, [search, categorySlug, material, printerType, minPrice, maxPrice, featured])

  const clearAll = () => setSearchParams({})

  const currentCategory = categories.find((c) => c.slug === categorySlug)

  const FilterControls = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Danh mục</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => updateParams({ categorySlug: null })}
            className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
              !categorySlug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => updateParams({ categorySlug: cat.slug })}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                categorySlug === cat.slug
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Chất liệu</h3>
        <div className="flex flex-wrap gap-2">
          {MATERIALS.map((m) => (
            <button
              key={m}
              onClick={() => updateParams({ material: material === m ? null : m })}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                material === m
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:border-primary/50 hover:text-primary'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Loại máy in</h3>
        <div className="flex flex-wrap gap-2">
          {PRINTER_TYPES.map((p) => (
            <button
              key={p}
              onClick={() => updateParams({ printerType: printerType === p ? null : p })}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                printerType === p
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:border-primary/50 hover:text-primary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Khoảng giá</h3>
        <div className="flex items-center gap-2">
          <Input
            key={`min-${minPrice || 'none'}`}
            type="number"
            placeholder="Từ"
            defaultValue={minPrice || ''}
            onBlur={(e) => updateParams({ minPrice: e.target.value || null })}
            className="h-9"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            key={`max-${maxPrice || 'none'}`}
            type="number"
            placeholder="Đến"
            defaultValue={maxPrice || ''}
            onBlur={(e) => updateParams({ maxPrice: e.target.value || null })}
            className="h-9"
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {currentCategory ? currentCategory.name : featured ? 'Sản phẩm nổi bật' : 'Tất cả sản phẩm'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {meta ? `${meta.total} sản phẩm` : 'Đang tải...'}
        </p>
      </div>

      {/* Search + controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => updateParams({ sort: v })}>
            <SelectTrigger className="w-[180px]">
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

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="sm:hidden">
                <SlidersHorizontal className="size-4" />
                Lọc
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Bộ lọc</SheetTitle>
              </SheetHeader>
              <div className="mt-4">{FilterControls}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filters */}
      {activeFilters > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {featured && (
            <Badge variant="secondary">
              Nổi bật
              <button onClick={() => updateParams({ featured: null })} aria-label="Bỏ lọc">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {categorySlug && (
            <Badge variant="secondary">
              {currentCategory?.name ?? categorySlug}
              <button onClick={() => updateParams({ categorySlug: null })} aria-label="Bỏ lọc">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {material && (
            <Badge variant="secondary">
              {material}
              <button onClick={() => updateParams({ material: null })} aria-label="Bỏ lọc">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {printerType && (
            <Badge variant="secondary">
              {printerType}
              <button onClick={() => updateParams({ printerType: null })} aria-label="Bỏ lọc">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Xóa tất cả bộ lọc
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border p-4">{FilterControls}</div>
        </aside>

        {/* Results */}
        <div>
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            <EmptyState
              title="Không tìm thấy sản phẩm"
              description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác."
              action={
                <Button variant="outline" onClick={clearAll}>
                  Xóa bộ lọc
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((product, i) => (
                  <ProductCard key={product._id} product={product} index={i} />
                ))}
              </div>
              {meta && <Pagination meta={meta} onPageChange={(p) => updateParams({ page: String(p) }, { keepPage: true })} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
