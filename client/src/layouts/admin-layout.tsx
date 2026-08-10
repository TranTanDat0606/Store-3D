import { NavLink, Outlet, Link } from 'react-router-dom'
import { Box, ChevronLeft, LayoutDashboard, Package, ShoppingCart, Star, Ticket, Users } from 'lucide-react'
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
]

export function AdminLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
              <Box className="size-5" />
            </span>
            <div>
              <p className="font-bold leading-tight">Store 3D</p>
              <p className="text-muted-foreground text-xs leading-tight">Quản trị</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ChevronLeft className="size-4" />
                Về trang chủ
              </Link>
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium">{user?.fullname}</p>
              <p className="text-muted-foreground text-xs">Admin</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-8 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <link.icon className="size-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <nav className="scrollbar-none -mx-4 mb-2 flex gap-2 overflow-x-auto px-4 lg:hidden">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:border-primary/50'
                )
              }
            >
              <link.icon className="size-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
