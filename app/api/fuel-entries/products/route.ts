import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/fuel-entries/products - Get unique product names used by the current user
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    // Get unique product names from user's entries, ordered by most recently used
    const products = await prisma.fuelEntry.findMany({
      where: {
        operatorId: session.user.id,
        isActive: true
      },
      select: {
        productName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Extract unique product names while preserving order (most recent first)
    const uniqueProducts: string[] = []
    const seen = new Set<string>()

    for (const entry of products) {
      if (!seen.has(entry.productName)) {
        seen.add(entry.productName)
        uniqueProducts.push(entry.productName)
      }
    }

    return successResponse(uniqueProducts)
  } catch (error) {
    console.error('Error fetching product names:', error)
    return errorResponse('Failed to fetch product names', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'PUMPA'])
