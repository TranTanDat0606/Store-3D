import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Headphones,
  Info,
  Loader2,
  Lock,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  Shield,
  Timer,
  User,
  Wallet,
  XCircle,
} from 'lucide-react'
import { orderApi, paymentApi, type QrPaymentInfo } from '@/services'
import { getApiErrorInfo } from '@/lib/apiError'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { toast } from 'sonner'
import { cn, formatCurrency, formatAccountNumber, resolveImageUrl } from '@/lib'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import type { Order, OrderStatus } from '@/types'

/**
 * Plan 4 T6 — VietQR payment screen (`.stitch/designs/qr-payment.html`, VN verbatim).
 *
 * PRESERVED logic (survey §4, plan T6):
 * - `POST /orders/:id/payment-qr` on mount (`paymentApi.generateQr`) — the QR image
 *   is the server-built VietQR Quick Link (`qrUrl`, server-side `order.total`+`orderCode`).
 * - 3 s poll of `GET /orders/:id` while `waiting`; webhook-only paid detection.
 * - 1 s countdown from `qr.expiresAt`; expired ⇒ regenerate.
 *
 * Polling lifecycle (Review Focus #5): the interval lives ONLY in a ref, is cleared
 * in the effect cleanup (unmount / state change), stops on terminal states
 * (`paid` → success route, `cancelled` → cancelled state, 404 → not-found state)
 * and is never created twice (stopPolling() runs before every creation).
 */

type QrState = 'loading' | 'waiting' | 'paid' | 'expired' | 'failed' | 'not-found' | 'cancelled'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

function CopyButton({
  label,
  value,
  copied,
  onCopy,
  variant = 'default',
}: {
  label: string
  value: string
  copied: boolean
  onCopy: (value: string, label: string) => void
  variant?: 'default' | 'primary'
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(value, label)}
      aria-label={`Sao chép ${label}`}
      className={cn(
        /* AC9 touch target: ≥44×44 hit area; icon/text sizes untouched. */
        'flex shrink-0 min-w-11 min-h-11 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-95',
        variant === 'primary'
          ? 'border-transparent bg-primary font-bold text-primary-foreground shadow-md hover:bg-primary/90'
          : 'border-border bg-muted text-foreground hover:bg-muted/70'
      )}
    >
      <Copy className="size-3.5" />
      {copied ? 'Đã chép' : 'Sao chép'}
    </button>
  )
}

function TransferRow({
  label,
  value,
  action,
}: {
  label: string
  value: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 p-3">
      <div className="min-w-0 space-y-0.5">
        <div className="text-muted-foreground text-[11px]">{label}</div>
        <div className="truncate text-sm font-semibold">{value}</div>
      </div>
      {action}
    </div>
  )
}

