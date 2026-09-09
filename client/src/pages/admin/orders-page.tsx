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

// One-way workflow — an order may only move forward along this chain.
// Mirrors server ALLOWED_NEXT_STATUS; admin can cancel from pending or confirmed.
const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['completed'],
  completed: [],
  cancelled: [],
}

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
      toast.success('Cập nhật trạng thái đơn hàng thành công', { duration: 4000 })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const itemCount = (o: Order) => o.items.reduce((s, it) => s + it.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm theo tên khách hàng hoặc mã đơn..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
          Không có đơn hàng nào
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="overflow-hidden rounded-2xl border border-border bg-card/50">
              <button
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
                onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">#{order._id.slice(-8).toUpperCase()}</span>
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.payment.status} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden text-sm text-muted-foreground sm:block">
                    {order.customer.name} · {itemCount(order)} sản phẩm · {formatDateTime(order.createdAt)}
                  </span>
                  <span className="font-bold text-foreground">{formatCurrency(order.total)}</span>
                  <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', expandedId === order._id && 'rotate-180')} />
                </div>
              </button>

              {expandedId === order._id && (
                <div className="border-t border-border p-4">
                  <div className="mb-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 text-sm text-foreground">
                      <p><span className="text-muted-foreground">Khách hàng:</span> {order.customer.name}</p>
                      <p><span className="text-muted-foreground">SĐT:</span> {order.customer.phone}</p>
                      <p><span className="text-muted-foreground">Email:</span> {order.customer.email}</p>
                      <p><span className="text-muted-foreground">Địa chỉ:</span> {order.customer.address}</p>
                      {order.note && <p><span className="text-muted-foreground">Ghi chú:</span> {order.note}</p>}
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item._id} className="flex items-center gap-3 text-sm">
                          {item.image && (
                            <img src={resolveImageUrl(item.image)} alt="" className="size-10 rounded-lg border border-border object-cover" />
                          )}
                          <span className="line-clamp-1 flex-1 text-foreground">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {order.discount > 0 && (
                        <p className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                          <span>Giảm giá</span>
                          <span>-{formatCurrency(order.discount)}</span>
                        </p>
                      )}
                      <p className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                        <span>Tổng</span>
                        <span>{formatCurrency(order.total)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                    <span className="text-sm text-muted-foreground">Cập nhật trạng thái:</span>
                    <Select
                      value={order.status}
                      onValueChange={(v) => changeStatus(order._id, v as OrderStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter((o) => o.value).map((o) => {
                          const opt = o.value as OrderStatus
                          const selectable = opt === order.status || ALLOWED_NEXT[order.status].includes(opt)
                          return (
                            <SelectItem key={o.value} value={o.value} disabled={!selectable}>
                              {o.label}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <Badge variant="outline">
                      {order.payment.method === 'cash' ? 'COD' : 'Chuyển khoản'}
                    </Badge>
                    {order.payment.status === 'unpaid' && order.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await orderApi.adminUpdateStatus(order._id, { status: order.status, paymentStatus: 'paid' })
                            setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, payment: { ...o.payment, status: 'paid' } } : o))
                            toast.success('Đã cập nhật trạng thái thanh toán', { duration: 4000 })
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
