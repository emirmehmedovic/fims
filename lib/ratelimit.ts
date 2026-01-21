import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Initialize Redis client from environment variables
// Note: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

// Only initialize if environment variables are present
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  // Create rate limiter instance
  // Allows 5 login attempts per minute per email
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
  })
}

/**
 * Rate limit a login attempt
 * @param email User email address
 * @returns Object with success boolean and optional limit/remaining info
 */
export async function checkLoginRateLimit(email: string): Promise<{
  success: boolean
  limit?: number
  remaining?: number
  reset?: number
}> {
  // If rate limiting is not configured, allow the request
  if (!ratelimit) {
    return { success: true }
  }

  const identifier = `login:${email.toLowerCase()}`
  const result = await ratelimit.limit(identifier)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitEnabled(): boolean {
  return ratelimit !== null
}
