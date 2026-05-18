import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/laboratories/:id - Get single laboratory
export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params

    const laboratory = await prisma.laboratory.findUnique({
      where: { id }
    })

    if (!laboratory) {
      return errorResponse('Laboratory not found', 404)
    }

    return successResponse(laboratory)
  } catch (error) {
    console.error('Error fetching laboratory:', error)
    return errorResponse('Failed to fetch laboratory', 500)
  }
})

// PATCH /api/laboratories/:id - Update laboratory
export const PATCH = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { name, accreditationNumber, address, contactPerson, phone, email, isActive } = body

    const existing = await prisma.laboratory.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Laboratory not found', 404)
    }

    const laboratory = await prisma.laboratory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(accreditationNumber !== undefined && { accreditationNumber }),
        ...(address !== undefined && { address }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return successResponse(laboratory)
  } catch (error) {
    console.error('Error updating laboratory:', error)
    return errorResponse('Failed to update laboratory', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// DELETE /api/laboratories/:id - Soft delete laboratory
export const DELETE = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params

    const existing = await prisma.laboratory.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Laboratory not found', 404)
    }

    const laboratory = await prisma.laboratory.update({
      where: { id },
      data: { isActive: false }
    })

    return successResponse(laboratory)
  } catch (error) {
    console.error('Error deleting laboratory:', error)
    return errorResponse('Failed to delete laboratory', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
