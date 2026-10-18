import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BadgeCheck, Lock, Mail, Phone, UserPlus, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/services/apiClient'
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
import { AuthShell, AuthInputWrap, PasswordToggle, authInputClass } from '@/pages/auth/auth-shell'

// Schema byte-preserved from the pre-T2 page (client validation only).
const registerSchema = z
  .object({
    fullname: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    phone: z
      .string()
      .optional()
      .refine((v) => !v || /^(\+84|0)\d{9,10}$/.test(v), 'Số điện thoại không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type RegisterValues = z.infer<typeof registerSchema>

/**
 * Page-scoped server-error latch (page-local; AuthContext C5 + guards untouched).
 * GuestOnlyRoute unmounts this page mid-submit (AUTH_START loader) before the
 * register promise settles — the latch hands the server's rejection message
 * (e.g. duplicate email) across the remount; stale entries expire after 5 s.
 */
const ERROR_LATCH_MS = 5000
let pendingError: { message: string; at: number } | null = null
const readPendingError = () => (pendingError && Date.now() - pendingError.at < ERROR_LATCH_MS ? pendingError.message : '')
/** Identity fields survive the same remount so a failed attempt can be retried (passwords never latched). */
let retryIdentity: { fullname: string; email: string; phone: string; at: number } | null = null
const readRetryIdentity = () =>
  retryIdentity && Date.now() - retryIdentity.at < ERROR_LATCH_MS ? retryIdentity : null

export default function RegisterPage() {
  const { register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState(readPendingError)
  const [submitting, setSubmitting] = useState(false)

  const retry = readRetryIdentity()
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullname: retry?.fullname ?? '',
      email: retry?.email ?? '',
      phone: retry?.phone ?? '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: RegisterValues) => {
    pendingError = null
    retryIdentity = { fullname: values.fullname, email: values.email, phone: values.phone ?? '', at: Date.now() }
    setError('')
    setSubmitting(true)
    try {
      // C4: register payload byte-identical to the pre-T2 page.
      await register({
        fullname: values.fullname,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      })
      retryIdentity = null
      // No post-success navigate: GuestOnlyRoute owns the redirect (single owner, T1) —
      // it bounces authed users to location.state.from ?? "/" (register while authed → bounce).
    } catch (err) {
      pendingError = { message: getErrorMessage(err), at: Date.now() }
      setError(pendingError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell active="register">
      <div className="space-y-1">
        <h2 className="text-foreground text-xl font-bold tracking-tight">Tạo tài khoản STORE 3D</h2>
        <p className="text-muted-foreground text-xs">
          Khám phá vũ trụ mô hình in 3D và tham gia cộng đồng nhà sưu tầm tinh hoa.
        </p>
      </div>

      {/* Server validation errors (existing getErrorMessage mapping — restyled container, role="alert" from Alert) */}
      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-3.5" noValidate>
          <FormField
            control={form.control}
            name="fullname"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-muted-foreground text-xs font-semibold">Họ và tên</FormLabel>
                <AuthInputWrap icon={User}>
                  <FormControl>
                    <Input
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                      autoFocus
                      className={authInputClass}
                      {...field}
                    />
                  </FormControl>
                </AuthInputWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-muted-foreground text-xs font-semibold">Email</FormLabel>
                <AuthInputWrap icon={Mail}>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@domain.com"
                      autoComplete="email"
                      className={authInputClass}
                      {...field}
                    />
                  </FormControl>
                </AuthInputWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-1">
                {/* Screen label reads "Số điện thoại" and marks it required; the field is
                    optional in the existing schema + server validator — suffix keeps that honest. */}
                <FormLabel className="text-muted-foreground text-xs font-semibold">
                  Số điện thoại{' '}
                  <span className="text-muted-foreground/70 font-normal">(không bắt buộc)</span>
                </FormLabel>
                <AuthInputWrap icon={Phone}>
                  <FormControl>
                    <Input placeholder="0912 345 678" autoComplete="tel" className={authInputClass} {...field} />
                  </FormControl>
                </AuthInputWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-muted-foreground text-xs font-semibold">Mật khẩu</FormLabel>
                <AuthInputWrap icon={Lock}>
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`${authInputClass} pr-11`}
                      {...field}
                    />
                  </FormControl>
                  <PasswordToggle
                    pressed={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                    ariaLabel="Hiện hoặc ẩn mật khẩu"
                  />
                </AuthInputWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-muted-foreground text-xs font-semibold">Xác nhận mật khẩu</FormLabel>
                <AuthInputWrap icon={BadgeCheck}>
                  <FormControl>
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`${authInputClass} pr-11`}
                      {...field}
                    />
                  </FormControl>
                  <PasswordToggle
                    pressed={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                    ariaLabel="Hiện hoặc ẩn mật khẩu"
                  />
                </AuthInputWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-3 h-12 w-full rounded-lg font-bold shadow-[0_0_25px] shadow-primary/30 transition-all hover:shadow-[0_0_30px] hover:shadow-primary/45 active:scale-[0.98]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Đang đăng ký...
              </span>
            ) : (
              <>
                Tạo tài khoản
                <UserPlus className="size-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground pt-3 text-center text-xs">
        Đã có tài khoản?{' '}
        <Link to="/dang-nhap" className="text-primary font-semibold hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  )
}
