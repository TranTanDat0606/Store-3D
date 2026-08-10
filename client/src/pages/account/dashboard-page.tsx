import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Package, Heart, User } from 'lucide-react'
import { orderApi } from '@/services'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatusBadge } from '@/components/order/order-status-badge'
import { formatCurrency, formatDateTime } from '@/lib'
import type { Order } from '@/types'

export default function AccountDashboardPage() {
  const { user } = useAuth()
  const { products: wishlist } = useWishlist()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    orderApi
      .mine({ limit: 5 })
      .then((res) => {
        if (!cancelled) setOrders(res.data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
              <Package className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-muted-foreground text-sm">Đơn hàng gần đây</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-xl">
              <Heart className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{wishlist.length}</p>
              <p className="text-muted-foreground text-sm">Sản phẩm yêu thích</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
              <User className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{user?.fullname.split(' ').pop()}</p>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Đơn hàng gần đây</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tai-khoan/don-hang">
              Xem tất cả
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center text-sm">
              Bạn chưa có đơn hàng nào.{' '}
              <Link to="/san-pham" className="text-primary hover:underline">
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  to={`/tai-khoan/don-hang/${order._id}`}
                  className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">#{order._id.slice(-8).toUpperCase()}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {formatDateTime(order.createdAt)} · {order.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{formatCurrency(order.total)}</span>
                    <ChevronRight className="text-muted-foreground size-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
