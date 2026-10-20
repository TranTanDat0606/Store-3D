import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Lock, Mail, MapPin, Phone, Save, User as UserIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { authApi } from '@/services/authApi'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/services/apiClient'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { resolveImageUrl } from '@/lib'
import { toast } from 'sonner'

/**
 * Plan 4 T7 — profile → `.stitch/designs/account-profile.html` (VN verbatim).
 *
 * SUPPORTED BY SERVER — fields kept (validators/auth.ts updateProfileSchema:20-26
 * accepts exactly fullname / email / phone / address / avatar):
 *   Họ và tên*, Địa chỉ email*, Số điện thoại, Địa chỉ (existing field).
 *   Payload byte-preserved: `authApi.updateProfile(values)` still sends
 *   { fullname, email, phone, address } — no key added/removed.
 *
 * Omitted from screen (no server support — logged):
 *   - "Ngày sinh" + "Giới tính": updateProfileSchema has no birthday/gender and the
 *     User model has no such fields (types/index.ts User).
 *   - Avatar upload block actions ("Đổi ảnh / Tải ảnh mới / Xóa"): the save payload
 *     has no avatar key today; adding it would change the preserved payload shape.
 *     The avatar (real, when present) or the initial is displayed instead.
 *   - "Địa chỉ mặc định" province/district/ward/notes card: decision #7 — no address
 *     book screen; server profile carries a single `address` string (kept above).
 *   - Email "Đã xác thực" chip: no email-verification system exists.
 *   - "45 ngày trước" password chip: no last-password-change timestamp in the API.
 *
 * "Đổi mật khẩu tài khoản" bottom card = link to the existing `/tai-khoan/mat-khau`
 * route (supported by authApi.updatePassword + change-password page).
 */

const profileSchema = z.object({
  fullname: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ').max(100),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^(\+84|0)\d{9,10}$/.test(v), 'Số điện thoại không hợp lệ'),
  address: z.string().optional(),
})

type ProfileValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  useDocumentTitle('Hồ sơ cá nhân')
  const { user, updateUser } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullname: user?.fullname ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      address: user?.address ?? '',
    },
  })

  const onSubmit = async (values: ProfileValues) => {
    setError('')
    setSubmitting(true)
    try {
      const updated = await authApi.updateProfile(values)
      updateUser(updated)
      toast.success('Cập nhật hồ sơ thành công')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const initial = user?.fullname?.trim().charAt(0)?.toUpperCase() ?? '?'
  const fieldIcon = 'text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'

  return (
    <div className="flex flex-col gap-6">
      {/* ================= PAGE HEADER ================= */}
      <div className="border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
              Hồ sơ cá nhân &amp; Tài khoản
            </h1>
            <p className="text-muted-foreground mt-1.5 max-w-2xl text-xs sm:text-sm">
              Quản lý thông tin định danh và địa chỉ giao nhận mô hình in 3D mặc định của bạn.
            </p>
          </div>
          <span className="border-border bg-muted inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold">
            <span
              className={
                user?.active ? 'bg-success h-2 w-2 animate-pulse rounded-full' : 'bg-destructive h-2 w-2 rounded-full'
              }
            />
            {user?.active ? 'Tài khoản hoạt động' : 'Tài khoản bị khóa'}
          </span>
        </div>
      </div>

      {/* ================= PROFILE INFORMATION CARD ================= */}
      <div className="border-border bg-card rounded-xl border p-5 shadow-md sm:p-6">
        <div className="mb-6 flex items-center gap-2.5 border-b border-border/60 pb-4">
          <div className="bg-muted text-primary flex size-8 items-center justify-center rounded-lg">
            <UserIcon className="size-4" />
          </div>
          <div>
            <h2 className="text-foreground text-base font-bold">Thông tin tài khoản</h2>
            <p className="text-muted-foreground text-xs">Dữ liệu định danh trên hoá đơn và giao hàng</p>
          </div>
        </div>

        {/* Avatar (real) — upload actions omitted, see file header */}
        <div className="border-border/60 bg-muted/40 mb-6 flex items-center gap-5 rounded-xl border p-4">
          <div className="border-primary/70 relative size-20 shrink-0 overflow-hidden rounded-full border-2 shadow-md sm:size-24">
            {user?.avatar ? (
              <img
                src={resolveImageUrl(user.avatar)}
                alt={user.fullname}
                className="size-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="bg-muted text-primary flex size-full items-center justify-center text-2xl font-bold">
                {initial}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-foreground text-sm font-bold">Ảnh đại diện</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Hồ sơ hiển thị theo ảnh đại diện của tài khoản.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ================= FORM (payload byte-preserved) ================= */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Họ và tên <span className="text-primary">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserIcon className={fieldIcon} aria-hidden />
                      <Input className="pl-9" placeholder="Nguyễn Văn A" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Địa chỉ email <span className="text-primary">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className={fieldIcon} aria-hidden />
                      <Input type="email" className="pl-9" placeholder="khach@store3d.com" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  {/* Deviation (logged): screen marks phone required (*); the existing zod
                      schema keeps it optional (server accepts empty) → no asterisk shown. */}
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className={fieldIcon} aria-hidden />
                      <Input type="tel" className="pl-9" placeholder="0901 234 567" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className={fieldIcon} aria-hidden />
                      <Input className="pl-9" placeholder="123 Nguyễn Trãi, Hà Nội" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-5">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-11 flex-1 sm:flex-none"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Đang lưu...
                  </span>
                ) : (
                  <>
                    <Save className="size-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                onClick={() => form.reset()}
                disabled={submitting}
              >
                Hủy bỏ
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* ================= CHANGE PASSWORD LINK CARD ================= */}
      <div className="border-border bg-card rounded-xl border p-5 shadow-sm transition-all hover:border-muted-foreground/40 sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="border-border/60 bg-muted text-primary mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border">
              <Lock className="size-5" />
            </div>
            <div>
              <h3 className="text-foreground text-base font-bold">Đổi mật khẩu tài khoản</h3>
              <p className="text-muted-foreground mt-1 max-w-2xl text-xs leading-relaxed sm:text-sm">
                Bạn nên sử dụng mật khẩu mạnh gồm chữ hoa, chữ thường, số và ký tự đặc biệt để bảo vệ
                tài khoản cũng như bộ sưu tập mô hình 3D.
              </p>
            </div>
          </div>
          <Link
            to="/tai-khoan/mat-khau"
            className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold transition-colors"
          >
            <span>Đi tới trang đổi mật khẩu</span>
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  )
}
