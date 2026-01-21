import { NextRequest } from "next/server"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"
import { createAutoSendBatch, processAutoSendBatch } from "@/lib/services/auto-send"
import { prisma } from "@/lib/prisma"

export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json().catch(() => ({}))
    const settings = await prisma.autoSendSettings.findUnique({ where: { id: 'default' } })
    const recipientIds = Array.isArray(body.recipientIds) && body.recipientIds.length > 0
      ? body.recipientIds
      : settings?.selectedRecipientIds

    const result = await createAutoSendBatch({
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
      recipientIds,
      includeCertificates: body.includeCertificates !== false,
      initiatedBy: session.user.id
    })

    if (!result.success) {
      return errorResponse(result.message || 'Auto-send failed', 400)
    }

    if (result.batchId) {
      processAutoSendBatch(result.batchId, session.user.id).catch((error) => {
        console.error('Error processing auto-send batch:', error)
      })
    }

    return successResponse(result)
  } catch (error) {
    console.error('Error running auto-send:', error)
    return errorResponse('Failed to run auto-send', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
