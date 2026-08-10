import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { categoryApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
          <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
          <p className="text-muted-foreground">{categories.length} danh mục</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm danh mục
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted h-40 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState title="Chưa có danh mục" description="Tạo danh mục đầu tiên của bạn." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat._id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    {cat.image ? (
                      <img src={cat.image} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground text-xs">No img</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {cat.description || 'Chưa có mô tả'}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">{cat.slug}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-1 border-t pt-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                    <Pencil className="size-4" />
                    Sửa
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="size-4 text-destructive" />
                        Xóa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn xóa danh mục "{cat.name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => handleDelete(cat._id, cat.name)}
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Tên danh mục</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Figurine"
              />
            </div>
            <div className="grid gap-2">
              <Label>Hình ảnh</Label>
              <ImageUpload
                images={form.image ? [form.image] : []}
                max={1}
                onChange={(images) => setForm({ ...form, image: images[0] ?? '' })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Mô tả danh mục..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm danh mục'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
