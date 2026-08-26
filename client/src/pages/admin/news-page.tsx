import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { newsApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { formatDate } from '@/lib'
import { toast } from 'sonner'
import type { News } from '@/types'

interface NewsForm {
  title: string
  excerpt: string
  content: string
  thumbnail: string
  category: string
  author: string
  status: 'draft' | 'published'
}

const EMPTY: NewsForm = {
  title: '',
  excerpt: '',
  content: '',
  thumbnail: '',
  category: 'general',
  author: 'Store3D',
  status: 'draft',
}

const CATEGORIES = [
  { value: 'general', label: 'Tin tức' },
  { value: '3d-printing', label: 'In 3D' },
  { value: 'fdm', label: 'FDM' },
  { value: 'resin', label: 'Resin/SLA' },
  { value: 'filament', label: 'Filament' },
  { value: 'tips', label: 'Tips & Tricks' },
]

export default function AdminNewsPage() {
  const [newsList, setNewsList] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<News | null>(null)
  const [form, setForm] = useState<NewsForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { limit: 50 }
    if (statusFilter) params.status = statusFilter
    newsApi
      .adminList(params)
      .then((res) => setNewsList(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setDialogOpen(true)
  }

  const openEdit = (n: News) => {
    setEditing(n)
    setForm({
      title: n.title,
      excerpt: n.excerpt,
      content: n.content,
      thumbnail: n.thumbnail,
      category: n.category,
      author: n.author,
      status: n.status,
    })
    setError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError('')
    if (!form.title.trim()) {
      setError('Vui lòng nhập tiêu đề')
      return
    }
    if (!form.content.trim()) {
      setError('Vui lòng nhập nội dung')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await newsApi.adminUpdate(editing._id, form)
        toast.success('Cập nhật bài viết thành công')
      } else {
        await newsApi.adminCreate(form)
        toast.success('Tạo bài viết thành công')
      }
      setDialogOpen(false)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await newsApi.adminRemove(id)
      toast.success('Xóa bài viết thành công')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bài viết</h1>
          <p className="text-muted-foreground">{newsList.length} bài viết</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Thêm bài viết
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted h-48 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : newsList.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed py-12 text-center">
          Chưa có bài viết nào
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {newsList.map((n) => (
            <Card key={n._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {n.status === 'published' ? (
                        <Eye className="size-4 text-emerald-500" />
                      ) : (
                        <EyeOff className="size-4 text-muted-foreground" />
                      )}
                      <Badge variant={n.status === 'published' ? 'default' : 'secondary'}>
                        {n.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 font-semibold">{n.title}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {n.category} · {formatDate(n.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(n)} aria-label="Sửa">
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
                          <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc muốn xóa bài viết &quot;{n.title}&quot;?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => handleDelete(n._id)}
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa bài viết' : 'Thêm bài viết mới'}</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Tiêu đề *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Tiêu đề bài viết"
              />
            </div>
            <div className="grid gap-2">
              <Label>Mô tả ngắn</Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Mô tả ngắn gọn nội dung bài viết..."
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Nội dung * (HTML)</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Nội dung bài viết (hỗ trợ HTML)..."
                rows={10}
              />
            </div>
            <div className="grid gap-2">
              <Label>Thumbnail URL</Label>
              <Input
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://... hoặc upload ảnh"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Danh mục</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tác giả</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as 'draft' | 'published' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bản nháp</SelectItem>
                    <SelectItem value="published">Xuất bản</SelectItem>
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
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo bài viết'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
