import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Copy,
  Gift,
  History,
  Info,
  Percent,
  Ticket,
} from 'lucide-react'
import { rewardApi } from '@/services/rewardApi'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatDate } from '@/lib'
import { toast } from 'sonner'
import type { UserCoupon } from '@/types'

/**
 * Plan 4 T8 — my-coupons → `.stitch/designs/account-coupons.html` (VN verbatim),
 * mounted inside the shared T7 account shell (sidebar/breadcrumb untouched).
 *
 * PRESERVED (logic untouched):
 *  - Data source: `GET /rewards/my-coupons` (same fetch effect, same error swallow).
 *  - Status derivation byte-identical to before: `usedAt` set → "Đã sử dụng";
 *    `expiresAt <= now` (and !usedAt) → "Hết hạn"; else available.
 *    Server truth (`models/UserCoupon.ts`): { user, code, discount (1–100, type
 *    'percent' only), orderId, source ('game' only), expiresAt, usedAt? }.
 *    Server has NO status enum + NO min-spend/scope/title fields → chips + copy are
 *    derived exactly from usedAt/expiresAt/source/discount; nothing invented.
 *  - Copy-to-clipboard: existing `navigator.clipboard` handler byte-for-byte
 *    (same toasts); button label per screen = "Sao chép mã".
 *
 * Screen-driven, honest behavior (logged deviations):
 *  - "Thêm mã giảm giá mới vào ví" input + "Áp dụng" OMITTED: `routes/coupon.ts`
 *    has no wallet-claim endpoint (`/coupons/apply` = checkout validation only;
 *    wallet coupons are only created by the mini-game reward) → the screen's fake
 *    `alert()` handler would be a lie.
 *  - Active ticket cards: tag "Quà tặng Mini-game" = real `source: 'game'`; title
 *    `Giảm N% cho đơn hàng` derived from `discount`; min-spend/scope lines
 *    ("Đơn tối thiểu từ 500.000₫", "Mã toàn sàn", "Tối đa 200.000₫") OMITTED —
 *    no server fields. Stub sub-line omitted for the same reason.
 *  - Status tabs filter the list (screen tabs are interactive). The combined muted
 *    heading "Mã đã sử dụng & Hết hạn (2)" is split per tab (verbatim tab labels
 *    + count) because the tabs filter; used/expired cards keep the screen's muted
 *    grid style, chips "Đã sử dụng"/"Hết hạn".
 *  - Used-card order lines ("Đã áp dụng cho đơn #ST3D-…", "Trạng thái đơn: Hoàn
 *    tất") OMITTED: `orderId` is a raw ObjectId and no order is fetched here;
 *    replaced with honest "Đã sử dụng ngày {usedAt}" (real field). Expired note
 *    "Hết hạn ngày {expiresAt}" mirrors the screen's pattern.
 *  - "Dùng ngay" → `/thanh-toan` (the only place a wallet code is applied; empty
 *    cart lands on checkout's own empty state; guests get the T1 login prompt).
 *  - Empty states: the screen defines none → the page's existing copy kept
 *    (hide-on-empty). Per-tab empty (list non-empty, tab empty) uses derived
 *    generic copy (logged).
 */

type TabKey = 'active' | 'used' | 'expired'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'active', label: 'Đang hiệu lực' },
  { key: 'used', label: 'Đã sử dụng' },
  { key: 'expired', label: 'Hết hạn' },
]

const TAB_EMPTY: Record<TabKey, { title: string; description: string }> = {
  active: { title: 'Không có mã đang hiệu lực', description: 'Hiện không có mã nào đang hiệu lực.' },
  used: { title: 'Chưa có mã đã sử dụng', description: 'Các mã bạn đã dùng sẽ hiển thị tại đây.' },
  expired: { title: 'Chưa có mã hết hạn', description: 'Các mã đã hết hạn sẽ hiển thị tại đây.' },
}

