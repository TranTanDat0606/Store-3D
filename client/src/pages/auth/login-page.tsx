import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Lock, Mail } from 'lucide-react'
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
const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type LoginValues = z.infer<typeof loginSchema>

/**
 * Page-scoped server-error latch (page-local; AuthContext C5 + guards untouched).
 * GuestOnlyRoute swaps <Outlet/> for its loader while AuthContext is mid-flight
 * (AUTH_START → isLoading), unmounting this page before the login promise
 * settles — component state alone would swallow the server's rejection
 * (pre-existing gap: wrong-password never rendered). The latch hands the
 * message across the remount; stale entries expire after 5 s.
 */
const ERROR_LATCH_MS = 5000
let pendingError: { message: string; at: number } | null = null
const readPendingError = () => (pendingError && Date.now() - pendingError.at < ERROR_LATCH_MS ? pendingError.message : '')
/** Email survives the same remount so a failed attempt can be retried (password never latched). */
let retryEmail: { value: string; at: number } | null = null
const readRetryEmail = () => (retryEmail && Date.now() - retryEmail.at < ERROR_LATCH_MS ? retryEmail.value : '')

export default function LoginPage() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(readPendingError)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: readRetryEmail(), password: '' },
  })

  const onSubmit = async (values: LoginValues) => {
    pendingError = null
    retryEmail = { value: values.email, at: Date.now() }
    setError('')
    setSubmitting(true)
    try {
      // C4: auth call byte-identical. Post-success redirect is owned by GuestOnlyRoute (reads location.state.from).
      await login(values)
      retryEmail = null
    } catch (err) {
      pendingError = { message: getErrorMessage(err), at: Date.now() }
      setError(pendingError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell active="login">
      <div className="space-y-1">
        <h2 className="text-foreground text-xl font-bold tracking-tight">Chào mừng bạn trở lại</h2>
        <p className="text-muted-foreground text-xs">
          Nhập thông tin xác thực để truy cập bộ sưu tập mô hình 3D của bạn.
        </p>
      </div>

      {/* Server validation errors (existing getErrorMessage mapping — restyled container, role="alert" from Alert) */}
      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-muted-foreground text-xs font-semibold">Email</FormLabel>
                <AuthInputWrap icon={Mail}>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="vidu@domain.com"
                      autoComplete="email"
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
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-muted-foreground text-xs font-semibold">Mật khẩu</FormLabel>
                <AuthInputWrap icon={Lock}>
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
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

          <Button
            type="submit"
            disabled={submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 h-12 w-full rounded-lg font-bold shadow-[0_0_25px] shadow-primary/30 transition-all hover:shadow-[0_0_30px] hover:shadow-primary/45 active:scale-[0.98]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Đang đăng nhập...
              </span>
            ) : (
              <>
                Đăng nhập
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground pt-4 text-center text-xs">
        Chưa có tài khoản?{' '}
        <Link to="/dang-ky" className="text-primary font-semibold hover:underline">
          Đăng ký
        </Link>
      </p>
    </AuthShell>
  )
}
