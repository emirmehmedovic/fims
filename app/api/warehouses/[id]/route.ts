import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/warehouses/:id - Get single warehouse
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            fuelEntries: true
          }
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    })

    if (!warehouse) {
      return errorResponse('Warehouse not found', 404)
    }

    // Transform data
    const response = {
      ...warehouse,
      users: warehouse.users.map(uw => uw.user)
    }

    return successResponse(response)
  } catch (error) {
    console.error('Error fetching warehouse:', error)
    return errorResponse('Failed to fetch warehouse', 500)
  }
})

// PATCH /api/warehouses/:id - Update warehouse
export const PATCH = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params
    const body = await req.json()
    const { name, code, location, capacity, description, isActive } = body

    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id }
    })

    if (!existingWarehouse) {
      return errorResponse('Warehouse not found', 404)
    }

    // If code is being changed, check uniqueness
    if (code && code !== existingWarehouse.code) {
      const codeExists = await prisma.warehouse.findUnique({
        where: { code }
      })

      if (codeExists) {
        return errorResponse('Warehouse code already exists', 400)
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code
    if (location !== undefined) updateData.location = location
    if (capacity !== undefined) updateData.capacity = parseInt(capacity)
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    // Update warehouse
    const updatedWarehouse = await prisma.warehouse.update({
      where: { id },
      data: updateData
    })

    // Log audit (entityId is FK to FuelEntry, so we omit it for Warehouse actions)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Warehouse',
        changes: {
          warehouseId: id,
          before: {
            name: existingWarehouse.name,
            code: existingWarehouse.code,
            location: existingWarehouse.location,
            capacity: existingWarehouse.capacity,
            isActive: existingWarehouse.isActive
          },
          after: {
            name: updatedWarehouse.name,
            code: updatedWarehouse.code,
            location: updatedWarehouse.location,
            capacity: updatedWarehouse.capacity,
            isActive: updatedWarehouse.isActive
          }
        }
      }
    })

    return successResponse(updatedWarehouse)
  } catch (error) {
    console.error('Error updating warehouse:', error)
    return errorResponse('Failed to update warehouse', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// DELETE /api/warehouses/:id - Soft delete warehouse
export const DELETE = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params

    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            fuelEntries: true
          }
        }
      }
    })

    if (!existingWarehouse) {
      return errorResponse('Warehouse not found', 404)
    }

    // Check if warehouse has fuel entries
    if (existingWarehouse._count.fuelEntries > 0) {
      return errorResponse('Cannot delete warehouse with existing fuel entries. Deactivate instead.', 400)
    }

    // Soft delete (set isActive to false)
    await prisma.warehouse.update({
      where: { id },
      data: { isActive: false }
    })

    // Log audit (entityId is FK to FuelEntry, so we omit it for Warehouse actions)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'Warehouse',
        changes: {
          warehouseId: id,
          deleted: {
            name: existingWarehouse.name,
            code: existingWarehouse.code
          }
        }
      }
    })

    return successResponse({ message: 'Warehouse deactivated successfully' })
  } catch (error) {
    console.error('Error deleting warehouse:', error)
    return errorResponse('Failed to delete warehouse', 500)
  }
}, ['SUPER_ADMIN'])
