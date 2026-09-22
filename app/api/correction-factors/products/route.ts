import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/correction-factors/products - Get all unique product names from fuel entries
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    // Get unique product names from ALL fuel entries (system-wide)
    const products = await prisma.fuelEntry.findMany({
      where: {
        isActive: true
      },
      select: {
        productName: true
      },
      distinct: ['productName'],
      orderBy: {
        productName: 'asc'
      }
    })

    const uniqueProducts = products.map(p => p.productName)

    return successResponse(uniqueProducts)
  } catch (error) {
    console.error('Error fetching product names:', error)
    return errorResponse('Failed to fetch product names', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
