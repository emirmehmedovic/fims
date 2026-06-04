import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { paginatedResponse, errorResponse } from "@/lib/api/response"
import { logger } from "@/lib/utils/logger"

// GET /api/certificates - List all uploaded certificates
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {
      certificatePath: { not: null }
    }

    // For OPERATOR/VIEWER role, filter by assigned warehouses only
    const userRole = session.user.role
    const userWarehouses = session.user.warehouses || []

    if (userRole === 'OPERATOR' || userRole === 'VIEWER') {
      const assignedWarehouseIds = userWarehouses.map((w: any) => w.id)
      if (assignedWarehouseIds.length === 0) {
        // User has no warehouses assigned, return empty result
        return paginatedResponse([], { total: 0, page, limit: pageSize })
      }
      where.warehouseId = { in: assignedWarehouseIds }
    }

    // Search filter - search across multiple fields
    if (search) {
      where.OR = [
        {
          registrationNumber: isNaN(parseInt(search)) ? undefined : parseInt(search)
        },
        {
          productName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          vehicleRegistration: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          certificateFileName: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ].filter(condition => condition !== undefined && Object.keys(condition).length > 0)
    }

    // Get total count of unique certificates
    const allCertificates = await prisma.fuelEntry.findMany({
      where,
      select: {
        certificatePath: true
      },
      orderBy: {
        certificateUploadedAt: 'desc'
      }
    })

    // Get unique certificate paths
    const uniquePaths = [...new Set(allCertificates.map(c => c.certificatePath).filter(Boolean))]
    const total = uniquePaths.length

    // Get paginated unique certificates with full details
    const paginatedPaths = uniquePaths.slice(skip, skip + pageSize)

    // Fetch full details for each unique certificate path
    // We get the most recent entry for each certificate
    const certificates = await Promise.all(
      paginatedPaths.map(async (path) => {
        const entry = await prisma.fuelEntry.findFirst({
          where: {
            certificatePath: path,
            ...where
          },
          select: {
            certificatePath: true,
            certificateFileName: true,
            certificateUploadedAt: true,
            registrationNumber: true,
            productName: true,
            entryDate: true,
            vehicleRegistration: true,
            warehouse: {
              select: {
                name: true,
                code: true
              }
            }
          },
          orderBy: {
            certificateUploadedAt: 'desc'
          }
        })
        return entry
      })
    )

    // Filter out any null entries and format response
    const validCertificates = certificates.filter(Boolean).map(cert => ({
      certificatePath: cert!.certificatePath,
      certificateFileName: cert!.certificateFileName,
      certificateUploadedAt: cert!.certificateUploadedAt,
      fuelEntry: {
        registrationNumber: cert!.registrationNumber,
        productName: cert!.productName,
        entryDate: cert!.entryDate,
        vehicleRegistration: cert!.vehicleRegistration,
        warehouse: cert!.warehouse
      }
    }))

    return paginatedResponse(validCertificates, {
      total,
      page,
      limit: pageSize
    })
  } catch (error) {
    logger.error('Error fetching certificates:', error)
    return errorResponse('Failed to fetch certificates', 500)
  }
})
