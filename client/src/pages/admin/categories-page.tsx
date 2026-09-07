import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Inbox, Layers, Package, Pencil, Plus, Search, SearchX, Trash2 } from 'lucide-react'
import { categoryApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { resolveImageUrl } from '@/lib'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Category } from '@/types'

const SCOPE_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'has', label: 'Có sản phẩm' },
  { value: 'empty', label: 'Trống' },
] as const

type Scope = (typeof SCOPE_OPTIONS)[number]['value']

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

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border">
          {['Danh mục', 'Mô tả', 'Sản phẩm', 'Ngày tạo', 'Thao tác'].map((h) => (
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
                  <Skeleton className="h-3.5 w-36 bg-muted" />
                  <Skeleton className="h-3 w-20 bg-muted" />
                </div>
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-44 bg-muted" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10 bg-muted" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24 bg-muted" /></TableCell>
            <TableCell><Skeleton className="h-8 w-24 bg-muted" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', description: '', image: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    categoryApi.all().then(setCategories).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(load, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const hasActiveFilters = Boolean(debouncedSearch.trim() || scope !== 'all')

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return categories.filter((cat) => {
      if (scope === 'has' && !(cat.productCount ?? 0)) return false
      if (scope === 'empty' && (cat.productCount ?? 0) > 0) return false
      if (q && !cat.name.toLowerCase().includes(q) && !cat.slug.toLowerCase().includes(q)) return false
      return true
    })
  }, [categories, debouncedSearch, scope])

  const stats = useMemo(
    () => ({
      total: categories.length,
      hasProducts: categories.filter((c) => (c.productCount ?? 0) > 0).length,
      empty: categories.filter((c) => (c.productCount ?? 0) === 0).length,
    }),
    [categories],
  )

  const resetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setScope('all')
  }

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
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Dashboard</span>
            <ChevronRight className="size-3" />
            <span className="text-foreground">Danh mục</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Danh mục</h2>
          <p className="text-sm text-muted-foreground">Quản lý danh mục sản phẩm</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm danh mục
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-xl bg-muted" />
            ))}
          </>
        ) : (
          <>
            <StatCard label="Tổng danh mục" value={stats.total} icon={Layers} accentClass="bg-cyan-500/10 text-cyan-300" />
            <StatCard label="Có sản phẩm" value={stats.hasProducts} icon={Package} accentClass="bg-emerald-500/10 text-emerald-300" />
            <StatCard label="Trống" value={stats.empty} icon={Inbox} accentClass="bg-rose-500/10 text-rose-300" />
          </>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm danh mục theo tên hoặc slug..."
            className="pl-9"
          />
        </div>
        <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Trạng thái sản phẩm" />
          </SelectTrigger>
          <SelectContent>
            {SCOPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/50">
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted">
              <SearchX className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {categories.length === 0 ? 'Chưa có danh mục' : 'Không tìm thấy danh mục'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {categories.length === 0
                  ? 'Tạo danh mục đầu tiên của bạn.'
                  : 'Thử thay đổi từ khóa hoặc bộ lọc của bạn.'}
              </p>
            </div>
            {categories.length === 0 ? (
              <Button size="sm" onClick={openCreate} className="mt-1">
                <Plus className="size-4" />
                Thêm danh mục
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1">
                Xóa bộ lọc
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Danh mục</TableHead>
                <TableHead className="text-muted-foreground">Mô tả</TableHead>
                <TableHead className="text-center text-muted-foreground">Sản phẩm</TableHead>
                <TableHead className="text-muted-foreground">Ngày tạo</TableHead>
                <TableHead className="text-right text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cat) => {
                const productCount = cat.productCount ?? 0
                return (
                  <TableRow key={cat._id} className="group border-border transition-colors duration-150 hover:bg-accent">
                    <TableCell className="min-w-56">
                      <div className="flex items-center gap-3">
                        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                          {cat.image ? (
                            <img src={resolveImageUrl(cat.image)} alt={cat.name} loading="lazy" className="size-full object-cover" />
                          ) : (
                            <Layers className="size-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-medium text-foreground">{cat.name}</p>
                          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{cat.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-64">
                      <p className={cn('line-clamp-2 text-sm', cat.description ? 'text-foreground' : 'italic text-muted-foreground')}>
                        {cat.description || 'Chưa có mô tả'}
                      </p>
                    </TableCell>
                    <TableCell className={cn('whitespace-nowrap text-center font-medium', productCount > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-muted-foreground')}>
                      {productCount.toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(cat.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-40 transition-opacity duration-150 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(cat)}
                          aria-label="Chỉnh sửa"
                          className="size-8 text-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Xóa" className="size-8 text-foreground hover:bg-accent hover:text-destructive">
                              <Trash2 className="size-4" />
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
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(cat._id, cat.name)}>
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
      </div>

      {/* Create/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
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