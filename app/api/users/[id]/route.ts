import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/users/:id - Get single user
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        warehouses: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return errorResponse('User not found', 404)
    }

    // Transform data
    const response = {
      ...user,
      warehouses: user.warehouses.map(uw => uw.warehouse)
    }

    return successResponse(response)
  } catch (error) {
    console.error('Error fetching user:', error)
    return errorResponse('Failed to fetch user', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// PATCH /api/users/:id - Update user
export const PATCH = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params
    const body = await req.json()
    const { name, email, role, isActive, warehouseIds } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        warehouses: {
          include: {
            warehouse: true
          }
        }
      }
    })

    if (!existingUser) {
      return errorResponse('User not found', 404)
    }

    // If email is being changed, check uniqueness
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return errorResponse('Email already exists', 400)
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive

    // Update user
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update basic fields
      const user = await tx.user.update({
        where: { id },
        data: updateData,
        include: {
          warehouses: {
            include: {
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          }
        }
      })

      // Update warehouse assignments if provided
      if (warehouseIds && Array.isArray(warehouseIds)) {
        // Delete existing assignments
        await tx.userWarehouse.deleteMany({
          where: { userId: id }
        })

        // Create new assignments
        if (warehouseIds.length > 0) {
          await tx.userWarehouse.createMany({
            data: warehouseIds.map((warehouseId: string) => ({
              userId: id,
              warehouseId
            }))
          })
        }

        // Fetch updated user with new warehouses
        return tx.user.findUnique({
          where: { id },
          include: {
            warehouses: {
              include: {
                warehouse: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                }
              }
            }
          }
        })
      }

      return user
    })

    // Log audit (entityId is FK to FuelEntry, so we omit it for User actions)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'User',
        changes: {
          targetUserId: id,
          before: {
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            isActive: existingUser.isActive,
            warehouses: existingUser.warehouses.map(uw => uw.warehouse.code)
          },
          after: {
            name: updatedUser?.name,
            email: updatedUser?.email,
            role: updatedUser?.role,
            isActive: updatedUser?.isActive,
            warehouses: updatedUser?.warehouses.map(uw => uw.warehouse.code)
          }
        }
      }
    })

    // Transform response
    const response = {
      ...updatedUser,
      passwordHash: undefined,
      warehouses: updatedUser?.warehouses.map(uw => uw.warehouse)
    }

    return successResponse(response)
  } catch (error) {
    console.error('Error updating user:', error)
    return errorResponse('Failed to update user', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// DELETE /api/users/:id - Soft delete user
export const DELETE = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params

    // Prevent deleting self
    if (id === session.user.id) {
      return errorResponse('Cannot delete your own account', 400)
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return errorResponse('User not found', 404)
    }

    // Soft delete (set isActive to false)
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })

    // Log audit (entityId is FK to FuelEntry, so we omit it for User actions)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'User',
        changes: {
          targetUserId: id,
          deleted: {
            name: existingUser.name,
            email: existingUser.email
          }
        }
      }
    })

    return successResponse({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return errorResponse('Failed to delete user', 500)
  }
}, ['SUPER_ADMIN'])
