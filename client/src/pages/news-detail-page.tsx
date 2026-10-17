import { useEffect, useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Newspaper,

  Clock,
  Share2,
  Bookmark,
  ChevronDown,
  List,
} from 'lucide-react'
import { newsApi } from '@/services'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, resolveImageUrl } from '@/lib'
import { cn } from '@/lib'
import { parseMarkdownToHtml, type ParsedContent } from '@/lib/markdown'
import type { News } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  '3d-printing': 'In 3D',
  fdm: 'FDM',
  resin: 'Resin/SLA',
  filament: 'Filament',
  tips: 'Tips & Tricks',
  general: 'Tin tức',
}

const CATEGORY_COLORS: Record<string, string> = {
  '3d-printing': 'bg-accent/10 text-accent border-accent/20',
  fdm: 'bg-accent/10 text-accent border-accent/20',
  resin: 'bg-accent/10 text-accent border-accent/20',
  filament: 'bg-warning/10 text-warning border-warning/20',
  tips: 'bg-success/10 text-success border-success/20',
  general: 'bg-muted/10 text-foreground border-border/20',
}

const HEADER_OFFSET = 100
const TOC_WIDTH = 220

interface HeadingItem {
  level: number
  text: string
  id: string
}

function scrollToHeading(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  window.scrollTo({ top: y, behavior: 'smooth' })
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const handler = () => {
      const st = document.documentElement.scrollTop
      const sh = document.documentElement.scrollHeight - document.documentElement.clientHeight
      setProgress(sh > 0 ? (st / sh) * 100 : 0)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
  return (
    <div className="pointer-events-none fixed top-0 left-0 z-50 h-[2px] w-full">
      <div
        className="h-full bg-gradient-to-r from-accent via-accent to-accent transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

/* ───────── Desktop TOC ───────── */
function TocDesktop({ headings }: { headings: HeadingItem[] }) {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (!headings.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActiveId(e.target.id)
            return
          }
        }
      },
      { rootMargin: `-${HEADER_OFFSET}px 0px -65% 0px`, threshold: 0 }
    )
    headings.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  if (!headings.length) return null

  return (
    <nav
      className="rounded-2xl border p-5 shadow-sm border-border bg-foreground/[0.03]"
      style={{ width: TOC_WIDTH }}
    >
      <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
        <List className="size-3.5" />
        Nội dung bài viết
      </p>
      <ul className="space-y-0.5 border-l border-border">
        {headings.map((h, i) => {
          const active = activeId === h.id
          return (
            <li key={i}>
              <button
                onClick={() => scrollToHeading(h.id)}
                className={cn(
                  'flex w-full items-center gap-2 border-l-2 py-[5px] text-left text-[13px] leading-snug transition-all duration-150',
                  h.level === 3 && 'ml-6',
                  active
                    ? 'border-l-accent/20 pl-3 font-semibold text-accent'
                    : 'border-l-transparent pl-3 hover:border-l-border text-foreground hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full transition-colors',
                    active ? 'bg-accent' : 'bg-muted'
                  )}
                />
                <span className="truncate">{h.text}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* ───────── Mobile TOC ───────── */
function TocMobile({ headings }: { headings: HeadingItem[] }) {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (!headings.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActiveId(e.target.id)
            return
          }
        }
      },
      { rootMargin: `-${HEADER_OFFSET}px 0px -65% 0px`, threshold: 0 }
    )
    headings.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  if (!headings.length) return null

  return (
    <div className="mb-6 lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium shadow-sm border-border bg-foreground/[0.03] text-foreground"
      >
        <span className="flex items-center gap-2">
          <List className="size-4 text-accent" />
          Mục lục bài viết
        </span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-2 rounded-xl border p-3 shadow-sm border-border bg-foreground/[0.03]">
          <ul className="space-y-0.5">
            {headings.map((h, i) => {
              const active = activeId === h.id
              return (
                <li key={i}>
                  <button
                    onClick={() => {
                      scrollToHeading(h.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      h.level === 3 && 'ml-4',
                      active
                        ? 'bg-accent/10 font-semibold text-accent'
                        : 'text-foreground hover:bg-foreground/[0.05] hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        active ? 'bg-accent' : 'bg-muted'
                      )}
                    />
                    {h.text}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ───────── Main Page ───────── */
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
        window.scrollTo(0, 0)
        try {
          const res = await newsApi.list({ limit: 3 })
          if (!cancelled) setRelated(res.data.filter((item) => item._id !== n._id).slice(0, 3))
        } catch { /* ignore */ }
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  const parsed: ParsedContent | null = useMemo(() => {
    if (!news?.content) return null
    return parseMarkdownToHtml(news.content)
  }, [news?.content])

  const headings = parsed?.headings ?? []

  /* Loading */
  if (loading) {
    return (
      <div className="relative min-h-screen">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-30 opacity-[0.04]" />
        <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Skeleton className="mb-4 h-6 w-48" />
          <Skeleton className="mb-4 h-10 w-3/4" />
          <Skeleton className="mb-6 h-56 w-full rounded-2xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-5/6" />
        </div>
      </div>
    )
  }

  /* Not found */
  if (notFound || !news) {
    return (
      <div className="relative min-h-screen">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-30 opacity-[0.04]" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-2xl font-bold">Không tìm thấy bài viết</h1>
          <p className="text-muted-foreground mt-2">Bài viết có thể đã bị xóa hoặc không tồn tại.</p>
          <Button className="mt-6" asChild>
            <Link to="/tin-tuc">Quay lại tin tức</Link>
          </Button>
        </div>
      </div>
    )
  }

  const catColor = CATEGORY_COLORS[news.category] || CATEGORY_COLORS.general

  return (
    <div className="relative min-h-screen">
      <ReadingProgress />
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-30 opacity-[0.04]" />

      {/* Breadcrumb — centered in narrow container */}
      <div className="relative mx-auto max-w-6xl px-6 py-6 sm:px-8">
        <Breadcrumb
          items={[
            { label: 'Tin tức', href: '/tin-tuc' },
            { label: news.title },
          ]}
        />
      </div>

      {/* Mobile TOC — full width */}
      <div className="relative px-6 lg:hidden">
        <div className="mx-auto max-w-6xl">
          <TocMobile headings={headings} />
        </div>
      </div>

      {/* ═══════ FULL-WIDTH LAYOUT ═══════ */}
      <div className="relative w-full" style={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* ─── TOC Sidebar: sticky left ─── */}
        <aside
          className="hidden shrink-0 lg:block"
          style={{
            width: TOC_WIDTH + 48,
            paddingLeft: 24,
            paddingRight: 24,
            flexShrink: 0,
            alignSelf: 'flex-start',
            position: 'sticky',
            top: 100,
          }}
        >
          <TocDesktop headings={headings} />
        </aside>

        {/* ─── Article Area ─── */}
        <main style={{ flex: '1 1 0%', minWidth: 0, paddingRight: 24 }}>
          {/* Article Card — max-width 1200px */}
          <article
            className="border shadow-sm border-border bg-foreground/[0.03]"
            style={{ borderRadius: 20, maxWidth: 1200, margin: '0 auto' }}
          >
            {/* Card inner padding */}
            <div style={{ padding: '32px 32px 40px' }} className="sm:p-8 lg:p-10">
              {/* Header */}
              <header className="mb-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn('border text-xs font-medium', catColor)}>
                    {CATEGORY_LABELS[news.category] ?? news.category}
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Calendar className="size-3" />
                    {formatDate(news.publishedAt || news.createdAt)}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Clock className="size-3" />
                    5 phút đọc
                  </span>
                </div>

                <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl text-foreground">
                  {news.title}
                </h1>

                {news.excerpt && (
                  <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed">
                    {news.excerpt}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t pt-4 border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent text-xs font-bold text-foreground shadow-sm">
                      {news.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{news.author}</p>
                      <p className="text-[11px] text-foreground">Store 3D Team</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-8 text-foreground hover:text-accent">
                      <Share2 className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-foreground hover:text-accent">
                      <Bookmark className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </header>

              {/* Thumbnail — full width of card */}
              {news.thumbnail && (
                <div className="mb-8 overflow-hidden rounded-xl border border-border">
                  <img
                    src={resolveImageUrl(news.thumbnail)}
                    alt={news.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full object-cover"
                    style={{ maxHeight: 480 }}
                  />
                </div>
              )}

              {/* Article Body — constrained width for readability */}
              {parsed && (
                <div
                  className={cn(
                    'news-article prose prose-invert mx-auto',
                    'prose-headings:scroll-mt-[100px]',
                    'prose-h2:text-xl prose-h2:font-bold prose-h2:text-foreground',
                    'prose-h2:mt-14 prose-h2:mb-4 prose-h2:pb-2.5 prose-h2:border-b prose-h2:border-border',
                    'prose-h3:text-lg prose-h3:font-semibold prose-h3:text-foreground',
                    'prose-h3:mt-8 prose-h3:mb-3',
                    'prose-p:text-[15px] prose-p:leading-[1.85] prose-p:text-foreground',
                    'prose-p:mb-5',
                    'prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:text-accent',
                    'prose-strong:text-foreground prose-strong:font-semibold',
                    'prose-li:text-foreground prose-li:my-1.5 prose-li:marker:text-accent',
                    'prose-ul:my-4 prose-ol:my-4',
                    'prose-blockquote:border-l-accent/20 prose-blockquote:bg-foreground/[0.02]',
                    'prose-blockquote:rounded-r-xl prose-blockquote:py-2.5 prose-blockquote:pr-6 prose-blockquote:pl-5 prose-blockquote:my-8',
                    'prose-blockquote:text-foreground',
                    'prose-img:rounded-xl prose-img:shadow-md',
                  )}
                  style={{ maxWidth: 820 }}
                  dangerouslySetInnerHTML={{ __html: parsed.html }}
                />
              )}
            </div>
          </article>

          {/* Article Footer — outside card */}
          <div className="mt-6 flex flex-wrap items-center gap-3 px-2">
            <Badge variant="secondary" className={cn('border text-xs', catColor)}>
              {CATEGORY_LABELS[news.category] ?? news.category}
            </Badge>
            <span className="text-muted-foreground text-xs">
              {formatDate(news.publishedAt || news.createdAt)}
            </span>
          </div>
        </main>
      </div>

      {/* Related Articles — centered container */}
      {related.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <section className="mt-14 border-t pt-10 border-border">
            <h2 className="mb-5 text-lg font-bold text-foreground">Bài viết liên quan</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {related.map((item) => (
                <Link key={item._id} to={`/tin-tuc/${item.slug}`} className="group">
                  <div className="bg-muted relative aspect-video overflow-hidden rounded-xl border transition-all group-hover:shadow-lg border-border">
                    {item.thumbnail ? (
                      <img
                        src={resolveImageUrl(item.thumbnail)}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Newspaper className="text-muted-foreground size-8" />
                      </div>
                    )}
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-accent">
                    {item.title}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDate(item.publishedAt || item.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Back button */}
      <div className="mx-auto max-w-6xl px-6 pb-10 sm:px-8">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-foreground">
          <Link to="/tin-tuc">
            <ArrowLeft className="size-4" />
            Quay lại tin tức
          </Link>
        </Button>
      </div>
    </div>
  )
}
