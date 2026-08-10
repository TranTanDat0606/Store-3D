import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { statsApi, orderApi } from '@/services'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatusBadge } from '@/components/order/order-status-badge'
import { formatCurrency, formatDateTime, cn } from '@/lib'
import type { BestSellingProduct, Order, StatsOverview } from '@/types'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [bestSelling, setBestSelling] = useState<BestSellingProduct[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      statsApi.overview(),
      statsApi.bestSelling(5),
      orderApi.adminList({ limit: 5 }),
    ])
      .then(([ov, best, orders]) => {
        if (cancelled) return
        setStats(ov)
        setBestSelling(best)
        setRecentOrders(orders.data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  const statCards = [
    { label: 'Tổng doanh thu', value: formatCurrency(stats?.totalRevenue ?? 0), icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Tổng đơn hàng', value: String(stats?.totalOrders ?? 0), icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Tổng sản phẩm', value: String(stats?.totalProducts ?? 0), icon: Package, color: 'text-purple-600' },
    { label: 'Khách hàng', value: String(stats?.totalCustomers ?? 0), icon: Users, color: 'text-amber-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-muted-foreground">Thống kê hoạt động của cửa hàng</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-muted-foreground text-sm">{card.label}</p>
                <p className="mt-1 text-2xl font-bold">{card.value}</p>
              </div>
              <div className={cn('flex size-12 items-center justify-center rounded-xl bg-muted', card.color)}>
                <card.icon className="size-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-amber-100 dark:bg-amber-950 flex size-12 items-center justify-center rounded-xl">
              <Clock className="size-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.pendingOrders ?? 0}</p>
              <p className="text-muted-foreground text-sm">Đơn chờ xác nhận</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-emerald-100 dark:bg-emerald-950 flex size-12 items-center justify-center rounded-xl">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.completedOrders ?? 0}</p>
              <p className="text-muted-foreground text-sm">Đơn hoàn thành</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Sản phẩm bán chạy</CardTitle>
            <TrendingUp className="text-muted-foreground size-5" />
          </CardHeader>
          <CardContent>
            {bestSelling.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-4">
                {bestSelling.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6 text-sm font-bold">#{i + 1}</span>
                    <img src={p.image} alt="" className="bg-muted size-10 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/admin/san-pham`} className="hover:text-primary line-clamp-1 text-sm font-medium">
                        {p.name}
                      </Link>
                      <p className="text-muted-foreground text-xs">{p.totalSold} đã bán</p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">Chưa có đơn hàng</p>
            ) : (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <Link
                    key={order._id}
                    to={`/admin/don-hang`}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        #{order._id.slice(-8).toUpperCase()} · {order.customer.name}
                      </p>
                      <p className="text-muted-foreground text-xs">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatCurrency(order.total)}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
