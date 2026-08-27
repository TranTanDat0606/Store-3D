import { StarRating } from '@/components/common/star-rating'
import { resolveImageUrl } from '@/lib'
import type { Review } from '@/types'

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  const user = typeof review.user === 'object' ? review.user : null

  return (
    <div className="border-b pb-6 last:border-0">
      <div className="flex items-center gap-3">
        <div className="bg-muted flex size-10 items-center justify-center rounded-full font-semibold">
          {user ? user.fullname.charAt(0).toUpperCase() : 'K'}
        </div>
        <div>
          <p className="font-medium">{user?.fullname ?? 'Khách hàng'}</p>
          <div className="mt-0.5">
            <StarRating rating={review.rating} />
          </div>
        </div>
      </div>
      {review.comment && (
        <p className="text-muted-foreground mt-3 whitespace-pre-line text-sm">{review.comment}</p>
      )}
      {review.images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.images.map((img, i) => (
            <img
              key={i}
              src={resolveImageUrl(img)}
              alt=""
              className="bg-muted size-16 rounded-lg object-cover"
            />
          ))}
        </div>
      )}
    </div>
  )
}
