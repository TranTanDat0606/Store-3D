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
  Trash2,
  XCircle,
} from 'lucide-react'
import { productApi, categoryApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Pagination } from '@/components/common/pagination'
import { formatCurrency, resolveImageUrl } from '@/lib'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Category, PaginationMeta, Product, ProductStatus } from '@/types'

export const PRODUCT_STATUS_META: Record<ProductStatus, { label: string; className: string }> = {
  active: { label: 'Đang bán', className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' },
  inactive: { label: 'Ẩn', className: 'border-white/10 bg-white/5 text-slate-300' },
  'out-of-stock': { label: 'Hết hàng', className: 'border-amber-400/30 bg-amber-500/10 text-amber-300' },
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
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', accentClass)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold text-white">{value.toLocaleString('vi-VN')}</p>
        <p className="truncate text-xs text-slate-400">{label}</p>
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
        <TableRow className="border-white/10">
          {['Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Trạng thái', 'Thao tác'].map((h) => (
            <TableHead key={h} className="text-slate-400">{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i} className="border-white/10">
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="size-14 rounded-lg bg-white/5" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-40 bg-white/5" />
                  <Skeleton className="h-3 w-24 bg-white/5" />
                </div>
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-20 bg-white/5" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10 bg-white/5" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20 rounded-full bg-white/5" /></TableCell>
            <TableCell><Skeleton className="h-8 w-24 bg-white/5" /></TableCell>
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
  const [refreshKey, setRefreshKey] = useState(0)
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

  const handleDelete = async (id: string) => {
    try {
      await productApi.remove(id)
      toast.success('Xóa sản phẩm thành công')
      setPage(1)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const firstItem = meta ? (meta.page - 1) * meta.limit + 1 : 0
  const lastItem = meta ? Math.min(meta.page * meta.limit, meta.total) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Dashboard</span>
            <ChevronRight className="size-3" />
            <span className="text-slate-300">Sản phẩm</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Sản phẩm</h2>
          <p className="text-sm text-slate-400">Quản lý kho hàng và trạng thái sản phẩm</p>
        </div>
        <Button onClick={() => navigate('/admin/san-pham/new')} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500">
          <Plus className="size-4" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-xl bg-white/5" />
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
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
            className="border-white/10 bg-slate-900/60 pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="border-white/10 bg-slate-900/60 text-slate-200" size="sm">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-slate-900 text-slate-200">
              <SelectItem value="">Tất cả danh mục</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="border-white/10 bg-slate-900/60 text-slate-200" size="sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-slate-900 text-slate-200">
              <SelectItem value="">Tất cả</SelectItem>
              <SelectItem value="active">Đang bán</SelectItem>
              <SelectItem value="inactive">Ẩn</SelectItem>
              <SelectItem value="out-of-stock">Hết hàng</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="border-white/10 bg-slate-900/60 text-slate-200" size="sm">
              <SelectValue placeholder="Khoảng giá" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-slate-900 text-slate-200">
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
            className="text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
        {loading ? (
          <TableSkeleton />
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <SearchX className="size-7 text-slate-500" />
            </div>
            <div>
              <p className="font-medium text-white">Không tìm thấy sản phẩm</p>
              <p className="mt-1 text-sm text-slate-400">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1 border-white/10 text-slate-200 hover:bg-white/5">
              Xóa bộ lọc
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">Sản phẩm</TableHead>
                <TableHead className="text-slate-400">Danh mục</TableHead>
                <TableHead className="text-right text-slate-400">Giá</TableHead>
                <TableHead className="text-center text-slate-400">Tồn kho</TableHead>
                <TableHead className="text-slate-400">Trạng thái</TableHead>
                <TableHead className="text-right text-slate-400">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const statusMeta = PRODUCT_STATUS_META[product.status]
                const categoryName = typeof product.category === 'object' ? product.category.name : ''
                const stockColor =
                  product.stock <= 0 ? 'text-rose-400' : product.stock <= 10 ? 'text-amber-300' : 'text-emerald-400'
                return (
                  <TableRow key={product._id} className="group border-white/10 transition-colors duration-150 hover:bg-white/5">
                    <TableCell className="min-w-64">
                      <div className="flex items-center gap-3">
                        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-800/80">
                          {product.images[0] ? (
                            <img src={resolveImageUrl(product.images[0])} alt={product.name} loading="lazy" className="size-full object-cover" />
                          ) : (
                            <ImageOff className="size-5 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/san-pham/${product._id}`}
                            className="line-clamp-1 text-sm font-medium text-white transition-colors hover:text-cyan-300"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-0.5 truncate font-mono text-xs text-slate-500">{product.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/10 text-slate-300">
                        {categoryName || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-white">{formatCurrency(product.salePrice)}</span>
                        {product.originalPrice > product.salePrice && (
                          <span className="text-xs text-slate-500 line-through">{formatCurrency(product.originalPrice)}</span>
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
                          className="size-8 text-slate-300 hover:bg-white/5 hover:text-white"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/san-pham/${product._id}`)}
                          aria-label="Chỉnh sửa"
                          className="size-8 text-slate-300 hover:bg-white/5 hover:text-white"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Xóa" className="size-8 text-slate-300 hover:bg-white/5 hover:text-rose-400">
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-white/10 bg-slate-900 text-slate-100">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Xóa sản phẩm?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                Bạn có chắc muốn xóa "{product.name}"? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">Hủy</AlertDialogCancel>
                              <AlertDialogAction className="bg-rose-500 text-white hover:bg-rose-600" onClick={() => handleDelete(product._id)}>
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:flex-row">
            <p className="text-sm text-slate-400">
              Hiển thị {firstItem}–{lastItem} trong tổng số {meta.total} sản phẩm
            </p>
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={preview !== null} onOpenChange={(open) => { if (!open) setPreview(null) }}>
        <DialogContent className="max-w-2xl border-white/10 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white">{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="grid gap-4 sm:grid-cols-2">
              <img src={resolveImageUrl(preview.images[0] ?? '')} alt={preview.name} className="aspect-square w-full rounded-xl border border-white/10 object-contain" />
              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  <span className="text-slate-400">Danh mục: </span>
                  {typeof preview.category === 'object' ? preview.category.name : '—'}
                </p>
                <p>
                  <span className="text-slate-400">Chất liệu: </span>{preview.material} · {preview.printerType}
                </p>
                <p>
                  <span className="text-slate-400">Kích thước: </span>{preview.size || '—'}
                </p>
                <p>
                  <span className="text-slate-400">Tồn kho: </span>{preview.stock}
                </p>
                <p>
                  <span className="text-slate-400">Giá bán: </span>
                  <span className="font-semibold text-cyan-300">{formatCurrency(preview.salePrice)}</span>
                </p>
                {preview.originalPrice > preview.salePrice && (
                  <p>
                    <span className="text-slate-400">Giá gốc: </span>
                    <span className="line-through">{formatCurrency(preview.originalPrice)}</span>
                  </p>
                )}
                <p className="text-slate-400">
                  Đánh giá: <span className="text-amber-300">★ {preview.rating}</span> ({preview.reviewCount})
                </p>
                <Button onClick={() => navigate(`/admin/san-pham/${preview._id}`)} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500">
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