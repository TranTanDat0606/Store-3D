import { useEffect, useState } from 'react'
import { productApi, categoryApi, newsApi } from '@/services'
import { AobingHero } from '@/components/home/aobing-hero'
import { FlashSaleSection } from '@/components/home/flash-sale-section'
import { CategoriesSection } from '@/components/home/categories-section'
import { BestSellersSection } from '@/components/home/best-sellers-section'
import { NewsSection } from '@/components/home/news-section'
import { CtaBand } from '@/components/home/cta-band'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { Category, News, Product } from '@/types'

/**
 * Home theo bộ màn hình `home-desktop|tablet|mobile` (Plan 3 T2).
 *
 * Section order (non-hero): Flash sale → Danh mục nổi bật → Sản phẩm bán chạy
 * nhất → Góc 3D & Tin tức sáng tạo → CTA band.
 *
 * Data sources (label/API truth):
 * - Flash sale  → productApi.list(sort=discount)   (giảm giá sâu nhất — THẬT)
 * - Categories  → categoryApi.all()                 (productCount thật)
 * - Best sellers→ productApi.list(sort=best-selling)(aggregate đã bán — THẬT;
 *                 KHÔNG dùng featured để ghi nhãn "bán chạy")
 * - News        → newsApi.list(limit=3)             (bài published mới nhất)
 * - CTA hotline → usePublicSettings (hide-on-absent)
 *
 * Stats block: KHÔNG tồn tại trên home hiện tại (T3 sẽ xác nhận grep).
 */
export default function HomePage() {
  useDocumentTitle('Mô hình in 3D')
  const [flashSale, setFlashSale] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      productApi.list({ sort: 'discount', status: 'active', limit: 4 }),
      categoryApi.all(),
      newsApi.list({ limit: 3 }),
    ])
      .then(([discountResult, cats, newsResult]) => {
        if (cancelled) return
        setFlashSale(
          (Array.isArray(discountResult?.data) ? discountResult.data : []).filter(
            (p) => p.originalPrice > p.salePrice,
          ),
        )
        setCategories(Array.isArray(cats) ? cats : [])
        setNews(Array.isArray(newsResult?.data) ? newsResult.data : [])
      })
      .catch(() => {
        // lỗi → section tương ứng tự ẩn/empty state, không crash
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      {/* Hero - AO BING cinematic (Plan 3 T1 — không đụng tới ở T2) */}
      <AobingHero />

      {/* Flash sale — sản phẩm giảm giá sâu nhất (sort=discount) */}
      <FlashSaleSection products={flashSale} />

      {/* Danh mục nổi bật — categoryApi.all() */}
      <CategoriesSection categories={categories} />

      {/* Sản phẩm bán chạy nhất — sort=best-selling (aggregate đơn hàng thật) */}
      <BestSellersSection categories={categories} />

      {/* Góc 3D & Tin tức sáng tạo — /api/news (published) */}
      {!loading && <NewsSection articles={news} />}

      {/* CTA band — hotline settings-driven */}
      <CtaBand />
    </div>
  )
}
