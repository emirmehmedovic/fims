import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/laboratories - List all laboratories
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const laboratories = await prisma.laboratory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' }
    })

    return successResponse(laboratories)
  } catch (error) {
    console.error('Error fetching laboratories:', error)
    return errorResponse('Failed to fetch laboratories', 500)
  }
})

// POST /api/laboratories - Create new laboratory
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const { name, accreditationNumber, address, contactPerson, phone, email } = body

    if (!name) {
      return errorResponse('Name is required', 400)
    }

    const laboratory = await prisma.laboratory.create({
      data: {
        name,
        accreditationNumber,
        address,
        contactPerson,
        phone,
        email
      }
    })

    return successResponse(laboratory, 201)
  } catch (error) {
    console.error('Error creating laboratory:', error)
    return errorResponse('Failed to create laboratory', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
