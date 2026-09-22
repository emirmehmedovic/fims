/**
 * Shared types used across the application
 * These types ensure type safety for JSON fields and complex objects
 */

// ============================================
// ADDITIVE DETAILS (JSON field in FuelEntry)
// ============================================

export interface AdditiveDetail {
  name: string
  addedAt: string  // ISO date string or datetime
  quantity: string // Quantity as string (e.g., "50ml", "100ml")
}

// Type guard for AdditiveDetail
export function isAdditiveDetail(obj: unknown): obj is AdditiveDetail {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as AdditiveDetail).name === 'string' &&
    typeof (obj as AdditiveDetail).addedAt === 'string' &&
    typeof (obj as AdditiveDetail).quantity === 'string'
  )
}

// Type guard for AdditiveDetail array
export function isAdditiveDetailArray(arr: unknown): arr is AdditiveDetail[] {
  return Array.isArray(arr) && arr.every(isAdditiveDetail)
}

// Safe parser for additiveDetails JSON field
export function parseAdditiveDetails(json: unknown): AdditiveDetail[] {
  if (!json) return []
  if (Array.isArray(json)) {
    return json.filter(isAdditiveDetail)
  }
  return []
}

// ============================================
// TANK MEASUREMENTS (for Receipt Records)
// ============================================

export interface TankMeasurement {
  tankNumber: string
  // Sonda (električna)
  initialSonde: string
  finalSonde: string
  // Letva (ručno mjerenje)
  initialLetva: string
  finalLetva: string
  // Temperatura i faktor
  initialTemp: string
  finalTemp: string
  initialFactor: string
  finalFactor: string
  // Izračunato na 15°C
  initialLiters15Sonde: string
  finalLiters15Sonde: string
  initialLiters15Letva: string
  finalLiters15Letva: string
}

// ============================================
// WEIGHING DATA (for Receipt Records)
// ============================================

export interface WeighingData {
  tara: string
  neto: string
  bruto: string
  specificWeight: string
  tempOnTanker: string
  litersWithCorrection: string
  deliveryNoteWeight: string
  weightDifference: string
}

// ============================================
// FUEL ENTRY DATA (for PDF generators)
// ============================================

export interface FuelEntryForPDF {
  id: string
  registrationNumber: number
  declarationNumber?: string | null
  entryDate: Date
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: Date | null
  customsDeclarationNumber: string | null
  customsDeclarationDate: Date | null
  isHigherQuality: boolean
  improvedCharacteristics: string[]
  additiveDetails?: AdditiveDetail[] | null
  countryOfOrigin: string | null
  laboratoryName: string | null
  labAccreditationNumber: string | null
  testReportNumber: string | null
  testReportDate: Date | null
  orderOpenedBy: string | null
  pickupLocation: string | null
  driverName: string | null
  vehicleRegistration: string | null
  certificatePath: string | null
  createdAt: Date
  warehouse: {
    name: string
    code: string
    location: string | null
  }
  operator: {
    name: string
    email: string
  }
  supplier: {
    name: string
    code: string
  } | null
  transporter: {
    name: string
    code: string
  } | null
  laboratory: {
    id: string
    name: string
    address: string | null
    accreditationNumber: string | null
  } | null
  client: {
    name: string
    code: string
  } | null
  station: {
    name: string
    code: string
    address: string
    city?: string | null
  } | null
}

// ============================================
// FUEL ENTRY FOR ZAPISNIK PDF
// ============================================

export interface FuelReceiptRecordData {
  id: string
  tankMeasurements: TankMeasurement[]
  announcedQuantity: number | null
  dischargedQuantity: number | null
  differenceQuantity: number | null
  meterReading: number | null
  deliveryNoteQuantity: number | null
  finalDifference: number | null
  hasDeliveryNote: boolean
  hasQualityCertificate: boolean
  hasComplianceDeclaration: boolean
  isWaterMeasured: boolean
  hasWaterInTank: boolean
  isVisualInspectionDone: boolean
  hasAdditives: boolean
  isLastUnload: boolean
  isTankCheckedAfterLastUnload: boolean
  fuelFoundOnLastUnload: string | null
  hasWeighing: boolean
  weighingData: WeighingData | null
}

export interface FuelEntryForZapisnikPDF {
  id: string
  registrationNumber: number
  declarationNumber?: string | null
  entryDate: Date
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: Date | null
  driverName: string | null
  vehicleRegistration: string | null
  transporter: {
    name: string
    code: string
  } | null
  warehouse: {
    code: string
    name: string
    location?: string | null
  } | null
  station: {
    name: string
    code: string
    address: string
    city?: string | null
  } | null
  receiptRecord: FuelReceiptRecordData | null
}

// ============================================
// FUEL ENTRY FOR ADDITIVE PDF
// ============================================

export interface FuelEntryForAdditivePDF {
  id: string
  registrationNumber: number
  declarationNumber?: string | null
  entryDate: Date
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: Date | null
  driverName: string | null
  vehicleRegistration: string | null
  additiveDetails: AdditiveDetail[]
  warehouse: {
    id: string
    name: string
    code: string
    location?: string | null
  } | null
  operator: {
    id: string
    name: string
    email: string
  } | null
  client: {
    id: string
    name: string
    code: string
  } | null
  station: {
    id: string
    name: string
    code: string
    address: string
    city?: string | null
  } | null
}

export interface FuelCharacteristicForPDF {
  id: string
  name: string
  description: string | null
  manufacturers: string[]
  type: string | null
}
