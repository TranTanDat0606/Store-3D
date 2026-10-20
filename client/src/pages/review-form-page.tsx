import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Info,
  Loader2,
  Send,
  ShieldAlert,
  Star,
} from 'lucide-react'
import { cn, resolveImageUrl } from '@/lib/utils'
import { productApi, reviewApi } from '@/services'
import { getApiErrorInfo } from '@/lib/apiError'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { Product, ReviewEligibility } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

/**
 * Review write form — rebuilt to `.stitch/designs/review-form.html` (Plan 4 T9).
 *
 * PRESERVED byte-for-byte (Plan 4 T9 / Review Focus #6 — restyle, preserve payload):
 *  - eligibility probe `GET /reviews/me/:productId` (`reviewApi.me`, 403/404
 *    swallowed → form stays usable, POST 403 is the honest backstop surface)
 *  - POST payload keys `{ product, rating, comment }` — exactly the legacy set
 *    (`review-form-page.tsx` old :130-134); server schema citation:
 *    `server/src/validators/review.ts:3-8` accepts product/rating/comment/images,
 *    but `images` is intentionally NOT sent (payload must stay byte-identical).
 *  - success behavior: sonner toast + `navigate('/san-pham/<slug>', { replace })`
 *  - §4 single surface: 409 (duplicate) surfaces ONLY via the global apiClient
 *    toast — this page's inline error skips `kind === 'conflict'`.
 *
 * Logged design gaps (no server backing — omitted, never invented):
 *  - "Hình ảnh / Video thực tế" upload + "3/5 ảnh" counter: server would accept
 *    `images[]`, but wiring it changes the POST payload → out of scope (T9).
 *  - "Hiển thị ẩn danh" checkbox: no anonymous field in `validators/review.ts`.
 *  - Sub-criteria micro-ratings (3× fixed "5.0" cards): fabricated statistics.
 *  - Order-code chip / "Giao thành công ngày …" / "Vận chuyển: 0₫ …" / "1/8"
 *    scale badge: eligibility API returns no order code/date/shipping data.
 *  - Design's in-page success toast: superseded by the preserved navigate-away.
 *  - Dynamic star label: screen only captures the 5/5 phrase → other values
 *    render the numeric part `{n}/5` (no invented mood copy).
 */

// Server `comment` is optional ≤1000 (`validators/review.ts:6`); the screen
// marks the field required (`*`) — client-side requiredness only, payload keys
// unchanged. Error strings mirror legacy/server phrasing.
const reviewSchema = z.object({
  rating: z.number().min(1, 'Vui lòng chọn số sao').max(5),
  comment: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập nội dung nhận xét')
    .max(1000, 'Bình luận tối đa 1000 ký tự'),
})

type ReviewValues = z.infer<typeof reviewSchema>

// Quick-suggestion chips — copy verbatim from `review-form.html` (labels +
// the full sentences their appendTag handlers insert).
const QUICK_TAGS: Array<{ label: string; text: string }> = [
  { label: '+ Độ nét sắc sảo', text: 'Độ nét sắc sảo, không một vết vân in!' },
  { label: '+ Màu sơn tinh xảo', text: 'Màu sơn tinh xảo mạ vàng óng ánh chuẩn cao cấp.' },
  { label: '+ Đóng gói kỹ', text: 'Đóng gói hộp mút xốp định hình siêu dày chống sốc.' },
  { label: '+ Giao hàng đúng hẹn', text: 'Giao hàng đúng hẹn, kiểm tra mã VietQR chuẩn xác.' },
]

/**
 * 5-star rating input as a NATIVE radio group (zero-dep a11y): browsers give
 * arrow-key navigation + single tab stop for free, `:checked` conveys state,
 * each input carries a VN `aria-label` ("1 sao"… "5 sao"). Stars are visually
 * hidden inputs + lucide `Star` icons; focus is visible via peer-focus-visible.
 */
function RatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <label
          key={i}
          className={cn(
            'group cursor-pointer rounded-md p-1 transition-transform hover:scale-125',
            disabled && 'pointer-events-none opacity-60'
          )}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
        >
          <input
            type="radio"
            name="review-rating"
            value={i}
            checked={value === i}
            disabled={disabled}
            onChange={() => onChange(i)}
            aria-label={`${i} sao`}
            className="peer sr-only"
          />
          <Star
            aria-hidden="true"
            className={cn(
              'size-8 pointer-events-none transition-colors md:size-10',
              'peer-focus-visible:ring-primary peer-focus-visible:ring-offset-background peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
              active >= i ? 'fill-primary text-primary' : 'fill-muted text-muted-foreground/40'
            )}
          />
        </label>
      ))}
    </div>
  )
}

