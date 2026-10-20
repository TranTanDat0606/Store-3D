import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  Hand,
  Heart,
  Mail,
  Package,
  Phone,
  QrCode,
  Ticket,
  User,
} from 'lucide-react'
import { orderApi, rewardApi } from '@/services'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, resolveImageUrl } from '@/lib'
import { orderCodeOf, paymentMethodLabel, PAYMENT_LABELS, StatusChip } from './account-chips'
import type { Order } from '@/types'

/**
 * Plan 4 T7 — account dashboard → `.stitch/designs/account-dashboard.html` (VN verbatim).
 *
 * REAL data only — widget inventory:
 *  - Welcome banner: greeting + user email/phone from AuthContext.
 *  - Stat 1 "Đơn hàng chưa xử lý" (pending + confirmed) & Stat 2 "Đã hoàn tất" (completed):
 *    counted client-side from ONE full `GET /orders/mine` page — the server's /mine
 *    endpoint ignores `status` (orderService.ts listForUser filters `{user}` only), so
 *    per-status cards are OMITTED when the account has >100 orders (incomplete data).
 *  - Stat 3 "Mã giảm giá khả dụng": `GET /rewards/my-coupons`, same available rule as
 *    coupons-page (`!usedAt && expiresAt > now`). Design sub-line "Giảm tới 20%…" omitted
 *    (fabricated discount claim → zero-fabrication mandate).
 *  - Recent orders: `GET /orders/mine` (server totals only, §3).
 *  - Quick links: wishlist (WishlistContext) + coupons (available count) + profile.
 * Omitted widgets (no API source — logged): points box ("Điểm tích lũy") lives in the
 * shell too, member "ID: ST3D-…" line, "Tài khoản đã xác thực" chip (no email-verification
 * system), "Đặt in theo yêu cầu" CTA (no custom-order flow), timeline step timestamps.
 */

const FULL_FETCH_LIMIT = 100

