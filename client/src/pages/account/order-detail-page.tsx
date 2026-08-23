import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { orderApi } from '@/services'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/order/order-status-badge'
import { ReviewProductAction } from '@/components/review/review-action'
import { useReviewEligibility } from '@/hooks/useReviewEligibility'
import { formatCurrency, formatDateTime, resolveImageUrl } from '@/lib'
import type { Order } from '@/types'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const productIds: string[] =
    order?.items.map((i) => (typeof i.product === 'object' ? i.product._id : i.product)) ?? []
  const eligibilityMap = useReviewEligibility(productIds)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    orderApi
      .getById(id)
      .then((o) => {
        if (!cancelled) setOrder(o)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <EmptyState
        title="Không tìm thấy đơn hàng"
        description="Đơn hàng này không tồn tại hoặc không thuộc về tài khoản của bạn."
        action={
          <Button asChild>
            <Link to="/tai-khoan/don-hang">Quay lại danh sách đơn hàng</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/tai-khoan/don-hang">
          <ArrowLeft className="size-4" />
          Quay lại
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Đơn hàng #{order._id.slice(-8).toUpperCase()}</h2>
          <p className="text-muted-foreground text-sm">
            Đặt lúc {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {order.items.map((item) => {
                const prod = typeof item.product === 'object' ? item.product : null
                const productId: string = typeof item.product === 'object' ? item.product._id : item.product
                const eligibility = eligibilityMap[productId]
                return (
                  <div key={item._id} className="flex items-center gap-4 py-3">
                    <div className="bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                      <img src={resolveImageUrl(item.image)} alt={item.name} className="size-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/san-pham/${prod?.slug ?? ''}`}
                        className="hover:text-primary line-clamp-1 text-sm font-medium"
                      >
                        {item.name}
                      </Link>
                      <p className="text-muted-foreground text-sm">x{item.quantity}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <ReviewProductAction slug={prod?.slug} eligibility={eligibility} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin giao hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p>
                <span className="text-muted-foreground">Người nhận:</span>{' '}
                <span className="font-medium">{order.customer.name}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Số điện thoại:</span>{' '}
                {order.customer.phone}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {order.customer.email}
              </p>
              <p>
                <span className="text-muted-foreground">Địa chỉ:</span> {order.customer.address}
              </p>
              {order.note && (
                <p>
                  <span className="text-muted-foreground">Ghi chú:</span> {order.note}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Tổng đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span className="text-muted-foreground">Giảm giá</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phí vận chuyển</span>
              <span>{order.shipping > 0 ? formatCurrency(order.shipping) : 'Miễn phí'}</span>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-bold">
              <span>Tổng cộng</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            <div className="text-muted-foreground pt-2 text-xs">
              Phương thức thanh toán:{' '}
              <span className="font-medium text-foreground">
                {order.payment.method === 'cash' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
