import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

const SETTINGS_ID = 'default'

const getSettings = async () => {
  const existing = await prisma.autoSendSettings.findUnique({
    where: { id: SETTINGS_ID }
  })

  if (existing) {
    return existing
  }

  return prisma.autoSendSettings.create({
    data: { id: SETTINGS_ID }
  })
}

export const GET = withAuth(async () => {
  try {
    const settings = await getSettings()
    return successResponse(settings)
  } catch (error) {
    console.error('Error fetching auto-send settings:', error)
    return errorResponse('Failed to fetch settings', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

export const PATCH = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const hasEnabled = typeof body.isEnabled === 'boolean'
    const hasRecipients = Array.isArray(body.selectedRecipientIds)
    if (!hasEnabled && !hasRecipients) {
      return errorResponse('Invalid payload', 400)
    }

    const settings = await prisma.autoSendSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        ...(hasEnabled ? { isEnabled: body.isEnabled } : {}),
        ...(hasRecipients ? { selectedRecipientIds: body.selectedRecipientIds } : {}),
        updatedBy: session.user.id
      },
      create: {
        id: SETTINGS_ID,
        isEnabled: hasEnabled ? body.isEnabled : true,
        selectedRecipientIds: hasRecipients ? body.selectedRecipientIds : [],
        updatedBy: session.user.id
      }
    })

    return successResponse(settings)
  } catch (error) {
    console.error('Error updating auto-send settings:', error)
    return errorResponse('Failed to update settings', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
