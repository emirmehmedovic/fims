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
        },
        laboratory: {
          select: {
            id: true,
            name: true,
            address: true,
            accreditationNumber: true
          }
        },
        client: {
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

    console.log('[PDF EXPORT] Entry found:', fuelEntry.registrationNumber)
    console.log('[PDF EXPORT] certificatePath:', fuelEntry.certificatePath)

    // Check if user has access to this entry
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      if (session.user.role === 'PUMPA') {
        // PUMPA users can only access their own entries
        if (fuelEntry.operatorId !== session.user.id) {
          return errorResponse('Access denied to this fuel entry', 403)
        }
      } else {
        // OPERATOR/VIEWER: check warehouse access
        const userWarehouses = session.user.warehouses?.map((w: any) => w.id) || []
        if (!userWarehouses.includes(fuelEntry.warehouseId)) {
          return errorResponse('Access denied to this fuel entry', 403)
        }
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
    // Use declarationNumber (format: 0001/26) and sanitize for filename (replace / with -)
    const declarationNum = fuelEntry.declarationNumber || String(fuelEntry.registrationNumber)
    const sanitizedDeclarationNum = declarationNum.replace(/\//g, '-')
    // Sanitize client name for filename - remove ALL special characters except letters, numbers, spaces
    // Then replace spaces with underscores and convert to ASCII-safe characters
    const sanitizeForFilename = (str: string): string => {
      return str
        .replace(/[„""''«»]/g, '')           // Remove special quotes
        .replace(/[\/\\:*?"<>|]/g, '')       // Remove filesystem-unsafe chars
        .replace(/[^\w\s\-čćžšđČĆŽŠĐáéíóúÁÉÍÓÚäöüÄÖÜ]/g, '') // Keep only word chars, spaces, dashes, and common accented letters
        .replace(/\s+/g, '_')                 // Replace spaces with underscores
        .replace(/_+/g, '_')                  // Collapse multiple underscores
        .replace(/^_|_$/g, '')                // Trim underscores from start/end
        .substring(0, 50)
    }
    const clientName = fuelEntry.client?.name
      ? sanitizeForFilename(fuelEntry.client.name)
      : 'Nepoznat'
    const filename = `Izjava_${sanitizedDeclarationNum}_${clientName}.pdf`

    // Use encodeURIComponent for the filename to handle any remaining special chars
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
    console.error('Error generating PDF:', error)
    return errorResponse('Failed to generate PDF', 500)
  }
})
