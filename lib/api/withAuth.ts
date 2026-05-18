import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { Role } from "@prisma/client"
import { validateCSRF } from "@/lib/api/csrf"

type Handler = (
  req: NextRequest,
  context: { params: Promise<any> },
  session: any
) => Promise<NextResponse>

export function withAuth(handler: Handler, allowedRoles?: Role[]) {
  return async (req: NextRequest, context: { params: Promise<any> }) => {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // CSRF Protection: Validate origin/referer for state-changing operations
    const csrfValidation = validateCSRF(req)
    if (!csrfValidation.valid) {
      console.error('[CSRF] Protection triggered:', csrfValidation.error)
      return NextResponse.json(
        { success: false, error: 'CSRF validation failed' },
        { status: 403 }
      )
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }

    return handler(req, context, session)
  }
}
