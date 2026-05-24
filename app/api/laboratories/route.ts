import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/laboratories - List all laboratories with pagination and search
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
        { accreditationNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const totalCount = await prisma.laboratory.count({ where })

    // Get paginated results
    const laboratories = await prisma.laboratory.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    return successResponse({
      data: laboratories,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
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
