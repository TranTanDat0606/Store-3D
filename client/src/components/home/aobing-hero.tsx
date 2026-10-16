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
 * Giới hạn scrub: chỉ dùng SCRUB_END (65%) đầu thời lượng video.
 * Frame 65% là bố cục đẹp nhất đã kiểm chứng trực quan (cánh xòe symmetric,
 * đủ chân, đầu cánh còn trong khung) — 80%+ đầu cánh bị cắt khỏi frame.
 */
const SCRUB_END = 0.65
/**
 * Progress cuộn tại đó video đạt SCRUB_END. Phần 0.93 → 1.0 là dwell giữ
 * frame cuối + CTA hiện rõ trước khi pin nhả.
 */
const SCRUB_DONE_AT = 0.93

/**
 * AO BING — scroll-driven video hero.
 *
 * Tích hợp navbar ↔ hero (nguyên nhân gốc của lỗi overlap + dead-zone):
 * - Navbar sticky `h-16` (64px) + section hero `-mt-16` → hero bắt đầu ngay
 *   ĐẦU document (overlay header), box sticky `top-16` pin ngay dưới navbar.
 *   → Video không bao giờ trượt dưới navbar, không có vùng cuộn "chết".
 *   → progress ['start start','end end'] khớp đúng pin (cùng điểm bắt đầu).
 *
 * - Video `object-contain` trong area min(100vw×9/16, 100svh−152px): toàn bộ
 *   khung video (gồm chân Gundam) luôn thấy — không cắt, không gradient tối.
 * - Band 88px riêng cho scroll-hint + CTA + progress hairline → không che video.
 * - Section 160svh (mobile) / 190svh (desktop) — pin ngắn hơn, hết animation
 *   là pin nhả, cuộn tự nhiên xuống section sau. Cuộn ngược đọc lại đúng.
 * - Reduced-motion / video lỗi: không pin, CTA hiện ngay.
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
    // progress = 0 đúng lúc pin bắt đầu (section chạm đỉnh viewport),
    // progress = 1 đúng lúc pin kết thúc (bottom of section chạm bottom of viewport)
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
    // phân biệt video progress với scroll distance: scroll 0→0.93 map về
    // video 0→SCRUB_END, phần còn lại là dwell giữ frame cố định.
    const videoProgress = Math.min(pendingProgress.current / SCRUB_DONE_AT, 1) * SCRUB_END
    const target = Math.min(videoProgress * video.duration, video.duration - 0.05)
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
      // -mt-16 overlay header (phải khớp h-16 của Navbar) — hero bắt đầu ở đầu
      // document để pin và progress cùng điểm xuất phát, không có vùng cuộn chết.
      className={`relative bg-black ${pinned ? '-mt-16 h-[160svh] md:h-[190svh]' : 'h-[100svh]'}`}
    >
      <h1 className="sr-only">STORE 3D — Mô hình in 3D cao cấp</h1>

      <div
        className={`flex h-[calc(100svh_-_4rem)] flex-col overflow-hidden ${
          pinned ? 'sticky top-16' : 'relative'
        }`}
      >
        {/* Video / fallback poster — object-contain: toàn khung (gồm chân) luôn thấy */}
        <div className="relative h-[min(calc(100vw*9/16),calc(100svh_-_9.5rem))] shrink-0 overflow-hidden bg-black">
          {videoFailed ? (
            <img
              src={POSTER_SRC}
              alt="Mô hình Gundam AO BING được in 3D"
              className="absolute inset-0 size-full object-contain"
              fetchPriority="high"
            />
          ) : (
            <video
              ref={videoRef}
              className="absolute inset-0 size-full object-contain"
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
        </div>

        {/* Band điều khiển: hint → CTA crossfade + progress hairline */}
        <div className="relative h-[5.5rem] shrink-0">
          {/* Scroll hint — mờ dần ngay khi bắt đầu cuộn */}
          {!showStaticCta && (
            <motion.div
              style={{ opacity: hintOpacity }}
              className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1"
              aria-hidden="true"
            >
              <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/70">
                Cuộn để khám phá
              </span>
              <ChevronDown className="size-4 animate-bounce text-white/50" />
            </motion.div>
          )}

          {/* CTA — fade-in khi hiệu ứng gần kết thúc.
              Khi showStaticCta phải truyền giá trị tường minh (không phải undefined):
              framer-motion không clear style cũ khi prop chuyển undefined →
              inline opacity:0 stale làm CTA biến mất trong fallback. */}
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center px-4"
            style={
              showStaticCta
                ? { opacity: 1, y: 0, pointerEvents: 'auto' }
                : { opacity: ctaOpacity, y: ctaY, pointerEvents: ctaPointer }
            }
          >
            <Button
              size="lg"
              className="group gap-2 bg-[#00E5FF] px-8 text-base font-semibold text-[#070A12] shadow-[0_0_24px_rgba(0,229,255,0.35)] hover:bg-[#33EBFF] dark:bg-[#00E5FF] dark:text-[#070A12] dark:hover:bg-[#33EBFF]"
              asChild
            >
              <Link to={ctaHref} aria-label="Mua ngay">
                Mua ngay
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </Button>
          </motion.div>

          {/* Progress hairline — progress cuộn (khác video progress, xem SCRUB_END) */}
          {!showStaticCta && (
            <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" aria-hidden="true">
              <motion.div style={{ scaleX: scrollProgress }} className="h-full origin-left bg-[#00E5FF]" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
