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

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10">
          {['Danh mục', 'Mô tả', 'Sản phẩm', 'Ngày tạo', 'Thao tác'].map((h) => (
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
                  <Skeleton className="h-3.5 w-36 bg-white/5" />
                  <Skeleton className="h-3 w-20 bg-white/5" />
                </div>
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-44 bg-white/5" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10 bg-white/5" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
            <TableCell><Skeleton className="h-8 w-24 bg-white/5" /></TableCell>
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
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Dashboard</span>
            <ChevronRight className="size-3" />
            <span className="text-slate-300">Danh mục</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Danh mục</h2>
          <p className="text-sm text-slate-400">Quản lý danh mục sản phẩm</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500">
          <Plus className="size-4" />
          Thêm danh mục
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-xl bg-white/5" />
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
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm danh mục theo tên hoặc slug..."
            className="border-white/10 bg-slate-900/60 pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40"
          />
        </div>
        <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
          <SelectTrigger className="border-white/10 bg-slate-900/60 text-slate-200" size="sm">
            <SelectValue placeholder="Trạng thái sản phẩm" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-slate-900 text-slate-200">
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
          className="text-slate-400 hover:bg-white/5 hover:text-white"
        >
          Reset
        </Button>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <SearchX className="size-7 text-slate-500" />
            </div>
            <div>
              <p className="font-medium text-white">
                {categories.length === 0 ? 'Chưa có danh mục' : 'Không tìm thấy danh mục'}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {categories.length === 0
                  ? 'Tạo danh mục đầu tiên của bạn.'
                  : 'Thử thay đổi từ khóa hoặc bộ lọc của bạn.'}
              </p>
            </div>
            {categories.length === 0 ? (
              <Button size="sm" onClick={openCreate} className="mt-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500">
                <Plus className="size-4" />
                Thêm danh mục
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1 border-white/10 text-slate-200 hover:bg-white/5">
                Xóa bộ lọc
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">Danh mục</TableHead>
                <TableHead className="text-slate-400">Mô tả</TableHead>
                <TableHead className="text-center text-slate-400">Sản phẩm</TableHead>
                <TableHead className="text-slate-400">Ngày tạo</TableHead>
                <TableHead className="text-right text-slate-400">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cat) => {
                const productCount = cat.productCount ?? 0
                return (
                  <TableRow key={cat._id} className="group border-white/10 transition-colors duration-150 hover:bg-white/5">
                    <TableCell className="min-w-56">
                      <div className="flex items-center gap-3">
                        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-800/80">
                          {cat.image ? (
                            <img src={resolveImageUrl(cat.image)} alt={cat.name} loading="lazy" className="size-full object-cover" />
                          ) : (
                            <Layers className="size-5 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-medium text-white">{cat.name}</p>
                          <p className="mt-0.5 truncate font-mono text-xs text-slate-500">{cat.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-64">
                      <p className={cn('line-clamp-2 text-sm', cat.description ? 'text-slate-300' : 'italic text-slate-500')}>
                        {cat.description || 'Chưa có mô tả'}
                      </p>
                    </TableCell>
                    <TableCell className={cn('whitespace-nowrap text-center font-medium', productCount > 0 ? 'text-emerald-400' : 'text-slate-500')}>
                      {productCount.toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-400">
                      {new Date(cat.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-40 transition-opacity duration-150 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(cat)}
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