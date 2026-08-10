import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { couponApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { formatCurrency, formatDate } from '@/lib'
import { toast } from 'sonner'
import type { Coupon } from '@/types'

interface CouponForm {
  code: string
  discount: number
  type: 'percent' | 'fixed'
  expiredDate: string
  quantity: number
}

const EMPTY: CouponForm = {
  code: '',
  discount: 0,
  type: 'percent',
  expiredDate: '',
  quantity: 0,
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState<CouponForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    couponApi.list().then(setCoupons).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setDialogOpen(true)
  }

  const openEdit = (c: Coupon) => {
    setEditing(c)
    setForm({
      code: c.code,
      discount: c.discount,
      type: c.type,
      expiredDate: c.expiredDate.slice(0, 10),
      quantity: c.quantity,
    })
    setError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError('')
    if (!form.code.trim()) {
      setError('Vui lòng nhập mã giảm giá')
      return
    }
    if (form.discount <= 0) {
      setError('Giá trị giảm phải lớn hơn 0')
      return
    }
    if (form.type === 'percent' && form.discount > 100) {
      setError('Phần trăm giảm không thể vượt quá 100%')
      return
    }
    if (!form.expiredDate) {
      setError('Vui lòng chọn ngày hết hạn')
      return
    }
    setSaving(true)
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discount: form.discount,
        type: form.type,
        expiredDate: new Date(form.expiredDate).toISOString(),
        quantity: form.quantity,
      }
      if (editing) {
        await couponApi.update(editing._id, payload)
        toast.success('Cập nhật mã giảm giá thành công')
      } else {
        await couponApi.create(payload)
        toast.success('Tạo mã giảm giá thành công')
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
      await couponApi.remove(id)
      toast.success('Xóa mã giảm giá thành công')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const isExpired = (c: Coupon) => new Date(c.expiredDate) < new Date()
  const isUsedUp = (c: Coupon) => c.quantity > 0 && c.usedCount >= c.quantity

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mã giảm giá</h1>
          <p className="text-muted-foreground">{coupons.length} mã</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm mã
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted h-36 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed py-12 text-center">
          Chưa có mã giảm giá nào
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => {
            const expired = isExpired(c)
            const usedUp = isUsedUp(c)
            const inactive = expired || usedUp
            return (
              <Card key={c._id} className={inactive ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-lg font-bold">{c.code}</p>
                      <p className="text-primary mt-1 text-2xl font-extrabold">
                        {c.type === 'percent' ? `-${c.discount}%` : `-${formatCurrency(c.discount)}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label="Sửa">
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
                            <AlertDialogTitle>Xóa mã giảm giá?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa mã "{c.code}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() => handleDelete(c._id)}
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="text-muted-foreground mt-3 space-y-1 text-sm">
                    <p>
                      Hạn dùng: {formatDate(c.expiredDate)}
                      {expired && <Badge variant="destructive" className="ml-2">Hết hạn</Badge>}
                    </p>
                    <p>
                      Đã dùng: {c.usedCount}/{c.quantity || '∞'}
                      {usedUp && <Badge variant="secondary" className="ml-2">Hết lượt</Badge>}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'}</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Mã</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SALE10"
                  className="font-mono"
                />
              </div>
              <div className="grid gap-2">
                <Label>Loại giảm giá</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as 'percent' | 'fixed' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Theo phần trăm (%)</SelectItem>
                    <SelectItem value="fixed">Cố định (VNĐ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Giá trị giảm</Label>
                <Input
                  type="number"
                  value={form.discount || ''}
                  onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Số lượng (0 = không giới hạn)</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Ngày hết hạn</Label>
              <Input
                type="date"
                value={form.expiredDate}
                onChange={(e) => setForm({ ...form, expiredDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm mã'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
