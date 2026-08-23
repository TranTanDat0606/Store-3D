import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Copy, Loader2, QrCode, RefreshCw, XCircle } from 'lucide-react'
import { orderApi, paymentApi, type QrPaymentInfo } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatCurrency, formatAccountNumber } from '@/lib'

type QrState = 'loading' | 'waiting' | 'paid' | 'expired' | 'failed'

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export default function QrPaymentPage() {
  const { id = '' } = useParams()
  const [state, setState] = useState<QrState>('loading')
  const [qr, setQr] = useState<QrPaymentInfo | null>(null)
  const [error, setError] = useState('')
  const [remainingMs, setRemainingMs] = useState(0)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const generate = useCallback(async () => {
    setState('loading')
    setError('')
    try {
      const info = await paymentApi.generateQr(id)
      setQr(info)
      setRemainingMs(new Date(info.expiresAt).getTime() - Date.now())
      setState('waiting')
    } catch (err) {
      setError(getErrorMessage(err))
      setState('failed')
    }
  }, [id])

  useEffect(() => {
    void generate()
    return stopPolling
  }, [generate, stopPolling])

  useEffect(() => {
    if (state !== 'waiting') return
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const order = await orderApi.getById(id)
        if (order.payment.status === 'paid') {
          stopPolling()
          setState('paid')
        }
      } catch {
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

  const copyCode = async () => {
    if (!qr) return
    try {
      await navigator.clipboard.writeText(qr.orderCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Không thể sao chép, vui lòng chép thủ công')
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-12 sm:px-6">
      <Link to="/san-pham" className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" />
        Tiếp tục mua sắm
      </Link>

      {state === 'loading' && (
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="text-primary size-10 animate-spin" />
          <p>Đang tạo mã thanh toán...</p>
        </div>
      )}

      {state === 'failed' && (
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <XCircle className="text-destructive mx-auto size-12" />
          <h1 className="mt-4 text-lg font-bold">Thanh toán thất bại</h1>
          <p className="text-muted-foreground mt-1 text-sm">{error || 'Không thể xác nhận giao dịch. Vui lòng thử lại.'}</p>
          <Button className="mt-6 w-full" onClick={() => void generate()}>
            Thử lại
          </Button>
        </div>
      )}

      {state === 'paid' && (
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
          <h1 className="mt-4 text-lg font-bold">Thanh toán thành công!</h1>
          <p className="text-muted-foreground mt-1 text-sm">Đơn hàng của bạn đã được xác nhận.</p>
          <div className="mt-6 grid gap-2">
            <Button asChild>
              <Link to="/tai-khoan/don-hang">Xem đơn hàng</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/san-pham">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </div>
      )}

      {state === 'expired' && (
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <XCircle className="text-destructive mx-auto size-12" />
          <h1 className="mt-4 text-lg font-bold">Mã QR đã hết hạn</h1>
          <p className="text-muted-foreground mt-1 text-sm">Mã QR đã hết hạn. Vui lòng tạo mã thanh toán mới.</p>
          <Button className="mt-6 w-full" onClick={() => void generate()}>
            <RefreshCw className="mr-2 size-4" />
            Tạo mã QR mới
          </Button>
        </div>
      )}

      {state === 'waiting' && qr && (
        <div className="w-full rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <QrCode className="size-5" />
            </div>
            <div>
              <h1 className="font-bold">Thanh toán chuyển khoản</h1>
              <p className="text-muted-foreground text-xs">TPBank – Tiên Phong Bank</p>
            </div>
          </div>

          <div
            className={`mx-auto w-fit rounded-xl border px-4 py-1.5 text-sm font-semibold tabular-nums ${
              remainingMs <= 60000
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-primary/30 bg-primary/5 text-primary'
            }`}
          >
            Mã QR sẽ hết hạn sau: {formatCountdown(remainingMs)}
          </div>

          <div className="my-5 flex justify-center">
            <div className="rounded-2xl border bg-white p-3">
              <img src={qr.qrUrl} alt="Mã thanh toán VietQR" className="size-56" />
            </div>
          </div>

          <p className="text-muted-foreground mb-4 text-center text-sm">Vui lòng quét mã QR và hoàn tất chuyển khoản.</p>

          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <BankRow label="Ngân hàng" value={qr.bank.bankName} />
            <BankRow label="Số tài khoản" value={formatAccountNumber(qr.bank.accountNumber)} />
            <BankRow label="Chủ tài khoản" value={qr.bank.accountDisplayName || qr.bank.accountName} />
            <BankRow label="Số tiền" value={formatCurrency(qr.amount)} />
            <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
              <span className="text-muted-foreground">Nội dung CK</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold">
                {qr.orderCode}
                <button onClick={() => void copyCode()} className="text-primary hover:text-primary/80" aria-label="Sao chép mã chuyển khoản">
                  <Copy className="size-4" />
                </button>
                {copied && <span className="text-emerald-600">Đã chép</span>}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="text-primary size-4" />
              Các bước thanh toán
            </p>
            <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-xs">
              <li>Quét mã QR bằng ứng dụng ngân hàng/phương thức thanh toán.</li>
              <li>Kiểm tra đúng ngân hàng, tài khoản và <span className="font-semibold text-foreground">số tiền {formatCurrency(qr.amount)}</span>.</li>
              <li>Xác nhận và hoàn tất chuyển khoản, giữ nguyên nội dung chuyển khoản.</li>
              <li>Chờ xác nhận thanh toán — đơn hàng sẽ được cập nhật tự động.</li>
            </ol>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Giữ nguyên nội dung chuyển khoản. Đơn hàng sẽ được xác nhận tự động sau khi ngân hàng báo giao dịch thành công.
          </p>
        </div>
      )}
    </div>
  )
}
