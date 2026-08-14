import { NextRequest } from 'next/server'

/**
 * CSRF Protection Middleware
 *
 * Validates Origin/Referer headers for state-changing operations
 * Prevents Cross-Site Request Forgery attacks
 */
export function validateCSRF(req: NextRequest): { valid: boolean; error?: string } {
  const method = req.method

  // Only validate state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return { valid: true }
  }

  // Get allowed origins
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_URL,
    'http://localhost:3000',
    'http://localhost:3001'
  ].filter((origin): origin is string => Boolean(origin))

  // Get request origin
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')

  // Check origin header (preferred)
  if (origin) {
    const isAllowed = allowedOrigins.some(allowed =>
      origin === allowed || origin.startsWith(allowed + '/')
    )

    if (isAllowed) {
      return { valid: true }
    }

    return {
      valid: false,
      error: `CSRF validation failed: Invalid origin ${origin}`
    }
  }

  // Fallback to referer header
  if (referer) {
    const isAllowed = allowedOrigins.some(allowed =>
      referer.startsWith(allowed)
    )

    if (isAllowed) {
      return { valid: true }
    }

    return {
      valid: false,
      error: `CSRF validation failed: Invalid referer ${referer}`
    }
  }

  // No origin or referer header
  // Allow if X-Requested-With header is present (XMLHttpRequest / fetch with custom headers)
  // This is safe because custom headers require CORS preflight which validates origin
  const xRequestedWith = req.headers.get('x-requested-with')
  if (xRequestedWith === 'XMLHttpRequest' || xRequestedWith === 'fetch') {
    return { valid: true }
  }

  // Check for Authorization header (API key / Bearer token requests are inherently CSRF-safe)
  const authorization = req.headers.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return { valid: true }
  }

  return {
    valid: false,
    error: 'CSRF validation failed: Missing origin/referer headers'
  }
}