export default function QrPaymentPage() {
  useDocumentTitle('Thanh toán QR')
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { settings } = usePublicSettings()
  const [state, setState] = useState<QrState>('loading')
  const [qr, setQr] = useState<QrPaymentInfo | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [remainingMs, setRemainingMs] = useState(0)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qrRequestedFor = useRef<string | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // One-shot order fetch for the summary column — same `GET /orders/:id` the
  // poll uses; the poll keeps it fresh and recovers a transient failure.
  const fetchOrder = useCallback(async () => {
    try {
      setOrder(await orderApi.getById(id))
    } catch {
      // transient — the 3 s poll recovers; 404 arrives via generateQr first
    }
  }, [id])

  const generate = useCallback(async () => {
    setState('loading')
    setError('')
    try {
      const info = await paymentApi.generateQr(id)
      setQr(info)
      setRemainingMs(new Date(info.expiresAt).getTime() - Date.now())
      setState('waiting')
      void fetchOrder()
    } catch (err) {
      const info = getApiErrorInfo(err)
      setError(info.message)
      setState(info.kind === 'not-found' ? 'not-found' : 'failed')
    }
  }, [id, fetchOrder])

  useEffect(() => {
    // exactly one POST /payment-qr per order (guards dev StrictMode double-mount)
    if (qrRequestedFor.current === id) return
    qrRequestedFor.current = id
    void generate()
    return stopPolling
  }, [generate, id, stopPolling])

  // 3 s poll — stops on unmount, on every state change and on terminal states.
  useEffect(() => {
    if (state !== 'waiting') return
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const fresh = await orderApi.getById(id)
        setOrder(fresh)
        if (fresh.payment.status === 'paid') {
          // webhook-only paid (C6) — never simulated client-side.
          stopPolling()
          setState('paid')
        } else if (fresh.status === 'cancelled') {
          stopPolling()
          setState('cancelled')
        }
      } catch (err) {
        const info = getApiErrorInfo(err)
        if (info.kind === 'not-found') {
          stopPolling()
          setError(info.message)
          setState('not-found')
        }
        // transient error — keep polling
      }
    }, 3000)
    return stopPolling
  }, [state, id, stopPolling])

  useEffect(() => {
    if (state !== 'waiting' || !qr) return
    const timer = setInterval(() => {
      const left = new Date(qr.expiresAt).getTime() - Date.now()
      setRemainingMs(left)
      if (left <= 0) {
        stopPolling()
        setState('expired')
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [state, qr, stopPolling])

  // Paid (webhook detected) → single completion surface = order-success page (decision #6).
  useEffect(() => {
    if (state !== 'paid') return
    navigate(`/thanh-toan-thanh-cong/${id}`, { replace: true })
  }, [state, id, navigate])

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(label)
      setTimeout(() => setCopiedField((prev) => (prev === label ? null : prev)), 1800)
    } catch {
      toast.error('Không thể sao chép, vui lòng chép thủ công')
    }
  }

  // "Tôi đã chuyển khoản" — immediate status recheck on the same poll endpoint.
  const recheck = async () => {
    setChecking(true)
    try {
      const fresh = await orderApi.getById(id)
      setOrder(fresh)
      if (fresh.payment.status === 'paid') {
        stopPolling()
        setState('paid')
      } else if (fresh.status === 'cancelled') {
        stopPolling()
        setState('cancelled')
      } else {
        toast('Chưa nhận được xác nhận thanh toán từ ngân hàng. Vui lòng chờ trong giây lát.')
      }
    } catch (err) {
      const info = getApiErrorInfo(err)
      if (info.kind === 'not-found') {
        stopPolling()
        setError(info.message)
        setState('not-found')
      } else {
        toast.error(info.message)
      }
    } finally {
      setChecking(false)
    }
  }

  const backLink = (
    <Link
      to="/tai-khoan/don-hang"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors md:text-sm"
    >
      <ArrowLeft className="size-4" />
      Quay lại đơn hàng
    </Link>
  )

  if (state === 'paid') return null

  if (state === 'loading') {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-12 sm:px-6">
        <Loader2 className="text-primary size-10 animate-spin" />
        <p className="text-muted-foreground">Đang tạo mã thanh toán...</p>
        <div className="mt-2 w-full space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (state === 'not-found') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        {backLink}
        <div className="mt-6">
          <EmptyState
            title="Không tìm thấy đơn hàng"
            description={error || 'Không tìm thấy dữ liệu'}
            icon={<Package className="size-7" />}
            action={
              <Button asChild>
                <Link to="/san-pham">Tiếp tục mua sắm</Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (state === 'failed') {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <XCircle className="text-destructive mx-auto size-12" />
          <h1 className="mt-4 text-lg font-bold">Thanh toán thất bại</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {error || 'Không thể xác nhận giao dịch. Vui lòng thử lại.'}
          </p>
          <Button className="mt-6 w-full" onClick={() => void generate()}>
            Thử lại
          </Button>
        </div>
        <div className="mt-6">{backLink}</div>
      </div>
    )
  }

  if (state === 'expired') {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <XCircle className="text-destructive mx-auto size-12" />
          <h1 className="mt-4 text-lg font-bold">Mã QR đã hết hạn</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Mã QR đã hết hạn. Vui lòng tạo mã thanh toán mới.
          </p>
          <Button className="mt-6 w-full" onClick={() => void generate()}>
            <RefreshCw className="mr-2 size-4" />
            Tạo mã QR mới
          </Button>
        </div>
        <div className="mt-6">{backLink}</div>
      </div>
    )
  }

  if (state === 'cancelled') {
    // Design gap (logged): no cancelled variant on `qr-payment.html` — honest
    // terminal copy instead of a waiting banner that would never resolve.
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <AlertTriangle className="text-destructive mx-auto size-12" />
          <h1 className="mt-4 text-lg font-bold">Đơn hàng đã bị hủy</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Đơn hàng của bạn đã bị hủy nên mã QR này không còn hiệu lực. Bạn không cần thanh toán
            nữa.
          </p>
          <Button className="mt-6 w-full" asChild>
            <Link to="/san-pham">Tiếp tục mua sắm</Link>
          </Button>
        </div>
        <div className="mt-6">{backLink}</div>
      </div>
    )
  }

  // ==================== waiting ====================
  const timerExpired = remainingMs <= 0
  const timerDanger = timerExpired || remainingMs < 120000

  return (
    <div className="min-h-[60vh]">
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-8">
        {backLink}
      </div>

      {/* ==================== 3-STEP PROGRESS STRIP (qr-payment.html) ==================== */}
      <section className="mt-3 border-b border-border bg-card/40 py-4">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Step 1: Hoàn tất */}
            <div className="flex items-center gap-3">
              <div className="border-secondary bg-secondary/10 text-secondary flex size-10 shrink-0 items-center justify-center rounded-full border">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <div className="text-secondary text-xs font-semibold uppercase tracking-wider">
                  Bước 1
                </div>
                <div className="text-foreground text-sm font-bold">Tạo đơn thành công</div>
              </div>
            </div>
            {/* Step 2: Active VietQR */}
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-full font-bold shadow-lg shadow-primary/10 ring-4 ring-primary/20 animate-pulse">
                2
              </div>
              <div>
                <div className="text-primary flex items-center gap-1 text-xs font-semibold uppercase tracking-wider">
                  <span>Bước 2</span>
                  <span className="bg-primary size-1.5 animate-ping rounded-full" />
                </div>
                <div className="text-primary text-sm font-bold">Chuyển khoản VietQR</div>
              </div>
            </div>
            {/* Step 3: Chờ xác nhận */}
            <div className="flex items-center gap-3 opacity-60">
              <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full border border-border font-bold">
                3
              </div>
              <div>
                <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Bước 3
                </div>
                <div className="text-muted-foreground text-sm font-medium">Xác nhận tự động</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AC9: `<section>`, not `<main>` — the site shell (layouts/main-layout.tsx)
          already owns the page's single `<main>`; a page-level `<main>` would nest
          landmarks. */}
      <section className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
        {/* ==================== LIVE STATUS NOTICE BANNER ==================== */}
        <section className="mb-8">
          {/* AC9: polite live region — announces status flips (paid/cancelled/expired)
              without stealing focus. */}
          <div
            role="status"
            className="flex flex-col items-center justify-between gap-4 rounded-xl border border-secondary/30 bg-muted/60 p-4 sm:flex-row"
          >
            <div className="flex items-center gap-3.5">
              <div className="bg-secondary/10 text-secondary flex size-8 shrink-0 items-center justify-center rounded-lg">
                <RefreshCw className="size-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span>Đang chờ ngân hàng xác nhận giao dịch…</span>
                  <span className="bg-secondary h-2 w-2 animate-pulse rounded-full" />
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Hệ thống tự động kích hoạt chế tác sau khi nhận tiền. Không cần chụp màn hình
                  biên lai.
                </p>
              </div>
            </div>
            <div className="border-border bg-background text-secondary shrink-0 rounded-lg border px-3 py-1.5 font-mono text-xs">
              ORDER LIFECYCLE: CHỜ XÁC NHẬN
            </div>
          </div>
        </section>

        {/* ==================== MAIN TWO COLUMN WORKSPACE ==================== */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: VietQR Payment Core (7 cols) */}
          <section className="space-y-6 lg:col-span-7">
            {qr && (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                {/* Card Header & Timer */}
                <div className="flex flex-col gap-4 border-b border-border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="flex items-center gap-2 text-lg font-bold md:text-xl">
                      <QrCode className="text-primary size-5" />
                      <span>Quét mã VietQR để thanh toán</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Mở ứng dụng ngân hàng hoặc ví điện tử để quét mã tự động điền nội dung
                    </p>
                  </div>
                  {/* Countdown Timer — AC9: the ticking value is `aria-hidden` so a
                      screen reader never reads every second; the sr-only `role="status"`
                      below announces only the minute change ("Còn lại X phút"), a
                      deliberate low-noise choice — status flips (paid/cancelled/expired)
                      are already announced by the banner's live region above. */}
                  <div className="border-primary/30 bg-background flex shrink-0 items-center gap-3 rounded-xl border px-4 py-2.5 shadow-inner">
                    <Timer
                      className={cn('text-primary size-4 animate-pulse', timerDanger && 'text-destructive')}
                    />
                    <div>
                      <div className="text-muted-foreground text-[10px] leading-none font-semibold uppercase">
                        Hiệu lực còn
                      </div>
                      <div
                        aria-hidden="true"
                        className={cn(
                          'mt-1 text-lg font-bold tracking-widest tabular-nums md:text-xl',
                          timerDanger ? 'text-destructive animate-pulse' : 'text-primary'
                        )}
                      >
                        {timerExpired ? 'HẾT HẠN' : formatCountdown(remainingMs)}
                      </div>
                    </div>
                  </div>
                  <span className="sr-only" role="status">
                    {timerExpired ? 'Mã QR đã hết hạn' : `Còn lại ${Math.ceil(remainingMs / 60000)} phút`}
                  </span>
                </div>

                {/* QR Presentation Area */}
                <div className="flex flex-col items-center justify-center border-b border-border bg-background/60 p-6 md:p-8">
                  <div className="flex w-full max-w-[280px] flex-col items-center rounded-2xl border-4 border-primary/80 bg-white p-5 shadow-2xl">
                    <div className="mb-3 flex w-full items-center justify-between px-1">
                      {/* AC9 scan-contrast exception (intentional): these slate/sky tones on
                          white paper are NOT muted-foreground drift — keep the hard contrast
                          so QR scanners read the label block; do not "fix" them in future
                          token sweeps. */}
                      <span className="text-xs font-black tracking-wider text-slate-800">
                        VietQR
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                        chuẩn VietQR
                      </span>
                    </div>
                    <img
                      src={qr.qrUrl}
                      alt="Mã thanh toán VietQR"
                      className="h-52 w-52"
                      decoding="async"
                    />
                    <div className="mt-3 flex items-center justify-center gap-1 text-center text-[11px] font-medium text-slate-600">
                      <Lock className="text-primary size-3" />
                      <span>Chuyển khoản VietQR tự động</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-4 flex items-center gap-1.5 text-center text-xs">
                    <Info className="text-primary size-4" />
                    <span>Quét mã trên bất kỳ ứng dụng Banking hỗ trợ chuẩn VietQR</span>
                  </p>
                </div>

                {/* Transfer Specifications with Copy Buttons */}
                <div className="space-y-3.5 bg-card p-6">
                  <h2 className="text-muted-foreground mb-2 text-xs font-bold uppercase tracking-wider">
                    Thông tin chuyển khoản thủ công
                  </h2>
                  <TransferRow
                    label="Ngân hàng thụ hưởng"
                    value={qr.bank.bankName}
                    action={
                      <span className="border-secondary/20 bg-secondary/10 text-secondary shrink-0 rounded border px-2 py-1 font-mono text-xs font-bold">
                        VIETQR
                      </span>
                    }
                  />
                  <TransferRow
                    label="Số tài khoản"
                    value={formatAccountNumber(qr.bank.accountNumber)}
                    action={
                      <CopyButton
                        label="số tài khoản"
                        value={qr.bank.accountNumber}
                        copied={copiedField === 'số tài khoản'}
                        onCopy={copyValue}
                      />
                    }
                  />
                  <TransferRow
                    label="Chủ tài khoản"
                    value={qr.bank.accountDisplayName || qr.bank.accountName}
                  />
                  <TransferRow
                    label="Số tiền thanh toán"
                    value={formatCurrency(qr.amount)}
                    action={
                      <CopyButton
                        label="số tiền"
                        value={String(qr.amount)}
                        copied={copiedField === 'số tiền'}
                        onCopy={copyValue}
                      />
                    }
                  />
                  {/* Highlighted transfer content */}
                  <div className="border-primary relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border-2 bg-primary/10 p-3.5">
                    <div className="min-w-0 space-y-1">
                      <div className="text-primary flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
                        <Info className="size-3" />
                        <span>Nội dung chuyển khoản (Bắt buộc chính xác)</span>
                      </div>
                      <div className="text-primary text-base font-extrabold tracking-wider break-all md:text-lg">
                        {qr.orderCode}
                      </div>
                    </div>
                    <CopyButton
                      label="nội dung chuyển khoản"
                      value={qr.orderCode}
                      copied={copiedField === 'nội dung chuyển khoản'}
                      onCopy={copyValue}
                      variant="primary"
                    />
                  </div>
                </div>

                {/* Hints & Warnings */}
                <div className="border-border bg-muted/20 space-y-2 border-t p-4 text-xs md:p-6">
                  <div className="text-muted-foreground flex items-start gap-2">
                    <CheckCircle2 className="text-secondary mt-0.5 size-4 shrink-0" />
                    <span>
                      Chuyển đúng số tiền và nội dung CK để hệ thống xác nhận tự động trong 30-60
                      giây.
                    </span>
                  </div>
                  <div className="text-muted-foreground/70 flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Đơn chuyển khoản dưới 1.000₫ sẽ tự động bị hủy theo quy chế ngân hàng.
                    </span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="border-border flex flex-col items-center gap-3 border-t bg-muted/30 p-6 sm:flex-row">
                  <Button size="lg" className="w-full sm:flex-1" onClick={() => void recheck()} disabled={checking}>
                    {checking ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        Tôi đã chuyển khoản
                      </>
                    )}
                  </Button>
                  {/* Deviation (logged): design shows "Hủy đơn hàng" here — the cancel
                      flow (dialog + reason) is owned by T7 account order screens; no
                      client cancel existed on this page before T6. */}
                </div>
              </div>
            )}

            {/* Support reminder card (§5: hotline/hours from settings, hide-on-absent) */}
            {settings.hotline && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Headphones className="text-primary size-5" />
                  <div className="text-xs">
                    <div className="font-bold">Cần trợ giúp với giao dịch VietQR?</div>
                    <div className="text-muted-foreground">
                      Hotline hỗ trợ kỹ thuật: {settings.hotline}
                      {settings.supportHours ? ` (${settings.supportHours})` : ''}
                    </div>
                  </div>
                </div>
                <a
                  href={`tel:${settings.hotline.replace(/\s/g, '')}`}
                  className="border-primary/40 text-primary hover:bg-primary/10 shrink-0 rounded-lg border px-3 py-1.5 font-mono text-xs font-bold"
                >
                  GỌI NGAY
                </a>
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: Sticky Order Summary (5 cols) */}
          <section className="space-y-6 lg:col-span-5 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl">
              {/* Summary Header */}
              <div className="border-border bg-muted/40 flex items-center justify-between border-b p-5">
                <div>
                  <span className="text-muted-foreground text-[11px] font-medium uppercase">
                    Chi tiết đơn hàng
                  </span>
                  <h2 className="mt-0.5 font-mono text-base font-bold">
                    {qr?.orderCode ?? order?.payment.orderCode ?? `#${id.slice(-8).toUpperCase()}`}
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                  <span className="bg-warning h-1.5 w-1.5 animate-ping rounded-full" />
                  {order ? STATUS_LABELS[order.status] : 'Chờ xác nhận'}
                </span>
              </div>

              {/* Product Item List */}
              {order ? (
                <div className="divide-y divide-border/60 p-5">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex items-start gap-3.5 py-3 first:pt-0">
                      <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-xl border">
                        <img
                          src={resolveImageUrl(item.image)}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-foreground line-clamp-2 text-xs font-semibold leading-tight md:text-sm">
                          {item.name}
                        </h3>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-muted-foreground font-mono text-xs">
                            SL: {item.quantity}
                          </span>
                          <span className="text-primary font-mono text-xs font-bold">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              )}

              {/* Calculation Breakdown — all values server-derived (§3) */}
              <div className="border-border space-y-2.5 border-t bg-muted/20 p-5 text-xs">
                <div className="text-muted-foreground flex justify-between">
                  <span>Tạm tính ({order ? order.items.length : '—'} sản phẩm)</span>
                  <span className="font-mono">{order ? formatCurrency(order.subtotal) : '—'}</span>
                </div>
                <div className="text-muted-foreground flex justify-between">
                  <span>Phí vận chuyển toàn quốc</span>
                  <span className="text-success font-semibold">
                    {!order
                      ? '—'
                      : order.shipping === 0
                        ? '0₫ (Miễn phí)'
                        : formatCurrency(order.shipping)}
                  </span>
                </div>
                <div className="text-muted-foreground flex justify-between">
                  <span>Giảm giá voucher</span>
                  <span className="font-mono">{order ? formatCurrency(order.discount) : '—'}</span>
                </div>
                <div className="border-border flex items-baseline justify-between border-t pt-3">
                  <span className="text-foreground block text-xs font-bold uppercase tracking-wider">
                    Tổng thanh toán
                  </span>
                  <span className="text-primary font-mono text-xl font-black md:text-2xl">
                    {order ? formatCurrency(order.total) : qr ? formatCurrency(qr.amount) : '—'}
                  </span>
                </div>
              </div>

              {/* Customer & Delivery Meta */}
              <div className="border-border space-y-3 border-t p-5 text-xs">
                <div className="flex items-start gap-2.5">
                  <User className="text-muted-foreground mt-0.5 size-4" />
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {order ? `${order.customer.name} · ${order.customer.phone}` : ''}
                    </div>
                    <div className="text-muted-foreground">Khách hàng</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="text-muted-foreground mt-0.5 size-4" />
                  <div className="min-w-0">
                    <div className="leading-relaxed">{order?.customer.address}</div>
                    <div className="text-secondary mt-0.5 text-[11px]">
                      Giao hàng tiêu chuẩn chống sốc chuyên dụng
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Wallet className="text-muted-foreground mt-0.5 size-4" />
                  <div className="min-w-0">
                    <div className="font-medium">Phương thức: Chuyển khoản VietQR tự động</div>
                    <div className="text-muted-foreground/70 text-[11px]">
                      Cổng thanh toán liên ngân hàng tự động
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality Guarantee Note */}
              <div className="border-border bg-muted/30 flex items-start gap-2.5 border-t p-4">
                <Shield className="text-primary mt-0.5 size-4 shrink-0" />
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Mô hình được đúc và sấy UV sau khi xác nhận thanh toán · Bảo hành chi tiết sắc
                  nét khi nhận hàng.
                </p>
              </div>
            </div>

            {/* Safe Checkout Assurance Box */}
            <div className="bg-background flex items-center gap-3 rounded-xl border border-border p-4">
              <Shield className="text-secondary size-6" />
              <div className="text-xs">
                <span className="font-semibold">Quy trình thanh toán an toàn</span>
                <p className="text-muted-foreground text-[11px]">
                  Giao dịch đối soát thời gian thực qua hệ thống ngân hàng.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
