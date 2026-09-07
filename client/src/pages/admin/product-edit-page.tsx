import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { productApi, categoryApi, type ProductPayload } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageUpload } from '@/components/admin/image-upload'
import { PRODUCT_STATUS_META } from './products-page'
import { formatCurrency, resolveImageUrl } from '@/lib'
import { toast } from 'sonner'
import type { Category, Product, ProductMaterial, ProductStatus, PrinterType } from '@/types'

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

export default function AdminProductEditPage() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<ProductPayload>(EMPTY_FORM)
  const [activeImage, setActiveImage] = useState(0)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    categoryApi.all().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    setLoading(true)
    productApi
      .getById(id)
      .then((p) => {
        if (cancelled) return
        setProduct(p)
        setForm({
          name: p.name,
          description: p.description,
          images: p.images,
          category: typeof p.category === 'object' ? p.category._id : p.category,
          material: p.material,
          printerType: p.printerType,
          size: p.size,
          stock: p.stock,
          originalPrice: p.originalPrice,
          salePrice: p.salePrice,
          status: p.status,
          featured: p.featured,
        })
      })
      .catch(() => navigate('/admin/san-pham', { replace: true }))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isNew, navigate])

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
      if (isNew) {
        await productApi.create(form)
        toast.success('Tạo sản phẩm thành công')
      } else {
        await productApi.update(id, form)
        toast.success('Cập nhật sản phẩm thành công')
      }
      navigate('/admin/san-pham')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isNew) return
    try {
      await productApi.remove(id)
      toast.success('Xóa sản phẩm thành công')
      navigate('/admin/san-pham')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[30rem] rounded-2xl bg-muted" />
        <Skeleton className="h-[30rem] rounded-2xl bg-muted" />
      </div>
    )
  }

  const previewImage = resolveImageUrl(form.images[activeImage] ?? form.images[0] ?? '')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/san-pham')} className="hover:bg-muted hover:text-accent-foreground" aria-label="Quay lại">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">{isNew ? 'Thêm sản phẩm mới' : product?.name}</h2>
            <p className="text-sm text-muted-foreground">{isNew ? 'Điền thông tin để tạo sản phẩm mới' : product?.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                  <Trash2 className="size-4" />
                  Xóa
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn xóa "{product?.name}"? Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
                    Xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {saving ? 'Đang lưu...' : isNew ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview panel */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card/50">
            {previewImage ? (
              <div className="group relative">
                <img src={previewImage} alt={form.name || 'Xem trước'} className="aspect-square w-full object-contain" />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
                Chưa có hình ảnh
              </div>
            )}
          </div>
          {form.images.length > 1 && (
            <div className="flex gap-2">
              {form.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={resolveImageUrl(img) === previewImage
                    ? 'rounded-lg border border-primary p-0.5'
                    : 'rounded-lg border border-border p-0.5 hover:border-border'}
                >
                  <img src={resolveImageUrl(img)} alt="" className="size-16 rounded-md object-cover" />
                </button>
              ))}
            </div>
          )}
          {!isNew && product && (
            <div className="rounded-2xl border border-border bg-card/50 p-4">
              <p className="text-sm text-muted-foreground">Giá bán: <span className="font-bold text-primary">{formatCurrency(product.salePrice)}</span></p>
              <p className="text-xs text-muted-foreground">Lượt đánh giá: ★ {product.rating} ({product.reviewCount})</p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4 rounded-2xl border border-border bg-card/50 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Tên sản phẩm</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tên sản phẩm" />
            </div>
            <div className="grid gap-2">
              <Label>Danh mục</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
              <Label>Hình ảnh</Label>
            <ImageUpload images={form.images} onChange={(images) => { setForm({ ...form, images }); setActiveImage(0) }} />
          </div>

          <div className="grid gap-2">
            <Label>Mô tả</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Mô tả chi tiết sản phẩm..." />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Chất liệu</Label>
              <Select value={form.material} onValueChange={(v) => setForm({ ...form, material: v as ProductMaterial })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['PLA', 'PETG', 'ABS', 'Resin'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
                  {['FDM', 'Resin Printer'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Kích thước</Label>
              <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="VD: 10x10x15cm" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Giá gốc (VNĐ)</Label>
              <Input type="number" value={form.originalPrice || ''} onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Giá bán (VNĐ)</Label>
              <Input type="number" value={form.salePrice || ''} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Tồn kho</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <Label className="cursor-pointer">Nổi bật</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label>Trạng thái:</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProductStatus })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRODUCT_STATUS_META) as ProductStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{PRODUCT_STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isNew && product && (
            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              <Link to={`/san-pham/${product.slug}`} className="hover:text-primary">Xem trang sản phẩm →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
