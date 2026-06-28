import { prisma } from '@/lib/prisma'

/**
 * Generates declaration number in format XXXX/YY
 * Example: 0001/26 (first declaration of 2026)
 *
 * The number resets to 0001 each year.
 */
export async function generateDeclarationNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  const yearSuffix = String(currentYear).slice(-2) // "2026" -> "26"

  // Find the highest declaration number for the current year
  const latestEntry = await prisma.fuelEntry.findFirst({
    where: {
      declarationNumber: {
        endsWith: `/${yearSuffix}`
      }
    },
    orderBy: {
      declarationNumber: 'desc'
    },
    select: {
      declarationNumber: true
    }
  })

  let nextNumber = 1

  if (latestEntry?.declarationNumber) {
    // Extract the number part from "0001/26" -> 1
    const numberPart = latestEntry.declarationNumber.split('/')[0]
    nextNumber = parseInt(numberPart, 10) + 1
  }

  // Format: pad to 4 digits
  const paddedNumber = String(nextNumber).padStart(4, '0')

  return `${paddedNumber}/${yearSuffix}`
}

/**
 * Parse declaration number to get year and sequence number
 * Example: "0015/26" -> { sequence: 15, year: 2026 }
 */
export function parseDeclarationNumber(declarationNumber: string): { sequence: number; year: number } | null {
  const match = declarationNumber.match(/^(\d{4})\/(\d{2})$/)
  if (!match) return null

  const sequence = parseInt(match[1], 10)
  const yearSuffix = parseInt(match[2], 10)
  const year = yearSuffix >= 50 ? 1900 + yearSuffix : 2000 + yearSuffix

  return { sequence, year }
}
