import { Badge } from '@/components/ui/badge'
import type { OrderStatus, PaymentStatus } from '@/types'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  confirmed: 'bg-accent/15 text-accent',
  shipping: 'bg-accent/15 text-accent',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-destructive/15 text-destructive',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
  pending_payment: 'Chờ thanh toán',
}

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  paid: 'border-transparent bg-success/15 text-success',
  unpaid: 'border-transparent bg-muted text-foreground',
  pending_payment: 'border-transparent bg-warning/15 text-warning',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={`border-transparent ${STATUS_STYLES[status] ?? ''}`}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className={PAYMENT_STYLES[status] ?? ''}>
      {PAYMENT_LABELS[status] ?? status}
    </Badge>
  )
}
