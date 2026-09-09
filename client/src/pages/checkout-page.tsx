import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Banknote, CreditCard, ShoppingBag, Info, Plus, ChevronDown, MapPin, Star, CircleCheck, Minus, Trash2, Pencil } from 'lucide-react'
import { orderApi, couponApi, addressApi, authApi, type CreateOrderPayload } from '@/services'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { CouponInput } from '@/components/checkout/coupon-input'
import { cn, formatCurrency, resolveImageUrl } from '@/lib'
import type { Address, Coupon, EligibleCoupon, PaymentMethod } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'

const SHIPPING_FEE = 0
const FREE_SHIPPING_THRESHOLD = 0
const PAYMENT_MIN_THRESHOLD = 1000
const USER_ADDRESS_SENTINEL = '__user_address__'

const checkoutSchema = z.object({
  name: z.string().min(2, 'Vui lòng nhập họ tên'),
  phone: z.string().min(1, 'Vui lòng nhập số điện thoại').regex(/^(\+84|0)\d{9,10}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ'),
  address: z.string().min(5, 'Vui lòng nhập địa chỉ nhận hàng'),
  note: z.string().optional(),
})

type CheckoutValues = z.infer<typeof checkoutSchema>

function formatAddress(addr: Address): string {
  return [addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart, updateQuantity, removeItem } = useCart()
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const addressDropdownRef = useRef<HTMLDivElement>(null)

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [discount, setDiscount] = useState(0)
  const [applying, setApplying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availableCoupons, setAvailableCoupons] = useState<EligibleCoupon[]>([])
  const [loadingCoupons, setLoadingCoupons] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false)
  const [addressEditOpen, setAddressEditOpen] = useState(false)
  const [addressEditTarget, setAddressEditTarget] = useState<{ type: 'user' | 'address'; id?: string } | null>(null)
  const [addressEditLabel, setAddressEditLabel] = useState('')
  const [addressEditValue, setAddressEditValue] = useState('')
  const [addressEditIsDefault, setAddressEditIsDefault] = useState(false)
  const [addressEditError, setAddressEditError] = useState('')
  const [addressEditSubmitting, setAddressEditSubmitting] = useState(false)

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.fullname ?? '',
      phone: user?.phone ?? '',
      email: user?.email ?? '',
      address: '',
      note: '',
    },
  })

  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true)
    try {
      const res = await addressApi.list()

      const hasUserAddress = Boolean(user?.address?.trim())
      let allAddresses: Address[] = res

      if (hasUserAddress) {
        const userAddressEntry: Address = {
          _id: USER_ADDRESS_SENTINEL,
          userId: user!._id,
          label: '',
          recipientName: user!.fullname,
          phone: user!.phone ?? '',
          street: user!.address!.trim(),
          ward: '',
          district: '',
          province: '',
          isDefault: res.length === 0,
          createdAt: user!.createdAt,
          updatedAt: user!.updatedAt,
        }
        allAddresses = [userAddressEntry, ...res]
      }

      setAddresses(allAddresses)

      const defaultAddr = allAddresses.find((a) => a.isDefault) ?? allAddresses[0] ?? null
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id)
        form.setValue('name', defaultAddr.recipientName, { shouldValidate: true })
        form.setValue('phone', defaultAddr.phone, { shouldValidate: true })
        form.setValue('address', formatAddress(defaultAddr), { shouldValidate: true })
      } else {
        setSelectedAddressId(null)
        form.setValue('name', user?.fullname ?? '', { shouldValidate: true })
        form.setValue('phone', user?.phone ?? '', { shouldValidate: true })
        form.setValue('address', '', { shouldValidate: true })
      }
    } catch {
      setAddresses([])
      setSelectedAddressId(null)
    } finally {
      setLoadingAddresses(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    loadAddresses()
  }, [loadAddresses])

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE
  const total = Math.max(0, subtotal - discount) + shipping
  const isBankTransferEnabled = total >= PAYMENT_MIN_THRESHOLD

  useEffect(() => {
    if (!isBankTransferEnabled && paymentMethod === 'bank-transfer') {
      setPaymentMethod('cash')
    }
  }, [isBankTransferEnabled, paymentMethod])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(e.target as Node)) {
        setAddressDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectAddress = (addr: Address) => {
    setSelectedAddressId(addr._id)
    form.setValue('name', addr.recipientName)
    form.setValue('phone', addr.phone)
    form.setValue('address', formatAddress(addr))
    setAddressDropdownOpen(false)
  }

  const applyCoupon = async (code: string) => {
    if (!code.trim()) return
    setApplying(true)
    setError('')
    try {
      const result = await couponApi.apply(code.trim(), subtotal)
      setAppliedCoupon(result.coupon)
      setDiscount(result.discount)
      toast.success('Áp dụng mã giảm giá thành công')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setApplying(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setDiscount(0)
  }

  const handleAddressSubmit = async () => {
    setAddressEditError('')
    const trimmed = addressEditValue.trim()
    if (!trimmed || trimmed.length < 5) {
      setAddressEditError('Địa chỉ tối thiểu 5 ký tự')
      return
    }
    setAddressEditSubmitting(true)
    try {
      if (addressEditTarget?.type === 'user') {
        const updated = await authApi.updateProfile({ address: trimmed })
        updateUser(updated)
        toast.success('Cập nhật địa chỉ thành công')
      } else if (addressEditTarget?.type === 'address' && addressEditTarget.id) {
        await addressApi.update(addressEditTarget.id, {
          label: addressEditLabel.trim(),
          recipientName: user?.fullname ?? '',
          phone: user?.phone ?? '',
          province: '',
          ward: '',
          street: trimmed,
          isDefault: addressEditIsDefault,
        })
        toast.success('Cập nhật địa chỉ thành công')
      } else {
        const newAddr = await addressApi.create({
          label: addressEditLabel.trim(),
          recipientName: user?.fullname ?? '',
          phone: user?.phone ?? '',
          province: '',
          ward: '',
          street: trimmed,
          isDefault: addressEditIsDefault,
        })
        toast.success('Thêm địa chỉ thành công')
        setSelectedAddressId(newAddr._id)
        form.setValue('name', newAddr.recipientName)
        form.setValue('phone', newAddr.phone)
        form.setValue('address', formatAddress(newAddr))
      }
      setAddressEditOpen(false)
      await loadAddresses()
    } catch (err) {
      setAddressEditError(getErrorMessage(err))
    } finally {
      setAddressEditSubmitting(false)
    }
  }

  const fetchAvailableCoupons = useCallback(async () => {
    if (subtotal > 0 && !appliedCoupon) {
      setLoadingCoupons(true)
      try {
        const coupons = await couponApi.eligible(subtotal)
        setAvailableCoupons(coupons)
      } catch {
        setAvailableCoupons([])
      } finally {
        setLoadingCoupons(false)
      }
    }
  }, [subtotal, appliedCoupon])

  useEffect(() => {
    fetchAvailableCoupons()
  }, [fetchAvailableCoupons])

  const onSubmit = async (values: CheckoutValues) => {
    if (items.length === 0) return
    setSubmitting(true)
    setError('')
    const payload: CreateOrderPayload = {
      customer: {
        name: values.name,
        phone: values.phone,
        email: values.email,
        address: values.address,
        ...(selectedAddressId && selectedAddressId !== USER_ADDRESS_SENTINEL ? { addressId: selectedAddressId } : {}),
      },
      items: items.map((i) => ({ product: i.productId, quantity: i.quantity })),
      note: values.note || undefined,
      paymentMethod,
      ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
    }
    try {
      const order = await orderApi.create(payload)
      clearCart()
      if (order.payment.method === 'bank-transfer') {
        navigate(`/thanh-toan-qr/${order._id}`)
      } else {
        navigate(`/thanh-toan-thanh-cong/${order._id}`)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Giỏ hàng trống"
          description="Thêm sản phẩm vào giỏ hàng trước khi thanh toán."
          icon={<ShoppingBag className="size-7" />}
          action={
            <Button asChild>
              <Link to="/san-pham">Xem sản phẩm</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold sm:text-3xl">Thanh toán</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin giao hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ tên</FormLabel>
                          <FormControl>
                            <Input placeholder="Nguyễn Văn A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input placeholder="0901 234 567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ban@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address Dropdown */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Địa chỉ nhận hàng</FormLabel>
                        <div ref={addressDropdownRef} className="relative">
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                readOnly
                                placeholder={loadingAddresses ? 'Đang tải địa chỉ...' : 'Chọn hoặc thêm địa chỉ nhận hàng'}
                                className="cursor-pointer pr-10"
                                autoComplete="off"
                                disabled={loadingAddresses}
                                onClick={() => !loadingAddresses && setAddressDropdownOpen((prev) => !prev)}
                              />
                              <button
                                type="button"
                                tabIndex={-1}
                                disabled={loadingAddresses}
                                onClick={() => !loadingAddresses && setAddressDropdownOpen((prev) => !prev)}
                                className="text-muted-foreground hover:text-foreground absolute right-0 top-0 flex h-full items-center px-3 transition-colors disabled:opacity-40"
                              >
                                {loadingAddresses ? (
                                  <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                                ) : (
                                  <ChevronDown className={cn('size-4 transition-transform', addressDropdownOpen && 'rotate-180')} />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />

                          {addressDropdownOpen && !loadingAddresses && (
                            <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
                              {addresses.length > 0 ? (
                                <div className="max-h-64 overflow-y-auto">
                                  {addresses.map((addr) => {
                                    const isUserAddress = addr._id === USER_ADDRESS_SENTINEL
                                    return (
                                    <div key={addr._id}>
                                      <button
                                        type="button"
                                        onClick={() => selectAddress(addr)}
                                        className={cn(
                                          'flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-primary/5',
                                          selectedAddressId === addr._id && 'bg-primary/5'
                                        )}
                                      >
                                        <MapPin className={cn('mt-0.5 size-4 shrink-0', selectedAddressId === addr._id ? 'text-primary' : 'text-muted-foreground')} />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            {isUserAddress && (
                                              <span className="text-xs font-medium">Địa chỉ từ hồ sơ</span>
                                            )}
                                            {!isUserAddress && addr.label && (
                                              <span className="text-xs font-medium">{addr.label}</span>
                                            )}
                                            {addr.isDefault && (
                                              <span className="flex items-center gap-0.5 text-[11px] font-medium text-primary">
                                                <Star className="size-2.5 fill-primary" />
                                                Mặc định
                                              </span>
                                            )}
                                          </div>
                                          <p className="mt-0.5 truncate text-sm">{formatAddress(addr)}</p>
                                        </div>
                                        {selectedAddressId === addr._id && (
                                          <CircleCheck className="text-primary mt-0.5 size-4 shrink-0" />
                                        )}
                                      </button>
                                      {selectedAddressId === addr._id && (
                                        <div className="flex justify-end border-b px-3 py-1.5">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setAddressDropdownOpen(false)
                                              setAddressEditTarget(isUserAddress ? { type: 'user' } : { type: 'address', id: addr._id })
                                              setAddressEditLabel(isUserAddress ? '' : (addr.label ?? ''))
                                              setAddressEditValue(addr.street)
                                              setAddressEditIsDefault(isUserAddress ? false : addr.isDefault)
                                              setAddressEditError('')
                                              setAddressEditOpen(true)
                                            }}
                                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                                          >
                                            <Pencil className="size-3" />
                                            Chỉnh sửa
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                  Chưa có địa chỉ nào
                                </div>
                              )}

                              <div className="border-t">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddressDropdownOpen(false)
                                    setAddressEditTarget({ type: 'address' })
                                    setAddressEditLabel('')
                                    setAddressEditValue('')
                                    setAddressEditIsDefault(false)
                                    setAddressEditError('')
                                    setAddressEditOpen(true)
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                                >
                                  <Plus className="size-4" />
                                  Thêm địa chỉ mới
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ghi chú (không bắt buộc)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Ghi chú cho cửa hàng..." rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>

              {/* Address Edit Dialog (unified) */}
              <Dialog open={addressEditOpen} onOpenChange={setAddressEditOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Sửa địa chỉ</DialogTitle>
                    <DialogDescription>Cập nhật thông tin địa chỉ</DialogDescription>
                  </DialogHeader>
                  {addressEditError && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {addressEditError}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tên địa chỉ</label>
                      <Input
                        placeholder="Nhà riêng / Công ty / ..."
                        value={addressEditLabel}
                        onChange={(e) => setAddressEditLabel(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Địa chỉ chi tiết</label>
                      <Textarea
                        placeholder="123 Nguyễn Văn A, phường X, TP.HCM"
                        value={addressEditValue}
                        onChange={(e) => setAddressEditValue(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={addressEditIsDefault}
                        onChange={(e) => setAddressEditIsDefault(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Đặt làm địa chỉ mặc định
                    </label>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddressEditOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleAddressSubmit} disabled={addressEditSubmitting}>
                      {addressEditSubmitting ? 'Đang lưu...' : 'Cập nhật'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phương thức thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                  'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors',
                  paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'hover:border-primary/40'
                )}
              >
                <Banknote className="text-primary size-6" />
                <div>
                  <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                  <p className="text-muted-foreground text-sm">Trả tiền mặt khi nhận sản phẩm</p>
                </div>
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => isBankTransferEnabled && setPaymentMethod('bank-transfer')}
                  disabled={!isBankTransferEnabled}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors',
                    paymentMethod === 'bank-transfer' ? 'border-primary bg-primary/5' : 'hover:border-primary/40',
                    !isBankTransferEnabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <CreditCard className="text-primary size-6" />
                  <div className="flex-1">
                    <p className="font-medium">Chuyển khoản ngân hàng</p>
                    <p className="text-muted-foreground text-sm">Chuyển khoản rồi chúng tôi sẽ xác nhận</p>
                  </div>
                  {!isBankTransferEnabled && (
                    <Info className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {!isBankTransferEnabled && (
                  <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
                    <Info className="size-3 shrink-0" />
                    Không khả dụng với đơn hàng dưới {formatCurrency(PAYMENT_MIN_THRESHOLD)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Đơn hàng của bạn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">

            {/* ── SECTION: Sản phẩm ── */}
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sản phẩm ({items.length})
              </p>
              <div className="max-h-80 space-y-0 overflow-y-auto">
                {items.map((item, idx) => (
                  <div key={item.productId}>
                    <div className="flex gap-3 py-3">
                      <div className="bg-muted relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40">
                        <img src={resolveImageUrl(item.image)} alt={item.name} loading="lazy" decoding="async" className="size-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            aria-label="Xóa sản phẩm"
                            className="text-muted-foreground/60 hover:text-destructive mt-0.5 shrink-0 rounded-md p-1 transition-colors hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {formatCurrency(item.price)} / sản phẩm
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-lg border border-border/80 bg-background">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Giảm số lượng"
                              className="flex size-7 items-center justify-center rounded-l-lg transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="flex size-7 items-center justify-center border-x border-border/80 text-xs font-medium">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              aria-label="Tăng số lượng"
                              className="flex size-7 items-center justify-center rounded-r-lg transition-colors hover:bg-muted"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {idx < items.length - 1 && (
                      <div className="border-b border-border/40" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION: Mã giảm giá ── */}
            <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Mã giảm giá
              </p>
              <CouponInput
                coupons={availableCoupons}
                loading={loadingCoupons}
                appliedCoupon={appliedCoupon}
                discount={discount}
                applying={applying}
                onApply={applyCoupon}
                onRemove={removeCoupon}
              />
            </div>

            {/* ── SECTION: Tổng kết giá ── */}
            <div className="mt-4 border-t border-border/60 pt-4">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Giảm giá</span>
                    <span className="font-medium">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span className="font-medium">{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <span className="text-base font-bold uppercase tracking-wide">Tổng cộng</span>
                <span className="text-primary text-lg font-bold">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* ── CTA ── */}
            <Button
              type="submit"
              form="checkout-form"
              className="mt-4 w-full"
              size="lg"
              disabled={submitting || loadingAddresses || !selectedAddressId}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang đặt hàng...
                </span>
              ) : (
                'Đặt hàng'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
