import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleCheck,
  CreditCard,
  History,
  Info,
  Lock,
  MapPin,
  Minus,
  Package,
  Pencil,
  Plus,
  PlusCircle,
  QrCode,
  Shield,
  ShoppingBag,
  Star,
  Truck,
  X,
} from 'lucide-react'
import { orderApi, couponApi, addressApi, authApi, type CreateOrderPayload } from '@/services'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { LoginPromptDialog } from '@/components/auth/login-prompt-dialog'
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
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
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
  useDocumentTitle('Thanh toán')
  const { items, subtotal, clearCart, updateQuantity, removeItem, openCart } = useCart()
  const { user, updateUser, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const addressDropdownRef = useRef<HTMLDivElement>(null)

  // Plan 4 T4: VietQR preselected per `checkout`/`checkout-states` screens ("Khuyên dùng",
  // radio checked) — starts disabled→cash below the 1.000₫ gate via the existing effect.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() =>
    subtotal >= PAYMENT_MIN_THRESHOLD ? 'bank-transfer' : 'cash'
  )
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

  // Plan 4 T4: page now renders for guests (login-prompt overlay) — skip authed fetches while logged out.
  useEffect(() => {
    if (isAuthenticated) loadAddresses()
  }, [loadAddresses, isAuthenticated])

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

  // Plan 4 T4: page now renders for guests (login-prompt overlay) — skip authed fetches while logged out.
  useEffect(() => {
    if (isAuthenticated) fetchAvailableCoupons()
  }, [fetchAvailableCoupons, isAuthenticated])

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

  const isCreateAddressMode = addressEditTarget?.type === 'address' && !addressEditTarget.id

  // Plan 4 T4 / decision #1: auth refresh in flight → keep the shared loader (no overlay flash).
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="bg-primary/10 text-primary flex size-12 animate-pulse items-center justify-center rounded-xl">
          <span className="text-lg font-bold">3D</span>
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
    )
  }

  // Plan 4 T4 / decision #1: unauthenticated at /thanh-toan → overlays-spec login prompt
  // (verbatim copy) → login carries state.from (pathname+search) so T1's guard returns here.
  if (!isAuthenticated) {
    return (
      <LoginPromptDialog
        open
        onOpenChange={(open) => {
          if (!open) navigate('/san-pham')
        }}
      />
    )
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
    <div className="min-h-[60vh]">
      <h1 className="sr-only">Thanh toán</h1>

      {/* ==================== CHECKOUT STEPPER (checkout.html) ==================== */}
      <section className="border-b border-border bg-card/40 py-4">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            {/* Step 1: Active */}
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-full shadow-lg shadow-primary/10 ring-2 ring-primary/40">
                <Truck className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-primary">Bước 1</span>
                <span className="text-foreground text-xs font-semibold sm:text-sm">Thông tin giao hàng</span>
              </div>
            </div>
            {/* Connector Line */}
            <div className="from-primary/50 via-border to-border mx-3 h-0.5 flex-1 bg-gradient-to-r sm:mx-6" />
            {/* Step 2: Next */}
            <div className="flex items-center gap-3">
              <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-full border border-border">
                <CreditCard className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Bước 2</span>
                <span className="text-muted-foreground text-xs font-medium sm:text-sm">Thanh toán</span>
              </div>
            </div>
            {/* Connector Line */}
            <div className="bg-border mx-3 h-0.5 flex-1 sm:mx-6" />
            {/* Step 3: Pending */}
            <div className="flex items-center gap-3 opacity-60">
              <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-full border border-border">
                <CheckCircle2 className="size-4" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Bước 3</span>
                <span className="text-muted-foreground text-xs font-medium sm:text-sm">Hoàn tất</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:py-10">
        {/* GRID 7/5 (checkout.html) */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* ==================== LEFT COLUMN (7 cols) ==================== */}
          <div className="space-y-8 lg:col-span-7">
            {/* CARD 1: Bước 1 — Thông tin nhận hàng */}
            <Card>
              <CardContent>
                <div className="mb-6 flex items-center justify-between border-b pb-5">
                  <div className="flex items-center gap-3">
                    <span className="border-primary/30 bg-primary/10 text-primary rounded border px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                      Bước 1
                    </span>
                    <h2 className="text-foreground text-lg font-bold md:text-xl">Thông tin nhận hàng</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddressDropdownOpen((prev) => !prev)}
                    className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                  >
                    <History className="size-3.5" />
                    Lịch sử địa chỉ
                  </button>
                </div>

                <Form {...form}>
                  <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Saved Address Selector */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                            Chọn sổ địa chỉ
                          </FormLabel>
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
                              <div className="border-popover absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
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
                                          selectedAddressId === addr._id && 'bg-primary/5 border-primary/40'
                                        )}
                                      >
                                        <MapPin className={cn('mt-0.5 size-4 shrink-0', selectedAddressId === addr._id ? 'text-primary' : 'text-muted-foreground')} />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            {isUserAddress && (
                                              <span className="text-muted-foreground text-xs font-medium">Địa chỉ từ hồ sơ</span>
                                            )}
                                            {!isUserAddress && addr.label && (
                                              <span className="bg-muted text-muted-foreground rounded-full border px-2 py-0.5 text-[10px] font-medium">
                                                {addr.label}
                                              </span>
                                            )}
                                            <span className="text-foreground text-xs font-semibold">{addr.recipientName}</span>
                                            {addr.phone && (
                                              <span className="text-muted-foreground text-xs">• {addr.phone}</span>
                                            )}
                                            {addr.isDefault && (
                                              <span className="text-primary flex items-center gap-0.5 text-[11px] font-medium">
                                                <Star className="size-2.5 fill-primary" />
                                                Mặc định
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-muted-foreground mt-0.5 truncate text-xs">{formatAddress(addr)}</p>
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
                                            className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs font-medium transition-colors"
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
                                  <div className="text-muted-foreground px-3 py-4 text-center text-sm">
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
                                    className="text-primary hover:bg-primary/5 flex w-full items-center gap-2 px-3 py-3 text-sm font-medium transition-colors"
                                  >
                                    <PlusCircle className="size-4" />
                                    Thêm địa chỉ giao hàng mới
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Recipient detail fields (design: "Thông tin người nhận chi tiết") */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                          Thông tin người nhận chi tiết
                        </span>
                        <span className="text-muted-foreground/70 text-[11px]">* Bắt buộc cho hóa đơn điện tử</span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-muted-foreground text-xs font-medium">Họ và tên người nhận</FormLabel>
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
                              <FormLabel className="text-muted-foreground text-xs font-medium">Số điện thoại liên hệ</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="0901 234 567" {...field} />
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
                            <FormLabel className="text-muted-foreground text-xs font-medium">
                              Email nhận mã kích hoạt bảo hành 3D &amp; Hóa đơn VAT
                            </FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="ban@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground text-xs font-medium">
                              Ghi chú vận chuyển mô hình nghệ thuật
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ví dụ: Giao giờ hành chính, đóng gói bọt khí cẩn thận tượng rồng Ao Bing sừng nhọn..."
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>

                {/* Address Edit Dialog (unified) */}
                <Dialog open={addressEditOpen} onOpenChange={setAddressEditOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{isCreateAddressMode ? 'Thêm địa chỉ nhận hàng mới' : 'Sửa địa chỉ'}</DialogTitle>
                      <DialogDescription className={isCreateAddressMode ? 'sr-only' : undefined}>
                        {isCreateAddressMode ? 'Thêm địa chỉ nhận hàng mới' : 'Cập nhật thông tin địa chỉ'}
                      </DialogDescription>
                    </DialogHeader>
                    {addressEditError && (
                      <Alert variant="destructive">
                        <AlertDescription>{addressEditError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-muted-foreground text-sm font-medium">Tên địa chỉ</label>
                        <Input
                          placeholder="Nhà riêng / Công ty / ..."
                          value={addressEditLabel}
                          onChange={(e) => setAddressEditLabel(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-muted-foreground text-sm font-medium">Địa chỉ chi tiết</label>
                        <Textarea
                          placeholder="Số nhà, tên đường, toà nhà, tầng..."
                          value={addressEditValue}
                          onChange={(e) => setAddressEditValue(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={addressEditIsDefault}
                          onChange={(e) => setAddressEditIsDefault(e.target.checked)}
                          className="rounded border-border"
                        />
                        Đặt làm địa chỉ nhận hàng mặc định
                      </label>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddressEditOpen(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleAddressSubmit} disabled={addressEditSubmitting}>
                        {addressEditSubmitting
                          ? 'Đang lưu...'
                          : isCreateAddressMode
                            ? 'Lưu địa chỉ'
                            : 'Cập nhật'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* In-page error banner (checkout-states.html position: above payment) */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* CARD 2: Bước 2 — Phương thức thanh toán */}
            <Card>
              <CardContent>
                <div className="mb-6 flex items-center justify-between border-b pb-5">
                  <div className="flex items-center gap-3">
                    <span className="border-border bg-muted text-muted-foreground rounded border px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                      Bước 2
                    </span>
                    <h2 className="text-foreground text-lg font-bold md:text-xl">Phương thức thanh toán</h2>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 text-xs">
                  Hỗ trợ 2 phương thức thanh toán an toàn, bảo mật nội địa. Không phát sinh chi phí trung gian.
                </p>

                <div className="space-y-4">
                  {/* OPTION 1: VIETQR (per screen — preselected when eligible) */}
                  <div className="relative">
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-4 rounded-xl border-2 p-5 transition-all',
                        paymentMethod === 'bank-transfer' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-border/80',
                        !isBankTransferEnabled && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        className="accent-primary mt-1 size-4 shrink-0"
                        checked={paymentMethod === 'bank-transfer'}
                        disabled={!isBankTransferEnabled}
                        onChange={() => setPaymentMethod('bank-transfer')}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-foreground flex items-center gap-2 text-sm font-bold md:text-base">
                            Chuyển khoản VietQR
                            <span className="bg-primary text-primary-foreground rounded px-2 py-0.5 text-[11px] font-extrabold uppercase">
                              Khuyên dùng
                            </span>
                          </span>
                          <span className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="bg-muted text-muted-foreground rounded border border-border px-2 py-0.5">COD</span>
                            <span className="bg-muted text-primary rounded border border-border px-2 py-0.5">VietQR</span>
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                          Mã QR code thanh toán động kèm nội dung chuyển khoản chính xác sẽ được tạo ngay sau khi bấm{' '}
                          <span className="text-primary font-semibold">&quot;Xác nhận đặt hàng&quot;</span>. Hiệu lực trong 15 phút,
                          kích hoạt sản xuất ngay lập tức.
                        </p>
                        <div className="bg-muted/50 text-muted-foreground flex items-center gap-3 rounded-lg border p-3 text-xs">
                          <QrCode className="text-primary size-4 shrink-0" />
                          <span>
                            Hệ thống hỗ trợ thanh toán VietQR cho mọi đơn hàng từ{' '}
                            <strong className="text-foreground font-semibold">1.000₫</strong> trở lên, miễn hoàn toàn phí chuyển
                            khoản liên ngân hàng.
                          </span>
                        </div>
                      </div>
                    </label>
                    {!isBankTransferEnabled && (
                      <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
                        <Info className="size-3 shrink-0" />
                        Không khả dụng với đơn hàng dưới {formatCurrency(PAYMENT_MIN_THRESHOLD)}
                      </p>
                    )}
                  </div>

                  {/* OPTION 2: COD */}
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-4 rounded-xl border-2 p-5 transition-all',
                      paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-border/80'
                    )}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      className="accent-primary mt-1 size-4 shrink-0"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-foreground text-sm font-bold md:text-base">
                          Thanh toán tiền mặt khi nhận hàng (COD)
                        </span>
                        <span className="text-primary text-xs font-semibold">Phụ phí: 0₫</span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                        Được quyền đồng kiểm mô hình (mở kiểm tra hiện trạng không nứt vỡ, đúng tỷ lệ và phụ kiện) trước khi
                        thanh toán tiền mặt cho shipper.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Trust blocks (checkout.html) */}
                <div className="text-muted-foreground mt-6 grid grid-cols-1 gap-3 border-t pt-5 text-xs sm:grid-cols-2">
                  <div className="flex items-center gap-2.5">
                    <Shield className="text-primary size-4 shrink-0" />
                    <span>Thanh toán an toàn</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Package className="text-accent size-4 shrink-0" />
                    <span>Quy chuẩn đóng gói chống sốc 3 lớp chuyên dụng</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ==================== RIGHT COLUMN (Sticky Summary - 5 cols) ==================== */}
          <aside className="lg:col-span-5">
            <Card className="sticky top-24 h-fit">
              <CardContent>
                {/* Header */}
                <div className="mb-5 flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-foreground text-base font-bold md:text-lg">Đơn hàng của bạn</h3>
                    <span className="bg-muted text-primary rounded-full px-2 py-0.5 text-xs font-bold">{items.length}</span>
                  </div>
                  <button
                    type="button"
                    onClick={openCart}
                    className="text-primary text-xs font-medium transition-colors hover:underline"
                  >
                    Sửa giỏ hàng
                  </button>
                </div>

                {/* Products List */}
                <div className="max-h-[380px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={item.productId}
                      className={cn('flex items-center gap-3.5 py-4', idx < items.length - 1 && 'border-b border-border')}
                    >
                      <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg border">
                        <img
                          src={resolveImageUrl(item.image)}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-foreground truncate text-xs font-bold">{item.name}</p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            aria-label="Xóa sản phẩm"
                            title="Xóa sản phẩm"
                            className="text-muted-foreground/60 hover:text-destructive mt-0.5 shrink-0 rounded-md p-1 transition-colors hover:bg-destructive/10"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-[11px]">
                          {formatCurrency(item.price)} / sản phẩm
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="bg-background inline-flex items-center rounded-lg border">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Giảm số lượng"
                              className="flex size-7 items-center justify-center rounded-l-lg transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="flex size-7 items-center justify-center border-x text-xs font-medium">
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
                          <span className="text-primary text-xs font-bold">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon block — placement/label per screen; CouponInput wiring unchanged (T5 reworks preview) */}
                <div className="mt-5 border-t pt-4">
                  <p className="text-muted-foreground mb-2 block text-xs font-semibold uppercase tracking-wide">
                    Mã ưu đãi / Phiếu quà tặng
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

                {/* Pricing Breakdown (checkout.html copy; totals logic = T5) */}
                <div className="text-muted-foreground mt-6 space-y-2.5 border-t pt-5 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Tạm tính ({items.length} sản phẩm)</span>
                    <span className="text-foreground font-medium tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        Giảm giá voucher
                        {appliedCoupon && (
                          <span className="bg-muted text-primary rounded px-1.5 py-0.2 text-[10px] font-bold">
                            {appliedCoupon.code}
                          </span>
                        )}
                      </span>
                      <span className="text-destructive font-medium tabular-nums">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Phí vận chuyển toàn quốc</span>
                    <span className="text-success font-semibold tabular-nums">
                      {shipping === 0 ? '0₫ (Miễn phí)' : formatCurrency(shipping)}
                    </span>
                  </div>

                  {/* Total Row — display only; server-authoritative swap is T5 (§3) */}
                  <div className="mt-3 flex items-baseline justify-between border-t-2 pt-4">
                    <span className="text-foreground block text-sm font-bold">TỔNG CỘNG THANH TOÁN</span>
                    <span className="text-primary block text-xl font-black tracking-tight tabular-nums sm:text-2xl">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* PRIMARY CTA */}
                <Button
                  type="submit"
                  form="checkout-form"
                  className="mt-6 w-full"
                  size="lg"
                  disabled={submitting || loadingAddresses || !selectedAddressId}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-foreground/30 border-t-border" />
                      Đang đặt hàng...
                    </span>
                  ) : (
                    <>
                      <span>XÁC NHẬN ĐẶT HÀNG</span>
                      <span className="tabular-nums">• {formatCurrency(total)}</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>

                {/* Guarantee badge */}
                <p className="text-muted-foreground/80 mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] leading-tight">
                  <Lock className="text-primary size-3 shrink-0" />
                  <span>Thanh toán an toàn • Đổi trả 7 ngày nếu lỗi in</span>
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
