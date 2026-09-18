import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/fuel-entries/last - Get the last fuel entry created by the current user
// Optional query param: productName - filter by specific product type
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url)
    const productName = searchParams.get('productName')

    const where: any = {
      operatorId: session.user.id,
      isActive: true
    }

    // Filter by product name if provided
    if (productName) {
      where.productName = productName
    }

    const lastEntry = await prisma.fuelEntry.findFirst({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        supplier: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        transporter: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            code: true,
            pib: true,
            idNumber: true
          }
        },
        laboratory: {
          select: {
            id: true,
            name: true,
            accreditationNumber: true
          }
        },
        station: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true
          }
        }
      }
    })

    if (!lastEntry) {
      return errorResponse('No previous entries found', 404)
    }

    return successResponse(lastEntry)
  } catch (error) {
    console.error('Error fetching last fuel entry:', error)
    return errorResponse('Failed to fetch last fuel entry', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'PUMPA'])
