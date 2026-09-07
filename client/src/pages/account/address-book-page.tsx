import { useState, useEffect } from 'react'
import { MapPin, Plus, Pencil, Trash2, Star, Check } from 'lucide-react'
import { addressApi } from '@/services'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from 'sonner'
import type { Address, CreateAddressPayload } from '@/types'

const initialForm: CreateAddressPayload = {
  label: '',
  recipientName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  street: '',
  isDefault: false,
}

export default function AddressBookPage() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateAddressPayload>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = async () => {
    setLoading(true)
    try {
      const res = await addressApi.list()
      setAddresses(res)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...initialForm, recipientName: user?.fullname ?? '', phone: user?.phone ?? '' })
    setError('')
    setDialogOpen(true)
  }

  const openEdit = (addr: Address) => {
    setEditingId(addr._id)
    setForm({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      street: addr.street,
      isDefault: addr.isDefault,
    })
    setError('')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.recipientName.trim() || !form.phone.trim() || !form.province.trim() || !form.district.trim() || !form.ward.trim() || !form.street.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin địa chỉ')
      return
    }
    setSubmitting(true)
    try {
      if (editingId) {
        await addressApi.update(editingId, form)
        toast.success('Cập nhật địa chỉ thành công')
      } else {
        await addressApi.create(form)
        toast.success('Thêm địa chỉ thành công')
      }
      setDialogOpen(false)
      loadAddresses()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await addressApi.remove(id)
      setAddresses((prev) => prev.filter((a) => a._id !== id))
      toast.success('Xóa địa chỉ thành công')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await addressApi.setDefault(id)
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a._id === id }))
      )
      toast.success('Đã đặt làm địa chỉ mặc định')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const updateField = (field: keyof CreateAddressPayload, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Sổ địa chỉ</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          Thêm địa chỉ
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-muted h-28 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <EmptyState
            title="Chưa có địa chỉ"
            description="Thêm địa chỉ để sử dụng khi thanh toán."
            icon={<MapPin className="size-7" />}
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4 mr-1" />
                Thêm địa chỉ
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className={`rounded-xl border p-4 transition-colors ${
                  addr.isDefault ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {addr.label && (
                        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium">
                          {addr.label}
                        </span>
                      )}
                      {addr.isDefault && (
                        <span className="flex items-center gap-1 text-xs font-medium text-primary">
                          <Star className="size-3 fill-primary" />
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-medium">{addr.recipientName}</p>
                    <p className="text-muted-foreground text-sm">{addr.phone}</p>
                    <p className="text-muted-foreground text-sm">
                      {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!addr.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleSetDefault(addr._id)}
                        title="Đặt làm mặc định"
                      >
                        <Check className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEdit(addr)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa địa chỉ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc muốn xóa địa chỉ này?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => handleDelete(addr._id)}
                          >
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Cập nhật thông tin địa chỉ' : 'Nhập thông tin địa chỉ giao hàng'}
              </DialogDescription>
            </DialogHeader>
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <Input
                placeholder="Nhãn (ví dụ: Nhà, Cơ quan)"
                value={form.label}
                onChange={(e) => updateField('label', e.target.value)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  placeholder="Tên người nhận"
                  value={form.recipientName}
                  onChange={(e) => updateField('recipientName', e.target.value)}
                />
                <Input
                  placeholder="Số điện thoại"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  placeholder="Tỉnh/Thành phố"
                  value={form.province}
                  onChange={(e) => updateField('province', e.target.value)}
                />
                <Input
                  placeholder="Quận/Huyện"
                  value={form.district}
                  onChange={(e) => updateField('district', e.target.value)}
                />
                <Input
                  placeholder="Phường/Xã"
                  value={form.ward}
                  onChange={(e) => updateField('ward', e.target.value)}
                />
              </div>
              <Input
                placeholder="Số nhà, đường..."
                value={form.street}
                onChange={(e) => updateField('street', e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => updateField('isDefault', e.target.checked)}
                  className="rounded border-gray-300"
                />
                Đặt làm địa chỉ mặc định
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
