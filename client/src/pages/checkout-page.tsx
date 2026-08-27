import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Banknote, CreditCard, CheckCircle2, ChevronDown, ChevronUp, ShoppingBag, Tag, X } from 'lucide-react'
import { orderApi, couponApi, type CreateOrderPayload } from '@/services'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { cn, formatCurrency, resolveImageUrl } from '@/lib'
import type { Coupon, CouponWithAvailability, PaymentMethod } from '@/types'
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

const checkoutSchema = z.object({
  name: z.string().min(2, 'Vui lòng nhập họ tên'),
  phone: z.string().min(1, 'Vui lòng nhập số điện thoại').regex(/^(\+84|0)\d{9,10}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ'),
  address: z.string().min(5, 'Vui lòng nhập địa chỉ nhận hàng'),
  note: z.string().optional(),
})

type CheckoutValues = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [discount, setDiscount] = useState(0)
  const [applying, setApplying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showCoupons, setShowCoupons] = useState(false)
  const [availableCoupons, setAvailableCoupons] = useState<CouponWithAvailability[]>([])
  const [loadingCoupons, setLoadingCoupons] = useState(false)

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.fullname ?? '',
      phone: user?.phone ?? '',
      email: user?.email ?? '',
      address: user?.address ?? '',
      note: '',
    },
  })

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE
  const total = Math.max(0, subtotal - discount) + shipping

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setApplying(true)
    setError('')
    try {
      const result = await couponApi.apply(couponCode.trim(), subtotal)
      setAppliedCoupon(result.coupon)
      setDiscount(result.discount)
      setCouponCode('')
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

  const applyCouponWithCode = async (code: string) => {
    if (!code.trim()) return
    setApplying(true)
    setError('')
    try {
      const result = await couponApi.apply(code.trim(), subtotal)
      setAppliedCoupon(result.coupon)
      setDiscount(result.discount)
      setCouponCode('')
      setShowCoupons(false)
      toast.success('Áp dụng mã giảm giá thành công')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setApplying(false)
    }
  }

  const fetchAvailableCoupons = useCallback(async () => {
    if (showCoupons && subtotal > 0 && !appliedCoupon) {
      setLoadingCoupons(true)
      try {
        const coupons = await couponApi.available(subtotal)
        setAvailableCoupons(coupons)
      } catch {
        setAvailableCoupons([])
      } finally {
        setLoadingCoupons(false)
      }
    }
  }, [showCoupons, subtotal, appliedCoupon])

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
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Địa chỉ nhận hàng</FormLabel>
                        <FormControl>
                          <Input placeholder="Số nhà, đường, quận, thành phố" {...field} />
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
              <button
                type="button"
                onClick={() => setPaymentMethod('bank-transfer')}
                className={cn(
                  'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors',
                  paymentMethod === 'bank-transfer' ? 'border-primary bg-primary/5' : 'hover:border-primary/40'
                )}
              >
                <CreditCard className="text-primary size-6" />
                <div>
                  <p className="font-medium">Chuyển khoản ngân hàng</p>
                  <p className="text-muted-foreground text-sm">Chuyển khoản rồi chúng tôi sẽ xác nhận</p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Đơn hàng của bạn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="bg-muted relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    <img src={resolveImageUrl(item.image)} alt={item.name} className="size-full object-cover" />
                    <span className="bg-primary text-primary-foreground absolute -top-0 -right-0 flex size-5 items-center justify-center rounded-bl-lg text-xs font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div>
              {appliedCoupon ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-between rounded-lg px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <Tag className="size-4" />
                    {appliedCoupon.code}
                    <span className="text-emerald-600/70 dark:text-emerald-400/70 text-xs">
                      (-{appliedCoupon.type === 'percent' ? `${appliedCoupon.discount}%` : formatCurrency(appliedCoupon.discount)})
                    </span>
                  </span>
                  <button onClick={removeCoupon} aria-label="Xóa mã giảm giá">
                    <X className="size-4 hover:text-destructive" />
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCoupons(!showCoupons)}
                    className="flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors hover:border-primary/40"
                  >
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="size-4" />
                      Chọn hoặc nhập mã giảm giá
                    </span>
                    {showCoupons ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>

                  {showCoupons && (
                    <div className="mt-2 space-y-3 rounded-lg border p-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập mã khuyến mãi..."
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="h-9 font-mono"
                        />
                        <Button variant="outline" size="sm" onClick={applyCoupon} disabled={applying || !couponCode.trim()}>
                          Áp dụng
                        </Button>
                      </div>

                      {loadingCoupons ? (
                        <div className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
                          <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                          Đang tải...
                        </div>
                      ) : availableCoupons.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-muted-foreground text-xs font-medium">Mã đang khả dụng:</p>
                          {availableCoupons.map((c) => (
                            <div
                              key={c._id}
                              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                                c.isApplicable ? 'hover:border-primary/40 hover:bg-primary/5' : 'opacity-60'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-mono text-sm font-bold">{c.code}</p>
                                <p className="text-muted-foreground text-xs">
                                  {c.type === 'percent' ? `Giảm ${c.discount}%` : `Giảm ${formatCurrency(c.discount)}`}
                                </p>
                                {c.minOrder > 0 && (
                                  <p className="text-muted-foreground text-xs">
                                    Đơn tối thiểu {formatCurrency(c.minOrder)}
                                  </p>
                                )}
                                {!c.isApplicable && c.reason && (
                                  <p className="text-destructive text-xs">{c.reason}</p>
                                )}
                              </div>
                              {c.isApplicable && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:border-orange-500/50 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
                                  onClick={() => {
                                    setCouponCode(c.code)
                                    applyCouponWithCode(c.code)
                                  }}
                                  disabled={applying}
                                >
                                  <CheckCircle2 className="size-4" />
                                  Dùng
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : subtotal > 0 ? (
                        <p className="text-muted-foreground py-2 text-center text-sm">Không có mã giảm giá khả dụng</p>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="text-muted-foreground">Giảm giá</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              type="submit"
              form="checkout-form"
              className="w-full"
              size="lg"
              disabled={submitting}
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
