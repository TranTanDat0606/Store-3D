import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { productApi, categoryApi, type ProductPayload } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Pagination } from '@/components/common/pagination'
import { ImageUpload } from '@/components/admin/image-upload'
import { formatCurrency, resolveImageUrl } from '@/lib'
import { toast } from 'sonner'
import type { Category, PaginationMeta, Product, ProductMaterial, PrinterType } from '@/types'

const EMPTY_FORM: ProductPayload = {
  name: '',
  description: '',
  images: [],
  category: '',
  material: 'PLA',
  printerType: 'FDM',
  size: '',
  stock: 0,
  originalPrice: 0,
  salePrice: 0,
  status: 'active',
  featured: false,
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    categoryApi.all().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    productApi
      .list({ page, limit: 10, search: debouncedSearch || undefined })
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

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description,
      images: product.images,
      category: typeof product.category === 'object' ? product.category._id : product.category,
      material: product.material,
      printerType: product.printerType,
      size: product.size,
      stock: product.stock,
      originalPrice: product.originalPrice,
      salePrice: product.salePrice,
      status: product.status,
      featured: product.featured,
    })
    setError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError('')
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên sản phẩm')
      return
    }
    if (!form.category) {
      setError('Vui lòng chọn danh mục')
      return
    }
    if (form.images.length === 0) {
      setError('Vui lòng thêm ít nhất một hình ảnh')
      return
    }
    if (form.salePrice <= 0) {
      setError('Giá bán phải lớn hơn 0')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await productApi.update(editing._id, form)
        toast.success('Cập nhật sản phẩm thành công')
      } else {
        await productApi.create(form)
        toast.success('Tạo sản phẩm thành công')
      }
      setDialogOpen(false)
      setPage(1)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground">{meta ? `${meta.total} sản phẩm` : ''}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm sản phẩm
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Ảnh</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá bán</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Không có sản phẩm
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <img
                      src={resolveImageUrl(product.images[0] ?? '')}
                      alt=""
                      className="bg-muted size-12 rounded-lg object-cover"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Link to={`/san-pham/${product.slug}`} className="hover:text-primary line-clamp-1 font-medium">
                        {product.name}
                      </Link>
                      <span className="text-muted-foreground text-xs">{product.material}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof product.category === 'object' ? product.category.name : '—'}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(product.salePrice)}</TableCell>
                  <TableCell>
                    <Badge variant={product.stock > 0 ? 'secondary' : 'destructive'}>
                      {product.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'active' ? 'default' : 'outline'}>
                      {product.status === 'active' ? 'Đang bán' : product.status === 'inactive' ? 'Ẩn' : 'Hết hàng'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)} aria-label="Sửa">
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Xóa">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa "{product.name}"? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() => handleDelete(product._id)}
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && <Pagination meta={meta} onPageChange={setPage} />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tên sản phẩm</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tên sản phẩm"
                />
              </div>
              <div className="grid gap-2">
                <Label>Danh mục</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Hình ảnh</Label>
              <ImageUpload images={form.images} onChange={(images) => setForm({ ...form, images })} />
            </div>

            <div className="grid gap-2">
              <Label>Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                placeholder="Mô tả chi tiết sản phẩm..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Chất liệu</Label>
                <Select value={form.material} onValueChange={(v) => setForm({ ...form, material: v as ProductMaterial })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['PLA', 'PETG', 'ABS', 'Resin'].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Loại máy in</Label>
                <Select value={form.printerType} onValueChange={(v) => setForm({ ...form, printerType: v as PrinterType })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['FDM', 'Resin Printer'].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Kích thước</Label>
                <Input
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="VD: 10x10x15cm"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Giá gốc (VNĐ)</Label>
                <Input
                  type="number"
                  value={form.originalPrice || ''}
                  onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Giá bán (VNĐ)</Label>
                <Input
                  type="number"
                  value={form.salePrice || ''}
                  onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tồn kho</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => setForm({ ...form, featured: v })}
                />
                <Label className="cursor-pointer">Nổi bật</Label>
              </div>
              <div className="flex items-center gap-2">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProductPayload['status'] })}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang bán</SelectItem>
                    <SelectItem value="inactive">Ẩn</SelectItem>
                    <SelectItem value="out-of-stock">Hết hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
