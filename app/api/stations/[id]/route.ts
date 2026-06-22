import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/stations/:id - Get single station
export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params

    const station = await prisma.station.findUnique({
      where: { id }
    })

    if (!station) {
      return errorResponse('Station not found', 404)
    }

    return successResponse(station)
  } catch (error) {
    console.error('Error fetching station:', error)
    return errorResponse('Failed to fetch station', 500)
  }
})

// PATCH /api/stations/:id - Update station
export const PATCH = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { name, code, address, contactPerson, phone, email, isActive } = body

    const existing = await prisma.station.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Station not found', 404)
    }

    // If code is being changed, check for duplicates
    if (code && code !== existing.code) {
      const duplicate = await prisma.station.findUnique({
        where: { code }
      })
      if (duplicate) {
        return errorResponse('Station with this code already exists', 400)
      }
    }

    const station = await prisma.station.update({
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

    return successResponse(station)
  } catch (error) {
    console.error('Error updating station:', error)
    return errorResponse('Failed to update station', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// DELETE /api/stations/:id - Soft delete station
export const DELETE = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params

    const existing = await prisma.station.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Station not found', 404)
    }

    const station = await prisma.station.update({
      where: { id },
      data: { isActive: false }
    })

    return successResponse(station)
  } catch (error) {
    console.error('Error deleting station:', error)
    return errorResponse('Failed to delete station', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
