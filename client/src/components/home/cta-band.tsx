import { Link } from 'react-router-dom'
import { Phone, Printer, Upload } from 'lucide-react'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import { Button } from '@/components/ui/button'

/**
 * CTA band "DỊCH VỤ IN 3D THEO YÊU CẦU" theo màn hình `home-*` (Plan 3 T2).
 *
 * - Hotline lấy từ `GET /api/settings/public` (hide-on-absent theo contract §5);
 *   số "1900 1234" trên màn hình là placeholder mẫu — KHÔNG hardcode.
 * - "Gửi file in theo yêu cầu" trỏ tới /lien-he: Plan 3 chưa có luồng upload
 *   file (nút trên màn hình không có đích riêng) — deviation có chủ đích.
 */
export function CtaBand() {
  const { settings } = usePublicSettings()
  const hotline = settings.hotline?.trim()

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-8 md:p-14">
          {/* ambient */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row md:text-left">
            <div className="max-w-2xl space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs font-medium text-primary">
                <Printer className="size-4" />
                <span>DỊCH VỤ IN 3D THEO YÊU CẦU</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-4xl">
                Sẵn sàng tạo mô hình của riêng bạn?
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                Bạn có file 3D độc quyền hoặc ý tưởng riêng? STORE 3D nhận in theo yêu cầu với vật
                liệu cao cấp, bảo hành chi tiết sắc nét và giao hàng toàn quốc.
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3.5 sm:flex-row md:w-auto md:flex-col lg:flex-row">
              <Button
                size="lg"
                className="rounded-xl bg-primary px-6 font-bold text-background shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                asChild
              >
                <Link to="/lien-he">
                  <Upload className="size-4" />
                  Gửi file in theo yêu cầu
                </Link>
              </Button>
              {/* Hotline: settings-driven, ẩn khi không có dữ liệu (contract §5) */}
              {hotline && (
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-foreground/15 bg-background/60 px-6 font-medium text-foreground hover:border-primary/50 hover:text-primary"
                  asChild
                >
                  <a href={`tel:${hotline.replace(/\s/g, '')}`}>
                    <Phone className="size-4 text-primary" />
                    Hotline: {hotline}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
