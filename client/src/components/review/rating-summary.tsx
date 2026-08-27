import { Link } from 'react-router-dom'
import { CheckCircle2, MessageSquare } from 'lucide-react'
import { StarRating } from '@/components/common/star-rating'
import { Button } from '@/components/ui/button'
import type { Review, ReviewEligibility } from '@/types'

interface RatingSummaryProps {
  rating: number
  reviewCount: number
  reviews: Review[]
  eligibility: ReviewEligibility | null
  isAuthenticated: boolean
  productSlug: string
  onLoginClick: () => void
}

export function RatingSummary({
  rating,
  reviewCount,
  reviews,
  eligibility,
  isAuthenticated,
  productSlug,
  onLoginClick,
}: RatingSummaryProps) {
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => Math.round(r.rating) === stars).length,
    percent: reviewCount > 0
      ? Math.round((reviews.filter((r) => Math.round(r.rating) === stars).length / reviewCount) * 100)
      : 0,
  }))

  return (
    <div className="h-fit rounded-xl border p-6 text-center">
      <div className="text-5xl font-extrabold">{rating > 0 ? rating.toFixed(1) : '—'}</div>
      <div className="mt-2 flex justify-center">
        <StarRating rating={rating} size="lg" />
      </div>
      <p className="text-muted-foreground mt-2 text-sm">{reviewCount} đánh giá</p>

      {/* Bar chart */}
      <div className="mt-4 space-y-1.5">
        {distribution.map((d) => (
          <div key={d.stars} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-right font-medium">{d.stars}</span>
            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-amber-400 h-full rounded-full transition-all"
                style={{ width: `${d.percent}%` }}
              />
            </div>
            <span className="text-muted-foreground w-6 text-right">{d.count}</span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <div className="mt-4">
        {!isAuthenticated ? (
          <Button className="w-full" variant="outline" onClick={onLoginClick}>
            Đăng nhập để đánh giá
          </Button>
        ) : eligibility?.canReview ? (
          <Button className="w-full" asChild>
            <Link to={`/danh-gia/${productSlug}`}>Viết đánh giá</Link>
          </Button>
        ) : eligibility?.hasReviewed ? (
          <div className="text-emerald-600 dark:text-emerald-400 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium">
            <CheckCircle2 className="size-4" />
            Đã đánh giá
          </div>
        ) : (
          <Button
            className="w-full"
            disabled
            title="Chỉ khách hàng đã mua và nhận được sản phẩm này mới có thể đánh giá"
          >
            <MessageSquare className="size-4" />
            Cần mua hàng để đánh giá
          </Button>
        )}
      </div>
    </div>
  )
}
