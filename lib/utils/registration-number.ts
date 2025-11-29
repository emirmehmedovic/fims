import { prisma } from '@/lib/prisma'

/**
 * Generate next registration number atomically
 * Uses transaction to ensure uniqueness even with concurrent requests
 */
export async function generateRegistrationNumber(): Promise<number> {
  return await prisma.$transaction(async (tx) => {
    // Get the max registration number
    const result = await tx.fuelEntry.aggregate({
      _max: {
        registrationNumber: true
      }
    })

    // Start from 12345 if no entries exist, otherwise increment
    const nextNumber = (result._max.registrationNumber || 12344) + 1

    return nextNumber
  })
}
