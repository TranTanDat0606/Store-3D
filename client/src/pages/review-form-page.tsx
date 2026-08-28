import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, ShieldAlert, Star } from 'lucide-react'
import { cn, resolveImageUrl } from '@/lib/utils'
import { productApi, reviewApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import type { Product, ReviewEligibility } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const reviewSchema = z.object({
  rating: z.number().min(1, 'Vui lòng chọn số sao').max(5),
  comment: z.string().trim().max(1000, 'Bình luận tối đa 1000 ký tự'),
})

type ReviewValues = z.infer<typeof reviewSchema>

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
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${i} sao`}
          className="p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed"
        >
          <Star
            className={cn(
              'size-7',
              (hover || value) >= i ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'
            )}
          />
        </button>
      ))}
      <span className="text-muted-foreground ml-2 text-sm">{value > 0 ? `${value} sao` : 'Chọn số sao'}</span>
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

  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  })

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
      toast.success('Gửi đánh giá thành công')
      navigate(`/san-pham/${product.slug}`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Không tìm thấy sản phẩm</h1>
        <p className="text-muted-foreground mt-2">Sản phẩm bạn muốn đánh giá không tồn tại hoặc đã bị xóa.</p>
        <Button className="mt-6" asChild>
          <Link to="/san-pham">Quay lại cửa hàng</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Viết đánh giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4 rounded-xl border p-4">
            {product.images?.[0] ? (
              <img
                src={resolveImageUrl(product.images[0])}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="size-16 rounded-lg object-cover"
              />
            ) : (
              <div className="bg-muted flex size-16 items-center justify-center rounded-lg" />
            )}
            <div>
              <p className="font-semibold">{product.name}</p>
              <p className="text-muted-foreground text-sm">{product.salePrice.toLocaleString('vi-VN')} ₫</p>
            </div>
          </div>

          {eligibilityLoading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
              <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              Đang kiểm tra...
            </div>
          ) : eligibility && !eligibility.purchased ? (
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
            <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
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
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đánh giá của bạn</FormLabel>
                    <FormControl>
                      <RatingInput value={field.value} onChange={field.onChange} disabled={submitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhận xét (không bắt buộc)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhận xét của bạn về sản phẩm (không bắt buộc)..."
                        rows={5}
                        disabled={submitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang gửi...
                  </span>
                ) : (
                  'Gửi đánh giá'
                )}
              </Button>
            </form>
          </Form>
          </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
