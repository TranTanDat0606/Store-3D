import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown, Star } from 'lucide-react'
import { productApi } from '@/services'
import { formatCurrency } from '@/lib'
import type { Product } from '@/types'

const VIDEO_SRC = '/assets/video/banner-aobing.mp4'
const POSTER_SRC = '/assets/video/banner-aobing-poster.jpg'
const FALLBACK_CTA = '/san-pham'
const FALLBACK_BEST_SELLERS = '/san-pham?sort=best-selling'

/**
 * AO BING — hero điện ảnh ~3s rồi loop cố định (owner directive Plan 3 T1).
 *
 * Port từ worktree `store3d-aobing` — TOÀN BỘ logic dính cuộn (scrub
 * `video.currentTime`, vùng pin 160/190svh, progress hairline) đã bị LOẠI BỎ.
 * Không còn listener cuộn nào: video tự phát (muted, loop) độc lập với trang.
 *
 * Bố cục theo 3 màn hình `.stitch/designs/home-*`:
 * - desktop (lg+): 2 cột — nội dung trái (7 cột) + khung figure bo góc 4/5 (5 cột).
 * - tablet/mobile: video là nền banner toàn chiều rộng, nội dung phủ lên trên.
 *
 * Treatment: vào trang = fade/rise nhẹ (~0.9s, framer-motion entrance only)
 * rồi ổn định — video loop chậm; màn hình home chỉ show frame hero đứng.
 * Reduced-motion: matchMedia trong component → video đứng ở frame đầu,
 * bỏ toàn bộ entrance animation.
 * Video lỗi → giữ poster (onError).
 * CTA "Khám phá ngay": tìm sản phẩm AO BING có thật trong DB, thiếu thì
 * fallback /san-pham — không bịa liên kết sản phẩm.
 */
