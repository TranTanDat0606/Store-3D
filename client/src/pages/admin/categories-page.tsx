import { useEffect, useState } from 'react'
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import { categoryApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { resolveImageUrl } from '@/lib'
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
import { ImageUpload } from '@/components/admin/image-upload'
import { EmptyState } from '@/components/common/empty-state'
import { toast } from 'sonner'
import type { Category } from '@/types'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', description: '', image: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    categoryApi.all().then(setCategories).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', image: '' })
    setError('')
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, description: cat.description ?? '', image: cat.image })
    setError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError('')
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên danh mục')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await categoryApi.update(editing._id, form)
        toast.success('Cập nhật danh mục thành công')
      } else {
        await categoryApi.create(form)
        toast.success('Tạo danh mục thành công')
      }
      setDialogOpen(false)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      await categoryApi.remove(id)
      toast.success(`Đã xóa danh mục "${name}"`)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{categories.length} danh mục</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500">
          <Plus className="size-4" />
          Thêm danh mục
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState title="Chưa có danh mục" description="Tạo danh mục đầu tiên của bạn." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat._id} className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl transition-all hover:border-cyan-400/30 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="bg-muted relative aspect-video overflow-hidden">
                {cat.image ? (
                  <img src={resolveImageUrl(cat.image)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="flex size-full items-center justify-center text-slate-500">
                    <Layers className="size-10" />
                  </div>
                )}
              </div>
              <div className="space-y-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-semibold text-slate-100">{cat.name}</p>
                </div>
                <p className="line-clamp-2 text-xs text-slate-400">{cat.description || 'Chưa có mô tả'}</p>
                <p className="text-[10px] text-slate-500">{cat.slug}</p>
                <div className="flex justify-end gap-1 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cat)} className="text-slate-300 hover:bg-white/5 hover:text-white">
                    <Pencil className="size-4" />
                    Sửa
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/5 hover:text-rose-400">
                        <Trash2 className="size-4" />
                        Xóa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-white/10 bg-slate-900 text-slate-100">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Xóa danh mục?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          Bạn có chắc muốn xóa danh mục "{cat.name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">Hủy</AlertDialogCancel>
                        <AlertDialogAction className="bg-rose-500 text-white hover:bg-rose-600" onClick={() => handleDelete(cat._id, cat.name)}>
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-white/10 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="text-slate-300">Tên danh mục</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Figurine"
                className="border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-300">Hình ảnh</Label>
              <ImageUpload
                images={form.image ? [form.image] : []}
                max={1}
                onChange={(images) => setForm({ ...form, image: images[0] ?? '' })}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-300">Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Mô tả danh mục..."
                className="border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500">
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm danh mục'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
