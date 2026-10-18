import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Factory, Heart, ShieldCheck, Tag } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { cn } from '@/lib/utils'
import showcaseImg from '@/assets/auth-showcase-dragon.jpg'

/**
 * Shared split-layout shell for the auth pages — rebuilt 1:1 from the approved
 * Stitch screen `.stitch/designs/login.html` (+ .png). Left = brand panel,
 * right = tab switcher + form slot. Plan 4 T2.
 *
 * Deviations (logged per planner decision #7 / task scope):
 * - The screen ships as a standalone focused viewport (own mini-header
 *   "Quay lại trang chủ" + copyright footer); here the pages render inside
 *   MainLayout (Navbar + Footer), so that chrome is not duplicated.
 * - Screen brand mark = placeholder Material icon in a box; we map it to the
 *   approved Plan-2 vector `<Logo variant="lockup" />` (subline reads
 *   "High-End 3D Collectibles" per logo-system, screen shows "High-End
 *   Collectibles Vietnam" — approved logo component wins, no copy invented).
 * - Showcase image = exact design asset downloaded from the screen's source
 *   URL (client/src/assets/auth-showcase-dragon.jpg, byte-identical 25 423 B).
 * - No forgot/reset-password or social links: screen shows none, server has
 *   no reset endpoint (survey §1.14 + decision #7).
 */

/** Orbitron accents only (Latin/numeric) — per design system; Vietnamese stays in Be Vietnam Pro. */
export const AUTH_ORBITRON = { fontFamily: "'Orbitron', sans-serif" }

export type AuthTab = 'login' | 'register'

/** Member perk cards from the approved screen (VN copy verbatim). */
const PERKS = [
  {
    icon: Tag,
    title: 'Thành viên nhận mã giảm giá riêng',
    desc: 'Ưu đãi độc quyền lên đến 20% cho mỗi bộ sưu tập giới hạn.',
  },
  {
    icon: Factory,
    title: 'Theo dõi đơn hàng mọi lúc',
    desc: 'Cập nhật tiến độ in 3D thời gian thực từ khâu cắt lớp đến hoàn thiện sơn thủ công.',
  },
  {
    icon: Heart,
    title: 'Lưu danh sách yêu thích',
    desc: 'Đồng bộ bộ sưu tập mô hình mong muốn trên mọi thiết bị.',
  },
] as const

/** Screen tab switcher — separate routes instead of the screen's in-page JS tabs. */
function AuthTabSwitcher({ active }: { active: AuthTab }) {
  const tabClass = (isActive: boolean) =>
    cn(
      'flex-1 rounded-md py-2.5 text-center text-sm transition-all duration-200',
      isActive
        ? 'bg-primary text-primary-foreground font-bold shadow-[0_0_25px] shadow-primary/35'
        : 'text-muted-foreground hover:text-foreground font-medium hover:bg-muted/60'
    )

  return (
    <div className="border-border/45 bg-card mb-8 flex w-full rounded-lg border p-1">
      <Link to="/dang-nhap" aria-current={active === 'login' ? 'page' : undefined} className={tabClass(active === 'login')}>
        Đăng nhập
      </Link>
      <Link to="/dang-ky" aria-current={active === 'register' ? 'page' : undefined} className={tabClass(active === 'register')}>
        Đăng ký
      </Link>
    </div>
  )
}

/** Icon-prefixed input wrapper per screen (focus ring lives on the wrapper). */
export function AuthInputWrap({
  icon: Icon,
  className,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'border-input/60 focus-within:border-primary focus-within:ring-primary/40 relative rounded-lg border bg-input/30 transition-all focus-within:ring-1',
        className
      )}
    >
      <div className="text-muted-foreground/70 pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        <Icon className="size-4" />
      </div>
      {children}
    </div>
  )
}

