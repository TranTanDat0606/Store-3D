import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { Box, ChevronLeft, LayoutDashboard, Newspaper, Package, ShoppingCart, Star, Ticket, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
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
}

export function AdminLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const title =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith('/admin/san-pham/') ? 'Chi tiết sản phẩm' : 'Quản trị')

  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100">
      {/* Radial glow background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-slate-900/60 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3 px-5 py-5">
            <span className="bg-gradient-to-br from-cyan-400 to-blue-500 flex size-10 items-center justify-center rounded-xl shadow-lg shadow-cyan-500/20">
              <Box className="size-5 text-white" />
            </span>
            <div>
              <p className="font-bold leading-tight text-white">Store 3D</p>
              <p className="text-xs text-slate-400">Quản trị</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 shadow-inner'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  )
                }
              >
                <link.icon className="size-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="bg-gradient-to-br from-cyan-400 to-blue-500 flex size-9 items-center justify-center rounded-xl shadow-lg shadow-cyan-500/20 lg:hidden">
                  <Box className="size-5 text-white" />
                </span>
                <h1 className="text-lg font-bold text-white sm:text-xl">{title}</h1>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild className="text-slate-300 hover:bg-white/5 hover:text-white">
                  <Link to="/">
                    <ChevronLeft className="size-4" />
                    Về trang chủ
                  </Link>
                </Button>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-white">{user?.fullname}</p>
                  <p className="text-xs text-slate-400">Admin</p>
                </div>
              </div>
            </div>
            {/* Mobile nav */}
            <nav className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium',
                      isActive
                        ? 'border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300'
                        : 'border-white/10 text-slate-400 hover:border-white/20'
                    )
                  }
                >
                  <link.icon className="size-4" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
