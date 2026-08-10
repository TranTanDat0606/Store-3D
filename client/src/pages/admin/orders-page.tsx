import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { orderApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/common/pagination'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/order/order-status-badge'
import { formatCurrency, formatDateTime } from '@/lib'
import { toast } from 'sonner'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <p className="text-muted-foreground">{meta ? `${meta.total} đơn hàng` : ''}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm theo tên khách hàng hoặc mã đơn..."
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted h-24 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed py-12 text-center">
          Không có đơn hàng nào
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id}>
              <CardContent className="p-4">
                <button
                  className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                  onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">#{order._id.slice(-8).toUpperCase()}</span>
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.payment.status} />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground text-sm">
                      {order.customer.name} · {formatDateTime(order.createdAt)}
                    </span>
                    <span className="font-bold">{formatCurrency(order.total)}</span>
                  </div>
                </button>

                {expandedId === order._id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="mb-4 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Khách hàng:</span> {order.customer.name}
                        </p>
                        <p>
                          <span className="text-muted-foreground">SĐT:</span> {order.customer.phone}
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
                      </div>
                      <div className="space-y-1 text-sm">
                        {order.items.map((item) => (
                          <p key={item._id} className="flex justify-between gap-4">
                            <span className="line-clamp-1">
                              {item.name} × {item.quantity}
                            </span>
                            <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                          </p>
                        ))}
                        {order.discount > 0 && (
                          <p className="flex justify-between text-emerald-600">
                            <span>Giảm giá</span>
                            <span>-{formatCurrency(order.discount)}</span>
                          </p>
                        )}
                        <p className="flex justify-between border-t pt-2 text-base font-bold">
                          <span>Tổng</span>
                          <span>{formatCurrency(order.total)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                      <span className="text-muted-foreground text-sm">Cập nhật trạng thái:</span>
                      <Select value={order.status} onValueChange={(v) => changeStatus(order._id, v as OrderStatus)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge variant={order.payment.status === 'paid' ? 'secondary' : 'outline'}>
                        {order.payment.method === 'cash' ? 'COD' : 'Chuyển khoản'}
                      </Badge>
                      {order.payment.status === 'unpaid' && order.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await orderApi.adminUpdateStatus(order._id, {
                                status: order.status,
                                paymentStatus: 'paid',
                              })
                              setOrders((prev) =>
                                prev.map((o) =>
                                  o._id === order._id ? { ...o, payment: { ...o.payment, status: 'paid' } } : o
                                )
                              )
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  )
}
