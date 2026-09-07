import apiClient from './apiClient'

type AssetType = 'background' | 'road' | 'player' | 'bird-robot' | 'mouse-robot'

interface CachedAsset {
  dataUrl: string
  timestamp: number
}

const CACHE_KEY = 'store3d_miu9_assets'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function loadCache(): Record<string, CachedAsset> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCache(cache: Record<string, CachedAsset>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // quota exceeded — clear old entries
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch { /* noop */ }
  }
}

function isCacheValid(entry: CachedAsset): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL
}

const inflight = new Map<string, Promise<string | null>>()

export async function getGameAsset(assetType: AssetType): Promise<string | null> {
  const cache = loadCache()
  const cached = cache[assetType]
  if (cached && isCacheValid(cached)) {
    return cached.dataUrl
  }

  if (inflight.has(assetType)) {
    return inflight.get(assetType)!
  }

  const promise = fetchAndCache(assetType, cache)
  inflight.set(assetType, promise)

  try {
    return await promise
  } finally {
    inflight.delete(assetType)
  }
}

async function fetchAndCache(assetType: AssetType, cache: Record<string, CachedAsset>): Promise<string | null> {
  try {
    const res = await apiClient.post<{ data: { base64: string; mimeType: string; cached: boolean } }>(
      '/gemini/game-asset',
      { assetType },
    )
    const { base64, mimeType } = res.data.data
    const dataUrl = `data:${mimeType};base64,${base64}`

    cache[assetType] = { dataUrl, timestamp: Date.now() }
    saveCache(cache)

    return dataUrl
  } catch {
    return null
  }
}

export async function preloadGameAssets(onProgress?: (loaded: number, total: number) => void): Promise<Record<AssetType, string | null>> {
  const types: AssetType[] = ['background', 'road', 'player', 'bird-robot', 'mouse-robot']
  const results: Record<string, string | null> = {}
  let loaded = 0

  await Promise.all(
    types.map(async (type) => {
      results[type] = await getGameAsset(type)
      loaded++
      onProgress?.(loaded, types.length)
    }),
  )

  return results as Record<AssetType, string | null>
}

export function clearAssetCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch { /* noop */ }
}
