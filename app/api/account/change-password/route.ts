import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"
import { compare, hash } from "bcryptjs"

export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return errorResponse('Trenutna i nova lozinka su obavezne', 400)
    }

    const strengthChecks = {
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword)
    }

    const isStrong = Object.values(strengthChecks).every(Boolean)
    if (!isStrong) {
      return errorResponse('Lozinka mora imati najmanje 8 znakova i sadržavati veliko slovo, malo slovo, broj i specijalni znak', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return errorResponse('Korisnik nije pronađen', 404)
    }

    const isValid = await compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return errorResponse('Trenutna lozinka nije tačna', 400)
    }

    if (currentPassword === newPassword) {
      return errorResponse('Nova lozinka mora biti različita od trenutne', 400)
    }

    const passwordHash = await hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date()
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'User',
        changes: {
          action: 'password_change',
          userId: session.user.id
        }
      }
    })

    return successResponse({ message: 'Lozinka je uspješno promijenjena' })
  } catch (error) {
    console.error('Error changing password:', error)
    return errorResponse('Neuspješno mijenjanje lozinke', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'])
