import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Package, Gamepad2 } from 'lucide-react'
import { orderApi } from '@/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatusBadge } from '@/components/order/order-status-badge'
import { ReviewProductAction } from '@/components/review/review-action'
import { useReviewEligibility } from '@/hooks/useReviewEligibility'
import { formatCurrency, resolveImageUrl } from '@/lib'
import type { Order } from '@/types'

const MiniGameModal = lazy(() =>
  import('@/components/mini-game/mini-game-modal').then((m) => ({ default: m.MiniGameModal })),
)

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [gameOpen, setGameOpen] = useState(false)

  const productIds: string[] =
    order?.items.map((i) => (typeof i.product === 'object' ? i.product._id : i.product)) ?? []
  const eligibilityMap = useReviewEligibility(productIds)

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

      {order && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Sản phẩm đã mua</CardTitle>
            <p className="text-muted-foreground text-sm">
              Bạn có thể đánh giá sản phẩm sau khi nhận được hàng.
            </p>
          </CardHeader>
          <CardContent className="divide-y">
            {order.items.map((item) => {
              const prod = typeof item.product === 'object' ? item.product : null
              const productId: string = typeof item.product === 'object' ? item.product._id : item.product
              const eligibility = eligibilityMap[productId]
              return (
                <div key={item._id} className="flex items-center gap-4 py-3">
                  <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    <img src={resolveImageUrl(item.image)} alt={item.name} loading="lazy" decoding="async" className="size-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">x{item.quantity} · {formatCurrency(item.price * item.quantity)}</p>
                  </div>
                  <ReviewProductAction slug={prod?.slug} eligibility={eligibility} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex justify-center gap-3">
        {order && order.status === 'completed' && (
          <Suspense fallback={null}>
            <Button variant="outline" onClick={() => setGameOpen(true)}>
              <Gamepad2 className="mr-2 size-4" />
              Chơi Mini Game nhận quà
            </Button>
            <MiniGameModal
              open={gameOpen}
              onOpenChange={setGameOpen}
              orderId={order._id}
            />
          </Suspense>
        )}
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
