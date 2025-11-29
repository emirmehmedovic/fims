import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { Role } from "@prisma/client"

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

    if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }

    return handler(req, context, session)
  }
}
