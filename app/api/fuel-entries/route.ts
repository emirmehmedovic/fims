import { z, ZodError } from 'zod'
import { CREATE_UNCONFIRMED, createFieldLabels, validateCreateFields } from '@/lib/fuel-entries/create-errors'
import { canUseWarehouse } from '@/lib/fuel-entries/server-access'
import { parseReceiptRecord } from '@/lib/fuel-entries/receipt-record'
import { canWriteReceipt } from '@/lib/fuel-entries/access'
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { paginatedResponse, successResponse, errorResponse } from "@/lib/api/response"
import { saveFile, validateFile } from "@/lib/utils/file-upload"
import { logger, isPrismaError } from "@/lib/utils/logger"
import { startOfDaySarajevo, startOfNextDaySarajevo } from "@/lib/utils/date"
import { generateDeclarationNumber } from "@/lib/utils/declaration-number"

// GET /api/fuel-entries - List fuel entries with advanced filters
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url)

    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50') || 50), 500)
    const warehouseId = searchParams.get('warehouseId')
    const stationId = searchParams.get('stationId')
    const clientId = searchParams.get('clientId')
    const productName = searchParams.get('productName')
    const deliveryNoteNumber = searchParams.get('deliveryNoteNumber')
    const registrationNumber = searchParams.get('registrationNumber')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const dateField = searchParams.get('dateField') || 'entryDate' // 'entryDate' or 'createdAt'
    const operatorId = searchParams.get('operatorId')
    const sortBy = searchParams.get('sortBy') || 'registrationNumber'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    // For role-based filtering
    const userRole = session.user.role
    const userWarehouses = session.user.warehouses || []

    if (userRole === 'PUMPA') {
      // PUMPA users see only their own entries
      where.operatorId = session.user.id
    } else if (userRole === 'OPERATOR' || userRole === 'VIEWER') {
      // OPERATOR/VIEWER see entries from their assigned warehouses
      const assignedWarehouseIds = userWarehouses.map((w: { id: string }) => w.id)
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
        const hasAccess = userWarehouses.some((w: { id: string }) => w.id === warehouseId)
        if (!hasAccess) {
          return errorResponse('Access denied to this warehouse', 403)
        }
      }
      where.warehouseId = warehouseId
    }

    if (stationId) {
      where.stationId = stationId
    }

    if (clientId) {
      where.clientId = clientId
    }

    // Operator filter (only for admins, not for PUMPA users who already filter by their own ID)
    if (operatorId && userRole !== 'PUMPA') {
      where.operatorId = operatorId
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
      // Search both old registrationNumber and new declarationNumber format
      const searchValue = registrationNumber.trim()

      if (searchValue.includes('/')) {
        // New format like "0100/26" - search by declarationNumber
        where.declarationNumber = {
          contains: searchValue,
          mode: 'insensitive'
        }
      } else if (/^\d+$/.test(searchValue)) {
        // Pure number - search both fields
        where.OR = [
          { registrationNumber: parseInt(searchValue) },
          { declarationNumber: { contains: searchValue, mode: 'insensitive' } }
        ]
      } else {
        // Other format - search by declarationNumber
        where.declarationNumber = {
          contains: searchValue,
          mode: 'insensitive'
        }
      }
    }

    if (dateFrom || dateTo) {
      const fieldName = dateField === 'createdAt' ? 'createdAt' : 'entryDate'
      where[fieldName] = {}
      if (dateFrom) {
        where[fieldName].gte = startOfDaySarajevo(dateFrom)
      }
      if (dateTo) {
        where[fieldName].lt = startOfNextDaySarajevo(dateTo)
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
            email: true,
            role: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            code: true
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
  const fail = (message: string, status = 400) => errorResponse(message, status, { localized: true })
  let savedEntryId: string | undefined
  try {
    let formData: FormData
    try { formData = await req.formData() } catch {
      return fail('Podaci prijave nisu ispravno poslani. Osvježite stranicu i pokušajte ponovo.')
    }
    const validationError = validateCreateFields(formData)
    if (validationError) return fail(validationError)

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
    const additiveDetailsStr = formData.get('additiveDetails') as string | null
    let additiveDetails = null
    if (additiveDetailsStr) {
      try {
        additiveDetails = z.array(z.object({
          name: z.string().min(1),
          addedAt: z.string().refine(value => Number.isFinite(new Date(value).getTime())),
          quantity: z.number().nonnegative().nullable().optional(),
        })).parse(JSON.parse(additiveDetailsStr))
      } catch {
        return fail('Podaci o aditiviranju nisu ispravni. Provjerite unesene aditive, količine i datume.')
      }
    }
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
    const vehicleRegistration = formData.get('vehicleRegistration') as string | null
    const clientId = formData.get('clientId') as string | null
    const laboratoryId = formData.get('laboratoryId') as string | null
    const stationId = formData.get('stationId') as string | null
    const certificate = formData.get('certificate') as File | null
    const existingCertificatePath = formData.get('existingCertificatePath') as string | null
    const receiptRecordStr = formData.get('receiptRecord') as string | null

    // Parse receipt record data for PUMPA users
    let receiptRecordData: ReturnType<typeof parseReceiptRecord> | undefined
    if (receiptRecordStr && canWriteReceipt(session.user.role)) {
      try {
        receiptRecordData = parseReceiptRecord(JSON.parse(receiptRecordStr))
      } catch (error) {
        if (error instanceof ZodError) {
          const fields = [...new Set(error.issues.map(issue => {
            const key = String(issue.path.at(-1))
            const tankIndex = issue.path[1]
            const label = createFieldLabels[key] || 'Podaci zapisnika'
            return typeof tankIndex === 'number' ? `Rezervoar ${tankIndex + 1}: ${label}` : label
          }))]
          return fail(`Zapisnik o prijemu sadrži neispravna polja: ${fields.join(', ')}. Provjerite unesene vrijednosti; količine moraju biti cijeli nenegativni brojevi.`)
        }
        return fail('Zapisnik o prijemu goriva nije ispravno poslan. Provjerite podatke zapisnika.')
      }
    }

    if (!await canUseWarehouse(session.user, warehouseId)) {
      return fail('Nemate dozvolu za kreiranje prijave u odabranom skladištu. Odaberite dodijeljeno skladište ili kontaktirajte administratora.', 403)
    }
    const parsedQuantity = Number(quantity)

    // Validate certificate BEFORE creating entry (if certificate is provided)
    // This prevents creating orphan entries with invalid files
    if (certificate) {
      if (typeof certificate === 'string') return fail('Certifikat nije ispravno poslan. Ponovo odaberite datoteku.')
      const validation = await validateFile(certificate)
      if (!validation.valid) {
        return fail(validation.error || 'Certifikat nije ispravan. Odaberite PDF, JPEG ili PNG datoteku do 10 MB.')
      }
    }

    // Create fuel entry with retry logic for declaration number race condition
    // If two users create entries simultaneously, one might get a duplicate declaration number
    // The @unique constraint will reject it, and we retry with a new number
    const MAX_RETRIES = 3
    let fuelEntry: any = null
    let lastError: any = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Generate declaration number in format XXXX/YY (e.g., 0001/26)
        const declarationNumber = await generateDeclarationNumber()

        // Create fuel entry - database will auto-generate registrationNumber
        fuelEntry = await prisma.fuelEntry.create({
          data: {
            // registrationNumber is auto-generated by database sequence
            declarationNumber,
            entryDate: new Date(entryDate),
            warehouseId,
            productName,
            quantity: parsedQuantity,
            deliveryNoteNumber: deliveryNoteNumber || null,
            deliveryNoteDate: deliveryNoteDate ? new Date(deliveryNoteDate) : null,
            customsDeclarationNumber: customsDeclarationNumber || null,
            customsDeclarationDate: customsDeclarationDate ? new Date(customsDeclarationDate) : null,
            isHigherQuality,
            improvedCharacteristics: isHigherQuality ? improvedCharacteristics.filter(Boolean) : [],
            additiveDetails: isHigherQuality ? additiveDetails || [] : [],
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
            vehicleRegistration: vehicleRegistration || null,
            clientId: clientId || null,
            laboratoryId: laboratoryId || null,
            stationId: stationId || null,
            certificatePath: null,
            certificateFileName: null,
            certificateUploadedAt: null,
            ...(receiptRecordData ? { receiptRecord: { create: receiptRecordData } } : {}),
            createdBy: session.user.id
          },
          include: {
            receiptRecord: true,
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
                email: true,
                role: true
              }
            },
            client: {
              select: {
                id: true,
                name: true,
                code: true
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

        savedEntryId = fuelEntry.id

        // Success - break out of retry loop
        break
      } catch (error) {
        lastError = error

        // Check if it's a unique constraint violation on declarationNumber (Prisma error P2002)
        if (isPrismaError(error) && error.code === 'P2002' && error.meta?.target?.includes('declaration_number')) {
          logger.warn(`[FUEL_ENTRY] Declaration number collision on attempt ${attempt}, retrying...`)

          if (attempt === MAX_RETRIES) {
            logger.error('[FUEL_ENTRY] Max retries reached for declaration number generation')
            return fail('Nije moguće dodijeliti jedinstven broj izjave zbog istovremenog kreiranja prijava. Pokušajte ponovo.', 409)
          }

          // Small delay before retry to reduce collision chance
          await new Promise(resolve => setTimeout(resolve, 50 * attempt))
          continue
        }

        // For other errors, throw immediately
        throw error
      }
    }

    if (!fuelEntry) {
      logger.error('[FUEL_ENTRY] Failed to create entry after retries:', lastError)
      return fail(CREATE_UNCONFIRMED, 500)
    }

    // Handle certificate (upload new OR use existing) AFTER entry is created
    // If upload fails, we rollback the entry (compensating transaction)
    let finalCertificatePath: string | null = null
    let finalCertificateFileName: string | null = null
    let finalCertificateUploadedAt: Date | null = null

    if (certificate && certificate.size > 0) {
      // Upload new certificate
      try {
        // Upload file using the database-generated registrationNumber
        finalCertificatePath = await saveFile(certificate, fuelEntry.registrationNumber)
        finalCertificateFileName = certificate.name
        finalCertificateUploadedAt = new Date()
      } catch (uploadError) {
        logger.error('[FUEL_ENTRY] Certificate upload failed, rolling back entry:', uploadError)

        // COMPENSATING TRANSACTION: Delete the entry since file upload failed
        // This prevents orphan entries and wasted registration numbers
        try {
          await prisma.fuelEntry.delete({
            where: { id: fuelEntry.id }
          })
          savedEntryId = undefined
          logger.info('[FUEL_ENTRY] Entry rolled back due to upload failure')
        } catch (deleteError) {
          logger.error('[FUEL_ENTRY] Failed to rollback entry:', deleteError)
          // Entry remains in database without certificate - admin can clean up later
        }

        return fail(savedEntryId
          ? 'Prijava je kreirana, ali certifikat nije spremljen. Otvorite prijavu na listi i dodajte certifikat ili kontaktirajte administratora. Nemojte kreirati novu prijavu.'
          : 'Prijava nije kreirana jer spremanje certifikata nije uspjelo. Pokušajte ponovo; ako se problem ponovi, kontaktirajte administratora.', 500)
      }
    } else if (existingCertificatePath) {
      // Use existing certificate
      finalCertificatePath = existingCertificatePath
      finalCertificateFileName = existingCertificatePath.split('/').pop() || 'certificate'
      finalCertificateUploadedAt = new Date()
    }

    // Update entry with certificate info if we have one
    if (finalCertificatePath) {
      await prisma.fuelEntry.update({
        where: { id: fuelEntry.id },
        data: {
          certificatePath: finalCertificatePath,
          certificateFileName: finalCertificateFileName,
          certificateUploadedAt: finalCertificateUploadedAt
        }
      })

      // Update local object for response
      fuelEntry.certificatePath = finalCertificatePath
      fuelEntry.certificateFileName = finalCertificateFileName
      fuelEntry.certificateUploadedAt = finalCertificateUploadedAt
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
    if (savedEntryId) return fail('Prijava je kreirana, ali završno spremanje nije u potpunosti uspjelo. Provjerite prijavu i certifikat na listi ili kontaktirajte administratora. Nemojte kreirati novu prijavu.', 500)
    if (isPrismaError(error)) {
      if (error.code === 'P2003' || error.code === 'P2025') return fail('Odabrano skladište, klijent, laboratorija, poslovnica, dobavljač ili prijevoznik više nije dostupan. Osvježite listu i ponovo odaberite podatke.', 409)
      if (error.code === 'P2002') return fail('Prijava s istim jedinstvenim brojem već postoji. Provjerite listu prijava prije ponovnog slanja.', 409)
      if (['P1001', 'P1002', 'P2024'].includes(error.code)) return fail('Veza s bazom podataka trenutno nije dostupna. Sačekajte kratko i pokušajte ponovo.', 503)
    }
    return fail(CREATE_UNCONFIRMED, 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'PUMPA'])
