import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Package } from 'lucide-react'
import { orderApi } from '@/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatusBadge } from '@/components/order/order-status-badge'
import { formatCurrency } from '@/lib'
import type { Order } from '@/types'

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    orderApi
      .getById(id)
      .then((o) => {
        if (!cancelled) setOrder(o)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <Skeleton className="mx-auto size-20 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-8 w-64" />
        <Skeleton className="mt-8 h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
          <CheckCircle2 className="size-10 text-emerald-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold sm:text-3xl">Đặt hàng thành công!</h1>
        <p className="text-muted-foreground mt-2">
          Cảm ơn bạn đã mua sắm tại Store 3D. Chúng tôi sẽ liên hệ để xác nhận đơn hàng.
        </p>
      </div>

      {order && (
        <Card className="mt-8">
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="text-muted-foreground size-5" />
                <span className="font-semibold">
                  Mã đơn: #{order._id.slice(-8).toUpperCase()}
                </span>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-muted-foreground">Tổng thanh toán</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Button asChild>
          <Link to="/tai-khoan/don-hang">Xem đơn hàng</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/san-pham">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    </div>
  )
}
