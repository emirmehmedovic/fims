import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { errorResponse } from "@/lib/api/response"
import { generateFuelEntryPDF } from "@/lib/utils/pdf-generator"
import { PDFDocument } from "pdf-lib"

export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params
    const item = await prisma.autoSendBatchItem.findUnique({
      where: { id },
      include: { batch: true }
    })

    if (!item) {
      return errorResponse('Batch not found', 404)
    }

    const entries = await prisma.fuelEntry.findMany({
      where: { id: { in: item.entryIds } },
      include: {
        warehouse: { select: { id: true, name: true, code: true, location: true } },
        operator: { select: { id: true, name: true, email: true } },
        supplier: { select: { id: true, name: true, code: true } },
        transporter: { select: { id: true, name: true, code: true } }
      }
    })

    const entryMap = new Map(entries.map(entry => [entry.id, entry]))
    const orderedEntries = item.entryIds.map(entryId => entryMap.get(entryId)).filter(Boolean)

    const mergedPdf = await PDFDocument.create()
    for (const entry of orderedEntries) {
      const pdfBuffer = await generateFuelEntryPDF(entry as any, item.includeCertificates)
      const pdf = await PDFDocument.load(pdfBuffer)
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      pages.forEach(page => mergedPdf.addPage(page))
    }

    const mergedPdfBytes = await mergedPdf.save()
    const pdfBuffer = Buffer.from(mergedPdfBytes)
    const fileName = `AutoSend_Paket_${item.sequence}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error downloading auto-send batch:', error)
    return errorResponse('Failed to download batch', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
