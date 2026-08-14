import { prisma } from '@/lib/prisma'

/**
 * Generates declaration number in format XXXX/YY
 * Example: 0001/26 (first declaration of 2026)
 *
 * The number resets to 0001 each year.
 * Supports numbers beyond 9999 (e.g., 10000/26, 10001/26, etc.)
 */
export async function generateDeclarationNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  const yearSuffix = String(currentYear).slice(-2) // "2026" -> "26"

  // Find the highest declaration number for the current year using numeric sorting
  // We use raw SQL to extract the numeric part and sort properly
  const result = await prisma.$queryRaw<{ max_num: number | null }[]>`
    SELECT MAX(CAST(SPLIT_PART("declarationNumber", '/', 1) AS INTEGER)) as max_num
    FROM "FuelEntry"
    WHERE "declarationNumber" LIKE ${'%/' + yearSuffix}
  `

  let nextNumber = 1

  if (result[0]?.max_num !== null && result[0]?.max_num !== undefined) {
    nextNumber = result[0].max_num + 1
  }

  // Format: pad to minimum 4 digits (allows 5+ digits for numbers > 9999)
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
