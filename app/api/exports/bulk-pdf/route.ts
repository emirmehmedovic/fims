import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { errorResponse, successResponse } from "@/lib/api/response"
import { generateFuelEntryPDF } from "@/lib/utils/pdf-generator"
import { PDFDocument } from "pdf-lib"

// POST /api/exports/bulk-pdf - Generate bulk PDF for multiple fuel entries
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const { 
      warehouseId, 
      productName, 
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
      if (productName) where.productName = { contains: productName, mode: 'insensitive' }
      if (dateFrom || dateTo) {
        where.entryDate = {}
        if (dateFrom) where.entryDate.gte = new Date(dateFrom)
        if (dateTo) where.entryDate.lte = new Date(dateTo)
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
        }
      },
      orderBy: { registrationNumber: 'asc' },
      take: 100 // Limit to 100 entries for performance
    })

    if (fuelEntries.length === 0) {
      return errorResponse('No fuel entries found matching the criteria', 404)
    }

    // Generate PDFs for each entry and merge them
    const mergedPdf = await PDFDocument.create()

    for (const entry of fuelEntries) {
      try {
        const pdfBuffer = await generateFuelEntryPDF(entry as any, includeCertificates)
        const pdf = await PDFDocument.load(pdfBuffer)
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        pages.forEach(page => mergedPdf.addPage(page))
      } catch (error) {
        console.error(`Error generating PDF for entry ${entry.registrationNumber}:`, error)
        // Continue with other entries
      }
    }

    const mergedPdfBytes = await mergedPdf.save()
    const pdfBuffer = Buffer.from(mergedPdfBytes)

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
          filters: { warehouseId, productName, dateFrom, dateTo }
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
    const productName = url.searchParams.get('productName')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')

    // Build filter conditions
    const where: any = {
      isActive: true
    }

    if (warehouseId) where.warehouseId = warehouseId
    if (productName) where.productName = { contains: productName, mode: 'insensitive' }
    if (dateFrom || dateTo) {
      where.entryDate = {}
      if (dateFrom) where.entryDate.gte = new Date(dateFrom)
      if (dateTo) where.entryDate.lte = new Date(dateTo)
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
      maxExportLimit: 100,
      canExport: count > 0 && count <= 100
    })
  } catch (error) {
    console.error('Error counting entries for bulk export:', error)
    return errorResponse('Failed to count entries', 500)
  }
})
