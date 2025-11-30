import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/warehouses - List all warehouses
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (!includeInactive) {
      where.isActive = true
    }

    // For OPERATOR/VIEWER, filter by assigned warehouses only
    const userRole = session.user.role
    const userWarehouses = session.user.warehouses || []
    
    if (userRole === 'OPERATOR' || userRole === 'VIEWER') {
      const assignedWarehouseIds = userWarehouses.map((w: any) => w.id)
      if (assignedWarehouseIds.length === 0) {
        return successResponse([])
      }
      where.id = { in: assignedWarehouseIds }
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        location: true,
        capacity: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            fuelEntries: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return successResponse(warehouses)
  } catch (error) {
    console.error('Error fetching warehouses:', error)
    return errorResponse('Failed to fetch warehouses', 500)
  }
})

// POST /api/warehouses - Create new warehouse
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const { name, code, location, capacity, description } = body

    // Validation
    if (!name || !code || !location || !capacity) {
      return errorResponse('Missing required fields', 400)
    }

    if (capacity <= 0) {
      return errorResponse('Capacity must be greater than 0', 400)
    }

    // Check if code already exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { code }
    })

    if (existingWarehouse) {
      return errorResponse('Warehouse code already exists', 400)
    }

    // Create warehouse
    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        location,
        capacity: parseInt(capacity),
        description: description || null
      }
    })

    // Log audit (entityId is FK to FuelEntry, so we omit it for Warehouse actions)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Warehouse',
        changes: {
          warehouseId: warehouse.id,
          created: {
            name: warehouse.name,
            code: warehouse.code,
            location: warehouse.location,
            capacity: warehouse.capacity
          }
        }
      }
    })

    return successResponse(warehouse, 201)
  } catch (error) {
    console.error('Error creating warehouse:', error)
    return errorResponse('Failed to create warehouse', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
