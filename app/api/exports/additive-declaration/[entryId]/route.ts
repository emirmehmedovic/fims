import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { errorResponse } from "@/lib/api/response"
import { generateAdditiveDeclarationPDF } from "@/lib/utils/pdf-generator-additive"

// GET /api/exports/additive-declaration/:entryId - Generate PDF for additive declaration
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { entryId } = params

    // Fetch fuel entry with all related data including additive details
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

    // Check if entry has additive details
    if (!fuelEntry.additiveDetails || (fuelEntry.additiveDetails as any[]).length === 0) {
      return errorResponse('This entry has no additive information', 400)
    }

    // Fetch additive master data for each additive in the entry
    const additiveNames = (fuelEntry.additiveDetails as any[]).map((ad: any) => ad.name)
    const additives = await prisma.fuelCharacteristic.findMany({
      where: {
        name: {
          in: additiveNames
        }
      }
    })

    // Generate PDF - cast types properly
    const entryData = {
      ...fuelEntry,
      additiveDetails: fuelEntry.additiveDetails as any[]
    }
    const pdfBuffer = await generateAdditiveDeclarationPDF(entryData as any, additives)

    // Return PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Izjava_O_Aditiviranju_${fuelEntry.registrationNumber}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating additive declaration PDF:', error)
    return errorResponse('Failed to generate additive declaration PDF', 500)
  }
})
