import { useEffect, useState } from 'react'
import { reviewApi } from '@/services'
import type { ReviewEligibility } from '@/types'

/**
 * Fetches the current user's review eligibility for a set of products.
 * Returns a map of productId → ReviewEligibility.
 */
export function useReviewEligibility(productIds: string[]): Record<string, ReviewEligibility> {
  const [map, setMap] = useState<Record<string, ReviewEligibility>>({})

  const idsKey = JSON.stringify([...new Set(productIds.filter(Boolean))].sort())

  useEffect(() => {
    let cancelled = false
    const ids = (JSON.parse(idsKey) as string[])
    if (ids.length === 0) {
      setMap({})
      return
    }
    Promise.all(ids.map((id) => reviewApi.me(id).catch(() => null))).then((results) => {
      if (cancelled) return
      const next: Record<string, ReviewEligibility> = {}
      results.forEach((el, i) => {
        if (el) next[ids[i]] = el
      })
      setMap(next)
    })
    return () => {
      cancelled = true
    }
  }, [idsKey])

  return map
}
