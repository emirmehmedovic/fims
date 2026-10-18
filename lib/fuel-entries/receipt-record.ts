import { z } from 'zod'
import { receiptQuantities } from './receipt-calculations'

const reading = z.union([
  z.string().refine(value => value.trim() === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)),
  z.number().int().nonnegative(),
  z.null(),
]).optional()
const quantity = z.number().int().nonnegative().nullable().optional()
const measurementSchema = z.object({
  tankNumber: z.string().optional(),
  initialSonde: reading, finalSonde: reading,
  initialLetva: reading, finalLetva: reading,
  initialLetva15: reading, finalLetva15: reading,
  initialSonde15: reading, finalSonde15: reading,
  initialLiters15Sonde: reading, finalLiters15Sonde: reading,
  initialLiters15Letva: reading, finalLiters15Letva: reading,
}).catchall(z.json())

const receiptSchema = z.object({
  tankerRegistration: z.string().nullable().optional(),
  tankMeasurements: z.array(measurementSchema).default([]),
  announcedQuantity: quantity,
  meterReading: quantity,
  hasDeliveryNote: z.boolean().default(false),
  hasQualityCertificate: z.boolean().default(false),
  hasComplianceDeclaration: z.boolean().default(false),
  isWaterMeasured: z.boolean().default(false),
  hasWaterInTank: z.boolean().default(false),
  isVisualInspectionDone: z.boolean().default(false),
  hasAdditives: z.boolean().default(false),
  isLastUnload: z.boolean().default(false),
  isTankCheckedAfterLastUnload: z.boolean().default(false),
  fuelFoundOnLastUnload: z.string().nullable().optional(),
  hasWeighing: z.boolean().default(false),
  weighingData: z.record(z.string(), z.json()).nullable().optional(),
})

// Validate writes only. Historical PDF reads retain their permissive legacy adapters.
// Derived values from clients are deliberately ignored.
export function parseReceiptRecord(input: unknown) {
  const record = receiptSchema.parse(input)
  return {
    ...record,
    tankerRegistration: record.tankerRegistration || null,
    fuelFoundOnLastUnload: record.fuelFoundOnLastUnload || null,
    weighingData: record.weighingData || {},
    ...receiptQuantities(record.tankMeasurements, record.announcedQuantity ?? null, record.meterReading ?? null),
  }
}
