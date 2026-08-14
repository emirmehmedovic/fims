import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Initialize Redis client from environment variables
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

// Only initialize Redis if environment variables are present
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
  })
}

// ============================================
// IN-MEMORY RATE LIMITER (Fallback when no Redis)
// ============================================
interface RateLimitEntry {
  attempts: number
  windowStart: number
}

// In-memory store for rate limiting
const inMemoryStore = new Map<string, RateLimitEntry>()

// Configuration
const IN_MEMORY_WINDOW_MS = 60 * 1000  // 1 minute window
const IN_MEMORY_MAX_ATTEMPTS = 5       // Max 5 attempts per window

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now - entry.windowStart > IN_MEMORY_WINDOW_MS * 2) {
      inMemoryStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * In-memory rate limit check
 */
function checkInMemoryRateLimit(identifier: string): {
  success: boolean
  limit: number
  remaining: number
  reset: number
} {
  const now = Date.now()
  const entry = inMemoryStore.get(identifier)

  // No entry or window expired - create new entry
  if (!entry || (now - entry.windowStart) > IN_MEMORY_WINDOW_MS) {
    inMemoryStore.set(identifier, { attempts: 1, windowStart: now })
    return {
      success: true,
      limit: IN_MEMORY_MAX_ATTEMPTS,
      remaining: IN_MEMORY_MAX_ATTEMPTS - 1,
      reset: now + IN_MEMORY_WINDOW_MS
    }
  }

  // Window still active - increment attempts
  entry.attempts++
  const remaining = Math.max(0, IN_MEMORY_MAX_ATTEMPTS - entry.attempts)
  const success = entry.attempts <= IN_MEMORY_MAX_ATTEMPTS

  return {
    success,
    limit: IN_MEMORY_MAX_ATTEMPTS,
    remaining,
    reset: entry.windowStart + IN_MEMORY_WINDOW_MS
  }
}

/**
 * Rate limit a login attempt
 * Uses Redis if available, falls back to in-memory rate limiting
 * @param email User email address
 * @returns Object with success boolean and limit info
 */
export async function checkLoginRateLimit(email: string): Promise<{
  success: boolean
  limit?: number
  remaining?: number
  reset?: number
}> {
  const identifier = `login:${email.toLowerCase()}`

  // Use Redis rate limiter if available
  if (ratelimit) {
    const result = await ratelimit.limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  }

  // Fallback to in-memory rate limiting
  return checkInMemoryRateLimit(identifier)
}

/**
 * Check if Redis rate limiting is enabled
 */
export function isRedisRateLimitEnabled(): boolean {
  return ratelimit !== null
}

/**
 * Check if any rate limiting is enabled (always true now with in-memory fallback)
 */
export function isRateLimitEnabled(): boolean {
  return true
}
