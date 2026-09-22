import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { errorResponse } from "@/lib/api/response"
import { generateZapisnikPDF } from "@/lib/utils/pdf-generator-zapisnik"

// GET /api/exports/receipt-record/:entryId - Generate and download PDF for fuel receipt record
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { entryId } = params

    // Fetch fuel entry with receipt record
    const fuelEntry = await prisma.fuelEntry.findUnique({
      where: { id: entryId },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            location: true
          }
        },
        transporter: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        station: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            city: true
          }
        },
        receiptRecord: true
      }
    })

    if (!fuelEntry) {
      return errorResponse('Fuel entry not found', 404)
    }

    if (!fuelEntry.receiptRecord) {
      return errorResponse('Receipt record not found for this entry', 404)
    }

    // Check if user has access to this entry
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      if (session.user.role === 'PUMPA') {
        // PUMPA users can only access their own entries
        if (fuelEntry.operatorId !== session.user.id) {
          return errorResponse('Access denied to this fuel entry', 403)
        }
      } else {
        // OPERATOR/VIEWER: check warehouse access
        const userWarehouses = session.user.warehouses?.map((w: { id: string }) => w.id) || []
        if (!userWarehouses.includes(fuelEntry.warehouseId)) {
          return errorResponse('Access denied to this fuel entry', 403)
        }
      }
    }

    // Generate PDF
    const pdfBuffer = await generateZapisnikPDF(fuelEntry)

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT_PDF',
        entityType: 'FuelReceiptRecord',
        entityId: entryId,
        changes: {
          action: 'receipt_record_pdf_export',
          registrationNumber: fuelEntry.registrationNumber
        }
      }
    })

    // Return PDF as download
    const declarationNum = fuelEntry.declarationNumber || String(fuelEntry.registrationNumber)
    const sanitizedDeclarationNum = declarationNum.replace(/\//g, '-')
    const filename = `Zapisnik_${sanitizedDeclarationNum}.pdf`

    const safeFilename = encodeURIComponent(filename).replace(/%20/g, '_')

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error generating receipt record PDF:', error)
    return errorResponse('Failed to generate PDF', 500)
  }
})
