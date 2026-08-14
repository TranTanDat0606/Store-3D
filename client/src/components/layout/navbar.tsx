import { Link, useNavigate } from 'react-router-dom'
import {
  Box,
  Search,
  ShoppingBag,
  Heart,
  Moon,
  Sun,
  LogOut,
  User,
  Menu,
  LayoutDashboard,
  Package,
  X,
  ImageOff,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/hooks/useDebounce'
import { useEffect } from 'react'
import type { Product } from '@/types'
import { formatCurrency, resolveImageUrl } from '@/lib'

function SearchSuggestions({ products }: { products: Product[] }) {
  if (products.length === 0) return null
  return (
    <div className="flex gap-2 overflow-x-auto p-3">
      {products.map((p) => (
        <Link
          key={p._id}
          to={`/san-pham/${p.slug}`}
          className="flex w-24 shrink-0 flex-col items-center gap-2 rounded-lg p-2 text-center transition-colors hover:bg-accent"
        >
          <div className="bg-muted flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg">
            {p.images[0] ? (
              <img
                src={resolveImageUrl(p.images[0])}
                alt={p.name}
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <ImageOff className="text-muted-foreground size-6" />
            )}
          </div>
          <span className="line-clamp-2 text-xs font-medium">{p.name}</span>
          <span className="text-primary text-xs font-semibold">{formatCurrency(p.salePrice)}</span>
        </Link>
      ))}
    </div>
  )
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { totalItems, openCart } = useCart()
  const { products: wishlist } = useWishlist()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([])
      return
    }
    let cancelled = false
    void import('@/services/productApi').then(({ productApi }) =>
      productApi.list({ search: debouncedSearch.trim(), limit: 5 }).then(({ data }) => {
        if (!cancelled) setSearchResults(data)
      })
    )
    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/san-pham?search=${encodeURIComponent(search.trim())}`)
      setSearchResults([])
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navLink =
    'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Mở menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
            <Box className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Store<span className="text-primary">3D</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex lg:ml-4">
          <Link to="/" className={navLink}>
            Trang chủ
          </Link>
          <Link to="/san-pham" className={navLink}>
            Sản phẩm
          </Link>
          <Link to="/san-pham?featured=true" className={navLink}>
            Nổi bật
          </Link>
        </nav>

        <form onSubmit={submitSearch} className="relative ml-auto hidden w-full max-w-xs sm:block md:max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="bg-muted/50 pl-9 pr-4"
            onBlur={() => setTimeout(() => setSearchResults([]), 200)}
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full right-0 left-0 mt-2 overflow-hidden rounded-xl border bg-popover shadow-lg">
              <SearchSuggestions products={searchResults} />
            </div>
          )}
        </form>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Đổi giao diện">
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          <Link to={isAuthenticated ? '/tai-khoan/yeu-thich' : '/dang-nhap'} className="relative">
            <Button variant="ghost" size="icon" aria-label="Danh sách yêu thích">
              <Heart className="size-5" />
            </Button>
            {isAuthenticated && wishlist.length > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 size-5 justify-center rounded-full p-0 text-xs">
                {wishlist.length}
              </Badge>
            )}
          </Link>

          <Button variant="ghost" size="icon" onClick={openCart} aria-label="Giỏ hàng" className="relative">
            <ShoppingBag className="size-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 size-5 justify-center rounded-full p-0 text-xs">
                {totalItems}
              </Badge>
            )}
          </Button>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-1 overflow-hidden rounded-full">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullname} className="size-8 rounded-full object-cover" />
                  ) : (
                    <User className="size-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="truncate text-sm font-medium">{user.fullname}</p>
                  <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === 'admin' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <LayoutDashboard className="size-4" />
                      Quản trị
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate('/tai-khoan')}>
                  <User className="size-4" />
                  Tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/tai-khoan/don-hang')}>
                  <Package className="size-4" />
                  Đơn hàng
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut className="size-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" className="ml-1" onClick={() => navigate('/dang-nhap')}>
              Đăng nhập
            </Button>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background px-4 py-4 md:hidden">
          <form onSubmit={submitSearch} className="relative mb-3">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="bg-muted/50 pl-9"
              onBlur={() => setTimeout(() => setSearchResults([]), 200)}
            />
            {searchResults.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-xl border bg-popover shadow-lg">
                <SearchSuggestions products={searchResults} />
              </div>
            )}
          </form>
          <nav className="flex flex-col gap-2">
            <Link to="/" className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium">
              Trang chủ
            </Link>
            <Link to="/san-pham" className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium">
              Sản phẩm
            </Link>
            <Link to="/san-pham?featured=true" className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium">
              Nổi bật
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
