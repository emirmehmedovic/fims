import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/dashboard/stats - Get dashboard statistics
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const url = new URL(req.url)
    const warehouseId = url.searchParams.get('warehouseId')

    // Build base filter
    const baseWhere: any = {
      isActive: true
    }

    // Check warehouse access for non-admin users
    let accessibleWarehouses: string[] = []
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      accessibleWarehouses = session.user.warehouses?.map((w: any) => w.id) || []
      baseWhere.warehouseId = { in: accessibleWarehouses }
    }

    // If specific warehouse requested, validate access
    if (warehouseId) {
      if (accessibleWarehouses.length > 0 && !accessibleWarehouses.includes(warehouseId)) {
        return errorResponse('Access denied to this warehouse', 403)
      }
      baseWhere.warehouseId = warehouseId
    }

    // Get date ranges
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Parallel queries for better performance
    const [
      totalEntries,
      totalVolume,
      entriesLast7Days,
      entriesLast30Days,
      entriesByWarehouse,
      entriesByProduct,
      recentEntries,
      totalWarehouses
    ] = await Promise.all([
      // Total entries count
      prisma.fuelEntry.count({ where: baseWhere }),
      
      // Total volume
      prisma.fuelEntry.aggregate({
        where: baseWhere,
        _sum: { quantity: true }
      }),
      
      // Entries in last 7 days
      prisma.fuelEntry.count({
        where: {
          ...baseWhere,
          entryDate: { gte: last7Days }
        }
      }),
      
      // Entries in last 30 days
      prisma.fuelEntry.count({
        where: {
          ...baseWhere,
          entryDate: { gte: last30Days }
        }
      }),
      
      // Entries grouped by warehouse
      prisma.fuelEntry.groupBy({
        by: ['warehouseId'],
        where: baseWhere,
        _count: { id: true },
        _sum: { quantity: true }
      }),
      
      // Entries grouped by product
      prisma.fuelEntry.groupBy({
        by: ['productName'],
        where: baseWhere,
        _count: { id: true },
        _sum: { quantity: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      
      // Recent entries
      prisma.fuelEntry.findMany({
        where: baseWhere,
        include: {
          warehouse: {
            select: { name: true, code: true }
          },
          operator: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Total warehouses (accessible)
      prisma.warehouse.count({
        where: {
          isActive: true,
          ...(accessibleWarehouses.length > 0 ? { id: { in: accessibleWarehouses } } : {})
        }
      })
    ])

    // Get warehouse names for the grouped data
    const warehouseIds = entriesByWarehouse.map(e => e.warehouseId)
    const warehouses = await prisma.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true, name: true, code: true }
    })
    const warehouseMap = new Map(warehouses.map(w => [w.id, w]))

    // Format entries by warehouse with names
    const formattedEntriesByWarehouse = entriesByWarehouse.map(e => ({
      warehouseId: e.warehouseId,
      name: warehouseMap.get(e.warehouseId)?.name || 'Unknown',
      code: warehouseMap.get(e.warehouseId)?.code || 'N/A',
      count: e._count.id,
      volume: e._sum.quantity || 0
    }))

    // Format entries by product
    const formattedEntriesByProduct = entriesByProduct.map(e => ({
      productName: e.productName,
      count: e._count.id,
      volume: e._sum.quantity || 0
    }))

    // Format recent entries
    const formattedRecentEntries = recentEntries.map(e => ({
      id: e.id,
      registrationNumber: e.registrationNumber,
      entryDate: e.entryDate,
      warehouse: e.warehouse.name,
      warehouseCode: e.warehouse.code,
      productName: e.productName,
      quantity: e.quantity,
      operator: e.operator.name,
      createdAt: e.createdAt
    }))

    // Calculate volume trend for last 30 days
    const volumeTrend = await prisma.$queryRaw<Array<{ date: Date; volume: bigint }>>`
      SELECT 
        DATE(entry_date) as date,
        SUM(quantity) as volume
      FROM fuel_entries
      WHERE is_active = true
        AND entry_date >= ${last30Days}
        ${warehouseId ? prisma.$queryRaw`AND warehouse_id = ${warehouseId}` : prisma.$queryRaw``}
      GROUP BY DATE(entry_date)
      ORDER BY date ASC
    `.catch(() => [])

    const formattedVolumeTrend = Array.isArray(volumeTrend) 
      ? volumeTrend.map(v => ({
          date: v.date,
          volume: Number(v.volume)
        }))
      : []

    return successResponse({
      totalWarehouses,
      totalEntries,
      totalVolume: totalVolume._sum.quantity || 0,
      entriesLast7Days,
      entriesLast30Days,
      entriesByWarehouse: formattedEntriesByWarehouse,
      entriesByProduct: formattedEntriesByProduct,
      recentActivity: formattedRecentEntries,
      volumeTrend: formattedVolumeTrend
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return errorResponse('Failed to fetch dashboard statistics', 500)
  }
})
