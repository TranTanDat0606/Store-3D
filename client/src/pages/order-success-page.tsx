import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  Box,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  Home,
  Package,
  Route,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react'
import { orderApi } from '@/services'
import { getApiErrorInfo, type ApiErrorInfo } from '@/lib/apiError'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { toast } from 'sonner'
import { cn, formatCurrency, formatDateTime, resolveImageUrl } from '@/lib'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import type { Order, OrderStatus, PaymentStatus } from '@/types'

/**
 * Plan 4 T6 — order-success screen (`.stitch/designs/order-success.html`, VN verbatim).
 *
 * §3: every total on this page is a SERVER order field (`order.subtotal`,
 * `order.discount`, `order.shipping`, `order.total`) — no client recomputation.
 * §4: 404 → empty-state copy; other load failures → ErrorState with retry.
 * Design gaps (logged): the "Hóa đơn điện tử… đã gửi tới <email>" line is omitted
 * (the server only emails on payment success, not on order creation), the
 * delivery-hours chip + "Thời gian áp dụng đến hết tháng" are omitted (unbacked
 * business values per §5), and the hotline block is settings-driven hide-on-absent.
 */

const MiniGameModal = lazy(() =>
  import('@/components/mini-game/mini-game-modal').then((m) => ({ default: m.MiniGameModal })),
)

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

const STATUS_CHIP_STYLES: Record<OrderStatus, string> = {
  pending: 'border-warning/30 bg-warning/10 text-warning',
  confirmed: 'border-accent/30 bg-accent/10 text-accent',
  shipping: 'border-accent/30 bg-accent/10 text-accent',
  completed: 'border-success/30 bg-success/10 text-success',
  cancelled: 'border-destructive/30 bg-destructive/10 text-destructive',
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
  pending_payment: 'Chờ thanh toán',
}

const STEP_ACTIVE_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  shipping: 2,
  completed: 3,
  cancelled: -1,
}

const ORDER_STEPS = [
  {
    n: '01',
    title: 'Chờ xác nhận',
    desc: 'Đội ngũ kỹ thuật viên kiểm tra đơn và liên hệ qua điện thoại trong 24h.',
    foot: 'Đang tiếp nhận thông tin',
    icon: null,
  },
  {
    n: '02',
    title: 'Đã xác nhận',
    desc: 'Duyệt file 3D, cắt layer vi mô & lên lịch in chi tiết tinh xảo.',
    foot: 'Dự kiến: Sau khi gọi xác nhận',
    icon: Clock,
  },
  {
    n: '03',
    title: 'Đang giao',
    desc: 'Đóng gói chống sốc 3 lớp & bàn giao đơn vị vận chuyển hỏa tốc.',
    foot: 'Giao từ 1 - 3 ngày làm việc',
    icon: Truck,
  },
  {
    n: '04',
    title: 'Hoàn tất',
    desc: 'Đồng kiểm tra độ nét mô hình, thanh toán COD và nhận hàng.',
    foot: 'Kèm phiếu bảo hành 1 đổi 1',
    icon: BadgeCheck,
  },
] as const

