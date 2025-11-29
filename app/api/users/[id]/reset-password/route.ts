import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"
import { hash } from "bcryptjs"

// POST /api/users/:id/reset-password - Admin resets user password
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params
    const body = await req.json()
    const { newPassword } = body

    if (!newPassword) {
      return errorResponse('New password is required', 400)
    }

    if (newPassword.length < 8) {
      return errorResponse('Password must be at least 8 characters', 400)
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return errorResponse('User not found', 404)
    }

    // Hash new password
    const passwordHash = await hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordChangedAt: new Date()
      }
    })

    // Log audit (entityId is FK to FuelEntry, so we omit it for User actions)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'User',
        changes: {
          targetUserId: id,
          action: 'password_reset',
          resetBy: session.user.name
        }
      }
    })

    return successResponse({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Error resetting password:', error)
    return errorResponse('Failed to reset password', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
