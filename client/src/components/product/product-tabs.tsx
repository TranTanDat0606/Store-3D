import { useRef, useState } from 'react'
import { ChevronDown, FileText, MessageSquareText, MessageSquare, SlidersHorizontal } from 'lucide-react'
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
  defaultTab?: TabId
}

type TabId = 'description' | 'specs' | 'reviews'

/*
 * Plan 3 T6 — tab labels verbatim từ screen pdp.html: "Mô tả chi tiết",
 * "Thông số kỹ thuật", "Đánh giá (N)" (N = reviewCount thật từ API).
 * Spec rows = real Product fields only. Omitted screen spec rows (không có
 * field backing, không bịa): "Trọng lượng tượng", "Thời gian in & xử lý tia
 * UV", "Quy trình sơn hoàn thiện", "Nơi sản xuất (Xưởng chế tác ...)".
 * Reviews tab = READ list (existing reviewApi.listByProduct pagination kept);
 * WRITE form = Plan 4 (route /danh-gia/:slug, untouched here).
 * Deviation: screen mobile-pdp dùng accordion cho 3 mục; giữ tabs hiện có trên
 * mobile (behavior preserved, tabs cuộn ngang được) — logged.
 */
export function ProductTabs({
  product,
  reviews,
  reviewEligibility,
  isAuthenticated,
  hasMoreReviews,
  onLoadMoreReviews,
  onLoginClick,
  defaultTab = 'description',
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  // AC9 (#1): roving tabindex refs — arrow keys move focus AND activate (WAI-ARIA APG tabs).
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const focusTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length // wrap around
    setActiveTab(tabs[next].id)
    tabRefs.current[next]?.focus()
  }

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        focusTab(index + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        focusTab(index - 1)
        break
      case 'Home':
        e.preventDefault()
        focusTab(0)
        break
      case 'End':
        e.preventDefault()
        focusTab(tabs.length - 1)
        break
    }
  }

  const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
    { id: 'description', label: 'Mô tả chi tiết', icon: FileText },
    { id: 'specs', label: 'Thông số kỹ thuật', icon: SlidersHorizontal },
    { id: 'reviews', label: `Đánh giá (${product.reviewCount})`, icon: MessageSquareText },
  ]

  const isLongDescription = (product.description?.length ?? 0) > 300

  return (
    <div className="mt-12 overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Tab bar — per pdp screen: card container, active = primary underline.
          AC9 (#1): proper ARIA tabs — tablist/tab/tabpanel + roving tabindex + arrow keys. */}
      <div className="border-b bg-muted/30">
        <div role="tablist" aria-label="Thông tin sản phẩm" className="flex gap-2 overflow-x-auto px-4 pt-2">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`product-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`product-tabpanel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-3.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div
        className="p-6 lg:p-8"
        role="tabpanel"
        id={`product-tabpanel-${activeTab}`}
        aria-labelledby={`product-tab-${activeTab}`}
      >
        {/* Description */}
        {activeTab === 'description' && (
          <div>
            {isLongDescription && !descriptionExpanded ? (
              <>
                <div className="prose prose-invert max-w-none overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
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
              <div className="prose prose-invert max-w-none">
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

        {/* Specs — heading verbatim từ screen; rows = real API fields only */}
        {activeTab === 'specs' && (
          <div className="max-w-2xl overflow-hidden rounded-xl border">
            {/* AC9 (#15): h3 → h2 (h1 is the PDP product title; no level skip). Visual style unchanged. */}
            <h2 className="text-muted-foreground border-b bg-muted/30 px-5 py-3 text-sm">
              Thông số kỹ thuật sản phẩm chế tác
            </h2>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Vật liệu', product.material],
                  ['Công nghệ in', product.printerType],
                  ['Kích thước', product.size || '—'],
                  ['Trạng thái', product.stock > 0 ? 'Còn hàng' : 'Hết hàng'],
                  ['Mã sản phẩm', product.slug],
                ].map(([label, value], i) => (
                  <tr key={label} className={i % 2 ? 'bg-muted/40' : ''}>
                    <td className="text-muted-foreground w-40 px-5 py-3 font-medium">{label}</td>
                    <td className="px-5 py-3 font-semibold">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reviews — READ only from existing API; write CTA in RatingSummary = existing Plan-4-route link */}
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
                    <ReviewCard
                      key={review._id}
                      review={review}
                      id={`review-${review._id}`}
                    />
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
