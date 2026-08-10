import { NavLink, Outlet } from 'react-router-dom'
import { Heart, LayoutDashboard, Package, Settings, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const links = [
  { to: '/tai-khoan', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/tai-khoan/don-hang', label: 'Đơn hàng của tôi', icon: Package },
  { to: '/tai-khoan/yeu-thich', label: 'Yêu thích', icon: Heart },
  { to: '/tai-khoan/ho-so', label: 'Hồ sơ', icon: User },
  { to: '/tai-khoan/mat-khau', label: 'Đổi mật khẩu', icon: Settings },
]

export function AccountLayout() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Tài khoản</h1>
        <p className="text-muted-foreground mt-1">
          Xin chào, <span className="font-medium text-foreground">{user?.fullname}</span>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <nav className="flex flex-col gap-1 lg:sticky lg:top-24">
            {links.map((link) => (
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

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
