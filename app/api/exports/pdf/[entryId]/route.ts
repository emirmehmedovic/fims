import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { errorResponse } from "@/lib/api/response"
import { generateFuelEntryPDF } from "@/lib/utils/pdf-generator"

// GET /api/exports/pdf/:entryId - Generate and download PDF for fuel entry
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { entryId } = params

    // Fetch fuel entry with all related data
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
      }
    })

    if (!fuelEntry) {
      return errorResponse('Fuel entry not found', 404)
    }

    // Check if user has access to this warehouse (for non-admin users)
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      const userWarehouses = session.user.warehouses?.map((w: any) => w.id) || []
      if (!userWarehouses.includes(fuelEntry.warehouseId)) {
        return errorResponse('Access denied to this fuel entry', 403)
      }
    }

    // Check URL params for options
    const url = new URL(req.url)
    const includeCertificate = url.searchParams.get('includeCertificate') !== 'false'

    // Generate PDF
    const pdfBuffer = await generateFuelEntryPDF(fuelEntry as any, includeCertificate)

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT_PDF',
        entityType: 'FuelEntry',
        entityId: entryId,
        changes: {
          action: 'pdf_export',
          registrationNumber: fuelEntry.registrationNumber,
          includeCertificate
        }
      }
    })

    // Return PDF as download
    const filename = `Izjava_${fuelEntry.registrationNumber}.pdf`
    
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return errorResponse('Failed to generate PDF', 500)
  }
})
