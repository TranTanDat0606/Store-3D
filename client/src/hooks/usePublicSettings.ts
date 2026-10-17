import { useEffect, useState } from 'react'
import { settingsApi, type PublicSettings } from '@/services/settings'

/**
 * Fetch-once snapshot of `GET /api/settings/public` for footer/contact rows.
 *
 * Cache mechanics: a module-level variable (no React context, no new deps)
 * holds the resolved snapshot plus the single in-flight promise, so every
 * mount — including concurrent mounts in the same tick — shares ONE request.
 * Fail-safe: any request error resolves to `{}` (hide-on-absent ⇒ all contact
 * rows omitted, no crash, no placeholders). Refetch is intentionally not
 * supported: a page-load snapshot is enough for the footer.
 */

let snapshot: PublicSettings | null = null
let inflight: Promise<PublicSettings> | null = null

function fetchOnce(): Promise<PublicSettings> {
  if (snapshot) return Promise.resolve(snapshot)
  if (!inflight) {
    inflight = settingsApi
      .getPublic()
      .then((settings) => {
        snapshot = settings ?? {}
        return snapshot
      })
      .catch(() => {
        // Fail-safe: error ⇒ empty snapshot (all rows hidden), never a crash.
        snapshot = {}
        return snapshot
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export function usePublicSettings(): { settings: PublicSettings; loading: boolean } {
  const [settings, setSettings] = useState<PublicSettings>(() => snapshot ?? {})
  const [loading, setLoading] = useState(() => snapshot === null)

  useEffect(() => {
    if (snapshot) {
      setSettings(snapshot)
      setLoading(false)
      return
    }
    let active = true
    void fetchOnce().then((s) => {
      if (!active) return
      setSettings(s)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return { settings, loading }
}
