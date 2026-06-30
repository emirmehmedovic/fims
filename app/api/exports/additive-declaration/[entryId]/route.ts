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

    if (!fuelEntry) {
      return errorResponse('Fuel entry not found', 404)
    }

    // Check if entry has additive details
    if (!fuelEntry.additiveDetails || (fuelEntry.additiveDetails as any[]).length === 0) {
      return errorResponse('This entry has no additive information', 400)
    }

    // Fetch ALL active fuel characteristics to match flexibly
    // (names may have special characters like ® that don't match exactly)
    const allAdditives = await prisma.fuelCharacteristic.findMany({
      where: { isActive: true }
    })

    // Normalize function to remove special characters for comparison
    const normalizeName = (name: string) =>
      name.replace(/[®™©]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

    // Find matching additives for each additive detail
    const additiveNames = (fuelEntry.additiveDetails as any[]).map((ad: any) => ad.name)
    console.log('[Additive PDF] Additive names from entry:', additiveNames)

    const additives = allAdditives.filter(a => {
      const normalizedDbName = normalizeName(a.name)
      return additiveNames.some(entryName => {
        const normalizedEntryName = normalizeName(entryName)
        // Check if names match after normalization
        return normalizedDbName === normalizedEntryName ||
               normalizedDbName.includes(normalizedEntryName) ||
               normalizedEntryName.includes(normalizedDbName)
      })
    })

    console.log('[Additive PDF] Found additives from DB:', additives.map(a => ({
      name: a.name,
      manufacturers: a.manufacturers,
      type: a.type
    })))

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
