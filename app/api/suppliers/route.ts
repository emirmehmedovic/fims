import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/suppliers - List all suppliers with pagination and search
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = includeInactive ? {} : { isActive: true }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const totalCount = await prisma.supplier.count({ where })

    // Get paginated results
    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    return successResponse({
      data: suppliers,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
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
