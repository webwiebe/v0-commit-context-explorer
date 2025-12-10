// Simple in-memory cache with TTL to avoid rate limiting
// Cache persists for the lifetime of the server process

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }

  return entry.data
}

export function setCache<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  })
}

export function clearCache(): void {
  cache.clear()
}

// Default TTLs
export const CACHE_TTL = {
  COMMIT: 10 * 60 * 1000, // 10 minutes for commit data
  DIFF: 30 * 60 * 1000, // 30 minutes for diff data (rarely changes)
  SUMMARY: 60 * 60 * 1000, // 1 hour for AI summaries
  PATH_COMMITS: 15 * 60 * 1000, // 15 minutes for path-filtered commits
} as const
