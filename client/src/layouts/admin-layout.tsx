import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Box, ChevronLeft, Gamepad2, LayoutDashboard, LogOut, Menu, MessageCircleQuestion, Newspaper, Package, ShoppingCart, Star, Ticket, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { contactApi } from '@/services'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/logo'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/san-pham', label: 'Sản phẩm', icon: Package },
  { to: '/admin/danh-muc', label: 'Danh mục', icon: Box },
  { to: '/admin/don-hang', label: 'Đơn hàng', icon: ShoppingCart },
  { to: '/admin/ma-giam-gia', label: 'Mã giảm giá', icon: Ticket },
  { to: '/admin/danh-gia', label: 'Đánh giá', icon: Star },
  { to: '/admin/khach-hang', label: 'Khách hàng', icon: Users },
  { to: '/admin/bai-viet', label: 'Bài viết', icon: Newspaper },
  { to: '/admin/ho-tro', label: 'Hỗ trợ', icon: MessageCircleQuestion },
  { to: '/admin/mini-game', label: 'Mini Game', icon: Gamepad2 },
]

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Tổng quan',
  '/admin/san-pham': 'Sản phẩm',
  '/admin/danh-muc': 'Danh mục',
  '/admin/don-hang': 'Đơn hàng',
  '/admin/ma-giam-gia': 'Mã giảm giá',
  '/admin/danh-gia': 'Đánh giá',
  '/admin/khach-hang': 'Khách hàng',
  '/admin/bai-viet': 'Bài viết',
  '/admin/ho-tro': 'Hỗ trợ',
  '/admin/mini-game': 'Mini Game',
}

/** Shared nav-link class factory (desktop sidebar + mobile drawer stay identical). */
function navLinkClass(isActive: boolean) {
  return cn(
    'flex items-center gap-3 border-l-4 px-4 py-2.5 text-sm transition-colors duration-150',
    isActive
      ? 'rounded-r-lg border-sidebar-primary bg-sidebar-accent font-bold text-sidebar-primary'
      : 'rounded-lg border-transparent font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
  )
}

/** Shared sidebar body: brand slot (Logo mono), section label, nav, logout footer. */
function SidebarBody({ supportCount, onNavigate }: { supportCount: number; onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Brand slot — approved admin screens: mono logo + "Quản trị hệ thống" */}
        <div className="px-5 pb-5 pt-4">
          <Link to="/" onClick={onNavigate} className="flex flex-col gap-2">
            <Logo variant="mono" alt="" className="text-base" />
            <span className="text-xs font-medium text-muted-foreground">Quản trị hệ thống</span>
          </Link>
        </div>
        <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Thực đơn quản trị
        </p>
        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <link.icon className="size-4" />
              {link.label}
              {link.to === '/admin/ho-tro' && supportCount > 0 && (
                <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                  {supportCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      {/* Bottom actions — per approved screens: "Đăng xuất" */}
      <div className="border-t border-sidebar-border px-3 pt-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-colors duration-150 hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </button>
        <p className="truncate px-3 pb-1 pt-2 text-xs text-muted-foreground">{user?.fullname}</p>
      </div>
    </>
  )
}

export function AdminLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [supportCount, setSupportCount] = useState(0)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    contactApi.adminCountNew().then(setSupportCount).catch(() => {})
    const interval = setInterval(() => {
      contactApi.adminCountNew().then(setSupportCount).catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const title =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith('/admin/san-pham/') ? 'Chi tiết sản phẩm' : 'Quản trị')

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Radial glow background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Desktop sidebar — w-60 dark surface, gold active item (sidebar* tokens) */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar lg:flex">
          <SidebarBody supportCount={supportCount} />
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar — h-16, blurred surface, page title + admin user cluster */}
          <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/85 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground lg:hidden"
                  aria-label="Mở menu"
                >
                  <Menu className="size-5" />
                </button>
                <h1 className="text-lg font-bold text-foreground sm:text-xl">{title}</h1>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <Link to="/">
                    <ChevronLeft className="size-4" />
                    Về trang chủ
                  </Link>
                </Button>
                <div className="h-6 w-px bg-border" aria-hidden="true" />
                <div className="flex items-center gap-3">
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-bold leading-tight text-foreground">{user?.fullname}</p>
                    <p className="text-[11px] text-primary">Admin</p>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-secondary text-sm font-bold text-primary">
                    {(user?.fullname ?? 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile slide-out nav drawer */}
          {mobileNavOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm lg:hidden"
                onClick={() => setMobileNavOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar shadow-xl lg:hidden">
                <div className="flex items-center justify-between pl-5 pr-3 pt-4">
                  <span className="sr-only">Điều hướng quản trị</span>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="ml-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    aria-label="Đóng menu"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <SidebarBody supportCount={supportCount} onNavigate={() => setMobileNavOpen(false)} />
              </div>
            </>
          )}

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
