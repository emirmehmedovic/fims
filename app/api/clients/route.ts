import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/clients - List all clients with pagination and search
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
    const totalCount = await prisma.client.count({ where })

    // Get paginated results
    const clients = await prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    return successResponse({
      data: clients,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return errorResponse('Failed to fetch clients', 500)
  }
})

// POST /api/clients - Create new client
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const { name, code, address, contactPerson, phone, email, pib, idNumber } = body

    if (!name) {
      return errorResponse('Name is required', 400)
    }

    // Check if code already exists (if provided)
    if (code) {
      const existing = await prisma.client.findUnique({
        where: { code }
      })

      if (existing) {
        return errorResponse('Client with this code already exists', 400)
      }
    }

    const client = await prisma.client.create({
      data: {
        name,
        code,
        address,
        contactPerson,
        phone,
        email,
        pib,
        idNumber
      }
    })

    return successResponse(client, 201)
  } catch (error) {
    console.error('Error creating client:', error)
    return errorResponse('Failed to create client', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
