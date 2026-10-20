import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, Gamepad2 } from 'lucide-react'
import { orderApi } from '@/services'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ReviewProductAction } from '@/components/review/review-action'
import { useReviewEligibility } from '@/hooks/useReviewEligibility'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatCurrency, formatDateTime, resolveImageUrl } from '@/lib'
import { getErrorMessage } from '@/services/apiClient'
import { orderCodeOf, PaymentChip, StatusChip, STATUS_LABELS } from './account-chips'
import { toast } from 'sonner'
import type { Order } from '@/types'

/**
 * Plan 4 T7 — decision #7: there is NO customer order-detail design screen. What
 * exists today is a dedicated `/tai-khoan/don-hang/:id` route (the list rows link
 * to it — there is no inline/expand in current code); it is PRESERVED as-is and
 * restyled to match the `account-orders.html` card language (rounded-2xl cards,
 * mono gold order code, chip pills). All logic below is unchanged: fetch,
 * eligibility hook, mini-game mount, cancel API call + payload.
 *
 * Cancel confirmation = `overlays-spec.html` TILE 02 (Hộp Thoại Hủy Đơn Hàng),
 * VN copy verbatim; a11y per spec: shadcn AlertDialog → role="alertdialog",
 * focus trap, Escape, focus return. Payload byte-preserved: `cancelByUser(id, reason)`
 * → POST body { reason }.
 */

const MiniGameModal = lazy(() =>
  import('@/components/mini-game/mini-game-modal').then((m) => ({ default: m.MiniGameModal }))
)

/** overlays-spec cancel reasons, verbatim (select options 1-4 + "other"). */
const CANCEL_REASONS = [
  'Đặt nhầm sản phẩm / muốn đổi mẫu khác',
  'Tìm thấy giá hoặc tùy chọn phù hợp hơn',
  'Muốn đổi địa chỉ nhận hàng hoặc phương thức COD',
  'Thời gian chế tác chưa phù hợp lịch cá nhân',
  'Lý do khác...',
] as const

