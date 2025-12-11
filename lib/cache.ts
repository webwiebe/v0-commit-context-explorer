// Cache with Redis support (persistent) and in-memory fallback
// Redis is used when REDIS_URL is set (e.g., in Docker deployment)
// Falls back to in-memory cache for local development

import Redis from "ioredis"

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// In-memory cache fallback
const memoryCache = new Map<string, CacheEntry<unknown>>()

// Redis client (only created if REDIS_URL is set)
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
    redis.on("error", (err: Error) => {
      console.error("[Cache] Redis error:", err.message)
    })
    redis.on("connect", () => {
      console.log("[Cache] Connected to Redis")
    })
  }
  return redis
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redisClient = getRedis()

  if (redisClient) {
    try {
      const data = await redisClient.get(key)
      if (data) {
        return JSON.parse(data) as T
      }
      return null
    } catch (err) {
      console.error("[Cache] Redis get error:", err)
      // Fall through to memory cache
    }
  }

  // In-memory fallback
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > entry.ttl) {
    memoryCache.delete(key)
    return null
  }

  return entry.data
}

export async function setCache<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): Promise<void> {
  const redisClient = getRedis()

  if (redisClient) {
    try {
      const ttlSeconds = Math.ceil(ttlMs / 1000)
      await redisClient.setex(key, ttlSeconds, JSON.stringify(data))
      return
    } catch (err) {
      console.error("[Cache] Redis set error:", err)
      // Fall through to memory cache
    }
  }

  // In-memory fallback
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  })
}

export async function clearCache(): Promise<void> {
  const redisClient = getRedis()

  if (redisClient) {
    try {
      await redisClient.flushdb()
    } catch (err) {
      console.error("[Cache] Redis clear error:", err)
    }
  }

  memoryCache.clear()
}

// Default TTLs
export const CACHE_TTL = {
  COMMIT: 10 * 60 * 1000, // 10 minutes for commit data
  DIFF: 30 * 60 * 1000, // 30 minutes for diff data (rarely changes)
  SUMMARY: 60 * 60 * 1000, // 1 hour for AI summaries (expensive!)
  PATH_COMMITS: 15 * 60 * 1000, // 15 minutes for path-filtered commits
  AI_CHANGELOG: 60 * 60 * 1000, // 1 hour for AI changelog summaries
  AI_MACHCONFIG: 60 * 60 * 1000, // 1 hour for AI mach-config analysis
} as const
