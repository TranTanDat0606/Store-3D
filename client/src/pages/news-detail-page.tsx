import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Newspaper, User } from 'lucide-react'
import { newsApi } from '@/services'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, resolveImageUrl } from '@/lib'
import type { News } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  '3d-printing': 'In 3D',
  fdm: 'FDM',
  resin: 'Resin/SLA',
  filament: 'Filament',
  tips: 'Tips & Tricks',
  general: 'Tin tức',
}

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [news, setNews] = useState<News | null>(null)
  const [related, setRelated] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) {
      setNotFound(true)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    newsApi
      .getBySlug(slug)
      .then(async (n) => {
        if (cancelled) return
        setNews(n)
        try {
          const res = await newsApi.list({ limit: 3 })
          if (!cancelled) setRelated(res.data.filter((item) => item._id !== n._id).slice(0, 3))
        } catch {
          /* ignore */
        }
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

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="mb-4 h-10 w-3/4" />
        <Skeleton className="mb-6 h-64 w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </div>
    )
  }

  if (notFound || !news) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Không tìm thấy bài viết</h1>
        <p className="text-muted-foreground mt-2">Bài viết có thể đã bị xóa hoặc không tồn tại.</p>
        <Button className="mt-6" asChild>
          <Link to="/tin-tuc">Quay lại tin tức</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumb
        className="mb-6"
        items={[
          { label: 'Tin tức', href: '/tin-tuc' },
          { label: news.title },
        ]}
      />

      <article>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{CATEGORY_LABELS[news.category] ?? news.category}</Badge>
          <span className="text-muted-foreground flex items-center gap-1 text-sm">
            <Calendar className="size-3" />
            {formatDate(news.publishedAt || news.createdAt)}
          </span>
          <span className="text-muted-foreground flex items-center gap-1 text-sm">
            <User className="size-3" />
            {news.author}
          </span>
        </div>

        <h1 className="mb-6 text-3xl font-bold sm:text-4xl">{news.title}</h1>

        {news.thumbnail && (
          <div className="mb-8 overflow-hidden rounded-xl">
            <img
              src={resolveImageUrl(news.thumbnail)}
              alt={news.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {news.excerpt && (
          <p className="text-muted-foreground mb-6 text-lg italic">{news.excerpt}</p>
        )}

        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
      </article>

      {related.length > 0 && (
        <section className="mt-12 border-t pt-8">
          <h2 className="mb-6 text-xl font-bold">Bài viết liên quan</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((item) => (
              <Link key={item._id} to={`/tin-tuc/${item.slug}`} className="group">
                <div className="bg-muted relative aspect-video overflow-hidden rounded-lg">
                  {item.thumbnail ? (
                    <img
                      src={resolveImageUrl(item.thumbnail)}
                      alt={item.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Newspaper className="text-muted-foreground size-8" />
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-primary">
                  {item.title}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatDate(item.publishedAt || item.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8">
        <Button variant="ghost" asChild>
          <Link to="/tin-tuc">
            <ArrowLeft className="size-4" />
            Quay lại tin tức
          </Link>
        </Button>
      </div>
    </div>
  )
}
