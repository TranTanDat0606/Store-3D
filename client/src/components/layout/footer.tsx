import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Clock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib'
import { Logo } from '@/components/brand/logo'
import { categoryApi } from '@/services/productApi'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import type { Category } from '@/types'

/**
 * Footer per approved screen `.stitch/designs/navbar-footer-spec.html`
 * Section F (FOOTER_CANONICAL): 4 columns (brand / collection links /
 * support links / showroom contact) + bottom copyright sub-bar.
 *
 * Owner mandate (Cross-plan §5): EVERY contact row (address, hotline,
 * support hours, email, social icons) renders only when its key exists
 * non-empty in `GET /api/settings/public`. Absent ⇒ row omitted entirely.
 * ZERO hardcoded contact values anywhere in this file.
 */

const hasText = (value?: string): value is string =>
  typeof value === 'string' && value.trim().length > 0

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="border-l-2 border-primary pl-2.5 text-sm font-bold tracking-wider text-foreground uppercase">
      {children}
    </h4>
  )
}

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', short: 'FB' },
  { key: 'zalo', label: 'Zalo', short: 'ZL' },
  { key: 'instagram', label: 'Instagram', short: 'IG' },
] as const

export function Footer() {
  const { settings } = usePublicSettings()
  const [categories, setCategories] = useState<Category[]>([])

  // Same dynamic category source as the navbar (approved design: lấy từ DB).
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

  // Hide-on-absent (owner mandate): a row exists only with a non-empty value.
  const address = hasText(settings.address) ? settings.address.trim() : undefined
  const hotline = hasText(settings.hotline) ? settings.hotline.trim() : undefined
  const supportHours = hasText(settings.supportHours) ? settings.supportHours.trim() : undefined
  const email = hasText(settings.email) ? settings.email.trim() : undefined
  const socialLinks = SOCIALS.filter((s) => hasText(settings.socialLinks?.[s.key])).map((s) => ({
    ...s,
    href: settings.socialLinks![s.key]!.trim(),
  }))

  const hasContact = Boolean(address || hotline || supportHours || email)

  return (
    <footer className="border-t border-border bg-card text-sm leading-relaxed text-muted-foreground">
      <div
        className={cn(
          'mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 md:grid-cols-2 md:px-8 lg:py-16',
          hasContact ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
        )}
      >
        {/* Cột 1: Thương hiệu STORE 3D & Sứ mệnh */}
        <div className="space-y-4">
          <Link to="/" className="inline-flex" aria-label="STORE 3D — Trang chủ">
            <Logo variant="lockup" alt="" />
          </Link>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Đam mê kiến tạo mô hình in 3D hoàn mỹ tại Việt Nam. Tiên phong ứng dụng công nghệ in
            quang hóa Resin SLA 8K và FDM công nghiệp chính xác từng micromet.
          </p>
          <div>
            <span className="inline-flex items-center gap-2 rounded border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold text-primary">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Chứng nhận SLA/FDM 8K Master
            </span>
          </div>
          {/* Social links: icons render IFF the settings payload carries a URL. */}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.label}
                  aria-label={social.label}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-secondary text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  {social.short}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Cột 2: Bộ sưu tập & Dịch vụ (dynamic — existing categories API) */}
        <div className="space-y-3">
          <ColumnHeading>Bộ Sưu Tập &amp; Dịch Vụ</ColumnHeading>
          <ul className="space-y-2 text-xs">
            <li>
              <Link
                to="/san-pham"
                className="block text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                Tất cả sản phẩm
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat._id}>
                <Link
                  to={`/san-pham?categorySlug=${cat.slug}`}
                  className="block text-muted-foreground transition-colors duration-150 hover:text-primary"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Cột 3: Hỗ trợ khách hàng (existing routes only — no invented slugs) */}
        <div className="space-y-3">
          <ColumnHeading>Hỗ Trợ Khách Hàng</ColumnHeading>
          <ul className="space-y-2 text-xs">
            <li>
              <Link
                to="/tin-tuc"
                className="block text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                Tin tức
              </Link>
            </li>
            <li>
              <Link
                to="/lien-he"
                className="block text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                Liên hệ
              </Link>
            </li>
            <li>
              <Link
                to="/tai-khoan/don-hang"
                className="block text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                Đơn hàng của tôi
              </Link>
            </li>
            <li>
              <Link
                to="/tai-khoan/yeu-thich"
                className="block text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                Danh sách yêu thích
              </Link>
            </li>
            <li>
              <Link
                to="/tai-khoan/ma-giam-gia"
                className="block text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                Mã giảm giá
              </Link>
            </li>
            <li>
              <Link
                to="/tai-khoan"
                className="block text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                Tài khoản
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 4: Hệ thống Showroom — settings-driven ONLY, absent ⇒ column omitted */}
        {hasContact && (
          <div className="space-y-3">
            <ColumnHeading>Hệ Thống Showroom</ColumnHeading>
            <ul className="space-y-3 text-xs">
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{address}</span>
                </li>
              )}
              {hotline && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    Hotline:{' '}
                    <a
                      href={`tel:${hotline}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      {hotline}
                    </a>
                  </span>
                </li>
              )}
              {supportHours && (
                <li className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{supportHours}</span>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    Email:{' '}
                    <a
                      href={`mailto:${email}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      {email}
                    </a>
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Bottom sub-bar (Copyright & Trust Badges) */}
      <div className="border-t border-border/60 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground md:flex-row md:px-8">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} STORE 3D Việt Nam. Bảo lưu mọi quyền. Đam mê kiến tạo mô
            hình in 3D hoàn mỹ.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-success">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Thanh toán an toàn
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-primary">Obsidian Gold UI v2.4</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
