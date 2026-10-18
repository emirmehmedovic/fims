import { readQuantity as reading, sondeReading, sondePair, completePair, letvaPair, type Reading, type ReceiptMeasurement } from '@/lib/fuel-entries/measurements'

// Prefer a complete sonde pair for each tank. Zero is a valid reading.
// Do not present a partial total while a tank's readings are incomplete.
export function calculateDeliveryNoteQuantity(
  measurements: ReceiptMeasurement[],
  soldQuantity: Reading,
): number | null {
  if (!measurements.length) return null
  let total = 0
  for (const measurement of measurements) {
    const initialSonde = sondeReading(measurement, 'initial')
    const finalSonde = sondeReading(measurement, 'final')
    const sonda = sondePair(measurement)
    if (sonda) {
      total += sonda[1] - sonda[0]
    } else if (initialSonde === null && finalSonde === null) {
      const initialRaw = reading(measurement.initialLetva)
      const finalRaw = reading(measurement.finalLetva)
      // Older records may contain only corrected letva readings.
      const pair = initialRaw === null && finalRaw === null
        ? letvaPair(measurement)
        : completePair(initialRaw, finalRaw)
      if (!pair) return null
      total += pair[1] - pair[0]
    } else {
      return null
    }
  }
  return total + (reading(soldQuantity) ?? 0)
}
