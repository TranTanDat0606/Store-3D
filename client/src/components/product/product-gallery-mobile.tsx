import { useState, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { resolveImageUrl, cn, calculateDiscountPercent } from '@/lib'
import { ProductLightbox } from './product-lightbox'
import type { Product } from '@/types'

interface ProductGalleryMobileProps {
  product: Product
}

export function ProductGalleryMobile({ product }: ProductGalleryMobileProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const images = product.images.length > 0 ? product.images : ['']
  const discountPercent = calculateDiscountPercent(product.originalPrice ?? 0, product.salePrice ?? 0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeImage < images.length - 1) {
        setActiveImage((prev) => prev + 1)
      } else if (diff < 0 && activeImage > 0) {
        setActiveImage((prev) => prev - 1)
      }
    }
  }, [activeImage, images.length])

  return (
    <>
      <div className="relative">
        {/* Main image */}
        <div
          className="bg-muted relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setLightboxOpen(true)}
          role="button"
          aria-label="Phóng to ảnh sản phẩm"
        >
          <img
            src={resolveImageUrl(images[activeImage])}
            alt={product.name}
            className="size-full object-contain"
            draggable={false}
          />
          {discountPercent > 0 && (
            <Badge className="bg-destructive absolute top-4 left-4 z-10 text-white">
              -{discountPercent}%
            </Badge>
          )}
        </div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={cn(
                  'size-2 rounded-full transition-all',
                  i === activeImage ? 'bg-primary w-4' : 'bg-white/60'
                )}
                aria-label={`Ảnh ${i + 1}`}
                aria-current={i === activeImage ? 'true' : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <ProductLightbox
            images={images}
            activeIndex={activeImage}
            onClose={() => setLightboxOpen(false)}
            onNavigate={setActiveImage}
          />
        )}
      </AnimatePresence>
    </>
  )
}
