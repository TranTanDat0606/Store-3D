import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, Package, ShoppingCart, Users, Clock, CheckCircle2, TrendingUp, type LucideIcon } from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { statsApi, orderApi } from '@/services'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrderStatusBadge } from '@/components/order/order-status-badge'
import { formatCurrency, formatDateTime, cn } from '@/lib'
import type { BestSellingProduct, Order, OrdersByStatus, RevenuePeriod, RevenuePoint, StatsOverview } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#38bdf8',
  shipping: '#818cf8',
  completed: '#34d399',
  cancelled: '#f43f5e',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

const PERIOD_LABELS: Record<RevenuePeriod, string> = {
  day: 'Hôm nay',
  week: 'Tuần này',
  month: 'Tháng này',
  year: 'Năm nay',
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [byStatus, setByStatus] = useState<OrdersByStatus[]>([])
  const [bestSelling, setBestSelling] = useState<BestSellingProduct[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<RevenuePeriod>('month')
  const [periodRevenue, setPeriodRevenue] = useState<number | null>(null)
  const [periodOrders, setPeriodOrders] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      statsApi.overview(),
      statsApi.revenue(30),
      statsApi.ordersByStatus(),
      statsApi.bestSelling(5),
      orderApi.adminList({ limit: 5 }),
    ])
      .then(([ov, rev, statuses, best, orders]) => {
        if (cancelled) return
        setStats(ov)
        setRevenue(rev)
        setByStatus(statuses)
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

  useEffect(() => {
    void statsApi.revenuePeriod(period).then((r) => {
      setPeriodRevenue(r.revenue)
      setPeriodOrders(r.orders)
    })
  }, [period])

  const chartData = useMemo(
    () => revenue.map((r) => ({ ...r, date: r.date.slice(5) })),
    [revenue]
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl bg-white/5" />
          <Skeleton className="h-80 rounded-2xl bg-white/5" />
        </div>
      </div>
    )
  }

  const statCards: {
    label: string
    value: string
    icon: LucideIcon
    accent: string
    glow: string
  }[] = [
    { label: 'Tổng đơn hàng', value: String(stats?.totalOrders ?? 0), icon: ShoppingCart, accent: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-500/20' },
    { label: 'Tổng sản phẩm', value: String(stats?.totalProducts ?? 0), icon: Package, accent: 'from-violet-400 to-purple-500', glow: 'shadow-violet-500/20' },
    { label: 'Khách hàng', value: String(stats?.totalCustomers ?? 0), icon: Users, accent: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/20' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardContent className="flex items-center justify-between gap-3 p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-400">Doanh thu</p>
                <Select value={period} onValueChange={(v) => setPeriod(v as RevenuePeriod)}>
                  <SelectTrigger size="sm" className="h-6 border-white/10 bg-white/5 px-2 text-xs text-slate-300">
                    <SelectValue placeholder="Chọn kỳ" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="mt-1 text-2xl font-bold text-white">
                {periodRevenue == null
                  ? <Skeleton className="h-7 w-28 bg-white/10" />
                  : formatCurrency(periodRevenue)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {periodOrders} đơn trong kỳ · Tổng cộng: {formatCurrency(stats?.totalRevenue ?? 0)}
              </p>
            </div>
            <div className={cn('flex size-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg', 'from-emerald-400 to-teal-500', 'shadow-emerald-500/20')}>
              <DollarSign className="size-6 text-white" />
            </div>
          </CardContent>
        </Card>
        {statCards.map((card) => (
          <Card key={card.label} className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={cn('flex size-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg', card.accent, card.glow)}>
                <card.icon className="size-6 text-white" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
              <Clock className="size-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.pendingOrders ?? 0}</p>
              <p className="text-sm text-slate-400">Đơn chờ xác nhận</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="size-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.completedOrders ?? 0}</p>
              <p className="text-sm text-slate-400">Đơn hoàn thành</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base text-white">Doanh thu 30 ngày</CardTitle>
            <TrendingUp className="size-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9' }} formatter={(v) => formatCurrency(Number(v))} />
                <Area type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base text-white">Trạng thái đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="status" innerRadius={70} outerRadius={100} paddingAngle={3} stroke="none">
                  {byStatus.map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9' }} formatter={(v, n) => [`${v} đơn`, STATUS_LABELS[String(n)] ?? String(n)]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {byStatus.map((s) => (
                <span key={s.status} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="size-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] ?? '#64748b' }} />
                  {STATUS_LABELS[s.status] ?? s.status} · {s.count}
                </span>
              ))}
              {byStatus.length === 0 && <span className="text-sm text-slate-400">Chưa có dữ liệu</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base text-white">Sản phẩm bán chạy</CardTitle>
            <TrendingUp className="size-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            {bestSelling.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-4">
                {bestSelling.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <span className={cn('w-6 text-sm font-bold', i === 0 ? 'text-cyan-400' : 'text-slate-400')}>#{i + 1}</span>
                    <img src={p.image} alt="" className="size-10 rounded-lg border border-white/10 object-cover" />
                    <div className="min-w-0 flex-1">
                      <Link to="/admin/san-pham" className="line-clamp-1 text-sm font-medium text-slate-100 hover:text-cyan-300">
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-400">{p.totalSold} đã bán</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-100">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base text-white">Đơn hàng gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Chưa có đơn hàng</p>
            ) : (
              <div className="divide-y divide-white/5">
                {recentOrders.map((order) => (
                  <Link key={order._id} to="/admin/don-hang" className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">
                        #{order._id.slice(-8).toUpperCase()} · {order.customer.name}
                      </p>
                      <p className="text-xs text-slate-400">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100">{formatCurrency(order.total)}</span>
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
