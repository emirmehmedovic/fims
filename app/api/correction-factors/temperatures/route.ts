import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/correction-factors/temperatures - Get available temperatures for a product
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const productName = searchParams.get('productName')

    if (!productName) {
      return errorResponse('Product name is required', 400)
    }

    // Get distinct temperatures for this product, ordered ascending
    // Use exact match for product name to avoid returning wrong temperatures
    const factors = await prisma.correctionFactor.findMany({
      where: {
        productName,
        isActive: true
      },
      select: {
        temperature: true
      },
      orderBy: {
        temperature: 'asc'
      },
      distinct: ['temperature']
    })

    // Extract just the temperature values
    const temperatures = factors.map(f => Number(f.temperature))

    return successResponse({ temperatures })
  } catch (error) {
    console.error('Error fetching temperatures:', error)
    return errorResponse('Failed to fetch temperatures', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'PUMPA'])
