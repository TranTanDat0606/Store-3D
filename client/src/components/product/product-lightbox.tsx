import { useEffect, useCallback, useState } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { resolveImageUrl, cn } from '@/lib'

interface ProductLightboxProps {
  images: string[]
  activeIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function ProductLightbox({ images, activeIndex, onClose, onNavigate }: ProductLightboxProps) {
  const [zoomed, setZoomed] = useState(false)

  const goNext = useCallback(() => {
    if (activeIndex < images.length - 1) {
      onNavigate(activeIndex + 1)
      setZoomed(false)
    }
  }, [activeIndex, images.length, onNavigate])

  const goPrev = useCallback(() => {
    if (activeIndex > 0) {
      onNavigate(activeIndex - 1)
      setZoomed(false)
    }
  }, [activeIndex, onNavigate])

  const toggleZoom = useCallback(() => {
    setZoomed((z) => !z)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, goNext, goPrev])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-label="Ảnh phóng to"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Đóng"
      >
        <X className="size-6" />
      </button>

      {activeIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          aria-label="Ảnh trước"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {activeIndex < images.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          aria-label="Ảnh tiếp"
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 text-white/70 text-sm">
        {activeIndex + 1} / {images.length}
      </div>

      <button
        onClick={toggleZoom}
        className="absolute bottom-20 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label={zoomed ? 'Thu nhỏ' : 'Phóng to'}
      >
        {zoomed ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
      </button>

      <div
        className="flex h-full w-full items-center justify-center p-12"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={resolveImageUrl(images[activeIndex])}
            alt=""
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'max-h-full max-w-full cursor-pointer object-contain transition-transform',
              zoomed ? 'scale-200' : 'scale-100'
            )}
            onDoubleClick={toggleZoom}
            draggable={false}
          />
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                onNavigate(i)
                setZoomed(false)
              }}
              className={cn(
                'size-12 overflow-hidden rounded-lg border-2 transition-all',
                i === activeIndex ? 'border-white' : 'border-white/30 opacity-60 hover:opacity-100'
              )}
              aria-label={`Ảnh ${i + 1}`}
            >
              <img src={resolveImageUrl(img)} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
