import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { paginatedResponse, successResponse, errorResponse } from "@/lib/api/response"
import { saveFile, validateFile } from "@/lib/utils/file-upload"
import { logger } from "@/lib/utils/logger"
import { startOfDaySarajevo, startOfNextDaySarajevo } from "@/lib/utils/date"

// GET /api/fuel-entries - List fuel entries with advanced filters
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const warehouseId = searchParams.get('warehouseId')
    const productName = searchParams.get('productName')
    const deliveryNoteNumber = searchParams.get('deliveryNoteNumber')
    const registrationNumber = searchParams.get('registrationNumber')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'entryDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // For OPERATOR role, filter by assigned warehouses only
    const userRole = session.user.role
    const userWarehouses = session.user.warehouses || []
    
    if (userRole === 'OPERATOR' || userRole === 'VIEWER') {
      const assignedWarehouseIds = userWarehouses.map((w: any) => w.id)
      if (assignedWarehouseIds.length === 0) {
        // User has no warehouses assigned, return empty result
        return paginatedResponse([], { total: 0, page, limit })
      }
      where.warehouseId = { in: assignedWarehouseIds }
    }

    // Additional warehouse filter (for admins or within operator's warehouses)
    if (warehouseId) {
      // If operator, verify they have access to this warehouse
      if (userRole === 'OPERATOR' || userRole === 'VIEWER') {
        const hasAccess = userWarehouses.some((w: any) => w.id === warehouseId)
        if (!hasAccess) {
          return errorResponse('Access denied to this warehouse', 403)
        }
      }
      where.warehouseId = warehouseId
    }

    if (productName) {
      where.productName = {
        contains: productName,
        mode: 'insensitive'
      }
    }

    if (deliveryNoteNumber) {
      where.deliveryNoteNumber = {
        contains: deliveryNoteNumber,
        mode: 'insensitive'
      }
    }

    if (registrationNumber) {
      where.registrationNumber = parseInt(registrationNumber)
    }

    if (dateFrom || dateTo) {
      where.entryDate = {}
      if (dateFrom) {
        where.entryDate.gte = startOfDaySarajevo(dateFrom)
      }
      if (dateTo) {
        where.entryDate.lt = startOfNextDaySarajevo(dateTo)
      }
    }

    // Get total count
    const total = await prisma.fuelEntry.count({ where })

    // Get fuel entries
    const entries = await prisma.fuelEntry.findMany({
      where,
      skip,
      take: limit,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        operator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    })

    return paginatedResponse(entries, { total, page, limit })
  } catch (error) {
    logger.error('Error fetching fuel entries:', error)
    return errorResponse('Failed to fetch fuel entries', 500)
  }
})

