import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// Valid lookup types
const LOOKUP_TYPES = ['products', 'countries', 'pickupLocations', 'fuelCharacteristics'] as const
type LookupType = typeof LOOKUP_TYPES[number]

// Map lookup type to Prisma model
const getLookupModel = (type: LookupType) => {
  switch (type) {
    case 'products':
      return prisma.product
    case 'countries':
      return prisma.country
    case 'pickupLocations':
      return prisma.pickupLocation
    case 'fuelCharacteristics':
      return prisma.fuelCharacteristic
    default:
      return null
  }
}

// PATCH /api/lookups/:id - Update lookup item
export const PATCH = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params
    const body = await req.json()
    const { type, name, description, code, address, isActive } = body

    if (!type || !LOOKUP_TYPES.includes(type)) {
      return errorResponse(`Invalid lookup type. Valid types: ${LOOKUP_TYPES.join(', ')}`, 400)
    }

    const model = getLookupModel(type)
    if (!model) {
      return errorResponse('Invalid lookup type', 400)
    }

    // Check if item exists
    const existing = await (model as any).findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Item not found', 404)
    }

    // If name is being changed, check uniqueness
    if (name && name.trim() !== existing.name) {
      const nameExists = await (model as any).findUnique({
        where: { name: name.trim() }
      })

      if (nameExists) {
        return errorResponse('Item with this name already exists', 400)
      }
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (isActive !== undefined) updateData.isActive = isActive
    
    if (type === 'products' || type === 'fuelCharacteristics') {
      if (description !== undefined) updateData.description = description || null
    }
    
    if (type === 'countries') {
      if (code !== undefined) updateData.code = code || null
    }
    
    if (type === 'pickupLocations') {
      if (address !== undefined) updateData.address = address || null
    }

    const item = await (model as any).update({
      where: { id },
      data: updateData
    })

    return successResponse(item)
  } catch (error) {
    console.error('Error updating lookup item:', error)
    return errorResponse('Failed to update lookup item', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// DELETE /api/lookups/:id - Soft delete lookup item
export const DELETE = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') as LookupType

    if (!type || !LOOKUP_TYPES.includes(type)) {
      return errorResponse(`Invalid lookup type. Valid types: ${LOOKUP_TYPES.join(', ')}`, 400)
    }

    const model = getLookupModel(type)
    if (!model) {
      return errorResponse('Invalid lookup type', 400)
    }

    // Check if item exists
    const existing = await (model as any).findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Item not found', 404)
    }

    // Soft delete (set isActive to false)
    await (model as any).update({
      where: { id },
      data: { isActive: false }
    })

    return successResponse({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting lookup item:', error)
    return errorResponse('Failed to delete lookup item', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
