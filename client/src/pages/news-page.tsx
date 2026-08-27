import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Newspaper, Calendar, ArrowRight } from 'lucide-react'
import { newsApi } from '@/services'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Pagination } from '@/components/common/pagination'
import { EmptyState } from '@/components/common/empty-state'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatDate, resolveImageUrl } from '@/lib'
import type { News, PaginationMeta } from '@/types'

export default function NewsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [news, setNews] = useState<News[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)

  const page = Number(searchParams.get('page') ?? 1)
  const category = searchParams.get('category') ?? ''

  useEffect(() => {
    newsApi.categories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params: Record<string, string | number> = { page, limit: 9 }
    if (category) params.category = category

    newsApi
      .list(params)
      .then((res) => {
        if (!cancelled) {
          setNews(res.data)
          setMeta(res.pagination)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNews([])
          setMeta(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, category])

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const CATEGORY_LABELS: Record<string, string> = {
    '3d-printing': 'In 3D',
    fdm: 'FDM',
    resin: 'Resin/SLA',
    filament: 'Filament',
    tips: 'Tips & Tricks',
    general: 'Tin tức',
  }

  return (
    <div className="relative min-h-screen">
      {/* Background grid - same style as Cart */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-30 dark:opacity-[0.04]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb className="mb-6" items={[{ label: 'Tin tức' }]} />

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            <Newspaper className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Tin tức công nghệ in 3D</h1>
            <p className="text-muted-foreground mt-1">Khám phá xu hướng, hướng dẫn và mẹo hay về 3D Printing</p>
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => updateParams({ category: null })}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              !category
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:border-primary/50 hover:text-primary'
            )}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => updateParams({ category: cat === category ? null : cat })}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                category === cat
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:border-primary/50 hover:text-primary'
              )}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted h-80 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <EmptyState
          title="Chưa có bài viết"
          description="Hiện tại chưa có bài viết nào. Hãy quay lại sau."
          icon={<Newspaper className="size-7" />}
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <Link key={item._id} to={`/tin-tuc/${item.slug}`} className="group">
                <Card className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="bg-muted relative aspect-video overflow-hidden">
                    {item.thumbnail ? (
                      <img
                        src={resolveImageUrl(item.thumbnail)}
                        alt={item.title}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Newspaper className="text-muted-foreground size-12" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </Badge>
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Calendar className="size-3" />
                        {formatDate(item.publishedAt || item.createdAt)}
                      </span>
                    </div>
                    <h2 className="line-clamp-2 font-semibold group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                    {item.excerpt && (
                      <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{item.excerpt}</p>
                    )}
                    <span className="text-primary mt-3 inline-flex items-center gap-1 text-sm font-medium">
                      Đọc thêm <ArrowRight className="size-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {meta && <Pagination meta={meta} onPageChange={(p) => updateParams({ page: String(p) })} />}
        </>
      )}
      </div>
    </div>
  )
}
