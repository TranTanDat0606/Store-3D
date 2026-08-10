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
        <Skeleton className="h-[30rem] rounded-2xl bg-white/5" />
        <Skeleton className="h-[30rem] rounded-2xl bg-white/5" />
      </div>
    )
  }

  const previewImage = resolveImageUrl(form.images[activeImage] ?? form.images[0] ?? '')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/san-pham')} className="text-slate-300 hover:bg-white/5 hover:text-white" aria-label="Quay lại">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-white">{isNew ? 'Thêm sản phẩm mới' : product?.name}</h2>
            <p className="text-sm text-slate-400">{isNew ? 'Điền thông tin để tạo sản phẩm mới' : product?.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200">
                  <Trash2 className="size-4" />
                  Xóa
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-white/10 bg-slate-900 text-slate-100">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Xóa sản phẩm?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Bạn có chắc muốn xóa "{product?.name}"? Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">Hủy</AlertDialogCancel>
                  <AlertDialogAction className="bg-rose-500 text-white hover:bg-rose-600" onClick={handleDelete}>
                    Xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500">
            <Save className="size-4" />
            {saving ? 'Đang lưu...' : isNew ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview panel */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
            {previewImage ? (
              <div className="group relative">
                <img src={previewImage} alt={form.name || 'Xem trước'} className="aspect-square w-full object-cover" />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center text-sm text-slate-500">
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
                    ? 'rounded-lg border border-cyan-400/60 p-0.5'
                    : 'rounded-lg border border-white/10 p-0.5 hover:border-white/30'}
                >
                  <img src={resolveImageUrl(img)} alt="" className="size-16 rounded-md object-cover" />
                </button>
              ))}
            </div>
          )}
          {!isNew && product && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
              <p className="text-sm text-slate-400">Giá bán: <span className="font-bold text-cyan-300">{formatCurrency(product.salePrice)}</span></p>
              <p className="text-xs text-slate-500">Lượt đánh giá: ★ {product.rating} ({product.reviewCount})</p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-slate-300">Tên sản phẩm</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tên sản phẩm" className="border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40" />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-300">Danh mục</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="w-full border-white/10 bg-slate-950/60 text-slate-100">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900 text-slate-100">
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-slate-300">Hình ảnh</Label>
            <ImageUpload images={form.images} onChange={(images) => { setForm({ ...form, images }); setActiveImage(0) }} />
          </div>

          <div className="grid gap-2">
            <Label className="text-slate-300">Mô tả</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Mô tả chi tiết sản phẩm..." className="border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label className="text-slate-300">Chất liệu</Label>
              <Select value={form.material} onValueChange={(v) => setForm({ ...form, material: v as ProductMaterial })}>
                <SelectTrigger className="w-full border-white/10 bg-slate-950/60 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900 text-slate-100">
                  {['PLA', 'PETG', 'ABS', 'Resin'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-300">Loại máy in</Label>
              <Select value={form.printerType} onValueChange={(v) => setForm({ ...form, printerType: v as PrinterType })}>
                <SelectTrigger className="w-full border-white/10 bg-slate-950/60 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900 text-slate-100">
                  {['FDM', 'Resin Printer'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-300">Kích thước</Label>
              <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="VD: 10x10x15cm" className="border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label className="text-slate-300">Giá gốc (VNĐ)</Label>
              <Input type="number" value={form.originalPrice || ''} onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })} className="border-white/10 bg-slate-950/60 text-slate-100 focus-visible:ring-cyan-400/40" />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-300">Giá bán (VNĐ)</Label>
              <Input type="number" value={form.salePrice || ''} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} className="border-white/10 bg-slate-950/60 text-slate-100 focus-visible:ring-cyan-400/40" />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-300">Tồn kho</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="border-white/10 bg-slate-950/60 text-slate-100 focus-visible:ring-cyan-400/40" />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <Label className="cursor-pointer text-slate-300">Nổi bật</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-slate-300">Trạng thái:</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProductStatus })}>
                <SelectTrigger className="w-[150px] border-white/10 bg-slate-950/60 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900 text-slate-100">
                  {(Object.keys(PRODUCT_STATUS_META) as ProductStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{PRODUCT_STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isNew && product && (
            <div className="border-t border-white/10 pt-3 text-xs text-slate-500">
              <Link to={`/san-pham/${product.slug}`} className="hover:text-cyan-300">Xem trang sản phẩm →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
