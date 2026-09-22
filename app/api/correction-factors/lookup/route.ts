import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"
import { Decimal } from "@prisma/client/runtime/library"

// GET /api/correction-factors/lookup - Find correction factor by product and temperature
// If exact temperature not found, returns closest available
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const productName = searchParams.get('productName')
    const temperature = searchParams.get('temperature')

    if (!productName || !temperature) {
      return errorResponse('Product name and temperature are required', 400)
    }

    const tempValue = parseFloat(temperature)

    // First try exact match
    let factor = await prisma.correctionFactor.findFirst({
      where: {
        productName,
        temperature: new Decimal(tempValue),
        isActive: true
      }
    })

    // If not found, try to find closest temperature for this product
    if (!factor) {
      // Get all factors for this product
      const allFactors = await prisma.correctionFactor.findMany({
        where: {
          productName,
          isActive: true
        },
        orderBy: {
          temperature: 'asc'
        }
      })

      if (allFactors.length > 0) {
        // Find closest temperature
        let closest = allFactors[0]
        let minDiff = Math.abs(allFactors[0].temperature.toNumber() - tempValue)

        for (const f of allFactors) {
          const diff = Math.abs(f.temperature.toNumber() - tempValue)
          if (diff < minDiff) {
            minDiff = diff
            closest = f
          }
        }

        // If within 5 degrees, use interpolation or closest
        if (minDiff <= 5) {
          factor = closest
        }
      }
    }

    if (!factor) {
      // Return a default factor of 1.0 if no match found
      return successResponse({
        factor: 1.0,
        isExact: false,
        message: 'No matching correction factor found, using default 1.0'
      })
    }

    return successResponse({
      factor: factor.factor.toNumber(),
      temperature: factor.temperature.toNumber(),
      productName: factor.productName,
      isExact: factor.temperature.toNumber() === tempValue,
      id: factor.id
    })
  } catch (error) {
    console.error('Error looking up correction factor:', error)
    return errorResponse('Failed to lookup correction factor', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'PUMPA'])
