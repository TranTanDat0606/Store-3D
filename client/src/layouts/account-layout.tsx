import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ChevronRight,
  Headset,
  Heart,
  LayoutDashboard,
  Lock,
  LogOut,
  Package,
  Ticket,
  User,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import { orderApi, rewardApi } from '@/services'
import { cn, resolveImageUrl } from '@/lib'

/**
 * Plan 4 T7 — shared account shell (design `account-orders.html` / `account-profile.html`
 * sidebar + breadcrumb; `account-dashboard.html` uses the same shell with a 4/8 column
 * split — the orders/profile 4 (xl:3) / 8 (xl:9) split is used as the shared variant).
 *
 * The 3 screens' sidebars disagree on labels/order; ONE set is used (logged deviation):
 *   Tổng quan tài khoản / Đơn hàng của tôi / Mã giảm giá & Ưu đãi / Sản phẩm yêu thích /
 *   Hồ sơ cá nhân / Đổi mật khẩu & Bảo mật / Đăng xuất
 * — orders-screen wording, "Hồ sơ cá nhân" (profile screen's own active label) because
 * decision #7 removed the address book (no `/sổ địa chỉ` screen exists).
 *
 * Nav badges = REAL counts only: orders total (`GET /orders/mine` pagination.total),
 * available coupons (`GET /rewards/my-coupons`, same available rule as coupons-page),
 * wishlist length (WishlistContext). Badge hidden when 0 / on fetch failure.
 *
 * §5 settings-driven: the support box renders only when `settings.hotline` is present;
 * hours row only when `settings.supportHours` is present (hide-on-absent).
 *
 * Omitted from design (no API source — logged): loyalty points box ("Điểm tích lũy"),
 * member ID line ("ID: ST3D-88291").
 *
 * T8 pages (wishlist/coupons) mount through the same `<Outlet />` untouched.
 */

const navItems = [
  { to: '/tai-khoan', label: 'Tổng quan tài khoản', icon: LayoutDashboard, end: true },
  { to: '/tai-khoan/don-hang', label: 'Đơn hàng của tôi', icon: Package, badge: 'orders' as const },
  { to: '/tai-khoan/ma-giam-gia', label: 'Mã giảm giá & Ưu đãi', icon: Ticket, badge: 'coupons' as const },
  { to: '/tai-khoan/yeu-thich', label: 'Sản phẩm yêu thích', icon: Heart, badge: 'wishlist' as const },
  { to: '/tai-khoan/ho-so', label: 'Hồ sơ cá nhân', icon: User },
  { to: '/tai-khoan/mat-khau', label: 'Đổi mật khẩu & Bảo mật', icon: Lock },
]

// Breadcrumb labels, longest prefix first so `/tai-khoan/don-hang/:id` resolves to the list.
const breadcrumbLabels: Array<[string, string]> = [
  ['/tai-khoan/don-hang', 'Đơn hàng của tôi'],
  ['/tai-khoan/yeu-thich', 'Sản phẩm yêu thích'],
  ['/tai-khoan/ma-giam-gia', 'Mã giảm giá & Ưu đãi'],
  ['/tai-khoan/ho-so', 'Hồ sơ cá nhân'],
  ['/tai-khoan/mat-khau', 'Đổi mật khẩu & Bảo mật'],
  ['/tai-khoan', 'Tổng quan tài khoản'],
]

function currentBreadcrumb(pathname: string): string {
  const hit = breadcrumbLabels.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return hit?.[1] ?? 'Tài khoản của tôi'
}

