import { Link, useNavigate, useLocation } from 'react-router-dom'
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

function SearchSuggestions({ products, query, onSelect }: { products: Product[]; query: string; onSelect: () => void }) {
  return (
    <div>
      <ul className="max-h-96 overflow-y-auto">
        {products.map((p) => (
          <li key={p._id}>
            <Link
              to={`/san-pham/${p.slug}`}
              onClick={onSelect}
              className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-accent"
            >
              <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {p.images[0] ? (
                  <img
                    src={resolveImageUrl(p.images[0])}
                    alt={p.name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageOff className="text-muted-foreground size-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
              </div>
              <span className="text-primary shrink-0 text-sm font-semibold tabular-nums">
                {formatCurrency(p.salePrice)}
              </span>
            </Link>
          </li>
        ))}
        {products.length === 0 && (
          <li className="text-muted-foreground px-3 py-6 text-center text-sm">Không tìm thấy sản phẩm phù hợp</li>
        )}
      </ul>
      <div className="border-t">
        <Link
          to={`/san-pham?search=${encodeURIComponent(query)}`}
          onClick={onSelect}
          className="hover:bg-accent text-primary flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-medium"
        >
          Xem tất cả kết quả cho “{query}”
        </Link>
      </div>
    </div>
  )
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { totalItems, openCart } = useCart()
  const { products: wishlist } = useWishlist()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { pathname, search: locationSearch } = useLocation()

  const isActive = (path: string, exact = false) => {
    if (exact) return pathname === path
    return pathname === path || pathname.startsWith(path + '/')
  }

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
      productApi.list({ search: debouncedSearch.trim(), limit: 8 }).then(({ data }) => {
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
          <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/', true) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Trang chủ
          </Link>
          <Link to="/san-pham" className={`text-sm font-medium transition-colors ${isActive('/san-pham', true) && !locationSearch.includes('featured') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Sản phẩm
          </Link>
          <Link to="/san-pham?featured=true" className={`text-sm font-medium transition-colors ${isActive('/san-pham') && locationSearch.includes('featured') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Nổi bật
          </Link>
          <Link to="/tin-tuc" className={`text-sm font-medium transition-colors ${isActive('/tin-tuc') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Tin tức
          </Link>
          <Link to="/lien-he" className={`text-sm font-medium transition-colors ${isActive('/lien-he', true) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Liên hệ
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
          {search.trim() && (
            <div className="absolute top-full right-0 mt-2 w-[min(26rem,90vw)] overflow-hidden rounded-xl border bg-popover shadow-lg">
              <SearchSuggestions
                products={searchResults}
                query={search.trim()}
                onSelect={() => {
                  setSearch('')
                  setSearchResults([])
                }}
              />
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
            {search.trim() && (
              <div className="mt-2 overflow-hidden rounded-xl border bg-popover shadow-lg">
                <SearchSuggestions
                products={searchResults}
                query={search.trim()}
                onSelect={() => {
                  setSearch('')
                  setSearchResults([])
                }}
              />
              </div>
            )}
          </form>
          <nav className="flex flex-col gap-2">
            <Link to="/" className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/', true) ? 'bg-accent text-primary' : 'hover:bg-accent'}`}>
              Trang chủ
            </Link>
            <Link to="/san-pham" className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/san-pham', true) && !locationSearch.includes('featured') ? 'bg-accent text-primary' : 'hover:bg-accent'}`}>
              Sản phẩm
            </Link>
            <Link to="/san-pham?featured=true" className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/san-pham') && locationSearch.includes('featured') ? 'bg-accent text-primary' : 'hover:bg-accent'}`}>
              Nổi bật
            </Link>
            <Link to="/tin-tuc" className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/tin-tuc') ? 'bg-accent text-primary' : 'hover:bg-accent'}`}>
              Tin tức
            </Link>
            <Link to="/lien-he" className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/lien-he', true) ? 'bg-accent text-primary' : 'hover:bg-accent'}`}>
              Liên hệ
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
