import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { productApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { toast } from 'sonner'
import type { PaginationMeta, Product, ProductStatus } from '@/types'

export const PRODUCT_STATUS_META: Record<ProductStatus, { label: string; className: string }> = {
  active: { label: 'Đang bán', className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' },
  inactive: { label: 'Ẩn', className: 'border-white/10 bg-white/5 text-slate-300' },
  'out-of-stock': { label: 'Hết hàng', className: 'border-amber-400/30 bg-amber-500/10 text-amber-300' },
}

export default function AdminProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [preview, setPreview] = useState<Product | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    productApi
      .list({ page, limit: 12, search: debouncedSearch || undefined })
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
  }, [page, debouncedSearch, refreshKey])

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{meta ? `${meta.total} sản phẩm` : 'Sản phẩm'}</p>
        </div>
        <Button onClick={() => navigate('/admin/san-pham/new')} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500">
          <Plus className="size-4" />
          Thêm sản phẩm
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="border-white/10 bg-slate-900/60 pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-slate-400">
          Không có sản phẩm
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const status = PRODUCT_STATUS_META[product.status]
            const categoryName = typeof product.category === 'object' ? product.category.name : ''
            return (
              <div key={product._id} className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl transition-all hover:border-cyan-400/30 hover:shadow-xl hover:shadow-cyan-500/10">
                <Link to={`/admin/san-pham/${product._id}`} className="block">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={resolveImageUrl(product.images[0] ?? '')}
                      alt={product.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setPreview(product)
                        }}
                        className="rounded-full border border-white/30 bg-white/10 p-2.5 text-white backdrop-blur-md hover:bg-white/20"
                        aria-label="Xem nhanh"
                      >
                        <Eye className="size-5" />
                      </button>
                    </div>
                  </div>
                </Link>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/admin/san-pham/${product._id}`} className="line-clamp-1 text-sm font-semibold text-slate-100 hover:text-cyan-300">
                      {product.name}
                    </Link>
                    <Badge className={status.className}>{status.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    {categoryName}
                    {product.material ? ` · ${product.material}` : ''}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">{formatCurrency(product.salePrice)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/san-pham/${product._id}`)} aria-label="Sửa" className="text-slate-300 hover:bg-white/5 hover:text-white">
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Xóa" className="text-slate-300 hover:bg-white/5 hover:text-rose-400">
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
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}

      <Dialog open={preview !== null} onOpenChange={(open) => { if (!open) setPreview(null) }}>
        <DialogContent className="max-w-2xl border-white/10 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white">{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="grid gap-4 sm:grid-cols-2">
              <img src={resolveImageUrl(preview.images[0] ?? '')} alt={preview.name} className="aspect-square w-full rounded-xl border border-white/10 object-cover" />
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
