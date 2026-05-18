import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/clients/:id - Get single client
export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params

    const client = await prisma.client.findUnique({
      where: { id }
    })

    if (!client) {
      return errorResponse('Client not found', 404)
    }

    return successResponse(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return errorResponse('Failed to fetch client', 500)
  }
})

// PATCH /api/clients/:id - Update client
export const PATCH = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { name, code, address, contactPerson, phone, email, pib, idNumber, isActive } = body

    const existing = await prisma.client.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Client not found', 404)
    }

    // If code is being changed, check for duplicates
    if (code && code !== existing.code) {
      const duplicate = await prisma.client.findUnique({
        where: { code }
      })
      if (duplicate) {
        return errorResponse('Client with this code already exists', 400)
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(address !== undefined && { address }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(pib !== undefined && { pib }),
        ...(idNumber !== undefined && { idNumber }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return successResponse(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return errorResponse('Failed to update client', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// DELETE /api/clients/:id - Soft delete client
export const DELETE = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params

    const existing = await prisma.client.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Client not found', 404)
    }

    const client = await prisma.client.update({
      where: { id },
      data: { isActive: false }
    })

    return successResponse(client)
  } catch (error) {
    console.error('Error deleting client:', error)
    return errorResponse('Failed to delete client', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
