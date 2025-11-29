import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/transporters - List all transporters
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const transporters = await prisma.transporter.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return successResponse(transporters)
  } catch (error) {
    console.error('Error fetching transporters:', error)
    return errorResponse('Failed to fetch transporters', 500)
  }
})

// POST /api/transporters - Create new transporter
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const { name, code, address, contactPerson, phone, email } = body

    if (!name || !code) {
      return errorResponse('Name and code are required', 400)
    }

    // Check if code already exists
    const existing = await prisma.transporter.findUnique({
      where: { code }
    })

    if (existing) {
      return errorResponse('Transporter with this code already exists', 400)
    }

    const transporter = await prisma.transporter.create({
      data: {
        name,
        code,
        address,
        contactPerson,
        phone,
        email
      }
    })

    return successResponse(transporter, 201)
  } catch (error) {
    console.error('Error creating transporter:', error)
    return errorResponse('Failed to create transporter', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
