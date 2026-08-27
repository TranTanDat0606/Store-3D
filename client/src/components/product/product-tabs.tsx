import { useState } from 'react'
import { ChevronDown, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib'
import { RatingSummary } from '@/components/review/rating-summary'
import { ReviewCard } from '@/components/review/review-card'
import type { Product, Review, ReviewEligibility } from '@/types'

interface ProductTabsProps {
  product: Product
  reviews: Review[]
  reviewEligibility: ReviewEligibility | null
  isAuthenticated: boolean
  hasMoreReviews: boolean
  onLoadMoreReviews: () => void
  onLoginClick: () => void
}

type TabId = 'description' | 'specs' | 'reviews'

export function ProductTabs({
  product,
  reviews,
  reviewEligibility,
  isAuthenticated,
  hasMoreReviews,
  onLoadMoreReviews,
  onLoginClick,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('description')
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  const tabs: { id: TabId; label: string }[] = [
    { id: 'description', label: 'Mô tả' },
    { id: 'specs', label: 'Thông số' },
    { id: 'reviews', label: `Đánh giá (${product.reviewCount})` },
  ]

  const isLongDescription = (product.description?.length ?? 0) > 300

  return (
    <div className="mt-12">
      {/* Tab bar */}
      <div className="border-b">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-foreground after:bg-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="py-8">
        {/* Description */}
        {activeTab === 'description' && (
          <div>
            {isLongDescription && !descriptionExpanded ? (
              <>
                <div className="prose prose-neutral dark:prose-invert max-w-none overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
                  <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
                </div>
                <Button
                  variant="link"
                  className="mt-2 px-0 text-sm"
                  onClick={() => setDescriptionExpanded(true)}
                >
                  <ChevronDown className="size-4" />
                  Xem thêm
                </Button>
              </>
            ) : (
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
                {isLongDescription && (
                  <Button
                    variant="link"
                    className="mt-2 px-0 text-sm"
                    onClick={() => setDescriptionExpanded(false)}
                  >
                    Thu gọn
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Specs */}
        {activeTab === 'specs' && (
          <div className="max-w-2xl overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Chất liệu', product.material],
                  ['Loại máy in', product.printerType],
                  ['Kích thước', product.size || '—'],
                  ['Trạng thái', product.stock > 0 ? 'Còn hàng' : 'Hết hàng'],
                  ['Mã sản phẩm', product.slug],
                ].map(([label, value], i) => (
                  <tr key={label} className={i % 2 ? 'bg-muted/40' : ''}>
                    <td className="text-muted-foreground w-40 px-4 py-3">{label}</td>
                    <td className="px-4 py-3 font-medium">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            <RatingSummary
              rating={product.rating}
              reviewCount={product.reviewCount}
              reviews={reviews}
              eligibility={reviewEligibility}
              isAuthenticated={isAuthenticated}
              productSlug={product.slug}
              onLoginClick={onLoginClick}
            />

            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center text-sm">
                  <MessageSquare className="size-10" />
                  <p>Chưa có đánh giá nào cho sản phẩm này.</p>
                </div>
              ) : (
                <>
                  {reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                  {hasMoreReviews && (
                    <Button variant="outline" className="w-full" onClick={onLoadMoreReviews}>
                      Xem thêm đánh giá
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
