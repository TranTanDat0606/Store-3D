import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { resolveImageUrl, cn, calculateDiscountPercent } from '@/lib'
import { ProductLightbox } from './product-lightbox'
import type { Product } from '@/types'

interface ProductGalleryProps {
  product: Product
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const images = product.images.length > 0 ? product.images : ['']
  const discountPercent = calculateDiscountPercent(product.originalPrice ?? 0, product.salePrice ?? 0)

  return (
    <>
      <div className="flex flex-col-reverse gap-4 lg:flex-row">
        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 lg:flex-col">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={cn(
                  'bg-muted size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all lg:size-20',
                  activeImage === i ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                )}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={activeImage === i ? 'true' : undefined}
              >
                <img src={resolveImageUrl(img)} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div
          className="bg-muted relative flex flex-1 cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl"
          onClick={() => setLightboxOpen(true)}
          role="button"
          aria-label="Phóng to ảnh sản phẩm"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
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
