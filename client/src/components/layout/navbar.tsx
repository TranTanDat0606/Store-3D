import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  Search,
  ShoppingBag,
  Heart,
  LogOut,
  User,
  Menu,
  LayoutDashboard,
  Package,
  X,
  ImageOff,
  ChevronDown,
  Ticket,
  Home,
  Box,
  LayoutGrid,
  Newspaper,
  Phone,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDebounce } from '@/hooks/useDebounce'
import type { Product, Category } from '@/types'
import { formatCurrency, resolveImageUrl } from '@/lib'
import { Logo } from '@/components/brand/logo'
import { categoryApi } from '@/services/productApi'

const ORBITRON = { fontFamily: "'Orbitron', sans-serif" }

function SearchSuggestions({ products, query, onSelect }: { products: Product[]; query: string; onSelect: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
        <span className="text-primary flex min-w-0 items-center gap-1.5 text-xs font-semibold">
          <Search className="size-3.5 shrink-0" />
          <span className="truncate">Sản phẩm gợi ý cho “{query}”</span>
        </span>
        <span className="text-muted-foreground shrink-0 text-[11px]">{products.length} gợi ý</span>
      </div>
      <ul className="max-h-96 overflow-y-auto p-2">
        {products.map((p) => (
          <li key={p._id}>
            <Link
              to={`/san-pham/${p.slug}`}
              onClick={onSelect}
              className="group flex items-center gap-3 rounded-lg border border-transparent bg-secondary/60 p-2 transition-all hover:border-primary/40 hover:bg-secondary"
            >
              <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60">
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
                <p className="group-hover:text-primary line-clamp-2 text-sm font-semibold transition-colors">{p.name}</p>
              </div>
              <span className="text-primary shrink-0 text-sm font-bold tabular-nums">
                {formatCurrency(p.salePrice)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-border/60 p-2">
        <Link
          to={`/san-pham?search=${encodeURIComponent(query)}`}
          onClick={onSelect}
          className="bg-secondary text-primary hover:bg-primary hover:text-primary-foreground flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-center text-xs font-bold transition-colors"
        >
          Xem tất cả kết quả tìm kiếm cho “{query}”
        </Link>
      </div>
    </div>
  )
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { totalItems, openCart } = useCart()
  const { products: wishlist } = useWishlist()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const isActive = (path: string, exact = false) => {
    if (exact) return pathname === path
    return pathname === path || pathname.startsWith(path + '/')
  }

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const debouncedSearch = useDebounce(search, 300)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const desktopSearchRef = useRef<HTMLInputElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const wasMobileOpen = useRef(false)

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

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    const hasSearch = search.trim().length > 0
    if (hasSearch) {
      params.set('search', search.trim())
      params.set('page', '1')
    } else {
      params.delete('search')
      params.delete('page')
    }
    setSearchParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // Dynamic category source (per approved design: "Danh mục (dropdown, lấy từ DB)").
  useEffect(() => {
    let cancelled = false
    categoryApi
      .all()
      .then((data) => {
        if (!cancelled) setCategories(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Design Section B: search focus trigger "input.focus() or Ctrl+K".
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        desktopSearchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      setSearchResults([])
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const closeMobile = () => setMobileOpen(false)

  // AC9: mobile drawer a11y — Escape closes, focus moves in, body scroll locked.
  // Cleanup runs on close AND unmount, so navigation-close also restores state.
  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    drawerRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [mobileOpen])

  // AC9: return focus to the hamburger when the drawer closes (not on initial mount).
  useEffect(() => {
    if (mobileOpen) {
      wasMobileOpen.current = true
    } else if (wasMobileOpen.current) {
      wasMobileOpen.current = false
      hamburgerRef.current?.focus()
    }
  }, [mobileOpen])

  const desktopLinkClass = (active: boolean) =>
    `border-b-2 pb-1 text-base transition-colors duration-200 ${
      active
        ? 'border-primary font-bold text-primary'
        : 'border-transparent font-medium text-muted-foreground hover:text-foreground'
    }`

  const mobileLinkClass = (active: boolean) =>
    `flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
      active
        ? 'border-primary/30 bg-primary/10 font-bold text-primary'
        : 'border-transparent font-medium text-foreground hover:bg-secondary'
    }`

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-3 md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-secondary! hover:text-primary! min-h-11 min-w-11 xl:hidden"
            ref={hamburgerRef}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Logo variant="mark" alt="" className="size-8 sm:size-9" />
            <span className="flex flex-col gap-1">
              <span className="text-primary text-lg leading-tight font-black tracking-widest sm:text-xl" style={ORBITRON}>
                STORE 3D
              </span>
              <span className="text-muted-foreground hidden text-[10px] font-medium tracking-wider uppercase lg:block">
                Mô hình in 3D Resin 8K &amp; FDM
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 xl:flex">
            <Link to="/" className={desktopLinkClass(isActive('/', true))}>
              Trang chủ
            </Link>
            <Link to="/san-pham" className={desktopLinkClass(isActive('/san-pham', true))}>
              Sản phẩm
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={
                    desktopLinkClass(searchParams.has('categorySlug')) +
                    ' flex cursor-pointer items-center gap-1 bg-transparent'
                  }
                >
                  Danh mục
                  <ChevronDown className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 rounded-xl border-border bg-popover p-2 shadow-2xl">
                <Link
                  to="/san-pham"
                  className="text-primary hover:bg-secondary flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold"
                >
                  Tất cả danh mục
                  <span aria-hidden="true">→</span>
                </Link>
                <div className="bg-border -mx-1 my-1 h-px" />
                {categories.map((cat) => (
                  <DropdownMenuItem key={cat._id} asChild className="cursor-pointer rounded-lg hover:bg-secondary">
                    <Link
                      to={`/san-pham?categorySlug=${cat.slug}`}
                      className="flex w-full flex-col items-start gap-0.5 py-1.5"
                    >
                      <span className="text-foreground text-sm font-semibold">{cat.name}</span>
                      {cat.description && (
                        <span className="text-muted-foreground line-clamp-1 text-xs">{cat.description}</span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/tin-tuc" className={desktopLinkClass(isActive('/tin-tuc'))}>
              Tin tức
            </Link>
            <Link to="/lien-he" className={desktopLinkClass(isActive('/lien-he', true))}>
              Liên hệ
            </Link>
          </nav>

          <form onSubmit={submitSearch} className="relative ml-auto hidden w-64 md:block xl:w-72">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              ref={desktopSearchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm mô hình, Resin 8K, FDM..."
              aria-label="Tìm kiếm sản phẩm"
              className="rounded-lg border-border bg-secondary/80 py-2 pr-12 pl-9 text-sm focus-visible:border-primary"
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => { setShowSuggestions(false); setSearchResults([]) }, 200)}
            />
            <kbd className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] md:block">
              Ctrl+K
            </kbd>
            {showSuggestions && search.trim() && (
              <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                <SearchSuggestions
                  products={searchResults}
                  query={search.trim()}
                  onSelect={() => { setShowSuggestions(false); setSearchResults([]) }}
                />
              </div>
            )}
          </form>

          <div className="flex items-center gap-1">
            <Link
              to={isAuthenticated ? '/tai-khoan/yeu-thich' : '/dang-nhap'}
              aria-label="Danh sách yêu thích"
              title="Yêu thích"
              className="text-muted-foreground hover:bg-secondary! hover:text-primary! active:scale-95 relative flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors xl:min-h-9 xl:min-w-9"
            >
              <Heart className="size-5" />
              {isAuthenticated && wishlist.length > 0 && (
                <span className="border-primary bg-secondary text-primary absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full border px-0.5 text-[10px] leading-none font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={openCart}
              aria-label="Giỏ hàng"
              title="Giỏ hàng"
              className="text-muted-foreground relative hover:bg-secondary! hover:text-primary! active:scale-95 min-h-11 min-w-11 xl:min-h-9 xl:min-w-9"
            >
              <ShoppingBag className="size-5" />
              {totalItems > 0 && (
                <span className="bg-primary text-primary-foreground absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] leading-none font-bold">
                  {totalItems}
                </span>
              )}
            </Button>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hover:bg-secondary! hover:text-foreground! ml-1 flex items-center gap-2 rounded-full border-2 border-primary bg-secondary pr-3 pl-1 max-sm:gap-0 max-sm:pr-1.5 shadow-[0_0_12px_color-mix(in_srgb,var(--ring)_30%,transparent)]"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullname}
                        loading="lazy"
                        decoding="async"
                        className="size-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full">
                        <User className="size-4" />
                      </span>
                    )}
                    <span className="hidden text-left sm:block">
                      <span className="text-foreground block max-w-32 truncate text-xs leading-tight font-bold">
                        {user.fullname}
                      </span>
                      <span className="text-primary block text-[10px] leading-tight font-semibold">
                        {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                      </span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl border-border bg-popover p-3 shadow-2xl">
                  <div className="bg-secondary/80 border-border/60 flex items-center gap-3 rounded-lg border p-3">
                    <div className="border-primary size-12 shrink-0 overflow-hidden rounded-full border-2">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.fullname}
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="bg-muted text-muted-foreground flex size-full items-center justify-center">
                          <User className="size-5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{user.fullname}</p>
                      <p className="text-muted-foreground truncate text-[11px]">{user.email}</p>
                      <p className="text-primary mt-1 text-[11px] font-semibold">
                        {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng thành viên'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-2" />
                  <ul className="mt-1 space-y-1 text-xs">
                    {user.role === 'admin' && (
                      <li>
                        <DropdownMenuItem
                          onClick={() => navigate('/admin')}
                          className="text-foreground hover:bg-secondary focus:bg-secondary focus:text-foreground! cursor-pointer rounded-lg px-2.5 py-2 font-semibold"
                        >
                          <LayoutDashboard className="text-muted-foreground size-4" />
                          Trang Quản trị
                        </DropdownMenuItem>
                      </li>
                    )}
                    <li>
                      <DropdownMenuItem
                        onClick={() => navigate('/tai-khoan')}
                        className="text-foreground hover:bg-secondary focus:bg-secondary focus:text-foreground! cursor-pointer rounded-lg px-2.5 py-2"
                      >
                        <User className="text-muted-foreground size-4" />
                        Tài khoản của tôi
                      </DropdownMenuItem>
                    </li>
                    <li>
                      <DropdownMenuItem
                        onClick={() => navigate('/tai-khoan/don-hang')}
                        className="text-foreground hover:bg-secondary focus:bg-secondary focus:text-foreground! cursor-pointer rounded-lg px-2.5 py-2"
                      >
                        <Package className="text-muted-foreground size-4" />
                        Đơn hàng của tôi
                      </DropdownMenuItem>
                    </li>
                    <li>
                      <DropdownMenuItem
                        onClick={() => navigate('/tai-khoan/ma-giam-gia')}
                        className="text-foreground hover:bg-secondary focus:bg-secondary focus:text-foreground! cursor-pointer rounded-lg px-2.5 py-2"
                      >
                        <Ticket className="text-muted-foreground size-4" />
                        Kho Voucher &amp; Ưu đãi
                      </DropdownMenuItem>
                    </li>
                    <li>
                      <DropdownMenuItem
                        onClick={() => navigate('/tai-khoan/yeu-thich')}
                        className="text-foreground hover:bg-secondary focus:bg-secondary focus:text-foreground! flex items-center justify-between rounded-lg px-2.5 py-2"
                      >
                        <span className="flex items-center gap-2">
                          <Heart className="text-muted-foreground size-4" />
                          Sản phẩm yêu thích
                        </span>
                        {wishlist.length > 0 && (
                          <span className="text-muted-foreground text-[11px]">{wishlist.length} món</span>
                        )}
                      </DropdownMenuItem>
                    </li>
                  </ul>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                    className="hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive! text-destructive cursor-pointer rounded-lg px-2.5 py-2 text-xs font-semibold"
                  >
                    <LogOut className="size-4" />
                    Đăng xuất khỏi tài khoản
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                onClick={() => navigate('/dang-nhap')}
                className="ml-1 h-9 max-sm:hidden rounded-lg border border-primary/70 bg-transparent px-4 font-semibold text-primary hover:bg-primary! hover:text-primary-foreground! active:scale-95"
              >
                <User className="size-4" />
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <div
            className="bg-background/60 absolute inset-0 backdrop-blur-sm"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
            ref={drawerRef}
            tabIndex={-1}
            className="border-border bg-card absolute inset-y-0 left-0 flex w-[88%] max-w-[340px] flex-col overflow-y-auto border-r p-5 shadow-2xl focus:outline-none"
          >
            <div className="border-border/60 flex items-center justify-between border-b pb-4">
              <Link to="/" onClick={closeMobile} className="flex items-center gap-2">
                <Logo variant="mark" alt="" className="size-7" />
                <span className="text-primary text-lg font-black tracking-wider" style={ORBITRON}>
                  STORE 3D
                </span>
              </Link>
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Đóng menu"
                className="bg-secondary text-muted-foreground hover:text-foreground flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={submitSearch} className="relative mt-4">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mô hình..."
                aria-label="Tìm kiếm sản phẩm"
                className="rounded-lg border-border bg-secondary/80 py-2.5 pl-9 text-sm focus-visible:border-primary"
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => { setShowSuggestions(false); setSearchResults([]) }, 200)}
              />
              {showSuggestions && search.trim() && (
                <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                  <SearchSuggestions
                    products={searchResults}
                    query={search.trim()}
                    onSelect={() => { setShowSuggestions(false); setSearchResults([]) }}
                  />
                </div>
              )}
            </form>

            <nav className="mt-5 flex flex-col gap-2">
              <Link to="/" onClick={closeMobile} className={mobileLinkClass(isActive('/', true))}>
                <span className="flex items-center gap-2.5">
                  <Home className={isActive('/', true) ? 'size-4' : 'text-muted-foreground size-4'} />
                  Trang chủ
                </span>
                {isActive('/', true) && <span className="bg-primary size-1.5 rounded-full" />}
              </Link>
              <Link to="/san-pham" onClick={closeMobile} className={mobileLinkClass(isActive('/san-pham', true))}>
                <span className="flex items-center gap-2.5">
                  <Box className={isActive('/san-pham', true) ? 'size-4' : 'text-muted-foreground size-4'} />
                  Sản phẩm
                </span>
                {isActive('/san-pham', true) && <span className="bg-primary size-1.5 rounded-full" />}
              </Link>
              {categories.length > 0 && (
                <div className="border-border/40 bg-secondary/40 rounded-xl border p-2.5">
                  <p className="text-primary border-border/40 flex items-center gap-2.5 border-b pb-2 text-sm font-semibold">
                    <LayoutGrid className="size-4" />
                    Danh mục
                  </p>
                  <div className="flex flex-col pl-4 pt-2 text-xs">
                    {categories.map((cat) => (
                      <Link
                        key={cat._id}
                        to={`/san-pham?categorySlug=${cat.slug}`}
                        onClick={closeMobile}
                        className="text-muted-foreground hover:text-primary py-1 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <Link to="/tin-tuc" onClick={closeMobile} className={mobileLinkClass(isActive('/tin-tuc'))}>
                <span className="flex items-center gap-2.5">
                  <Newspaper className={isActive('/tin-tuc') ? 'size-4' : 'text-muted-foreground size-4'} />
                  Tin tức
                </span>
                {isActive('/tin-tuc') && <span className="bg-primary size-1.5 rounded-full" />}
              </Link>
              <Link to="/lien-he" onClick={closeMobile} className={mobileLinkClass(isActive('/lien-he', true))}>
                <span className="flex items-center gap-2.5">
                  <Phone className={isActive('/lien-he', true) ? 'size-4' : 'text-muted-foreground size-4'} />
                  Liên hệ
                </span>
                {isActive('/lien-he', true) && <span className="bg-primary size-1.5 rounded-full" />}
              </Link>
            </nav>

            <div className="mt-auto border-border/60 pt-4">
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    closeMobile()
                    navigate('/dang-nhap')
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-colors"
                >
                  <User className="size-4" />
                  Đăng nhập / Đăng ký
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
