import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/suppliers - List all suppliers
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const suppliers = await prisma.supplier.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' }
    })

    return successResponse(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return errorResponse('Failed to fetch suppliers', 500)
  }
})

// POST /api/suppliers - Create new supplier
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const { name, code, address, contactPerson, phone, email } = body

    if (!name || !code) {
      return errorResponse('Name and code are required', 400)
    }

    // Check if code already exists
    const existing = await prisma.supplier.findUnique({
      where: { code }
    })

    if (existing) {
      return errorResponse('Supplier with this code already exists', 400)
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        code,
        address,
        contactPerson,
        phone,
        email
      }
    })

    return successResponse(supplier, 201)
  } catch (error) {
    console.error('Error creating supplier:', error)
    return errorResponse('Failed to create supplier', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