export default function OrderDetailPage() {
  useDocumentTitle('Chi tiết đơn hàng')
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelNote, setCancelNote] = useState('')
  const [gameOpen, setGameOpen] = useState(false)

  const productIds: string[] =
    order?.items.map((i) => (typeof i.product === 'object' ? i.product._id : i.product)) ?? []
  const eligibilityMap = useReviewEligibility(productIds)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    orderApi
      .getById(id)
      .then((o) => {
        if (!cancelled) setOrder(o)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const handleCancelOrder = async () => {
    if (!order) return
    setCancelling(true)
    // Payload byte-preserved: POST /orders/:id/cancel { reason } — the optional
    // spec note rides along inside the same `reason` string (no new key).
    const composedReason = cancelNote.trim() ? `${cancelReason} — ${cancelNote.trim()}` : cancelReason
    try {
      const updated = await orderApi.cancelByUser(order._id, composedReason || undefined)
      setOrder(updated)
      setCancelDialogOpen(false)
      setCancelReason('')
      setCancelNote('')
      toast.success('Hủy đơn hàng thành công')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <EmptyState
        title="Không tìm thấy đơn hàng"
        description="Đơn hàng này không tồn tại hoặc không thuộc về tài khoản của bạn."
        action={
          <Button asChild>
            <Link to="/tai-khoan/don-hang">Quay lại danh sách đơn hàng</Link>
          </Button>
        }
      />
    )
  }

  const cardCls = 'border-border bg-card rounded-2xl border shadow-lg'

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="min-h-10">
        <Link to="/tai-khoan/don-hang">
          <ArrowLeft className="size-4" />
          Quay lại
        </Link>
      </Button>

      <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-lg sm:p-5">
        <div>
          <h1 className="text-foreground flex flex-wrap items-center gap-2 text-xl font-bold">
            <span className="text-primary font-mono tracking-wide">{orderCodeOf(order)}</span>
          </h1>
          <p className="text-muted-foreground text-sm">Đặt lúc {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={order.status} />
          <PaymentChip status={order.payment.status} />
          {order.status === 'completed' && (
            <Suspense fallback={null}>
              <Button variant="outline" size="sm" className="min-h-9" onClick={() => setGameOpen(true)}>
                <Gamepad2 className="size-4" />
                Nhận quà
              </Button>
              <MiniGameModal open={gameOpen} onOpenChange={setGameOpen} orderId={order._id} />
            </Suspense>
          )}
          {order.status === 'pending' && (
            <Button variant="destructive" size="sm" className="min-h-9" onClick={() => setCancelDialogOpen(true)}>
              <Ban className="size-4" />
              Hủy đơn hàng
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* min-w-0 (T11b): grid children default to min-width:auto — a long
            unbreakable string in a card (e.g. API-allowed 100-char email) would
            otherwise inflate the track and overflow the 375/390 viewport. */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card className={cardCls}>
            <CardHeader>
              <CardTitle className="text-base">Sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {order.items.map((item) => {
                const prod = typeof item.product === 'object' ? item.product : null
                const productId: string = typeof item.product === 'object' ? item.product._id : item.product
                const eligibility = eligibilityMap[productId]
                return (
                  <div key={item._id} className="flex items-center gap-4 py-3">
                    <div className="bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                      <img src={resolveImageUrl(item.image)} alt={item.name} loading="lazy" decoding="async" className="size-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/san-pham/${prod?.slug ?? ''}`}
                        className="hover:text-primary line-clamp-1 text-sm font-medium"
                      >
                        {item.name}
                      </Link>
                      <p className="text-muted-foreground text-sm">x{item.quantity}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-primary font-mono text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <ReviewProductAction slug={prod?.slug} eligibility={eligibility} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className={cardCls}>
            <CardHeader>
              <CardTitle className="text-base">Thông tin giao hàng</CardTitle>
            </CardHeader>
            {/* break-words (T11b): soft-wrap unbreakable user strings (email,
                address, note) so the card never widens the grid track. */}
            <CardContent className="space-y-1.5 text-sm break-words">
              <p>
                <span className="text-muted-foreground">Người nhận:</span>{' '}
                <span className="font-medium">{order.customer.name}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Số điện thoại:</span>{' '}
                {order.customer.phone}
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
            </CardContent>
          </Card>
        </div>

        <Card className={cardCls + ' h-fit min-w-0'}>
          <CardHeader>
            <CardTitle className="text-base">Tổng đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="font-mono">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <span className="text-muted-foreground">Giảm giá</span>
                <span className="font-mono">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phí vận chuyển</span>
              <span className="font-mono">
                {order.shipping > 0 ? formatCurrency(order.shipping) : 'Miễn phí'}
              </span>
            </div>
            <div className="border-border flex justify-between border-t pt-3 text-base font-bold">
              <span>Tổng cộng</span>
              <span className="text-primary font-mono">{formatCurrency(order.total)}</span>
            </div>
            <div className="text-muted-foreground pt-2 text-xs">
              Phương thức thanh toán:{' '}
              <span className="font-medium text-foreground">
                {order.payment.method === 'cash' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============ CANCEL CONFIRMATION — overlays-spec TILE 02 (verbatim) ============
          role="alertdialog" + focus trap + Escape + focus return come from shadcn
          AlertDialog (Plan 2 overlay standards). */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="border-destructive/40 sm:max-w-md">
          <AlertDialogHeader className="flex-row items-start gap-3.5 text-left">
            <span className="border-destructive/30 bg-destructive/10 text-destructive flex size-10 shrink-0 items-center justify-center rounded-xl border">
              <Ban className="size-5" />
            </span>
            <div className="flex-1 space-y-1.5">
              <AlertDialogTitle className="leading-snug">
                Hủy đơn hàng <span className="text-primary font-mono font-black">{orderCodeOf(order)}</span>?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs leading-relaxed">
                Đơn hàng đang ở trạng thái{' '}
                <span className="text-accent font-medium">{STATUS_LABELS[order.status]}</span>. Sau khi hủy,
                phôi in 3D sẽ giải phóng khỏi hàng chờ xưởng chế tác.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <div className="space-y-3.5 text-xs">
            <div>
              <label
                htmlFor="cancel-reason"
                className="text-foreground mb-1.5 flex items-center justify-between font-semibold"
              >
                <span>
                  Lý do hủy đơn hàng <span className="text-destructive">*</span>
                </span>
                <span className="text-muted-foreground text-[10px] font-normal">Bắt buộc</span>
              </label>
              <select
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="border-input bg-muted text-foreground focus:ring-ring flex w-full appearance-none rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1"
              >
                <option value="">Chọn lý do hủy đơn…</option>
                {CANCEL_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="cancel-note"
                className="text-foreground mb-1.5 flex items-center justify-between font-semibold"
              >
                <span>
                  Ghi chú thêm cho STORE 3D <span className="text-muted-foreground text-[11px] font-normal">(tùy chọn)</span>
                </span>
                <span className="text-muted-foreground text-[10px]">Tối đa 200 ký tự</span>
              </label>
              <textarea
                id="cancel-note"
                rows={2}
                maxLength={200}
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="Chia sẻ thêm lý do để STORE 3D cải thiện dịch vụ chế tác hoàn thiện..."
                className="border-input bg-muted text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border p-2.5 text-xs focus:outline-none focus:ring-1"
              />
            </div>

            <div className="border-destructive/20 bg-background text-muted-foreground flex items-start gap-2 rounded-lg border p-2.5 text-[11px]">
              <Ban className="text-destructive mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                Nếu bạn đã thanh toán qua <span className="text-foreground font-semibold">VietQR</span>, hoàn
                tiền tự động vào tài khoản gốc trong vòng 24h làm việc. COD không phát sinh chi phí.
              </span>
            </div>
          </div>

          <AlertDialogFooter className="border-border/60 mt-2 border-t pt-3">
            <AlertDialogCancel className="min-h-11">Giữ đơn hàng</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-11"
              onClick={handleCancelOrder}
              disabled={cancelling || !cancelReason}
            >
              <Ban className="size-4" />
              {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
