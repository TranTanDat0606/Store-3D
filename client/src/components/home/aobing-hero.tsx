import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { productApi } from '@/services'

const VIDEO_SRC = '/assets/video/banner-aobing.mp4'
const POSTER_SRC = '/assets/video/banner-aobing-poster.jpg'
const FALLBACK_CTA = '/san-pham'

/**
 * AO BING — scroll-driven video hero.
 *
 * - Section cao hơn viewport: video được pin (position: sticky) trong lúc cuộn.
 * - scrollYProgress [0..1] map vào video.currentTime — cuộn xuống tách, cuộn
 *   ngược lắp lại, dừng cuộn thì frame dừng đúng vị trí.
 * - Nút "Mua ngay" fade-in khi hiệu ứng gần kết thúc.
 * - Reduced-motion: không pin, không scrub, CTA hiện ngay.
 * - Video lỗi: hiện poster image, CTA hiện ngay.
 * - Link CTA: tìm sản phẩm "AO BING" có thật trong DB; nếu chưa có → /san-pham
 *   (không bịa liên kết sản phẩm).
 */
export function AobingHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const [videoFailed, setVideoFailed] = useState(false)
  const [ctaHref, setCtaHref] = useState(FALLBACK_CTA)

  const { scrollYProgress: rawProgress } = useScroll({
    target: sectionRef,
    // progress = 0 khi hero chạm đỉnh viewport,
    // progress = 1 đúng lúc điểm pin kết thúc (bottom of section chạm bottom of viewport)
    offset: ['start start', 'end end'],
  })
  // framer-motion có thể trả progress ngoài [0..1] (thậm chí NaN) khi cuộn qua hết
  // vùng pin — chuẩn hóa về [0..1] để mọi transform/seek luôn nhận giá trị hợp lệ.
  const scrollProgress = useTransform(rawProgress, (v) =>
    Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1,
  )

  /* ---------- scroll → video.currentTime (rAF-coalesced) ---------- */
  const pendingProgress = useRef(0)
  const rafRef = useRef<number | null>(null)

  const applySeek = () => {
    rafRef.current = null
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
    const target = Math.min(pendingProgress.current * video.duration, video.duration - 0.05)
    if (!Number.isFinite(target)) return
    // chỉ seek khi lệch hơn 1 frame — tránh spam seek không cần thiết
    if (Math.abs(video.currentTime - target) > 1 / 24) video.currentTime = target
  }

  const queueSeek = (progress: number) => {
    pendingProgress.current = progress
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(applySeek)
  }

  useMotionValueEvent(scrollProgress, 'change', (progress) => {
    if (prefersReducedMotion) return
    queueSeek(progress)
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onMeta = () => {
      pendingProgress.current = 0
      applySeek()
    }
    video.addEventListener('loadedmetadata', onMeta)
    return () => {
      video.removeEventListener('loadedmetadata', onMeta)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- CTA: chỉ link tới sản phẩm AO BING nếu tồn tại thật ---------- */
  useEffect(() => {
    let cancelled = false
    productApi
      .list({ search: 'AO BING', limit: 10, status: 'active' })
      .then((result) => {
        if (cancelled) return
        const found = (result.data ?? []).find((p) => p.name.trim().toLowerCase().includes('ao bing'))
        if (found?.slug) setCtaHref(`/san-pham/${found.slug}`)
      })
      .catch(() => {
        // API lỗi → giữ fallback /san-pham
      })
    return () => {
      cancelled = true
    }
  }, [])

  /* ---------- motion values cho CTA / scroll hint ---------- */
  const ctaOpacity = useTransform(scrollProgress, [0.8, 0.93], [0, 1])
  const ctaY = useTransform(scrollProgress, [0.8, 0.93], [16, 0])
  const ctaPointer = useTransform(ctaOpacity, (o) => (o > 0.6 ? 'auto' : 'none'))
  const hintOpacity = useTransform(scrollProgress, [0, 0.08], [1, 0])

  const showStaticCta = Boolean(prefersReducedMotion || videoFailed)
  const pinned = !prefersReducedMotion

  return (
    <section
      ref={sectionRef}
      aria-label="Giới thiệu bộ sưu tập AO BING"
      className={`relative bg-black ${pinned ? 'h-[190svh] md:h-[250svh]' : 'h-[100svh]'}`}
    >
      <h1 className="sr-only">STORE 3D — Mô hình in 3D cao cấp</h1>

      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Video / fallback poster */}
        {videoFailed ? (
          <img
            src={POSTER_SRC}
            alt="Mô hình Gundam AO BING được in 3D"
            className="absolute inset-0 size-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 size-full object-cover"
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
          />
        )}

        {/* Đảm bảo chữ/CTA đọc được trên mọi frame video */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        {/* Scroll hint — mờ dần ngay khi bắt đầu cuộn */}
        {!showStaticCta && (
          <motion.div
            style={{ opacity: hintOpacity }}
            className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-1 text-white/80"
            aria-hidden="true"
          >
            <span className="text-xs tracking-widest uppercase">Cuộn để khám phá</span>
            <ChevronDown className="size-5 animate-bounce" />
          </motion.div>
        )}

        {/* CTA — fade-in khi hiệu ứng gần kết thúc */}
        <motion.div
          className="absolute inset-x-0 bottom-12 z-10 flex justify-center px-4"
          style={showStaticCta ? undefined : { opacity: ctaOpacity, y: ctaY, pointerEvents: ctaPointer }}
        >
          <Button
            size="lg"
            className="group gap-2 bg-white px-8 text-base font-semibold text-slate-950 shadow-2xl shadow-black/40 hover:bg-white/90 dark:bg-white dark:text-slate-950"
            asChild
          >
            <Link to={ctaHref} aria-label="Mua ngay">
              Mua ngay
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