function StatusChip({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        STATUS_CHIP_STYLES[status] ?? 'border-border bg-muted text-muted-foreground'
      )}
    >
      {status === 'pending' && <span className="bg-warning h-1.5 w-1.5 animate-ping rounded-full" />}
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export default function OrderSuccessPage() {
  useDocumentTitle('Đặt hàng thành công')
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<ApiErrorInfo | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [gameOpen, setGameOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const toastedRef = useRef(false)
  const { settings } = usePublicSettings()

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    orderApi
      .getById(id)
      .then((o) => {
        if (cancelled) return
        setOrder(o)
        if (!toastedRef.current) {
          toastedRef.current = true
          toast.success('Đặt hàng thành công!', {
            description: `Đơn hàng #${o._id.slice(-8).toUpperCase()} đã được tiếp nhận.`,
            duration: 4000,
          })
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getApiErrorInfo(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Skeleton className="mx-auto size-20 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-8 w-64" />
        <Skeleton className="mt-8 h-40 w-full" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    )
  }

  // §4: 404 → empty-state copy
  if (loadError?.kind === 'not-found') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Không tìm thấy đơn hàng"
          description={loadError.message}
          icon={<ClipboardList className="size-7" />}
          action={
            <Button asChild>
              <Link to="/">Về trang chủ</Link>
            </Button>
          }
        />
      </div>
    )
  }

  if (loadError || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <ErrorState
          message={loadError?.message}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    )
  }

  const orderCode = order.payment.orderCode ?? `#${order._id.slice(-8).toUpperCase()}`
  const activeStep = STEP_ACTIVE_INDEX[order.status] ?? 0
  const isCancelled = order.status === 'cancelled'

  const copyOrderCode = async () => {
    try {
      await navigator.clipboard.writeText(orderCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Không thể sao chép, vui lòng chép thủ công')
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">
      {/* ==================== BREADCRUMB ==================== */}
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-8 flex items-center gap-2 text-xs">
        <Link to="/" className="transition-colors hover:text-primary">
          Trang chủ
        </Link>
        <ChevronRight className="size-3" />
        <Link to="/thanh-toan" className="transition-colors hover:text-primary">
          Thanh toán
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-primary font-medium">Đặt hàng thành công</span>
      </nav>

      {/* ==================== CENTERED HERO SUCCESS ==================== */}
      <section className="mx-auto mb-12 max-w-3xl text-center">
        <div className="border-primary bg-muted relative mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-[0_0_25px_rgba(237,184,76,0.28)] md:h-24 md:w-24">
          <CheckCircle2 className="text-primary size-10 md:size-14" />
          <div className="border-primary/30 pointer-events-none absolute -inset-1 animate-pulse rounded-full border" />
        </div>
        <h1 className="text-foreground mb-3 text-3xl font-extrabold tracking-tight md:text-5xl">
          Đặt hàng thành công!
        </h1>
        <p className="text-muted-foreground mx-auto mb-6 max-w-xl text-sm leading-relaxed md:text-base">
          Cảm ơn bạn đã lựa chọn STORE 3D. Chúng tôi sẽ liên hệ xác nhận trong 24h và bắt đầu quy
          trình chế tác mô hình.
        </p>
        {/* Order Code Badge Bar */}
        <div className="bg-card border-border inline-flex flex-wrap items-center justify-center gap-3 rounded-xl border px-5 py-3 shadow-inner">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Mã đơn hàng:
          </span>
          <span className="text-primary font-mono text-lg font-bold tracking-wider md:text-xl">
            {orderCode}
          </span>
          <button
            type="button"
            onClick={() => void copyOrderCode()}
            title="Sao chép mã đơn"
            aria-label="Sao chép mã đơn hàng"
            className={cn(
              'border-border bg-muted text-foreground hover:bg-muted/70 flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
              copied && 'text-primary'
            )}
          >
            <Copy className="size-3.5" />
            <span>{copied ? 'Đã chép!' : 'Sao chép'}</span>
          </button>
          <StatusChip status={order.status} />
        </div>
        {/* Deviation (logged): design's "Hóa đơn điện tử… đã gửi tới <email>" line omitted —
            the server only sends email on payment success (paymentService), not on order
            creation; showing it would be a fabricated claim. */}
      </section>

      {isCancelled && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive mb-8 rounded-xl border p-4 text-center text-sm font-semibold">
          Đơn hàng đã bị hủy
        </div>
      )}

      {/* ==================== ORDER STATUS TIMELINE (4 STEPS) ==================== */}
      <section className="bg-card border-border mb-10 rounded-2xl border p-6 shadow-lg md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-primary size-5" />
            <h2 className="text-base font-bold md:text-lg">Tiến trình xử lý đơn hàng</h2>
          </div>
          <span className="text-muted-foreground text-xs">
            Cập nhật: <span className="text-foreground">{formatDateTime(order.updatedAt)}</span>
          </span>
        </div>
        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ORDER_STEPS.map((step, idx) => {
            const isActive = idx === activeStep && !isCancelled
            const Icon = step.icon
            return (
              <div
                key={step.n}
                className={cn(
                  'flex flex-col justify-between rounded-xl border p-4',
                  isActive
                    ? 'border-primary/70 bg-muted shadow-[0_0_12px_rgba(237,184,76,0.2)]'
                    : 'border-border bg-muted/40 opacity-80'
                )}
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg font-mono text-xs font-bold',
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {step.n}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-semibold uppercase tracking-wide',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {isActive ? 'Hiện tại' : `Bước ${idx + 1}`}
                    </span>
                  </div>
                  <h3 className={cn('mb-1 text-sm font-bold', isActive ? 'text-primary' : '')}>
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
                </div>
                <div
                  className={cn(
                    'mt-3 flex items-center gap-1.5 border-t pt-2 text-[11px]',
                    isActive ? 'border-primary/30 text-primary' : 'border-border/60 text-muted-foreground'
                  )}
                >
                  {isActive && step.icon === null ? (
                    <span className="bg-primary h-2 w-2 animate-pulse rounded-full" />
                  ) : (
                    Icon && <Icon className="size-3 shrink-0" />
                  )}
                  <span>{step.foot}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ==================== BENTO GRID: MINI-SUMMARY & DELIVERY ==================== */}
      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Order Item List */}
        <div className="bg-card border-border rounded-2xl border p-6 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Package className="text-primary size-5" />
              Chi tiết mô hình đặt chế tác ({order.items.length})
            </h2>
            <span className="border-secondary/30 bg-secondary/10 text-secondary rounded-md border px-2.5 py-1 text-xs font-semibold">
              FDM &amp; Resin 8K Ultra
            </span>
          </div>
          {order.items.map((item, idx) => (
            <div
              key={item._id}
              className={cn(
                'flex flex-col items-start gap-4 py-3 sm:flex-row sm:items-center',
                idx < order.items.length - 1 && 'border-b border-border/40'
              )}
            >
              <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-xl border">
                <img
                  src={resolveImageUrl(item.image)}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold leading-snug">{item.name}</h4>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Số lượng: {String(item.quantity).padStart(2, '0')}
                </p>
              </div>
              <div className="self-end sm:self-center sm:pl-4">
                <span className="font-mono text-base font-bold text-primary">
                  {formatCurrency(item.price)}
                </span>
              </div>
            </div>
          ))}

          {/* Payment Calculations — server order fields only (§3) */}
          <div className="border-border/60 mt-4 space-y-2 border-t pt-4 text-xs">
            <div className="text-muted-foreground flex justify-between">
              <span>Tạm tính ({order.items.length} sản phẩm):</span>
              <span className="font-mono">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="text-muted-foreground flex justify-between">
              <span>Phí vận chuyển toàn quốc:</span>
              <span className="text-success font-semibold">
                {order.shipping === 0 ? 'Miễn phí (0₫)' : formatCurrency(order.shipping)}
              </span>
            </div>
            {order.discount > 0 && (
              /* Added row (logged deviation): screen has no discount line, but hiding the
                 server discount would break the subtotal → total reconciliation. */
              <div className="text-muted-foreground flex justify-between">
                <span>Giảm giá voucher:</span>
                <span className="text-destructive font-semibold">
                  -{formatCurrency(order.discount)}
                </span>
              </div>
            )}
            <div className="border-border flex items-center justify-between border-t pt-3 text-sm">
              <span className="font-bold">Tổng cộng thanh toán:</span>
              <span className="text-primary font-mono text-xl font-black md:text-2xl">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Logistics & Payment Specs */}
        <div className="space-y-6">
          {/* Recipient & Delivery Info */}
          <div className="bg-card border-border rounded-2xl border p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Home className="text-secondary size-5" />
              Địa chỉ nhận hàng
            </h3>
            <div className="space-y-1.5 text-xs">
              <p className="text-sm font-bold">
                {order.customer.name} <span className="font-normal">| {order.customer.phone}</span>
              </p>
              <p className="text-muted-foreground leading-relaxed">{order.customer.address}</p>
              {/* Deviation (logged): design's "Giao giờ hành chính (8:30 – 17:30)" chip omitted —
                  delivery hours are a business value not backed by settings (§5). */}
            </div>
          </div>

          {/* Payment Method Box */}
          <div className="bg-card border-border rounded-2xl border p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 className="text-primary size-5" />
              Phương thức thanh toán
            </h3>
            {order.payment.method === 'cash' ? (
              <>
                <div className="border-border bg-muted mb-2 rounded-xl border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                    <CheckCircle2 className="text-primary size-4" />
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-normal">
                    Được đồng kiểm tra hàng trước khi thanh toán tiền mặt cho nhân viên giao hàng.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-muted-foreground">Hỗ trợ chính sách:</span>
                  <span className="font-medium">Đồng kiểm 100% khi nhận</span>
                </div>
              </>
            ) : (
              <>
                <div className="border-border bg-muted mb-2 rounded-xl border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">Chuyển khoản VietQR</span>
                    <CheckCircle2 className="text-primary size-4" />
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-normal">
                    Giao dịch đối soát thời gian thực qua hệ thống ngân hàng.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-muted-foreground">Trạng thái thanh toán:</span>
                  <span
                    className={cn(
                      'font-medium',
                      order.payment.status === 'paid' ? 'text-success' : 'text-warning'
                    )}
                  >
                    {PAYMENT_LABELS[order.payment.status] ?? order.payment.status}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================== CTA ROW ==================== */}
      <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button size="lg" className="w-full sm:w-auto" asChild>
          <Link to={`/tai-khoan/don-hang/${order._id}`}>
            <Route className="size-4" />
            Theo dõi đơn hàng
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
          <Link to="/san-pham">
            <Store className="size-4" />
            Tiếp tục mua sắm
          </Link>
        </Button>
      </div>

      {/* ==================== PROMO & MINI-GAME TEASER ==================== */}
      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Promo Card 1: Review for Voucher */}
        <div className="border-border/40 bg-gradient-to-br from-muted to-background rounded-2xl border p-6">
          <div className="flex items-start gap-4">
            <div className="bg-warning/10 border-warning/30 flex size-12 shrink-0 items-center justify-center rounded-xl border">
              <ShoppingBag className="text-warning size-5" />
            </div>
            <div>
              <span className="text-primary text-[10px] font-bold uppercase tracking-wider">
                Đặc quyền người sưu tầm
              </span>
              <h3 className="mb-1.5 mt-0.5 text-sm font-bold md:text-base">
                Đánh giá sản phẩm khi nhận hàng — nhận mã giảm giá
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Chụp ảnh góc trưng bày mô hình và để lại cảm nhận sau khi nghiệm thu để nhận ngay mã
                ưu đãi giảm 10% cho đơn hàng tiếp theo.
              </p>
            </div>
          </div>
        </div>

        {/* Mini-Game Teaser Card */}
        <div className="border-secondary/30 bg-gradient-to-br from-muted to-background relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6">
          <div className="flex items-start gap-4">
            <div className="bg-secondary/10 border-secondary/30 flex size-12 shrink-0 items-center justify-center rounded-xl border">
              <Box className="text-secondary size-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-secondary text-[10px] font-bold uppercase tracking-wider">
                  Tương tác nhận quà
                </span>
                <span className="text-primary font-mono text-[10px] font-bold">REWARD CODES</span>
              </div>
              <h3 className="mb-1 mt-0.5 text-sm font-bold md:text-base">
                Chơi mini-game nhận thưởng
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Tích lũy từ 50 điểm trong game xếp khối 3D để đổi lấy mã giảm giá{' '}
                <strong className="text-primary font-mono">REWARD</strong> (tối đa 200.000₫).
              </p>
            </div>
          </div>
          {/* Existing gate preserved: the game CTA only unlocks for completed orders
              (server game session rules); design's "Chơi ngay" is omitted until then.
              Deviation (logged): "Thời gian áp dụng đến hết tháng" line omitted — the
              server reward coupon expiry is 14 days (config/rewards.ts). */}
          {order.status === 'completed' && (
            <div className="mt-4 flex justify-end border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={() => setGameOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors"
              >
                Chơi ngay
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== QUICK SUPPORT & COMMITMENT BOX ==================== */}
      <section className="bg-muted/40 border-border mb-4 rounded-2xl border p-6 md:p-8">
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
          {/* Col 1: Hotline (§5 settings-driven, hide-on-absent) */}
          {settings.hotline && (
            <div className="flex items-center gap-4">
              <div className="bg-muted border-border flex size-12 items-center justify-center rounded-xl border">
                <ShoppingBag className="text-primary size-5" />
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Hotline hỗ trợ đơn hàng</span>
                <p className="font-mono text-lg font-bold text-primary">{settings.hotline}</p>
                {settings.supportHours && (
                  <span className="text-muted-foreground text-[11px]">
                    Khung giờ: {settings.supportHours}
                  </span>
                )}
              </div>
            </div>
          )}
          {/* Col 2: Anti-Shock Packaging */}
          <div className="flex items-center gap-4 border-t border-border pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
            <div className="bg-muted border-border flex size-12 items-center justify-center rounded-xl border">
              <Package className="text-secondary size-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold">Đóng gói an toàn tuyệt đối</h4>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                Bao bọc chống sốc 3 lớp định hình chuyên biệt cho mô hình chi tiết nhỏ.
              </p>
            </div>
          </div>
          {/* Col 3: 1 to 1 Guarantee */}
          <div className="flex items-center gap-4 border-t border-border pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
            <div className="bg-muted border-border flex size-12 items-center justify-center rounded-xl border">
              <BadgeCheck className="text-success size-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold">Bảo hành vận chuyển 100%</h4>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                Cam kết 1 đổi 1 ngay lập tức nếu phát hiện nứt gãy trong quá trình giao nhận.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        {gameOpen && (
          <MiniGameModal open={gameOpen} onOpenChange={setGameOpen} orderId={order._id} />
        )}
      </Suspense>
    </div>
  )
}
