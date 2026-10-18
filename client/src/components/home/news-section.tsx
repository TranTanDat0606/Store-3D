import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, CalendarDays, Layers } from 'lucide-react'
import type { News } from '@/types'
import { formatDate, resolveImageUrl } from '@/lib'

interface NewsSectionProps {
  articles: News[]
}

/**
 * "Góc 3D & Tin tức sáng tạo" theo màn hình `home-*` (Plan 3 T2).
 *
 * Data thật: `GET /api/news` (newsService.list — chỉ bài published, sắp xếp
 * `-publishedAt -createdAt`). Category badge hiển thị đúng category từ DB;
 * ngày hiển thị đúng publishedAt/createdAt.
 *
 * Deviations có chủ đích (không bịa dữ liệu):
 * - "5 phút đọc" BỊ BỎ: News model không có read-time/word-count.
 * - Bài thứ 3 ẩn trên mobile (screen mobile chỉ show 2 post) — vẫn truy cập
 *   được qua "Tất cả bài viết".
 */
export function NewsSection({ articles }: NewsSectionProps) {
  if (articles.length === 0) return null

  const shown = articles.slice(0, 3)

  return (
    <section className="border-b border-foreground/5 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 hidden text-xs font-bold tracking-widest text-secondary uppercase sm:block">
              KIẾN THỨC &amp; XU HƯỚNG
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              Góc 3D &amp; Tin tức sáng tạo
            </h2>
            <p className="mt-1 text-[11px] text-muted-foreground sm:hidden">
              Kiến thức công nghệ &amp; hậu trường chế tác
            </p>
          </div>
          <Link
            to="/tin-tuc"
            className="group flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <span>Tất cả bài viết</span>
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Cards: 1 cột mobile (bài 3 ẩn), 3 cột md+ */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {shown.map((article, i) => (
            <NewsCard key={article._id} article={article} hiddenOnMobile={i === 2} />
          ))}
        </div>
      </div>
    </section>
  )
}

function NewsCard({ article, hiddenOnMobile }: { article: News; hiddenOnMobile: boolean }) {
  const published = article.publishedAt ?? article.createdAt

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-card/50 transition-all hover:border-primary/40 ${
        hiddenOnMobile ? 'hidden md:flex' : ''
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
        <div className="absolute inset-0 flex items-center justify-center">
          <Layers className="size-8 text-muted-foreground" />
        </div>
        {article.thumbnail ? (
          <img
            src={resolveImageUrl(article.thumbnail)}
            alt={article.title}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
            className="relative size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        {article.category && (
          <span className="absolute top-3 left-3 rounded-md border border-primary/30 bg-background/85 px-2.5 py-1 text-[11px] font-semibold text-secondary backdrop-blur">
            {article.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-3" />
            <span>{formatDate(published)}</span>
          </div>
          <h3 className="line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-primary">
            <Link to={`/tin-tuc/${article.slug}`} className="after:absolute after:inset-0 after:content-['']">
              {article.title}
            </Link>
          </h3>
          {article.excerpt && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
          )}
        </div>
        <div className="mt-4 flex items-center gap-1 border-t border-foreground/5 pt-4 text-xs font-semibold text-primary">
          <span>Đọc tiếp</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  )
}
