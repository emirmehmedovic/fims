import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

export const PATCH = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const name = body.name ? String(body.name).trim() : ''

    if (!name || name.length < 2) {
      return errorResponse('Ime mora imati najmanje 2 znaka', 400)
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'User',
        changes: {
          action: 'profile_update',
          userId: session.user.id
        }
      }
    })

    return successResponse({ name: user.name })
  } catch (error) {
    console.error('Error updating profile:', error)
    return errorResponse('Neuspješno ažuriranje profila', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'])
