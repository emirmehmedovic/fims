import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"
import { Decimal } from "@prisma/client/runtime/library"

// POST /api/correction-factors/bulk - Bulk import correction factors
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { factors, replaceExisting = false } = body

    if (!Array.isArray(factors) || factors.length === 0) {
      return errorResponse('Factors array is required', 400)
    }

    // Validate all factors
    for (const factor of factors) {
      if (!factor.productName || factor.temperature === undefined || factor.factor === undefined) {
        return errorResponse('Each factor must have productName, temperature, and factor', 400)
      }
    }

    // If replaceExisting is true, delete all existing factors first
    if (replaceExisting) {
      await prisma.correctionFactor.deleteMany({})
    }

    // Create all factors
    const createdCount = await prisma.correctionFactor.createMany({
      data: factors.map((f: any) => ({
        productName: f.productName,
        temperature: new Decimal(f.temperature),
        factor: new Decimal(f.factor),
        isActive: true
      })),
      skipDuplicates: true
    })

    return successResponse({
      message: `Successfully imported ${createdCount.count} correction factors`,
      count: createdCount.count
    }, 201)
  } catch (error) {
    console.error('Error bulk importing correction factors:', error)
    return errorResponse('Failed to bulk import correction factors', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// GET /api/correction-factors/bulk - Get seed data for actual products
export const GET = withAuth(async () => {
  // Thermal expansion coefficients by fuel type
  // Diesel: ~0.00083/°C
  // Gasoline (benzin): ~0.00123/°C
  // LPG: ~0.00180/°C
  // Heating oil (lož ulje): ~0.00070/°C
  // Mazut: ~0.00065/°C
  // Jet fuel: ~0.00090/°C
  // Propan/Butan: ~0.00200/°C

  const productsWithCoefficients: Array<{ name: string; coeff: number }> = [
    // Benzini
    { name: 'Bezolovni benzin 95 BAS EN 228 BEZ ADITIVA', coeff: 0.00123 },
    { name: 'Bezolovni benzin 95 bas en 228 H PLUS', coeff: 0.00123 },
    { name: 'BMB 100- Bezolovni benzin BAS EN 228', coeff: 0.00123 },
    { name: 'BMB 98 - Bezolovni benzin BAS EN 228', coeff: 0.00123 },
    // Dizeli
    { name: 'Dizel bas en 590 (10ppm) BEZ ADITIVA', coeff: 0.00083 },
    { name: 'Dizel bas en 590 10ppm H PLUS', coeff: 0.00083 },
    // LPG / Plinovi
    { name: 'Izo-butan', coeff: 0.00200 },
    { name: 'LPG (auto-plin) BAS EN 589', coeff: 0.00180 },
    { name: 'LPG ( dom i industrija -"povlašteni" ) BAS EN 589', coeff: 0.00180 },
    { name: 'LPG (tečni naftni gas) BAS EN 589', coeff: 0.00180 },
    { name: 'Propan', coeff: 0.00200 },
    // Ostala goriva
    { name: 'LUEL - Lož ulje ekstra lako BAS 1002', coeff: 0.00070 },
    { name: 'MAZUT NISKOSUMPORNI', coeff: 0.00065 },
    { name: 'MLAZNO GORIVO JET A-1', coeff: 0.00090 }
  ]

  // Temperature range from -20 to 40 in steps of 5
  const temperatures = [-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40]

  const factors: any[] = []

  for (const product of productsWithCoefficients) {
    for (const temp of temperatures) {
      // Factor = 1 - coefficient * (temperature - 15)
      // At 15°C, factor = 1.0
      // Higher temp = lower factor (fuel expands)
      // Lower temp = higher factor (fuel contracts)
      const factor = 1 - product.coeff * (temp - 15)
      factors.push({
        productName: product.name,
        temperature: temp,
        factor: Math.round(factor * 1000000) / 1000000 // 6 decimal places
      })
    }
  }

  return successResponse({
    message: 'Faktori korekcije za vaše proizvode bazirani na standardnim koeficijentima termičke ekspanzije',
    note: 'Ovo su aproksimacije. Zamijenite sa stvarnim certifikovanim vrijednostima kada ih dobijete.',
    factors
  })
}, ['SUPER_ADMIN', 'ADMIN'])