// POST /api/fuel-entries - Create new fuel entry
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const formData = await req.formData()

    // Extract fields
    const entryDate = formData.get('entryDate') as string
    const warehouseId = formData.get('warehouseId') as string
    const productName = formData.get('productName') as string
    const quantity = formData.get('quantity') as string
    const deliveryNoteNumber = formData.get('deliveryNoteNumber') as string | null
    const deliveryNoteDate = formData.get('deliveryNoteDate') as string | null
    const customsDeclarationNumber = formData.get('customsDeclarationNumber') as string | null
    const customsDeclarationDate = formData.get('customsDeclarationDate') as string | null
    const isHigherQuality = formData.get('isHigherQuality') === 'true'
    const improvedCharacteristics = formData.getAll('improvedCharacteristics[]') as string[]
    const countryOfOrigin = formData.get('countryOfOrigin') as string | null
    const laboratoryName = formData.get('laboratoryName') as string | null
    const labAccreditationNumber = formData.get('labAccreditationNumber') as string | null
    const testReportNumber = formData.get('testReportNumber') as string | null
    const testReportDate = formData.get('testReportDate') as string | null
    const orderOpenedBy = formData.get('orderOpenedBy') as string | null
    const pickupLocation = formData.get('pickupLocation') as string | null
    const supplierId = formData.get('supplierId') as string | null
    const transporterId = formData.get('transporterId') as string | null
    const driverName = formData.get('driverName') as string | null
    const certificate = formData.get('certificate') as File | null

    // Validation
    if (!entryDate || !warehouseId || !productName || !quantity) {
      return errorResponse('Missing required fields', 400)
    }

    const parsedQuantity = parseInt(quantity)
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return errorResponse('Invalid quantity', 400)
    }

    // Validate certificate BEFORE creating entry (if certificate is provided)
    // This prevents creating orphan entries with invalid files
    if (certificate && certificate.size > 0) {
      const validation = await validateFile(certificate)
      if (!validation.valid) {
        return errorResponse(validation.error || 'Invalid certificate file', 400)
      }
    }

    // Create fuel entry - database will auto-generate registrationNumber
    // This prevents race conditions when multiple users create entries simultaneously
    let fuelEntry = await prisma.fuelEntry.create({
      data: {
        // registrationNumber is auto-generated by database sequence
        entryDate: new Date(entryDate),
        warehouseId,
        productName,
        quantity: parsedQuantity,
        deliveryNoteNumber: deliveryNoteNumber || null,
        deliveryNoteDate: deliveryNoteDate ? new Date(deliveryNoteDate) : null,
        customsDeclarationNumber: customsDeclarationNumber || null,
        customsDeclarationDate: customsDeclarationDate ? new Date(customsDeclarationDate) : null,
        isHigherQuality,
        improvedCharacteristics: improvedCharacteristics.filter(Boolean),
        countryOfOrigin: countryOfOrigin || null,
        laboratoryName: laboratoryName || null,
        labAccreditationNumber: labAccreditationNumber || null,
        testReportNumber: testReportNumber || null,
        testReportDate: testReportDate ? new Date(testReportDate) : null,
        operatorId: session.user.id,
        orderOpenedBy: orderOpenedBy || null,
        pickupLocation: pickupLocation || null,
        supplierId: supplierId || null,
        transporterId: transporterId || null,
        driverName: driverName || null,
        certificatePath: null,
        certificateFileName: null,
        certificateUploadedAt: null,
        createdBy: session.user.id
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        operator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Handle certificate upload AFTER entry is created
    // If upload fails, we rollback the entry (compensating transaction)
    if (certificate && certificate.size > 0) {
      try {
        // Upload file using the database-generated registrationNumber
        const certificatePath = await saveFile(certificate, fuelEntry.registrationNumber)
        const certificateFileName = certificate.name

        // Update entry with certificate info
        await prisma.fuelEntry.update({
          where: { id: fuelEntry.id },
          data: {
            certificatePath,
            certificateFileName,
            certificateUploadedAt: new Date()
          }
        })

        // Update local object for response
        fuelEntry.certificatePath = certificatePath
        fuelEntry.certificateFileName = certificateFileName
        fuelEntry.certificateUploadedAt = new Date()
      } catch (uploadError) {
        logger.error('[FUEL_ENTRY] Certificate upload failed, rolling back entry:', uploadError)

        // COMPENSATING TRANSACTION: Delete the entry since file upload failed
        // This prevents orphan entries and wasted registration numbers
        try {
          await prisma.fuelEntry.delete({
            where: { id: fuelEntry.id }
          })
          logger.info('[FUEL_ENTRY] Entry rolled back due to upload failure')
        } catch (deleteError) {
          logger.error('[FUEL_ENTRY] Failed to rollback entry:', deleteError)
          // Entry remains in database without certificate - admin can clean up later
        }

        return errorResponse(
          'Failed to upload certificate. Please try again.',
          500
        )
      }
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'FuelEntry',
        entityId: fuelEntry.id,
        changes: {
          created: {
            registrationNumber: fuelEntry.registrationNumber,
            productName: fuelEntry.productName,
            quantity: fuelEntry.quantity,
            warehouseCode: fuelEntry.warehouse.code
          }
        }
      }
    })

    return successResponse(fuelEntry, 201)
  } catch (error) {
    logger.error('Error creating fuel entry:', error)
    return errorResponse('Failed to create fuel entry', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'])
