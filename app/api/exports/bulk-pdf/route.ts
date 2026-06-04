import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { errorResponse, successResponse } from "@/lib/api/response"
import { generateFuelEntryPDF, createSharedBrowser } from "@/lib/utils/pdf-generator"
import { PDFDocument } from "pdf-lib"
import { startOfDaySarajevo, startOfNextDaySarajevo } from "@/lib/utils/date"
import { checkBulkExportRateLimit } from "@/lib/api/rate-limit-bulk"

// POST /api/exports/bulk-pdf - Generate bulk PDF for multiple fuel entries (OPTIMIZED + RATE LIMITED)
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    // Rate limiting: Max 5 bulk exports per hour
    const rateLimit = checkBulkExportRateLimit(session.user.id)
    if (!rateLimit.allowed) {
      console.warn(`[BULK_EXPORT] Rate limit exceeded for user ${session.user.email}`)
      return NextResponse.json(
        {
          success: false,
          error: rateLimit.error,
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime
        },
        { status: 429 } // Too Many Requests
      )
    }

    console.log(`[BULK_EXPORT] Request allowed. Remaining: ${rateLimit.remaining}`)

    const body = await req.json()
    const {
      warehouseId,
      clientId,
      productName,
      deliveryNoteNumber,
      registrationNumber,
      dateFrom,
      dateTo,
      entryIds,
      includeCertificates = true
    } = body

    // Build filter conditions
    const where: any = {
      isActive: true
    }

    // If specific entry IDs provided, use those
    if (entryIds && Array.isArray(entryIds) && entryIds.length > 0) {
      where.id = { in: entryIds }
    } else {
      // Otherwise use filters
      if (warehouseId) where.warehouseId = warehouseId
      if (clientId) where.clientId = clientId
      if (productName) where.productName = { contains: productName, mode: 'insensitive' }
      if (deliveryNoteNumber) where.deliveryNoteNumber = { contains: deliveryNoteNumber, mode: 'insensitive' }
      if (registrationNumber) where.registrationNumber = parseInt(registrationNumber)
      if (dateFrom || dateTo) {
        where.entryDate = {}
        if (dateFrom) where.entryDate.gte = startOfDaySarajevo(dateFrom)
        if (dateTo) where.entryDate.lt = startOfNextDaySarajevo(dateTo)
      }
    }

    // Check warehouse access for non-admin users
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      const userWarehouses = session.user.warehouses?.map((w: any) => w.id) || []
      if (warehouseId && !userWarehouses.includes(warehouseId)) {
        return errorResponse('Access denied to this warehouse', 403)
      }
      where.warehouseId = { in: userWarehouses }
    }

    // Fetch fuel entries
    const fuelEntries = await prisma.fuelEntry.findMany({
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
        laboratory: {
          select: {
            id: true,
            name: true,
            address: true,
            accreditationNumber: true
          }
        }
      },
      orderBy: { registrationNumber: 'asc' },
      take: 200 // Increased limit from 100 to 200
    })

    if (fuelEntries.length === 0) {
      return errorResponse('No fuel entries found matching the criteria', 404)
    }

    console.log(`[BULK_EXPORT] Generating ${fuelEntries.length} PDFs in parallel batches...`)

    // OPTIMIZED: Create ONE browser instance for all PDFs (memory optimization)
    const browser = await createSharedBrowser()
    let pdfBuffer: Buffer

    try {
      // OPTIMIZED: Generate PDFs in parallel batches (5 at a time)
      const mergedPdf = await PDFDocument.create()
      const batchSize = 5
      const totalBatches = Math.ceil(fuelEntries.length / batchSize)

      for (let i = 0; i < fuelEntries.length; i += batchSize) {
        const batch = fuelEntries.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1

        console.log(`[BULK_EXPORT] Processing batch ${batchNumber}/${totalBatches} (${batch.length} entries)`)

        // Generate PDFs for this batch in parallel (reusing same browser)
        const pdfPromises = batch.map(async (entry) => {
          try {
            const pdfBuffer = await generateFuelEntryPDF(entry as any, includeCertificates, browser)
            return { success: true, pdfBuffer, registrationNumber: entry.registrationNumber }
          } catch (error) {
            console.error(`[BULK_EXPORT] Error generating PDF for entry ${entry.registrationNumber}:`, error)
            return { success: false, registrationNumber: entry.registrationNumber, error }
          }
        })

        const results = await Promise.all(pdfPromises)

        // Merge successful PDFs
        for (const result of results) {
          if (result.success && result.pdfBuffer) {
            try {
              const pdf = await PDFDocument.load(result.pdfBuffer)
              const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
              pages.forEach(page => mergedPdf.addPage(page))
            } catch (error) {
              console.error(`[BULK_EXPORT] Error merging PDF for entry ${result.registrationNumber}:`, error)
            }
          }
        }
      }

      console.log(`[BULK_EXPORT] All PDFs generated and merged successfully`)

      // Save merged PDF inside try block (before finally)
      const mergedPdfBytes = await mergedPdf.save()
      pdfBuffer = Buffer.from(mergedPdfBytes)
    } finally {
      // Always close the browser
      await browser.close()
      console.log(`[BULK_EXPORT] Browser instance closed`)
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BULK_EXPORT',
        entityType: 'FuelEntry',
        changes: {
          action: 'bulk_pdf_export',
          entriesCount: fuelEntries.length,
          registrationNumbers: fuelEntries.map(e => e.registrationNumber),
          filters: { warehouseId, clientId, productName, deliveryNoteNumber, registrationNumber, dateFrom, dateTo }
        }
      }
    })

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `Bulk_Export_${timestamp}_${fuelEntries.length}_entries.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error generating bulk PDF:', error)
    return errorResponse('Failed to generate bulk PDF', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'])

// GET /api/exports/bulk-pdf - Get count of entries that would be exported
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const url = new URL(req.url)
    const warehouseId = url.searchParams.get('warehouseId')
    const clientId = url.searchParams.get('clientId')
    const productName = url.searchParams.get('productName')
    const deliveryNoteNumber = url.searchParams.get('deliveryNoteNumber')
    const registrationNumber = url.searchParams.get('registrationNumber')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')

    // Build filter conditions
    const where: any = {
      isActive: true
    }

    if (warehouseId) where.warehouseId = warehouseId
    if (clientId) where.clientId = clientId
    if (productName) where.productName = { contains: productName, mode: 'insensitive' }
    if (deliveryNoteNumber) where.deliveryNoteNumber = { contains: deliveryNoteNumber, mode: 'insensitive' }
    if (registrationNumber) where.registrationNumber = parseInt(registrationNumber)
    if (dateFrom || dateTo) {
      where.entryDate = {}
      if (dateFrom) where.entryDate.gte = startOfDaySarajevo(dateFrom)
      if (dateTo) where.entryDate.lt = startOfNextDaySarajevo(dateTo)
    }

    // Check warehouse access for non-admin users
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      const userWarehouses = session.user.warehouses?.map((w: any) => w.id) || []
      if (warehouseId && !userWarehouses.includes(warehouseId)) {
        return errorResponse('Access denied to this warehouse', 403)
      }
      where.warehouseId = { in: userWarehouses }
    }

    const count = await prisma.fuelEntry.count({ where })

    return successResponse({
      count,
      maxExportLimit: 200,
      canExport: count > 0 && count <= 200
    })
  } catch (error) {
    console.error('Error counting entries for bulk export:', error)
    return errorResponse('Failed to count entries', 500)
  }
})
