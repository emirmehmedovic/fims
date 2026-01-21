import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { paginatedResponse, errorResponse, successResponse } from "@/lib/api/response"
import { hash } from "bcryptjs"
import { logger } from "@/lib/utils/logger"
import { createUserSchema } from "@/lib/validations/api-schemas"

// GET /api/users - List users with pagination and filters
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      where.role = role
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Get total count
    const total = await prisma.user.count({ where })

    // Get users with warehouses
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data
    const transformedUsers = users.map(user => ({
      ...user,
      warehouses: user.warehouses.map(uw => uw.warehouse)
    }))

    return paginatedResponse(transformedUsers, { total, page, limit })
  } catch (error) {
    logger.error('Error fetching users:', error)
    return errorResponse('Failed to fetch users', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// POST /api/users - Create new user
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()

    // Zod validation
    const validation = createUserSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.format()
      return errorResponse('Validation failed', 400, errors)
    }

    const { name, email, password, role, warehouseIds } = validation.data

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return errorResponse('Email already exists', 400)
    }

    // Hash password
    const passwordHash = await hash(password, 10)

    // Create user with warehouse assignments
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        warehouses: {
          create: warehouseIds.map((warehouseId: string) => ({
            warehouseId
          }))
        }
      },
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

    // Log audit (entityId is FK to FuelEntry, so we omit it for User actions)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'User',
        changes: {
          createdUserId: user.id,
          created: {
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      }
    })

    // Transform response
    const response = {
      ...user,
      passwordHash: undefined,
      warehouses: user.warehouses.map(uw => uw.warehouse)
    }

    return successResponse(response, 201)
  } catch (error) {
    logger.error('Error creating user:', error)
    return errorResponse('Failed to create user', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