export default function ReviewFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null)
  const [eligibilityLoading, setEligibilityLoading] = useState(false)

  useDocumentTitle('Đánh giá sản phẩm')

  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  })

  const comment = form.watch('comment') ?? ''

  useEffect(() => {
    let cancelled = false
    if (!slug) {
      setNotFound(true)
      setLoading(false)
      return
    }
    productApi
      .getBySlug(slug)
      .then((p) => {
        if (!cancelled) setProduct(p)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  // PRESERVED: eligibility probe + semantics (plan T9) — a failed probe keeps
  // the form usable; the server's POST 403 remains the authoritative gate.
  useEffect(() => {
    if (!product) return
    let cancelled = false
    setEligibilityLoading(true)
    reviewApi
      .me(product._id)
      .then((el) => {
        if (!cancelled) setEligibility(el)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setEligibilityLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [product])

  // PRESERVED payload keys: { product, rating, comment } — byte-identical to
  // the legacy page. No totals/images/anonymous fields.
  const onSubmit = async (values: ReviewValues) => {
    if (!product) return
    setError('')
    setSubmitting(true)
    try {
      await reviewApi.create({
        product: product._id,
        rating: values.rating,
        comment: values.comment,
      })
      // PRESERVED success behavior: toast + replace-navigate to the PDP.
      toast.success('Gửi đánh giá thành công')
      navigate(`/san-pham/${product.slug}`, { replace: true })
    } catch (err) {
      const info = getApiErrorInfo(err)
      // §4: 409 (duplicate review) is owned by the global apiClient toast —
      // no page-level double surface.
      if (info.kind !== 'conflict') setError(info.message)
    } finally {
      setSubmitting(false)
    }
  }

  const appendTag = (text: string) => {
    const current = form.getValues('comment')
    const next = current.trim() === '' ? text : `${current} ${text}`
    form.setValue('comment', next, { shouldDirty: true, shouldValidate: true })
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span
          className="size-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
          role="status"
          aria-label="Đang tải"
        />
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-foreground text-2xl font-bold">Không tìm thấy sản phẩm</h1>
        <p className="text-muted-foreground mt-2">
          Sản phẩm bạn muốn đánh giá không tồn tại hoặc đã bị xóa.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/san-pham">Quay lại cửa hàng</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* ==================== BREADCRUMB ====================
          Screen order: Trang chủ / Đơn hàng của tôi / [mã đơn] / Đánh giá sản phẩm.
          The order-code crumb is omitted — the eligibility API returns no order
          code (logged design gap); "Đơn hàng của tôi" links to the orders list. */}
      <div className="bg-card border-border border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
          <nav aria-label="Breadcrumb" className="text-muted-foreground flex items-center gap-2 text-xs">
            <Link to="/" className="transition-colors hover:text-primary">
              Trang chủ
            </Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <Link to="/tai-khoan/don-hang" className="transition-colors hover:text-primary">
              Đơn hàng của tôi
            </Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <span className="text-foreground font-semibold">Đánh giá sản phẩm</span>
          </nav>
        </div>
      </div>

      {/* ==================== CENTRAL FORM CONTAINER (max-w 720) ==================== */}
      <div className="mx-auto max-w-[720px] px-4 py-8">
        {/* ---------- Page header ---------- */}
        <div className="mb-8 text-center">
          <div className="border-primary/20 bg-muted text-primary mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
            <BadgeCheck className="size-4" aria-hidden="true" />
            Đánh giá minh bạch từ khách hàng thực tế
          </div>
          <h1 className="text-foreground text-2xl font-extrabold tracking-tight md:text-3xl">
            Đánh giá sản phẩm
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-xs leading-relaxed md:text-sm">
            Chia sẻ phản hồi thực tế của bạn về chất lượng in 3D Resin 8K Ultra, độ hoàn thiện mạ
            vàng thủ công và đóng gói bảo hộ của STORE 3D.
          </p>
        </div>

        {/* ---------- Eligibility info banner ---------- */}
        <div className="bg-card border-secondary/40 relative mb-6 overflow-hidden rounded-xl border p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-secondary text-secondary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border">
              <Info className="size-4" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-foreground text-xs font-semibold">
                Đơn hàng hợp lệ để đánh giá:
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng hoàn tất. Mỗi sản phẩm trong đơn
                chỉ được đánh giá 1 lần để bảo đảm tính khách quan.
              </p>
            </div>
          </div>
        </div>

        {/* ---------- Product mini-card (real data from productApi) ---------- */}
        <div className="bg-card border-border hover:border-primary/40 mb-8 rounded-2xl border p-4 transition-all">
          <div className="flex items-center gap-4">
            <div className="border-border bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border md:h-24 md:w-24">
              {product.images?.[0] ? (
                <img
                  src={resolveImageUrl(product.images[0])}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Star className="text-muted-foreground/40 size-6" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-grow">
              {eligibility?.purchased && (
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="border-success/30 bg-success/10 text-success inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    Đã mua hàng · Hoàn tất
                  </span>
                </div>
              )}
              <h2 className="text-foreground truncate text-base font-bold">{product.name}</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Phân loại:{' '}
                <span className="text-foreground font-medium">
                  {product.material} · {product.printerType}
                </span>
              </p>
              <p className="text-primary mt-2 font-mono text-xs font-bold">
                {product.salePrice.toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        </div>

        {eligibilityLoading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
            <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Đang kiểm tra...
          </div>
        ) : eligibility && !eligibility.purchased ? (
          /* Ineligible — honest single-surface message (server POST-403 copy,
             `reviewService.ts:67`), no double toast. */
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="size-4" />
            <AlertDescription>
              Bạn cần mua và nhận được sản phẩm này trước khi đánh giá.{' '}
              <Link to={`/san-pham/${product.slug}`} className="font-medium underline">
                Xem sản phẩm
              </Link>
            </AlertDescription>
          </Alert>
        ) : eligibility && eligibility.hasReviewed ? (
          <Alert className="border-success/30 bg-success/10 text-success mb-6">
            <CheckCircle2 className="size-4" />
            <AlertDescription>
              Bạn đã đánh giá sản phẩm này rồi.{' '}
              <Link to={`/san-pham/${product.slug}`} className="font-medium underline">
                Quay lại sản phẩm
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {error && (
              <Alert variant="destructive" className="mb-6" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* ---------- Star rating block ---------- */}
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem className="bg-card border-border rounded-2xl border p-6 text-center">
                      <fieldset className="border-0 p-0 m-0">
                        <legend className="text-foreground float-none mb-2 w-full p-0 text-sm font-semibold">
                          Đánh giá tổng quan chất lượng mô hình{' '}
                          <span className="text-destructive">*</span>
                        </legend>
                        <p className="text-muted-foreground mb-4 text-xs">
                          Vui lòng nhấp chọn số sao tương ứng với độ hài lòng của bạn
                        </p>
                        <RatingInput
                          value={field.value}
                          onChange={field.onChange}
                          disabled={submitting}
                        />
                        {field.value > 0 && (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-muted px-3 py-1">
                            <span className="text-primary text-xs font-bold tracking-wide">
                              {field.value}/5
                              {field.value === 5
                                ? ' — Cực kỳ hài lòng / Tuyệt tác mô hình'
                                : ''}
                            </span>
                          </div>
                        )}
                      </fieldset>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ---------- Textarea + quick tags ---------- */}
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-foreground">
                          Nội dung nhận xét <span className="text-destructive">*</span>
                        </FormLabel>
                        <span
                          className={cn(
                            'font-mono text-muted-foreground text-[11px]',
                            comment.length > 500 && 'text-destructive'
                          )}
                          aria-hidden="true"
                        >
                          {comment.length}/500 ký tự
                        </span>
                      </div>
                      {/* Quick suggestion chips — labels + inserted texts verbatim */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-muted-foreground/80 self-center text-[11px]">
                          Gợi ý nhanh:
                        </span>
                        {QUICK_TAGS.map((tag) => (
                          <button
                            key={tag.label}
                            type="button"
                            disabled={submitting}
                            onClick={() => appendTag(tag.text)}
                            className="bg-muted border-border text-foreground hover:border-primary hover:text-primary rounded-full border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Chia sẻ cảm nhận chân thật của bạn về sản phẩm (chất lượng in Resin 8K, độ chi tiết vân vảy rồng, màu sơn mạ vàng thủ công, đóng gói mút xốp định hình...)"
                          rows={5}
                          disabled={submitting}
                          className="resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ---------- Action row ---------- */}
                <div className="flex flex-col-reverse items-center justify-between gap-4 pt-4 sm:flex-row">
                  <Link
                    to="/tai-khoan/don-hang"
                    className="border-border text-foreground hover:border-primary hover:text-primary inline-flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition-all sm:w-auto"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Quay lại đơn hàng
                  </Link>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold tracking-wide shadow-lg shadow-primary/20 transition-all duration-200 active:scale-95 sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" aria-hidden="true" />
                        Gửi đánh giá
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  )
}