/** Active ticket card (screen "ticket stub" design). */
function VoucherTicket({
  coupon,
  onCopy,
}: {
  coupon: UserCoupon
  onCopy: (code: string) => void
}) {
  return (
    <article className="border-border bg-card hover:border-primary/50 flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all md:flex-row">
      {/* Left stub — percentage value */}
      <div className="border-border bg-muted/60 flex flex-col items-center justify-center gap-1 border-b border-dashed p-5 text-center md:w-48 md:border-r md:border-b-0">
        <span className="bg-primary/10 border-primary/30 text-primary flex size-10 items-center justify-center rounded-full border">
          <Percent className="size-5" />
        </span>
        <span className="text-primary font-mono text-2xl font-extrabold tracking-tight">
          GIẢM {coupon.discount}%
        </span>
        {/* Omitted (no server field — logged): scope sub-line ("Toàn bộ danh mục"). */}
      </div>

      {/* Right content */}
      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span
                className={cn(
                  'rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                  coupon.source === 'game'
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground'
                )}
              >
                {coupon.source === 'game' ? 'Quà tặng Mini-game' : 'Ưu đãi'}
              </span>
              <p className="text-foreground mt-1.5 text-base font-bold">
                Giảm {coupon.discount}% cho đơn hàng
              </p>
            </div>
            <span className="border-primary/30 bg-muted text-primary rounded border px-2.5 py-1 font-mono text-xs font-bold">
              {coupon.code}
            </span>
          </div>
          {/* Omitted (no server fields — logged): min-spend / scope description. */}
        </div>

        <div className="border-border/60 flex flex-col gap-3 border-t pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
            <Clock className="size-4" />
            <span>
              Hạn dùng: <strong className="text-foreground">{formatDate(coupon.expiresAt)}</strong>
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCopy(coupon.code)}
              className="border-border bg-muted hover:bg-muted-foreground/10 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-all"
            >
              <Copy className="size-3" />
              <span>Sao chép mã</span>
            </button>
            <Link
              to="/thanh-toan"
              className="bg-primary text-primary-foreground hover:brightness-110 inline-flex items-center gap-1 rounded-lg px-4 py-2 text-xs font-bold transition-all"
            >
              <span>Dùng ngay</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

/** Muted used/expired card (screen's low-emphasis grid). */
function MutedCouponCard({ coupon, kind }: { coupon: UserCoupon; kind: 'used' | 'expired' }) {
  const isUsed = kind === 'used'
  return (
    <article
      className={cn(
        'border-border bg-card flex flex-col justify-between rounded-xl border p-4',
        isUsed ? 'opacity-60' : 'opacity-50'
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground bg-muted line-through rounded px-2 py-0.5 font-mono text-xs font-bold">
            {coupon.code}
          </span>
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-semibold',
              isUsed
                ? 'border-border bg-muted text-muted-foreground border'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            )}
          >
            {isUsed ? 'Đã sử dụng' : 'Hết hạn'}
          </span>
        </div>
        <p className="text-foreground mt-2 text-sm font-bold">Giảm {coupon.discount}% cho đơn hàng</p>
        <p className="text-muted-foreground mt-1 line-through text-xs">
          {isUsed && coupon.usedAt
            ? `Đã sử dụng ngày ${formatDate(coupon.usedAt)}`
            : `Hết hạn ngày ${formatDate(coupon.expiresAt)}`}
        </p>
      </div>
      {/* Omitted (used — logged): order ref "Đã áp dụng cho đơn #…" + "Trạng thái
          đơn: Hoàn tất" (needs an order fetch; orderId is a raw id). */}
      {!isUsed && (
        <div className="text-muted-foreground border-border/60 mt-3 flex items-center gap-1 border-t pt-3 text-[11px]">
          <History className="size-3" />
          <span>Chương trình đã kết thúc</span>
        </div>
      )}
    </article>
  )
}

export default function CouponsPage() {
  useDocumentTitle('Mã giảm giá & Ưu đãi')
  const [coupons, setCoupons] = useState<UserCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('active')

  useEffect(() => {
    let cancelled = false
    rewardApi
      .myCoupons()
      .then((data) => {
        if (!cancelled && data) setCoupons(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success(`Đã sao chép mã: ${code}`)
    }).catch(() => {
      toast.error('Không thể sao chép mã')
    })
  }

  // PRESERVED: byte-identical status derivation from the pre-rebuild page.
  const available = coupons.filter((c) => !c.usedAt && new Date(c.expiresAt).getTime() > Date.now())
  const used = coupons.filter((c) => c.usedAt)
  const expired = coupons.filter((c) => !c.usedAt && new Date(c.expiresAt).getTime() <= Date.now())

  const counts: Record<TabKey, number> = {
    active: available.length,
    used: used.length,
    expired: expired.length,
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Mã giảm giá của tôi</h2>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  const activeList = tab === 'active' ? available : tab === 'used' ? used : expired

  return (
    <div className="flex flex-col gap-6">
      {/* ================= SECTION HEADER CARD ================= */}
      <div className="border-border bg-card relative overflow-hidden rounded-xl border p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="bg-primary/10 border-primary/30 text-primary flex size-8 items-center justify-center rounded-lg border">
                <Ticket className="size-4" />
              </span>
              <h1 className="text-foreground text-xl font-bold md:text-2xl">Mã giảm giá của tôi</h1>
            </div>
            <p className="text-muted-foreground text-xs md:text-sm">
              Quản lý và áp dụng mã ưu đãi cho các đơn hàng mô hình in 3D công nghệ cao (Resin 8K Ultra
              &amp; FDM Pro).
            </p>
          </div>
          <div className="border-border bg-muted flex items-center gap-2 self-start rounded-lg border px-3 py-1.5 md:self-auto">
            <BadgeCheck className="text-primary size-3.5" />
            <span className="text-foreground text-xs font-medium">
              Thanh toán an toàn qua COD &amp; VietQR
            </span>
          </div>
        </div>
        {/* Omitted (no wallet-claim endpoint — logged): "Thêm mã giảm giá mới vào ví"
            input + "Áp dụng" button (the screen's handler is a mock alert). */}
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="bg-primary/10 mb-4 flex size-16 items-center justify-center rounded-2xl">
              <Gift className="text-primary size-8" />
            </div>
            <p className="text-lg font-semibold">Chưa có mã giảm giá</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Hoàn thành đơn hàng và chơi mini game để nhận mã giảm giá!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ================= FILTER TABS ================= */}
          <div className="border-border flex items-center gap-2 overflow-x-auto border-b text-sm">
            {TABS.map((t) => {
              const isActive = tab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 transition-colors',
                    isActive
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{t.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 font-mono text-xs',
                      isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {counts[t.key]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ================= TAB PANE ================= */}
          {activeList.length === 0 ? (
            <div className="border-border bg-card rounded-xl border border-dashed px-6 py-10 text-center">
              <p className="text-foreground text-sm font-semibold">{TAB_EMPTY[tab].title}</p>
              <p className="text-muted-foreground mt-1 text-sm">{TAB_EMPTY[tab].description}</p>
            </div>
          ) : tab === 'active' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-foreground flex items-center gap-2 text-sm font-bold">
                  <span className="bg-primary size-2 rounded-full" />
                  <span>Mã giảm giá đang hiệu lực ({available.length})</span>
                </h2>
                <span className="text-muted-foreground text-xs">Cập nhật tự động theo giỏ hàng</span>
              </div>
              {available.map((coupon) => (
                <VoucherTicket key={coupon._id} coupon={coupon} onCopy={copyCode} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
                <History className="size-4" />
                <span>
                  {tab === 'used' ? 'Mã đã sử dụng' : 'Mã hết hạn'} ({activeList.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activeList.map((coupon) => (
                  <MutedCouponCard key={coupon._id} coupon={coupon} kind={tab === 'used' ? 'used' : 'expired'} />
                ))}
              </div>
            </div>
          )}

          {/* ================= POLICY BOX (screen copy verbatim) ================= */}
          <div className="border-primary/30 bg-card relative overflow-hidden rounded-xl border p-5">
            <div className="flex items-start gap-3">
              <span className="bg-primary/10 border-primary/30 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border">
                <Info className="size-4" />
              </span>
              <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <p className="text-foreground text-sm font-bold">
                  Quy định sử dụng voucher tại STORE 3D
                </p>
                <p>
                  • Mỗi đơn hàng chỉ áp dụng tối đa{' '}
                  <strong className="text-foreground">01 mã giảm giá</strong>. Voucher không có giá trị
                  quy đổi thành tiền mặt.
                </p>
                <p>
                  • Áp dụng song song với chính sách miễn phí vận chuyển cho các đơn hàng mô hình hợp lệ
                  toàn quốc.
                </p>
                <p>
                  • Phương thức thanh toán được áp dụng voucher:{' '}
                  <strong className="text-primary">COD (Thanh toán khi nhận hàng)</strong> hoặc quét mã
                  chuyển khoản tức thì qua <strong className="text-primary">VietQR</strong>.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
