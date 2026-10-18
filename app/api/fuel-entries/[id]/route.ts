import { canUseWarehouse } from '@/lib/fuel-entries/server-access'
import { parseReceiptRecord } from '@/lib/fuel-entries/receipt-record'
import { canWriteReceipt, fuelEntryAccessFilter } from '@/lib/fuel-entries/access'
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"
import { saveFile, validateFile } from "@/lib/utils/file-upload"

// GET /api/fuel-entries/:id - Get single fuel entry
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params

    // OPTIMIZED: Build WHERE clause with authorization check
    const where = { id, AND: [fuelEntryAccessFilter(session.user)] }

    const fuelEntry = await prisma.fuelEntry.findUnique({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            location: true
          }
        },
        operator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            contactPerson: true,
            phone: true,
            email: true
          }
        },
        transporter: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            contactPerson: true,
            phone: true,
            email: true
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
        },
        receiptRecord: true
      }
    })

    if (!fuelEntry) {
      // Entry either doesn't exist OR user doesn't have access
      return errorResponse('Fuel entry not found', 404)
    }

    return successResponse(fuelEntry)
  } catch (error) {
    console.error('Error fetching fuel entry:', error)
    return errorResponse('Failed to fetch fuel entry', 500)
  }
})

// PATCH /api/fuel-entries/:id - Update fuel entry
export const PATCH = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params

    // OPTIMIZED: Build WHERE clause with authorization check
    const where = { id, AND: [fuelEntryAccessFilter(session.user)] }

    // Check if fuel entry exists (with authorization built into query)
    const existingEntry = await prisma.fuelEntry.findUnique({
      where
    })

    if (!existingEntry) {
      // Entry either doesn't exist OR user doesn't have access
      return errorResponse('Fuel entry not found', 404)
    }

    const formData = await req.formData()

    // Extract fields (all optional for update)
    const entryDate = formData.get('entryDate') as string | null
    const warehouseId = formData.get('warehouseId') as string | null
    const productName = formData.get('productName') as string | null
    const quantity = formData.get('quantity') as string | null
    const deliveryNoteNumber = formData.get('deliveryNoteNumber') as string | null
    const deliveryNoteDate = formData.get('deliveryNoteDate') as string | null
    const customsDeclarationNumber = formData.get('customsDeclarationNumber') as string | null
    const customsDeclarationDate = formData.get('customsDeclarationDate') as string | null
    const isHigherQuality = formData.get('isHigherQuality') as string | null
    const improvedCharacteristicsData = formData.get('improvedCharacteristics[]') as string | null
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
    const clientId = formData.get('clientId') as string | null
    const stationId = formData.get('stationId') as string | null
    const laboratoryId = formData.get('laboratoryId') as string | null
    const vehicleRegistration = formData.get('vehicleRegistration') as string | null
    const additiveDetailsStr = formData.get('additiveDetails') as string | null
    const certificate = formData.get('certificate') as File | null
    const existingCertificatePath = formData.get('existingCertificatePath') as string | null
    const receiptRecordStr = formData.get('receiptRecord') as string | null

    let receiptData: ReturnType<typeof parseReceiptRecord> | undefined
    if (receiptRecordStr && canWriteReceipt(session.user.role)) {
      try {
        receiptData = parseReceiptRecord(JSON.parse(receiptRecordStr))
      } catch {
        return errorResponse('Invalid receiptRecord format', 400)
      }
    }

    if (warehouseId && warehouseId !== existingEntry.warehouseId && !await canUseWarehouse(session.user, warehouseId)) {
      return errorResponse('Access denied to this warehouse', 403)
    }

    // Build update data object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    if (entryDate) updateData.entryDate = new Date(entryDate)
    if (warehouseId) updateData.warehouseId = warehouseId
    if (productName) updateData.productName = productName
    if (quantity) {
      const parsedQuantity = parseInt(quantity)
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return errorResponse('Invalid quantity', 400)
      }
      updateData.quantity = parsedQuantity
    }
    if (deliveryNoteNumber !== null) updateData.deliveryNoteNumber = deliveryNoteNumber || null
    if (deliveryNoteDate !== null) updateData.deliveryNoteDate = deliveryNoteDate ? new Date(deliveryNoteDate) : null
    if (customsDeclarationNumber !== null) updateData.customsDeclarationNumber = customsDeclarationNumber || null
    if (customsDeclarationDate !== null) updateData.customsDeclarationDate = customsDeclarationDate ? new Date(customsDeclarationDate) : null
    if (isHigherQuality !== null) updateData.isHigherQuality = isHigherQuality === 'true'
    if (improvedCharacteristicsData !== null) {
      const improvedCharacteristics = formData.getAll('improvedCharacteristics[]') as string[]
      updateData.improvedCharacteristics = improvedCharacteristics.filter(Boolean)
    }
    if (countryOfOrigin !== null) updateData.countryOfOrigin = countryOfOrigin || null
    if (laboratoryName !== null) updateData.laboratoryName = laboratoryName || null
    if (labAccreditationNumber !== null) updateData.labAccreditationNumber = labAccreditationNumber || null
    if (testReportNumber !== null) updateData.testReportNumber = testReportNumber || null
    if (testReportDate !== null) updateData.testReportDate = testReportDate ? new Date(testReportDate) : null
    if (orderOpenedBy !== null) updateData.orderOpenedBy = orderOpenedBy || null
    if (pickupLocation !== null) updateData.pickupLocation = pickupLocation || null
    if (supplierId !== null) updateData.supplierId = supplierId || null
    if (transporterId !== null) updateData.transporterId = transporterId || null
    if (driverName !== null) updateData.driverName = driverName || null
    if (clientId !== null) updateData.clientId = clientId || null
    if (stationId !== null) updateData.stationId = stationId || null
    if (laboratoryId !== null) updateData.laboratoryId = laboratoryId || null
    if (vehicleRegistration !== null) updateData.vehicleRegistration = vehicleRegistration || null
    if (additiveDetailsStr) {
      try {
        updateData.additiveDetails = JSON.parse(additiveDetailsStr)
      } catch (e) {
        console.error('Error parsing additiveDetails:', e)
      }
    }

    // The quality flag is authoritative, including for previously imported data.
    if (!(updateData.isHigherQuality ?? existingEntry.isHigherQuality)) {
      updateData.improvedCharacteristics = []
      updateData.additiveDetails = []
    }

    // Handle certificate (upload new OR use existing)
    if (certificate && certificate.size > 0) {
      // Upload new certificate
      const validation = await validateFile(certificate)
      if (!validation.valid) {
        return errorResponse(validation.error || 'Invalid file', 400)
      }

      const certificatePath = await saveFile(certificate, existingEntry.registrationNumber)
      updateData.certificatePath = certificatePath
      updateData.certificateFileName = certificate.name
      updateData.certificateUploadedAt = new Date()
    } else if (existingCertificatePath) {
      // Use existing certificate
      updateData.certificatePath = existingCertificatePath
      updateData.certificateFileName = existingCertificatePath.split('/').pop() || 'certificate'
      updateData.certificateUploadedAt = new Date()
    }

    // Track changes for audit log
    const changes: any = {
      before: {},
      after: {}
    }

    Object.keys(updateData).forEach(key => {
      if (key !== 'certificatePath' && key !== 'certificateFileName' && key !== 'certificateUploadedAt') {
        changes.before[key] = (existingEntry as any)[key]
        changes.after[key] = updateData[key]
      }
    })

    // Update fuel entry
    const updatedEntry = await prisma.fuelEntry.update({
      where: { id },
      data: {
        ...updateData,
        ...(receiptData ? { receiptRecord: { upsert: { create: receiptData, update: receiptData } } } : {}),
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
        },
        supplier: true,
        transporter: true,
        client: true,
        laboratory: true,
        station: true,
        receiptRecord: true
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'FuelEntry',
        entityId: id,
        changes
      }
    })

    return successResponse(updatedEntry)
  } catch (error) {
    console.error('Error updating fuel entry:', error)
    return errorResponse('Failed to update fuel entry', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'PUMPA'])

// DELETE /api/fuel-entries/:id - Soft delete fuel entry
export const DELETE = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params

    // OPTIMIZED: Build WHERE clause with authorization check
    const where = { id, AND: [fuelEntryAccessFilter(session.user)] }

    const existingEntry = await prisma.fuelEntry.findUnique({
      where,
      select: {
        id: true,
        registrationNumber: true,
        productName: true,
        isActive: true,
        warehouseId: true
      }
    })

    if (!existingEntry) {
      // Entry either doesn't exist OR user doesn't have access
      return errorResponse('Fuel entry not found', 404)
    }

    if (!existingEntry.isActive) {
      return errorResponse('Fuel entry is already deleted', 400)
    }

    // Soft delete
    await prisma.fuelEntry.update({
      where: { id },
      data: { isActive: false }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'FuelEntry',
        entityId: id,
        changes: {
          deleted: {
            registrationNumber: existingEntry.registrationNumber,
            productName: existingEntry.productName
          }
        }
      }
    })

    return successResponse({ message: 'Fuel entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting fuel entry:', error)
    return errorResponse('Failed to delete fuel entry', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'PUMPA'])
