import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Package } from 'lucide-react'
import { orderApi } from '@/services'
import { Pagination } from '@/components/common/pagination'
import { EmptyState } from '@/components/common/empty-state'
import { OrderStatusBadge } from '@/components/order/order-status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDateTime, resolveImageUrl } from '@/lib'
import type { Order, PaginationMeta } from '@/types'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    orderApi
      .mine({ page, limit: 10 })
      .then((res) => {
        if (cancelled) return
        setOrders(res.data)
        setMeta(res.pagination)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Đơn hàng của tôi</h2>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng"
          description="Bạn chưa đặt đơn hàng nào. Hãy khám phá cửa hàng của chúng tôi."
          icon={<Package className="size-7" />}
          action={
            <Link to="/san-pham" className="text-primary font-medium hover:underline">
              Mua sắm ngay
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id}>
                <CardContent className="p-5">
                  <Link to={`/tai-khoan/don-hang/${order._id}`} className="block">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">
                          Mã đơn: #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {order.items.slice(0, 4).map((item, i) => (
                          <img
                            key={i}
                            src={resolveImageUrl(item.image)}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="bg-muted size-12 rounded-full border-2 border-background object-cover"
                          />
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          {order.items.map((i) => i.name).join(', ')}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{formatCurrency(order.total)}</span>
                        <ChevronRight className="text-muted-foreground size-5" />
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  )
}
