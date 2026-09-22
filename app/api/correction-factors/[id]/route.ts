import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"
import { Decimal } from "@prisma/client/runtime/library"

// GET /api/correction-factors/[id] - Get single correction factor
export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const params = await context.params
    const { id } = params

    const factor = await prisma.correctionFactor.findUnique({
      where: { id }
    })

    if (!factor) {
      return errorResponse('Correction factor not found', 404)
    }

    return successResponse(factor)
  } catch (error) {
    console.error('Error fetching correction factor:', error)
    return errorResponse('Failed to fetch correction factor', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'PUMPA'])

// PUT /api/correction-factors/[id] - Update correction factor
export const PUT = withAuth(async (req: NextRequest, context) => {
  try {
    const params = await context.params
    const { id } = params
    const body = await req.json()
    const { productName, temperature, factor, isActive } = body

    const existing = await prisma.correctionFactor.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Correction factor not found', 404)
    }

    // If changing product/temperature combination, check for conflicts
    if (productName !== undefined || temperature !== undefined) {
      const newProductName = productName ?? existing.productName
      const newTemperature = temperature !== undefined
        ? new Decimal(temperature)
        : existing.temperature

      const conflict = await prisma.correctionFactor.findFirst({
        where: {
          productName: newProductName,
          temperature: newTemperature,
          id: { not: id }
        }
      })

      if (conflict) {
        return errorResponse('Correction factor for this product and temperature already exists', 409)
      }
    }

    const updated = await prisma.correctionFactor.update({
      where: { id },
      data: {
        ...(productName !== undefined && { productName }),
        ...(temperature !== undefined && { temperature: new Decimal(temperature) }),
        ...(factor !== undefined && { factor: new Decimal(factor) }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Error updating correction factor:', error)
    return errorResponse('Failed to update correction factor', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// DELETE /api/correction-factors/[id] - Soft delete correction factor
export const DELETE = withAuth(async (req: NextRequest, context) => {
  try {
    const params = await context.params
    const { id } = params

    const existing = await prisma.correctionFactor.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Correction factor not found', 404)
    }

    // Soft delete by setting isActive to false
    await prisma.correctionFactor.update({
      where: { id },
      data: { isActive: false }
    })

    return successResponse({ message: 'Correction factor deleted successfully' })
  } catch (error) {
    console.error('Error deleting correction factor:', error)
    return errorResponse('Failed to delete correction factor', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
