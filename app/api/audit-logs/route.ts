import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/audit-logs - Get audit logs with filters
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const action = url.searchParams.get('action')
    const entityType = url.searchParams.get('entityType')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build filter conditions
    const where: any = {}

    // Non-admin users can only see their own logs
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      where.userId = session.user.id
    } else if (userId) {
      where.userId = userId
    }

    if (action) {
      where.action = action
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (dateFrom || dateTo) {
      where.timestamp = {}
      if (dateFrom) where.timestamp.gte = new Date(dateFrom)
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.timestamp.lte = endDate
      }
    }

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ])

    // Format logs
    const formattedLogs = logs.map(log => ({
      id: log.id,
      user: log.user,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      changes: log.changes,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.timestamp
    }))

    return successResponse({
      logs: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return errorResponse('Failed to fetch audit logs', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'])