export function AobingHero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [aobing, setAobing] = useState<Product | null>(null)

  /* prefers-reduced-motion — matchMedia chủ động trong component */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  /* reduced-motion → đứng frame đầu; bình thường → tự phát muted loop */
  useEffect(() => {
    const video = videoRef.current
    if (!video || videoFailed) return
    if (reducedMotion) {
      video.pause()
      video.currentTime = 0
    } else {
      void video.play().catch(() => {
        // trình duyệt chặn autoplay → poster vẫn hiển thị
      })
    }
  }, [reducedMotion, videoFailed])

  /* CTA/spec tag: chỉ dùng sản phẩm AO BING có thật trong DB */
  useEffect(() => {
    let cancelled = false
    productApi
      .list({ search: 'AO BING', limit: 10, status: 'active' })
      .then((result) => {
        if (cancelled) return
        const found = (result.data ?? []).find((p) =>
          p.name.trim().toLowerCase().includes('ao bing'),
        )
        if (found) setAobing(found)
      })
      .catch(() => {
        // API lỗi → giữ fallback /san-pham
      })
    return () => {
      cancelled = true
    }
  }, [])

  /* Entrance chỉ chạy 1 lần lúc mount, tổng ≤3s rồi ổn định */
  const enter = (delay: number) =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: 'easeOut' as const },
        }

  const ctaHref = aobing?.slug ? `/san-pham/${aobing.slug}` : FALLBACK_CTA

  const badgeBase =
    'items-center gap-2 rounded-full border border-primary/40 bg-card px-3 py-1.5 text-xs font-semibold tracking-wide text-primary'

  return (
    <section
      aria-label="Giới thiệu bộ sưu tập AO BING"
      className="relative overflow-hidden border-b border-border/30 bg-background"
    >
      {/* Ambient glows (home-desktop) */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-[410px] max-w-7xl grid-cols-1 items-center gap-8 px-4 py-10 md:min-h-[480px] lg:min-h-0 lg:grid-cols-12 lg:px-8 lg:py-16">
        {/* Cột nội dung trái (lg: 7 cột) — mobile/tablet: phủ lên video nền */}
        <div className="relative z-10 space-y-5 lg:col-span-7 lg:space-y-6">
          {/* Badge — copy verbatim theo từng màn hình */}
          <motion.div {...enter(0)} className="flex">
            <span className={`hidden font-semibold tracking-wide lg:inline-flex ${badgeBase}`}>
              <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
              <span>BỘ SƯU TẬP GIỚI HẠN 2025</span>
            </span>
            <span className={`hidden font-semibold tracking-wide md:inline-flex lg:hidden ${badgeBase}`}>
              <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
              <span>PHIÊN BẢN GIỚI HẠN 2025 • ĐỘC BẢN</span>
            </span>
            <span className={`inline-flex font-semibold tracking-wide md:hidden ${badgeBase}`}>
              <Star className="size-3 text-primary" aria-hidden="true" />
              <span>Phiên bản giới hạn 2025 • Độc bản</span>
            </span>
          </motion.div>

          {/* Headline — verbatim, giống nhau cả 3 màn hình */}
          <motion.h1
            {...enter(0.1)}
            className="text-2xl leading-snug font-black tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl lg:leading-[1.15] lg:font-extrabold"
          >
            Mô hình in 3D độc đáo —{' '}
            <span className="text-primary lg:bg-gradient-to-r lg:from-primary lg:via-primary lg:to-amber-200 lg:bg-clip-text lg:text-transparent">
              trưng bày thế giới của bạn
            </span>
          </motion.h1>

          {/* Subtitle — verbatim theo breakpoint */}
          <motion.div {...enter(0.2)}>
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground md:hidden">
              Chế tác Resin 8K Ultra &amp; FDM siêu sắc nét, hoàn thiện thủ công tinh xảo từng vân
              vảy huyền thoại.
            </p>
            <p className="hidden max-w-2xl text-sm leading-relaxed text-muted-foreground md:block lg:hidden">
              Chế tác Resin 8K Ultra &amp; FDM công nghệ cao, hoàn thiện thủ công tinh xảo từng vảy
              rồng huyền thoại cho không gian sưu tầm của bạn.
            </p>
            <p className="hidden max-w-xl text-base leading-relaxed text-muted-foreground lg:block lg:text-lg">
              Khám phá hàng ngàn mô hình in resin và FDM độ phân giải siêu cao 8K, hoàn thiện thủ
              công tinh xảo từng chi tiết cho không gian của bạn.
            </p>
          </motion.div>

          {/* CTA — "Khám phá ngay" verbatim; href screen "#ban-chay" map sang
              route best-sellers có thật (section anchor thuộc T2/T3) */}
          <motion.div {...enter(0.3)} className="flex flex-wrap items-center gap-3 pt-2 sm:gap-4">
            <Link
              to={ctaHref}
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 sm:flex-none sm:text-base lg:py-3.5"
            >
              <span>Khám phá ngay</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              to={FALLBACK_BEST_SELLERS}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card/50 px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/60 hover:text-primary active:scale-95 sm:px-5 md:px-6 lg:border-primary/60 lg:bg-secondary/50 lg:py-3.5 lg:text-base lg:font-semibold"
            >
              <span className="md:hidden">Bán chạy</span>
              <span className="hidden md:inline">Sản phẩm bán chạy</span>
              <ArrowRight className="hidden size-4 md:block" aria-hidden="true" />
            </Link>
          </motion.div>

          {/* Gợi ý khám phá thêm — chỉ mobile theo home-mobile */}
          <div className="flex items-center justify-center gap-1 pt-2 text-[11px] text-muted-foreground lg:hidden">
            <span>Cuộn khám phá tủ trưng bày</span>
            <ChevronDown className="size-4 animate-bounce" aria-hidden="true" />
          </div>
        </div>

        {/* Video AO BING — mobile/tablet: nền banner toàn khung; lg+: khung figure 4/5 */}
        <motion.div
          {...(reducedMotion
            ? {}
            : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.9, ease: 'easeOut' as const } })}
          className="absolute inset-0 z-0 lg:static lg:col-span-5"
        >
          <div className="relative h-full w-full overflow-hidden lg:aspect-[4/5] lg:rounded-2xl lg:border lg:border-border/60 lg:shadow-2xl">
            {videoFailed ? (
              <img
                src={POSTER_SRC}
                alt="Mô hình in 3D AO BING"
                className="absolute inset-0 size-full object-cover"
                fetchPriority="high"
              />
            ) : (
              <video
                ref={videoRef}
                className="absolute inset-0 size-full object-cover"
                src={VIDEO_SRC}
                poster={POSTER_SRC}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                disablePictureInPicture
                aria-hidden="true"
                onError={() => setVideoFailed(true)}
              />
            )}

            {/* Gradient legibility (mobile/tablet) + vignette (lg theo home-desktop) */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent lg:from-background lg:via-transparent lg:to-background/30" />
            <div className="absolute inset-0 hidden bg-gradient-to-r from-background/80 via-transparent to-background/40 lg:block" />

            {/* SHOWCASE tag (home-desktop figure frame) */}
            <div className="absolute top-4 left-4 hidden items-center gap-2 rounded-full border border-border/40 bg-background/80 px-3 py-1 text-[11px] text-foreground backdrop-blur-md lg:flex">
              <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
              <span className="font-medium">SHOWCASE 360° CINEMATIC</span>
            </div>

            {/* Spec tag — CHỈ dữ liệu thật từ DB (name/giá/material/size);
                "Bản giới hạn 200 chiếc" của screen bỏ (không có nguồn dữ liệu) */}
            {aobing && (
              <Link
                to={`/san-pham/${aobing.slug}`}
                className="absolute inset-x-4 bottom-4 hidden rounded-xl border border-border/50 bg-card/90 p-3.5 backdrop-blur-md transition-colors hover:border-primary/60 lg:block"
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-foreground">{aobing.name}</span>
                  <span className="text-xs font-bold text-primary">{formatCurrency(aobing.salePrice)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span>{aobing.material}</span>
                  {aobing.size && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span>{aobing.size}</span>
                    </>
                  )}
                </div>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
