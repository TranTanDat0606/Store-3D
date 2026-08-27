import { Star } from 'lucide-react'
import { cn } from '@/lib'

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'lg'
  className?: string
}

export function StarRating({ rating, size = 'sm', className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'fill-amber-400 text-amber-400',
            size === 'lg' ? 'size-5' : 'size-3.5',
            rating < i - 0.5 && 'fill-muted text-muted'
          )}
        />
      ))}
    </div>
  )
}
