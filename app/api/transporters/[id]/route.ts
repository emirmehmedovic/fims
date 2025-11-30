import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/transporters/:id - Get single transporter
export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params

    const transporter = await prisma.transporter.findUnique({
      where: { id }
    })

    if (!transporter) {
      return errorResponse('Transporter not found', 404)
    }

    return successResponse(transporter)
  } catch (error) {
    console.error('Error fetching transporter:', error)
    return errorResponse('Failed to fetch transporter', 500)
  }
})

// PATCH /api/transporters/:id - Update transporter
export const PATCH = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { name, code, address, contactPerson, phone, email, isActive } = body

    const existing = await prisma.transporter.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Transporter not found', 404)
    }

    // If code is being changed, check for duplicates
    if (code && code !== existing.code) {
      const duplicate = await prisma.transporter.findUnique({
        where: { code }
      })
      if (duplicate) {
        return errorResponse('Transporter with this code already exists', 400)
      }
    }

    const transporter = await prisma.transporter.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(address !== undefined && { address }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return successResponse(transporter)
  } catch (error) {
    console.error('Error updating transporter:', error)
    return errorResponse('Failed to update transporter', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// DELETE /api/transporters/:id - Soft delete transporter
export const DELETE = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params

    const existing = await prisma.transporter.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Transporter not found', 404)
    }

    const transporter = await prisma.transporter.update({
      where: { id },
      data: { isActive: false }
    })

    return successResponse(transporter)
  } catch (error) {
    console.error('Error deleting transporter:', error)
    return errorResponse('Failed to delete transporter', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