/** Screen password visibility toggle — button + aria-pressed per a11y requirement. */
export function PasswordToggle({
  pressed,
  onToggle,
  ariaLabel,
}: {
  pressed: boolean
  onToggle: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center rounded-md pr-3.5 transition-colors focus-visible:ring-ring/70 focus-visible:outline-none focus-visible:ring-2"
    >
      {pressed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )
}

/** Input class shared by both auth forms (wrapper provides padding + focus state). */
export const authInputClass =
  'h-11 border-0 bg-transparent shadow-none pl-10 focus-visible:border-0 focus-visible:ring-0 md:text-sm'

export function AuthShell({ active, children }: { active: AuthTab; children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <div className="border-border/45 bg-card relative overflow-hidden rounded-xl shadow-2xl">
        {/* Ambient Obsidian Gold decor (token-based, per screen) */}
        <div className="bg-primary/10 pointer-events-none absolute -top-32 -left-32 size-80 rounded-full blur-3xl" />
        <div className="bg-accent/15 pointer-events-none absolute -right-32 -bottom-32 size-80 rounded-full blur-3xl" />

        <div className="relative grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT PANEL: brand, slogan, showcase figurine, member perks */}
          <div className="border-border/30 bg-card flex flex-col justify-between gap-8 border-b p-8 md:p-12 lg:border-r lg:border-b-0">
            <div className="space-y-6">
              {/* Approved vector brand lockup (maps the screen's boxed mark + wordmark) */}
              <Logo variant="lockup" alt="" />

              <div>
                <h1 className="text-foreground text-2xl leading-tight font-extrabold tracking-tight md:text-3xl">
                  Không gian nghệ thuật in 3D Việt Nam
                </h1>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Trải nghiệm tuyệt tác chế tác mô hình Resin 8K và FDM công nghệ cao. Hội tụ đỉnh cao điêu khắc số và tay
                  nghề hoàn thiện thủ công.
                </p>
              </div>

              {/* Showcase figurine (exact design asset) */}
              <div className="border-border/40 group relative h-48 overflow-hidden rounded-xl border md:h-56">
                <img
                  src={showcaseImg}
                  alt="Mô hình rồng in 3D resin 8K sơn mạ vàng trên bục obsidian trong không gian trưng bày tối"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="from-card via-card/30 absolute inset-0 bg-gradient-to-t to-transparent" />
                <div className="absolute right-4 bottom-3 left-4 flex items-center justify-between">
                  <span className="border-primary/20 bg-card/80 text-primary rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                    Phiên bản thủ công sơn mạ vàng
                  </span>
                  <span className="text-foreground/80 text-xs" style={AUTH_ORBITRON}>
                    EDITION 8K
                  </span>
                </div>
              </div>

              {/* Exclusive member perks (verbatim screen copy) */}
              <div className="space-y-3 pt-2">
                <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Đặc quyền hội viên độc bản
                </div>
                {PERKS.map((perk, i) => (
                  <div
                    key={perk.title}
                    className="border-border/20 hover:border-primary/40 flex items-start gap-3 rounded-lg border bg-muted/60 p-3 transition-colors"
                  >
                    <div
                      className={cn(
                        'bg-input flex size-8 shrink-0 items-center justify-center rounded-md',
                        i === 1 ? 'text-accent' : 'text-primary'
                      )}
                    >
                      <perk.icon className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-foreground text-sm font-semibold">{perk.title}</h2>
                      <p className="text-muted-foreground text-xs leading-relaxed">{perk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-border/20 text-muted-foreground mt-8 flex items-center gap-2 border-t pt-4 text-xs">
              <ShieldCheck className="text-primary size-4" />
              <span>Bảo mật dữ liệu &amp; Thanh toán an toàn</span>
            </div>
          </div>

          {/* RIGHT PANEL: tab switcher + auth form */}
          <div className="bg-muted/40 flex flex-col justify-center p-8 md:p-12">
            <AuthTabSwitcher active={active} />
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