export default function AccountDashboardPage() {
  useDocumentTitle('Tài khoản — Tổng quan')
  const { user } = useAuth()
  const { products: wishlist } = useWishlist()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersTotal, setOrdersTotal] = useState<number | null>(null)
  const [counts, setCounts] = useState<{ pending: number; confirmed: number; completed: number } | null>(null)
  const [couponCount, setCouponCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    orderApi
      .mine({ limit: FULL_FETCH_LIMIT })
      .then((res) => {
        if (cancelled) return
        setOrders(res.data)
        setOrdersTotal(res.pagination.total)
        // Counts are honest only when the fetch covered every order.
        if (res.data.length >= res.pagination.total) {
          setCounts({
            pending: res.data.filter((o) => o.status === 'pending').length,
            confirmed: res.data.filter((o) => o.status === 'confirmed').length,
            completed: res.data.filter((o) => o.status === 'completed').length,
          })
        } else {
          setCounts(null)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    rewardApi
      .myCoupons()
      .then((list) => {
        if (cancelled) return
        setCouponCount(list.filter((c) => !c.usedAt && new Date(c.expiresAt).getTime() > Date.now()).length)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const recent = orders.slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      {/* ================= WELCOME BANNER ================= */}
      <div className="border-border bg-card relative overflow-hidden rounded-xl border p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <h1 className="text-foreground truncate text-xl font-bold tracking-tight md:text-2xl">
                Xin chào, {user?.fullname}
              </h1>
              <Hand className="text-primary size-5 shrink-0" aria-hidden />
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Chào mừng bạn trở lại với không gian sưu tầm nghệ thuật in 3D tại{' '}
              <strong className="text-primary font-medium">STORE 3D</strong>. Dưới đây là hiện trạng đơn
              hàng và tài khoản của bạn.
            </p>
            <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              {user?.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="text-muted-foreground size-3.5" aria-hidden />
                  {user.email}
                </span>
              )}
              {user?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="text-muted-foreground size-3.5" aria-hidden />
                  <span className="font-mono">{user.phone}</span>
                </span>
              )}
              {/* Omitted (no API source): "Tài khoản đã xác thực" chip — no email-verification system. */}
            </div>
          </div>
          {/* Omitted (no flow exists): "Đặt in theo yêu cầu" CTA. */}
        </div>
      </div>

      {/* ================= 3 STAT CARDS (real counts only) ================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {counts && (
          <>
            <div className="border-primary/40 bg-card rounded-xl border p-4 transition-colors hover:border-primary">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">Đơn hàng chưa xử lý</span>
                <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                  <Clock className="size-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-primary font-mono text-3xl font-black">
                  {String(counts.pending + counts.confirmed).padStart(2, '0')}
                </div>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  {counts.pending} Chờ xác nhận, {counts.confirmed} Đã xác nhận
                </p>
              </div>
            </div>
            <div className="border-accent/40 bg-card rounded-xl border p-4 transition-colors hover:border-accent">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">Đã hoàn tất</span>
                <div className="bg-accent/10 text-accent flex size-8 items-center justify-center rounded-lg">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-accent font-mono text-3xl font-black">
                  {String(counts.completed).padStart(2, '0')}
                </div>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  {counts.completed} đơn hàng bàn giao hoàn mỹ
                </p>
              </div>
            </div>
          </>
        )}
        <div className="border-border bg-card rounded-xl border p-4 transition-colors hover:border-outline">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Mã giảm giá khả dụng</span>
            <div className="bg-muted text-primary flex size-8 items-center justify-center rounded-lg">
              <Ticket className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-foreground font-mono text-3xl font-black">
              {couponCount === null ? '—' : String(couponCount).padStart(2, '0')}
            </div>
            {/* Omitted (fabricated claim): "Giảm tới 20% cho mô hình Resin 8K". */}
          </div>
        </div>
      </div>

      {/* ================= RECENT ORDERS ================= */}
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <div className="border-border/60 flex flex-wrap items-center justify-between gap-2 border-b p-5">
          <div>
            <h2 className="text-foreground text-base font-bold">Đơn hàng gần nhất</h2>
            <p className="text-muted-foreground text-xs">
              Quy trình: Chờ xác nhận → Đã xác nhận → Đang giao → Hoàn tất
            </p>
          </div>
          <Link
            to="/tai-khoan/don-hang"
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-semibold underline-offset-4 hover:underline"
          >
            {ordersTotal !== null ? `Xem tất cả ${ordersTotal} đơn hàng` : 'Xem tất cả đơn hàng'}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center text-sm">
            Bạn chưa có đơn hàng nào.{' '}
            <Link to="/san-pham" className="text-primary hover:underline">
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {recent.map((order) => {
              const qty = order.items.reduce((s, i) => s + i.quantity, 0)
              const first = order.items[0]
              return (
                <div key={order._id} className="hover:bg-muted/40 p-4 transition-colors sm:p-5">
                  <div className="mb-3 flex flex-col gap-2 border-b border-border/40 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-primary font-mono text-sm font-bold tracking-wider">
                        {orderCodeOf(order)}
                      </span>
                      <span className="text-border text-xs">•</span>
                      <span className="text-muted-foreground text-xs">Ngày đặt: {formatDate(order.createdAt)}</span>
                    </div>
                    <StatusChip status={order.status} />
                  </div>
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                        {first ? (
                          <img
                            src={resolveImageUrl(first.image)}
                            alt={first.name}
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover"
                          />
                        ) : (
                          <Package className="text-primary size-6" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-foreground truncate text-sm font-semibold leading-snug">
                          {order.items.map((i) => i.name).join(', ')}
                        </h3>
                        <p className="text-muted-foreground mt-0.5 text-xs">Số lượng: {qty} sản phẩm</p>
                        <p className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-1 text-xs">
                          {order.payment.method === 'bank-transfer' ? (
                            <QrCode className="text-secondary size-3.5" aria-hidden />
                          ) : (
                            <Banknote className="text-secondary size-3.5" aria-hidden />
                          )}
                          Thanh toán:{' '}
                          <strong className="text-foreground font-medium">
                            {paymentMethodLabel(order.payment.method)}
                          </strong>{' '}
                          ({PAYMENT_LABELS[order.payment.status]})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t pt-3 md:flex-col md:items-end md:justify-center md:border-t-0 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className="text-muted-foreground text-[11px]">
                          {order.shipping === 0 ? 'Miễn phí ship 0₫' : `Phí vận chuyển ${formatCurrency(order.shipping)}`}
                        </p>
                        <p className="text-primary font-mono text-base font-black">{formatCurrency(order.total)}</p>
                      </div>
                      <Link
                        to={`/tai-khoan/don-hang/${order._id}`}
                        className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ================= QUICK LINKS BENTO ================= */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          to="/tai-khoan/yeu-thich"
          className="border-border bg-card hover:border-primary/50 group flex flex-col justify-between rounded-xl border p-5 transition-all"
        >
          <div>
            <div className="bg-muted text-primary group-hover:scale-105 mb-3 flex size-10 items-center justify-center rounded-lg transition-transform">
              <Heart className="size-5" />
            </div>
            <h3 className="text-foreground group-hover:text-primary text-sm font-bold transition-colors">
              Sản phẩm yêu thích ({wishlist.length})
            </h3>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Khám phá các mẫu figurine đang theo dõi và nhận thông báo khi có hàng đợt mới.
            </p>
          </div>
          <div className="text-primary mt-4 flex items-center text-xs font-semibold">
            Quản lý danh sách
            <ArrowRight className="group-hover:translate-x-1 ml-1 size-3.5 transition-transform" aria-hidden />
          </div>
        </Link>

        <Link
          to="/tai-khoan/ma-giam-gia"
          className="border-border bg-card hover:border-primary/50 group flex flex-col justify-between rounded-xl border p-5 transition-all"
        >
          <div>
            <div className="bg-muted text-primary group-hover:scale-105 mb-3 flex size-10 items-center justify-center rounded-lg transition-transform">
              <Ticket className="size-5" />
            </div>
            <h3 className="text-foreground group-hover:text-primary text-sm font-bold transition-colors">
              Mã giảm giá{couponCount !== null ? ` (${couponCount})` : ''}
            </h3>
            {/* Deviation (logged): design copy cites specific voucher codes (STORE3D100K / SALE10)
                which don't exist in data → honest generic copy instead. */}
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Xem các mã giảm giá đang có trong ví và áp dụng ngay tại giỏ hàng.
            </p>
          </div>
          <div className="text-primary mt-4 flex items-center text-xs font-semibold">
            Xem ví voucher
            <ArrowRight className="group-hover:translate-x-1 ml-1 size-3.5 transition-transform" aria-hidden />
          </div>
        </Link>

        <Link
          to="/tai-khoan/ho-so"
          className="border-border bg-card hover:border-primary/50 group flex flex-col justify-between rounded-xl border p-5 transition-all"
        >
          <div>
            <div className="bg-muted text-accent group-hover:scale-105 mb-3 flex size-10 items-center justify-center rounded-lg transition-transform">
              <User className="size-5" />
            </div>
            <h3 className="text-foreground group-hover:text-primary text-sm font-bold transition-colors">
              Cập nhật hồ sơ
            </h3>
            {/* Deviation (logged): design copy mentions an address book ("sổ địa chỉ") which
                decision #7 removed → honest copy. */}
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Quản lý thông tin tài khoản và địa chỉ giao nhận của bạn.
            </p>
          </div>
          <div className="text-primary mt-4 flex items-center text-xs font-semibold">
            Chỉnh sửa ngay
            <ArrowRight className="group-hover:translate-x-1 ml-1 size-3.5 transition-transform" aria-hidden />
          </div>
        </Link>
      </div>
    </div>
  )
}
