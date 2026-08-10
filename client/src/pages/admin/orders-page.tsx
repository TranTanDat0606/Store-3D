import { useEffect, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { orderApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/common/pagination'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/order/order-status-badge'
import { formatCurrency, formatDateTime, resolveImageUrl } from '@/lib'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus, PaginationMeta } from '@/types'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    orderApi
      .adminList({ page, limit: 10, search: search || undefined, status: status || undefined })
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
  }, [page, search, status])

  const changeStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      const updated = await orderApi.adminUpdateStatus(id, { status: newStatus })
      setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)))
      toast.success('Cập nhật trạng thái đơn hàng thành công')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const itemCount = (o: Order) => o.items.reduce((s, it) => s + it.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm theo tên khách hàng hoặc mã đơn..."
            className="border-white/10 bg-slate-900/60 pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-[180px] border-white/10 bg-slate-900/60 text-slate-100">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-slate-900 text-slate-100">
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-slate-400">
          Không có đơn hàng nào
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <button
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
                onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">#{order._id.slice(-8).toUpperCase()}</span>
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.payment.status} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden text-sm text-slate-400 sm:block">
                    {order.customer.name} · {itemCount(order)} sản phẩm · {formatDateTime(order.createdAt)}
                  </span>
                  <span className="font-bold text-white">{formatCurrency(order.total)}</span>
                  <ChevronDown className={cn('size-4 text-slate-400 transition-transform', expandedId === order._id && 'rotate-180')} />
                </div>
              </button>

              {expandedId === order._id && (
                <div className="border-t border-white/10 p-4">
                  <div className="mb-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 text-sm text-slate-300">
                      <p><span className="text-slate-400">Khách hàng:</span> {order.customer.name}</p>
                      <p><span className="text-slate-400">SĐT:</span> {order.customer.phone}</p>
                      <p><span className="text-slate-400">Email:</span> {order.customer.email}</p>
                      <p><span className="text-slate-400">Địa chỉ:</span> {order.customer.address}</p>
                      {order.note && <p><span className="text-slate-400">Ghi chú:</span> {order.note}</p>}
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item._id} className="flex items-center gap-3 text-sm">
                          {item.image && (
                            <img src={resolveImageUrl(item.image)} alt="" className="size-10 rounded-lg border border-white/10 object-cover" />
                          )}
                          <span className="line-clamp-1 flex-1 text-slate-300">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium text-slate-100">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {order.discount > 0 && (
                        <p className="flex justify-between text-sm text-emerald-400">
                          <span>Giảm giá</span>
                          <span>-{formatCurrency(order.discount)}</span>
                        </p>
                      )}
                      <p className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
                        <span>Tổng</span>
                        <span>{formatCurrency(order.total)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                    <span className="text-sm text-slate-400">Cập nhật trạng thái:</span>
                    <Select value={order.status} onValueChange={(v) => changeStatus(order._id, v as OrderStatus)}>
                      <SelectTrigger className="w-[180px] border-white/10 bg-slate-950/60 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-slate-900 text-slate-100">
                        {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge variant="outline" className="border-white/10 text-slate-300">
                      {order.payment.method === 'cash' ? 'COD' : 'Chuyển khoản'}
                    </Badge>
                    {order.payment.status === 'unpaid' && order.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-slate-200 hover:bg-white/5 hover:text-white"
                        onClick={async () => {
                          try {
                            await orderApi.adminUpdateStatus(order._id, { status: order.status, paymentStatus: 'paid' })
                            setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, payment: { ...o.payment, status: 'paid' } } : o))
                            toast.success('Đã cập nhật trạng thái thanh toán')
                          } catch (err) {
                            toast.error(getErrorMessage(err))
                          }
                        }}
                      >
                        Đánh dấu đã thanh toán
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  )
}
