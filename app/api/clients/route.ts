import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/clients - List all clients
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const clients = await prisma.client.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' }
    })

    return successResponse(clients)
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
