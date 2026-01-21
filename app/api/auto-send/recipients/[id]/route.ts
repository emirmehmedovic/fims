import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

export const PATCH = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params
    const body = await req.json()

    const recipient = await prisma.autoEmailRecipient.update({
      where: { id },
      data: {
        ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
        ...(body.name !== undefined ? { name: body.name ? String(body.name).trim() : null } : {})
      }
    })

    return successResponse(recipient)
  } catch (error) {
    console.error('Error updating auto-send recipient:', error)
    return errorResponse('Failed to update recipient', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

export const DELETE = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params
    await prisma.autoEmailRecipient.delete({ where: { id } })
    return successResponse({ id })
  } catch (error) {
    console.error('Error deleting auto-send recipient:', error)
    return errorResponse('Failed to delete recipient', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
