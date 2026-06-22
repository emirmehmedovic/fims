import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/stations - List all stations with pagination and search
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
        { address: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const totalCount = await prisma.station.count({ where })

    // Get paginated results
    const stations = await prisma.station.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    return successResponse({
      data: stations,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching stations:', error)
    return errorResponse('Failed to fetch stations', 500)
  }
})

// POST /api/stations - Create new station
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const { name, code, address, contactPerson, phone, email } = body

    if (!name) {
      return errorResponse('Name is required', 400)
    }

    if (!code) {
      return errorResponse('Code is required', 400)
    }

    if (!address) {
      return errorResponse('Address is required', 400)
    }

    // Check if code already exists
    const existing = await prisma.station.findUnique({
      where: { code }
    })

    if (existing) {
      return errorResponse('Station with this code already exists', 400)
    }

    const station = await prisma.station.create({
      data: {
        name,
        code,
        address,
        contactPerson,
        phone,
        email
      }
    })

    return successResponse(station, 201)
  } catch (error) {
    console.error('Error creating station:', error)
    return errorResponse('Failed to create station', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