export function AccountLayout() {
  const { user, logout } = useAuth()
  const { products: wishlist } = useWishlist()
  const { settings } = usePublicSettings()
  const { pathname } = useLocation()
  const [ordersCount, setOrdersCount] = useState<number | null>(null)
  const [couponsCount, setCouponsCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    orderApi
      .mine({ limit: 1 })
      .then((r) => {
        if (!cancelled) setOrdersCount(r.pagination.total)
      })
      .catch(() => {})
    rewardApi
      .myCoupons()
      .then((list) => {
        if (cancelled) return
        const available = list.filter(
          (c) => !c.usedAt && new Date(c.expiresAt).getTime() > Date.now()
        )
        setCouponsCount(available.length)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const badges: Record<'orders' | 'coupons' | 'wishlist', number | null> = {
    orders: ordersCount,
    coupons: couponsCount,
    wishlist: wishlist.length,
  }

  const roleLabel = user?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'
  const initial = user?.fullname?.trim().charAt(0)?.toUpperCase() ?? '?'

  return (
    <div className="w-full">
      {/* ================= BREADCRUMB ================= */}
      <section className="border-border/60 bg-muted/40 w-full border-b">
        <nav
          aria-label="Đường dẫn trang"
          className="text-muted-foreground mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-3 text-xs md:px-8"
        >
          <Link to="/" className="hover:text-primary flex items-center gap-1 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="size-3" />
          <Link to="/tai-khoan" className="hover:text-primary transition-colors">
            Tài khoản của tôi
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-primary font-medium">{currentBreadcrumb(pathname)}</span>
        </nav>
      </section>

      {/* ================= MAIN ACCOUNT SHELL ================= */}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-8 px-4 py-6 md:px-8 lg:grid-cols-12">
        {/* ---------- LEFT SIDEBAR ---------- */}
        <aside className="flex flex-col gap-5 lg:col-span-4 xl:col-span-3">
          {/* Profile identity card (real user data only) */}
          <div className="border-border bg-card relative overflow-hidden rounded-xl border p-5">
            <div className="flex items-center gap-3.5">
              <div className="border-primary/60 relative size-14 shrink-0 overflow-hidden rounded-full border-2">
                {user?.avatar ? (
                  <img
                    src={resolveImageUrl(user.avatar)}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="bg-muted text-primary flex size-full items-center justify-center text-lg font-bold">
                    {initial}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="text-foreground truncate text-sm font-bold">{user?.fullname}</h3>
                  <span className="border-primary/40 bg-primary/10 text-primary rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                    {roleLabel}
                  </span>
                </div>
                <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
              </div>
            </div>
            {/* Omitted (no API source): "Điểm tích lũy" points box + "ID: ST3D-…" member ID line. */}
          </div>

          {/* Navigation menu (labels verbatim per design) */}
          <nav className="border-border bg-card rounded-xl border p-3">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const count = item.badge ? badges[item.badge] : null
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-11 items-center justify-between gap-2 rounded-lg border-l-4 px-3.5 py-3 text-sm font-medium transition-colors',
                        isActive
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                      )
                    }
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {count !== null && count > 0 ? (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-bold',
                          'bg-muted text-foreground'
                        )}
                      >
                        {count}
                      </span>
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 opacity-40" />
                    )}
                  </NavLink>
                )
              })}
            </div>
            <div className="mt-1 border-t border-border/60 pt-2">
              <button
                type="button"
                onClick={() => void logout()}
                className="text-destructive hover:bg-destructive/10 flex min-h-11 w-full items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-colors"
              >
                <LogOut className="size-4" />
                Đăng xuất
              </button>
            </div>
          </nav>

          {/* Support box — §5 settings-driven hide-on-absent (hotline gate) */}
          {settings.hotline && (
            <div className="border-border bg-card rounded-xl border p-5">
              <div className="text-secondary flex items-center gap-2 text-xs font-semibold tracking-wider">
                <Headset className="size-4" />
                HỖ TRỢ KỸ THUẬT IN 3D
              </div>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                Tư vấn vật liệu in <span className="text-foreground font-medium">Resin 8K, PLA, PETG</span> và
                scale tỷ lệ mô hình kiến trúc, figurine.
              </p>
              <div className="border-border bg-muted mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5">
                <div>
                  <p className="text-muted-foreground text-[10px]">
                    {settings.supportHours ? `Hotline (${settings.supportHours})` : 'Hotline'}
                  </p>
                  <p className="text-primary font-mono text-xs font-bold">{settings.hotline}</p>
                </div>
                <Link
                  to="/lien-he"
                  className="border-border bg-muted-foreground/10 hover:bg-primary hover:text-primary-foreground rounded-lg border px-3 py-2 text-xs font-medium text-foreground transition-colors"
                >
                  Cần hỗ trợ in 3D riêng?
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* ---------- RIGHT CONTENT ---------- (`<div>`, not `<main>`: the site
            shell in main-layout.tsx already owns the page's single `<main>`) */}
        <div className="min-w-0 lg:col-span-8 xl:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
