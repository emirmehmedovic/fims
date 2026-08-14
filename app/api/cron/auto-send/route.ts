import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api/response"
import { createAutoSendBatch, processAutoSendBatch } from "@/lib/services/auto-send"
import { prisma } from "@/lib/prisma"
import { timingSafeEqual } from "crypto"

// In-memory rate limiting for cron endpoint
const cronAttempts = new Map<string, { count: number; windowStart: number }>()
const CRON_RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const CRON_MAX_ATTEMPTS = 10 // Max 10 attempts per minute

function checkCronRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = cronAttempts.get(ip)

  if (!entry || (now - entry.windowStart) > CRON_RATE_LIMIT_WINDOW) {
    cronAttempts.set(ip, { count: 1, windowStart: now })
    return true
  }

  entry.count++
  return entry.count <= CRON_MAX_ATTEMPTS
}

// Timing-safe string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

export const POST = async (req: NextRequest) => {
  // Get client IP for rate limiting
  const forwardedFor = req.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown'

  // Rate limit check
  if (!checkCronRateLimit(ip)) {
    console.warn(`[CRON] Rate limit exceeded for IP: ${ip}`)
    return errorResponse('Too many requests', 429)
  }

  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  // Validate CRON_SECRET is configured and strong
  if (!secret || secret.length < 32) {
    console.error('[CRON] CRON_SECRET not configured or too weak (must be 32+ chars)')
    return errorResponse('CRON secret not configured', 500)
  }

  // Timing-safe token comparison
  if (!token || !safeCompare(token, secret)) {
    console.warn(`[CRON] Unauthorized attempt from IP: ${ip}`)
    return errorResponse('Unauthorized', 401)
  }

  try {
    const settings = await prisma.autoSendSettings.findUnique({
      where: { id: 'default' }
    })
    if (settings && !settings.isEnabled) {
      return successResponse({ skipped: true, reason: 'Auto-send paused' })
    }

    const body = await req.json().catch(() => ({}))
    const result = await createAutoSendBatch({
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
      recipientIds: settings?.selectedRecipientIds,
      includeCertificates: body.includeCertificates !== false
    })

    if (!result.success) {
      return errorResponse(result.message || 'Auto-send failed', 400)
    }

    if (result.batchId) {
      await processAutoSendBatch(result.batchId)
    }

    return successResponse(result)
  } catch (error) {
    console.error('Error running cron auto-send:', error)
    return errorResponse('Failed to run cron auto-send', 500)
  }
}
