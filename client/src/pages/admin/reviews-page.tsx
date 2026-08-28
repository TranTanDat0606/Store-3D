import { useEffect, useState } from 'react'
import { Search, Star, Trash2 } from 'lucide-react'
import { reviewApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Pagination } from '@/components/common/pagination'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatDateTime, resolveImageUrl } from '@/lib'
import { toast } from 'sonner'
import type { PaginationMeta, Review } from '@/types'

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-3.5 ${rating >= i ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
        />
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    reviewApi
      .adminList({ page, limit: 10, search: debouncedSearch || undefined })
      .then((res) => {
        if (cancelled) return
        setReviews(res.data)
        setMeta(res.pagination)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch])

  const handleDelete = async (id: string) => {
    try {
      await reviewApi.adminRemove(id)
      setReviews((prev) => prev.filter((r) => r._id !== id))
      setMeta((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev))
      toast.success('Xóa đánh giá thành công')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>
        <p className="text-muted-foreground">{meta ? `${meta.total} đánh giá` : ''}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo nội dung đánh giá..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-28 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed py-12 text-center">
          Chưa có đánh giá nào
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const user = typeof review.user === 'object' ? review.user : null
            const product = typeof review.product === 'object' ? review.product : null
            return (
              <Card key={review._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{user?.fullname ?? 'Khách hàng'}</span>
                        <StarRow rating={review.rating} />
                        <span className="text-muted-foreground text-xs">
                          {formatDateTime(review.createdAt)}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Sản phẩm:{' '}
                        <span className="font-medium text-foreground">{product?.name ?? 'Không rõ'}</span>
                      </p>
                      {review.comment && (
                        <p className="mt-2 text-sm whitespace-pre-line">{review.comment}</p>
                      )}
                      {review.images.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {review.images.map((img, i) => (
                            <img key={i} src={resolveImageUrl(img)} alt="" className="bg-muted size-14 rounded-lg object-cover" />
                          ))}
                        </div>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Xóa">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa đánh giá?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc muốn xóa đánh giá này? Điểm đánh giá của sản phẩm sẽ được tính lại.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => handleDelete(review._id)}
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  )
}
