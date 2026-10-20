import { cn } from '@/lib'
import type { Order, OrderStatus, PaymentStatus } from '@/types'

/**
 * Plan 4 T7 — status/payment chips shared by the account pages
 * (dashboard / orders / order-detail) so one mapping is used everywhere.
 *
 * PRESERVED LOGIC: STATUS_LABELS is byte-identical to the app-wide status enum
 * mapping in `components/order/order-status-badge.tsx` — only the visual style
 * changed (design `account-orders.html` pill look, tokens only).
 */

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export const STATUS_CHIP_STYLES: Record<OrderStatus, string> = {
  pending: 'border-warning/30 bg-warning/10 text-warning',
  confirmed: 'border-accent/30 bg-accent/10 text-accent',
  shipping: 'border-accent/30 bg-accent/10 text-accent',
  completed: 'border-success/30 bg-success/10 text-success',
  cancelled: 'border-destructive/30 bg-destructive/10 text-destructive',
}

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
  pending_payment: 'Chờ thanh toán',
}

export const PAYMENT_CHIP_STYLES: Record<PaymentStatus, string> = {
  paid: 'border-success/30 bg-success/10 text-success',
  unpaid: 'border-border bg-muted text-muted-foreground',
  pending_payment: 'border-warning/30 bg-warning/10 text-warning',
}

export function StatusChip({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        STATUS_CHIP_STYLES[status] ?? 'border-border bg-muted text-muted-foreground'
      )}
    >
      {status === 'pending' && <span className="bg-warning h-1.5 w-1.5 animate-ping rounded-full" />}
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function PaymentChip({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        PAYMENT_CHIP_STYLES[status] ?? 'border-border bg-muted text-muted-foreground'
      )}
    >
      {PAYMENT_LABELS[status] ?? status}
    </span>
  )
}

/** Payment display name used by the design copy ("Thanh toán: COD / VietQR"). */
export function paymentMethodLabel(method: Order['payment']['method']): string {
  return method === 'cash' ? 'COD' : 'VietQR'
}

/** Real order code: server QR orderCode when present, else the existing id-derived fallback. */
export function orderCodeOf(order: Order): string {
  return order.payment.orderCode ?? `#${order._id.slice(-8).toUpperCase()}`
}
