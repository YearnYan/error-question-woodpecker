import { createHash } from 'crypto'

const cache = new Map<string, { data: string; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export function getCacheKey(content: string): string {
  return createHash('md5').update(content).digest('hex')
}

export function getFromCache(key: string): string | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

export function setCache(key: string, data: string): void {
  // Limit cache size
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
  cache.set(key, { data, timestamp: Date.now() })
}

export function clearCache(): void {
  cache.clear()
}
