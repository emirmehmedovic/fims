import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"
import { Decimal } from "@prisma/client/runtime/library"

// GET /api/correction-factors - List all correction factors with filtering
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const productName = searchParams.get('productName')
    const temperature = searchParams.get('temperature')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '100'), 500)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true
    }

    if (productName) {
      where.productName = {
        contains: productName,
        mode: 'insensitive'
      }
    }

    if (temperature) {
      where.temperature = new Decimal(temperature)
    }

    const [factors, total] = await Promise.all([
      prisma.correctionFactor.findMany({
        where,
        orderBy: [
          { productName: 'asc' },
          { temperature: 'asc' }
        ],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.correctionFactor.count({ where })
    ])

    return successResponse({
      data: factors,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching correction factors:', error)
    return errorResponse('Failed to fetch correction factors', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'PUMPA'])

// POST /api/correction-factors - Create new correction factor
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { productName, temperature, factor } = body

    if (!productName || temperature === undefined || factor === undefined) {
      return errorResponse('Product name, temperature, and factor are required', 400)
    }

    // Check if combination already exists
    const existing = await prisma.correctionFactor.findUnique({
      where: {
        productName_temperature: {
          productName,
          temperature: new Decimal(temperature)
        }
      }
    })

    if (existing) {
      return errorResponse('Correction factor for this product and temperature already exists', 409)
    }

    const newFactor = await prisma.correctionFactor.create({
      data: {
        productName,
        temperature: new Decimal(temperature),
        factor: new Decimal(factor)
      }
    })

    return successResponse(newFactor, 201)
  } catch (error) {
    console.error('Error creating correction factor:', error)
    return errorResponse('Failed to create correction factor', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
