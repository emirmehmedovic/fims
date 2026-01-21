import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api/response"
import { createAutoSendBatch, processAutoSendBatch } from "@/lib/services/auto-send"
import { prisma } from "@/lib/prisma"

export const POST = async (req: NextRequest) => {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!secret) {
    return errorResponse('CRON secret not configured', 500)
  }

  if (token !== secret) {
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
