import { Link } from 'react-router-dom'
import { CheckCircle2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReviewEligibility } from '@/types'

/**
 * Review action for a purchased product. Shows a "Đánh giá sản phẩm" button
 * when the user can review, or "Đã đánh giá" when they already did. Renders
 * nothing when the user is not yet eligible (no qualifying purchase).
 */
export function ReviewProductAction({
  slug,
  eligibility,
}: {
  slug?: string
  eligibility?: ReviewEligibility
}) {
  if (!eligibility) return null

  if (eligibility.hasReviewed) {
    return (
      <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5 text-sm font-medium">
        <CheckCircle2 className="size-4" />
        Đã đánh giá
      </span>
    )
  }

  if (!eligibility.purchased || !slug) return null

  return (
    <Button size="sm" variant="outline" asChild>
      <Link to={`/danh-gia/${slug}`}>
        <Star className="fill-amber-400 text-amber-400 size-4" />
        Đánh giá sản phẩm
      </Link>
    </Button>
  )
}
