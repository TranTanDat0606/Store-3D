import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCircle2, Clock, Package, Receipt } from 'lucide-react'
import { orderApi } from '@/services'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Pagination } from '@/components/common/pagination'
import { EmptyState } from '@/components/common/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency, formatDateTime, resolveImageUrl } from '@/lib'
import {
  orderCodeOf,
  paymentMethodLabel,
  PaymentChip,
  StatusChip,
} from './account-chips'
import type { Order, PaginationMeta } from '@/types'

/**
 * Plan 4 T7 — orders list → `.stitch/designs/account-orders.html` (VN verbatim).
 *
 * PRESERVED: fetch `orderApi.mine({ page, limit: 10 })` (params byte-identical),
 * pagination + empty state, status/payment enum mapping (shared `account-chips`),
 * row → `/tai-khoan/don-hang/:id` detail navigation.
 *
 * Omitted from screen (logged):
 *  - Status filter chips "Tất cả (12) / Chờ xác nhận (1) …": the server's
 *    `GET /orders/mine` IGNORES `status` (orderService.ts listForUser filters
 *    `{user}` only; apiFeatures never receives a status) → chips would lie. Not wired.
 *  - Search input "Tìm mã đơn hoặc tên mô hình...": `/mine` passes no `searchFields`
 *    to apiFeatures → search is dropped server-side. Not wired.
 *  - Per-card actions with no existing implementation: "Thanh toán ngay" (QR),
 *    "Đánh giá sản phẩm"/"Mua lại" (list-level), "Xem hóa đơn VAT", "Mua lại toàn
 *    bộ đơn". Existing review/cancel actions live on the detail route (restyled there).
 *  - Timeline per-step timestamps (no step history in the Order model).
 * Timeline block rendered for completed orders only (exactly what the screen shows),
 * steps derived from the real `completed` status.
 */

const TIMELINE_STEPS = [
  { title: 'Đã xác nhận', desc: 'Kiểm duyệt file 3D' },
  { title: 'In & Xử lý Resin 8K', desc: 'Sấy UV & Hoàn thiện thủ công' },
  { title: 'Đang giao hàng', desc: 'Bàn giao đơn vị vận chuyển' },
  { title: 'Giao thành công', desc: '' },
] as const

export default function OrdersPage() {
  useDocumentTitle('Đơn hàng của tôi')
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
    <div className="flex flex-col gap-6">
      {/* ================= TITLE & CONTEXT BAR ================= */}
      <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-foreground flex flex-wrap items-center gap-2.5 text-2xl font-extrabold tracking-tight md:text-3xl">
            <span>Đơn hàng của tôi</span>
            {meta && (
              <span className="border-border bg-muted text-muted-foreground rounded-full border px-2.5 py-1 text-xs font-normal">
                Tổng cộng: {meta.total} đơn
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Theo dõi hành trình chế tác, đóng gói và vận chuyển các mô hình sưu tầm của bạn.
          </p>
        </div>
      </div>
      {/* Omitted (no server support — logged): status filter chips + search input
          (`/orders/mine` ignores `status` and drops `search`, see file header). */}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
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
        <div className="flex flex-col gap-5">
          {orders.map((order) => {
            const qty = order.items.reduce((s, i) => s + i.quantity, 0)
            const isCompleted = order.status === 'completed'
            return (
              <article
                key={order._id}
                className="border-border bg-card overflow-hidden rounded-2xl border shadow-lg transition-all hover:border-muted-foreground/40"
              >
                {/* ---------- Card header ---------- */}
                <div className="bg-muted/40 border-border/60 flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="bg-primary/10 border-primary/30 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg border">
                      <Receipt className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-primary font-mono text-sm font-bold tracking-wide">
                          {orderCodeOf(order)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          • {formatDateTime(order.createdAt)}
                        </span>
                      </div>
                      <span className="text-muted-foreground/80 block text-[11px]">
                        Thanh toán: {paymentMethodLabel(order.payment.method)} · Phí vận chuyển{' '}
                        {order.shipping === 0 ? '0₫' : formatCurrency(order.shipping)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={order.status} />
                    <PaymentChip status={order.payment.status} />
                  </div>
                </div>

                {/* ---------- Inline processing timeline (completed orders — decision #7:
                       no customer order-detail screen in design; detail stays on its
                       existing route, this block restyles the screen's timeline) ---------- */}
                {isCompleted && (
                  <div className="border-border/60 bg-muted/30 border-b px-4 py-5 sm:px-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-foreground flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                        <Clock className="text-primary size-3.5" aria-hidden />
                        Tiến trình xử lý &amp; Chế tác mô hình
                      </p>
                      <span className="text-success flex items-center gap-1 text-[11px] font-semibold">
                        <CheckCircle2 className="size-3.5" aria-hidden />
                        Đã giao thành công tới bạn
                      </span>
                    </div>
                    <ol className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                      {TIMELINE_STEPS.map((step, i) => (
                        <li key={step.title} className="flex flex-col items-start">
                          <div className="mb-2 flex w-full items-center">
                            <span
                              className={cn(
                                'z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                i === 3
                                  ? 'bg-primary text-primary-foreground ring-primary/30 ring-4'
                                  : 'bg-success text-background ring-success/20 ring-4'
                              )}
                            >
                              {i === 3 ? <CheckCircle2 className="size-3.5" /> : <Check className="size-3" />}
                            </span>
                            {i < 3 && <span className="bg-success ml-2 hidden h-0.5 flex-1 sm:block" />}
                          </div>
                          <p
                            className={cn(
                              'text-xs font-bold',
                              i === 3 ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            {step.title}
                          </p>
                          {step.desc && (
                            <p className="text-muted-foreground mt-0.5 text-[11px]">{step.desc}</p>
                          )}
                          {i === 3 && (
                            <p className="text-muted-foreground mt-0.5 text-[10px]">
                              Người nhận: {order.customer.name}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* ---------- Items ---------- */}
                <div className="divide-y divide-border/60 p-4 sm:p-6">
                  {order.items.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-xl border">
                          <img
                            src={resolveImageUrl(item.image)}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground truncate text-sm font-semibold transition-colors sm:text-base">
                            {item.name}
                          </p>
                          <p className="text-muted-foreground mt-1.5 text-xs">
                            Số lượng: <span className="text-foreground font-semibold">{item.quantity}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-primary font-mono self-end text-base font-bold sm:self-center">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ---------- Summary & action bar ---------- */}
                <div className="border-border/60 bg-muted/60 flex flex-col gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-muted-foreground">
                      Tổng số lượng: <strong className="text-foreground">{qty} món</strong>
                    </span>
                    <span className="text-border">•</span>
                    <span className="text-muted-foreground">Tổng thanh toán:</span>
                    <span className="text-primary font-mono text-lg font-black">
                      {formatCurrency(order.total)}
                    </span>
                    {order.shipping === 0 && (
                      <span className="bg-success/10 text-success hidden rounded border border-success/20 px-2 py-0.5 text-[11px] font-semibold md:inline-block">
                        Freeship
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {/* Existing list action preserved (row → detail route). Design's
                        "Hủy đơn hàng / Thanh toán ngay / Đánh giá / Mua lại / VAT" are
                        not implemented on the list today — omitted, see file header. */}
                    <Link
                      to={`/tai-khoan/don-hang/${order._id}`}
                      className="border-border bg-muted hover:bg-muted-foreground/10 text-foreground inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
                    >
                      Xem chi tiết đơn
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </div>
      )}
    </div>
  )
}
