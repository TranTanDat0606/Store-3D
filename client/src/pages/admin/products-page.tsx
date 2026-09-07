import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  ImageOff,
  Package,
  Pencil,
  Plus,
  Search,
  SearchX,
  XCircle,
} from 'lucide-react'
import { productApi, categoryApi } from '@/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Pagination } from '@/components/common/pagination'
import { formatCurrency, resolveImageUrl } from '@/lib'
import { cn } from '@/lib/utils'
import type { Category, PaginationMeta, Product, ProductStatus } from '@/types'

export const PRODUCT_STATUS_META: Record<ProductStatus, { label: string; className: string }> = {
  active: { label: 'Đang bán', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  inactive: { label: 'Ẩn', className: 'border-border bg-muted text-muted-foreground' },
  'out-of-stock': { label: 'Hết hàng', className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
}

const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 500.000 ₫', min: undefined, max: 500000 },
  { label: '500.000 – 1.000.000 ₫', min: 500000, max: 1000000 },
  { label: '1.000.000 – 3.000.000 ₫', min: 1000000, max: 3000000 },
  { label: 'Trên 3.000.000 ₫', min: 3000000, max: undefined },
] as const

interface Stats {
  total: number
  active: number
  lowStock: number
  outOfStock: number
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  accentClass: string
}

function StatCard({ label, value, icon: Icon, accentClass }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4">
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', accentClass)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold text-foreground">{value.toLocaleString('vi-VN')}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
}

function TableSkeleton({ rows = 6 }: TableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border">
          {['Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Trạng thái', 'Thao tác'].map((h) => (
            <TableHead key={h} className="text-muted-foreground">{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i} className="border-border">
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="size-14 rounded-lg bg-muted" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-40 bg-muted" />
                  <Skeleton className="h-3 w-24 bg-muted" />
                </div>
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-20 bg-muted" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24 bg-muted" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10 bg-muted" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20 rounded-full bg-muted" /></TableCell>
            <TableCell><Skeleton className="h-8 w-24 bg-muted" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function AdminProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, lowStock: 0, outOfStock: 0 })
  const [categories, setCategories] = useState<Category[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [refreshKey, _setRefreshKey] = useState(0)
  const [preview, setPreview] = useState<Product | null>(null)

  const hasActiveFilters = Boolean(debouncedSearch.trim() || category || status || priceRange)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, category, status, priceRange])

  const selectedPrice = useMemo(
    () => PRICE_RANGES.find((r) => r.label === priceRange) ?? PRICE_RANGES[0],
    [priceRange],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    productApi
      .list({
        page,
        limit: 12,
        search: debouncedSearch.trim() || undefined,
        category: category || undefined,
        status: status || undefined,
        minPrice: selectedPrice?.min,
        maxPrice: selectedPrice?.max,
      })
      .then((res) => {
        if (cancelled) return
        setProducts(res.data)
        setMeta(res.pagination)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch, category, status, selectedPrice, refreshKey])

  useEffect(() => {
    let cancelled = false
    setStatsLoading(true)
    void Promise.all([
      productApi.list({ limit: 1 }),
      productApi.list({ limit: 1, status: 'active' }),
      productApi.list({ limit: 100, status: 'active' }),
      productApi.list({ limit: 1, status: 'out-of-stock' }),
      categoryApi.all(),
    ])
      .then(([all, activeRes, activeSample, outOfStockRes, cats]) => {
        if (cancelled) return
        const lowStock = activeSample.data.filter((p) => p.stock > 0 && p.stock <= 10).length
        setStats({
          total: all.pagination.total,
          active: activeRes.pagination.total,
          lowStock,
          outOfStock: outOfStockRes.pagination.total,
        })
        setCategories(cats)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const resetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setCategory('')
    setStatus('')
    setPriceRange('')
    setPage(1)
  }

  const firstItem = meta ? (meta.page - 1) * meta.limit + 1 : 0
  const lastItem = meta ? Math.min(meta.page * meta.limit, meta.total) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Dashboard</span>
            <ChevronRight className="size-3" />
            <span className="text-foreground">Sản phẩm</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Sản phẩm</h2>
          <p className="text-sm text-muted-foreground">Quản lý kho hàng và trạng thái sản phẩm</p>
        </div>
        <Button onClick={() => navigate('/admin/san-pham/new')}>
          <Plus className="size-4" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-xl bg-muted" />
            ))}
          </>
        ) : (
          <>
            <StatCard label="Tổng sản phẩm" value={stats.total} icon={Package} accentClass="bg-cyan-500/10 text-cyan-300" />
            <StatCard label="Đang bán" value={stats.active} icon={CheckCircle2} accentClass="bg-emerald-500/10 text-emerald-300" />
            <StatCard label="Sắp hết" value={stats.lowStock} icon={AlertTriangle} accentClass="bg-amber-500/10 text-amber-300" />
            <StatCard label="Hết hàng" value={stats.outOfStock} icon={XCircle} accentClass="bg-rose-500/10 text-rose-300" />
          </>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả danh mục</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              <SelectItem value="active">Đang bán</SelectItem>
              <SelectItem value="inactive">Ẩn</SelectItem>
              <SelectItem value="out-of-stock">Hết hàng</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Khoảng giá" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((r) => (
                <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/50">
        {loading ? (
          <TableSkeleton />
        ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted">
              <SearchX className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Không tìm thấy sản phẩm</p>
              <p className="mt-1 text-sm text-muted-foreground">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1">
              Xóa bộ lọc
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Sản phẩm</TableHead>
                <TableHead className="text-muted-foreground">Danh mục</TableHead>
                <TableHead className="text-right text-muted-foreground">Giá</TableHead>
                <TableHead className="text-center text-muted-foreground">Tồn kho</TableHead>
                <TableHead className="text-muted-foreground">Trạng thái</TableHead>
                <TableHead className="text-right text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const statusMeta = PRODUCT_STATUS_META[product.status]
                const categoryName = typeof product.category === 'object' ? product.category.name : ''
                const stockColor =
                  product.stock <= 0 ? 'text-destructive' : product.stock <= 10 ? 'text-amber-500' : 'text-emerald-500'
                return (
                  <TableRow key={product._id} className="group border-border transition-colors duration-150 hover:bg-accent/50">
                    <TableCell className="min-w-64">
                      <div className="flex items-center gap-3">
                        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                          {product.images[0] ? (
                            <img src={resolveImageUrl(product.images[0])} alt={product.name} loading="lazy" className="size-full object-cover" />
                          ) : (
                            <ImageOff className="size-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/san-pham/${product._id}`}
                            className="line-clamp-1 text-sm font-medium text-foreground transition-colors hover:text-primary"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{product.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryName || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-foreground">{formatCurrency(product.salePrice)}</span>
                        {product.originalPrice > product.salePrice && (
                          <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.originalPrice)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={cn('whitespace-nowrap text-center font-medium', stockColor)}>
                      {product.stock.toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-40 transition-opacity duration-150 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreview(product)}
                          aria-label="Xem nhanh"
                          className="size-8"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/san-pham/${product._id}`)}
                          aria-label="Chỉnh sửa"
                          className="size-8"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Hiển thị {firstItem}–{lastItem} trong tổng số {meta.total} sản phẩm
            </p>
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={preview !== null} onOpenChange={(open) => { if (!open) setPreview(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="grid gap-4 sm:grid-cols-2">
              <img src={resolveImageUrl(preview.images[0] ?? '')} alt={preview.name} className="aspect-square w-full rounded-xl border border-border object-contain" />
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="text-muted-foreground">Danh mục: </span>
                  {typeof preview.category === 'object' ? preview.category.name : '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Chất liệu: </span>{preview.material} · {preview.printerType}
                </p>
                <p>
                  <span className="text-muted-foreground">Kích thước: </span>{preview.size || '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Tồn kho: </span>{preview.stock}
                </p>
                <p>
                  <span className="text-muted-foreground">Giá bán: </span>
                  <span className="font-semibold text-primary">{formatCurrency(preview.salePrice)}</span>
                </p>
                {preview.originalPrice > preview.salePrice && (
                  <p>
                    <span className="text-muted-foreground">Giá gốc: </span>
                    <span className="line-through">{formatCurrency(preview.originalPrice)}</span>
                  </p>
                )}
                <p className="text-muted-foreground">
                  Đánh giá: <span className="text-amber-500">★ {preview.rating}</span> ({preview.reviewCount})
                </p>
                <Button onClick={() => navigate(`/admin/san-pham/${preview._id}`)} className="w-full">
                  <Pencil className="size-4" />
                  Chỉnh sửa sản phẩm
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}