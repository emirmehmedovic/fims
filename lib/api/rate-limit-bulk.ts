/**
 * Rate Limiter for Bulk Export Operations
 *
 * Prevents abuse by limiting bulk PDF generation requests
 * Uses in-memory storage (suitable for single-server deployment)
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (per server instance)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  error?: string
}

/**
 * Check rate limit for bulk export operations
 *
 * @param userId - User ID to track
 * @param limit - Maximum requests per window (default: 5)
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 */
export function checkBulkExportRateLimit(
  userId: string,
  limit: number = 5,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): RateLimitResult {
  const key = `bulk-export:${userId}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Create new entry or reset if expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs
    }
    rateLimitStore.set(key, entry)
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000 / 60) // minutes
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      error: `Rate limit exceeded. Try again in ${resetIn} minutes.`
    }
  }

  // Increment counter
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Reset rate limit for a user (admin override)
 */
export function resetBulkExportRateLimit(userId: string): void {
  const key = `bulk-export:${userId}`
  rateLimitStore.delete(key)
}

/**
 * Get current rate limit status for a user
 */
export function getBulkExportRateLimitStatus(userId: string, limit: number = 5): {
  count: number
  remaining: number
  resetTime: number | null
} {
  const key = `bulk-export:${userId}`
  const entry = rateLimitStore.get(key)
  const now = Date.now()

  if (!entry || now > entry.resetTime) {
    return {
      count: 0,
      remaining: limit,
      resetTime: null
    }
  }

  return {
    count: entry.count,
    remaining: Math.max(0, limit - entry.count),
    resetTime: entry.resetTime
  }
}
