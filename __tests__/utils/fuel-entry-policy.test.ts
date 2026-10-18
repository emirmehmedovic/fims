import { documentMark } from '@/lib/fuel-entries/pdf-policy'
import { canAccessFuelEntry } from '@/lib/fuel-entries/access'
import { receiptTotals } from '@/lib/fuel-entries/measurements'
import { parseReceiptRecord } from '@/lib/fuel-entries/receipt-record'

it.each([
  ['ADMIN', 'pecat.png', 'pecat.png'],
  ['SUPER_ADMIN', 'pecat.png', 'pecat.png'],
  ['OPERATOR', 'potpis.png', null],
  ['PUMPA', 'potpis.png', null],
  ['VIEWER', null, null],
])('selects marks for %s', (role, compliance, additive) => {
  expect(documentMark('compliance', role!)).toBe(compliance)
  expect(documentMark('additive', role!)).toBe(additive)
  expect(documentMark('receipt', role!)).toBeNull()
})

it('restricts pump users to their entries and operators to assigned warehouses', () => {
  const entry = { operatorId: 'owner', warehouseId: 'warehouse' }
  expect(canAccessFuelEntry({ id: 'other', role: 'PUMPA', warehouses: [{ id: 'warehouse' }] }, entry)).toBe(false)
  expect(canAccessFuelEntry({ id: 'owner', role: 'PUMPA' }, entry)).toBe(true)
  expect(canAccessFuelEntry({ id: 'other', role: 'OPERATOR', warehouses: [{ id: 'warehouse' }] }, entry)).toBe(true)
  expect(canAccessFuelEntry({ id: 'other', role: 'OPERATOR' }, entry)).toBe(false)
})

it('reads historical measurement keys without requiring a migration', () => {
  expect(receiptTotals([{ initialLiters15Sonde: '100', finalLiters15Sonde: '1100', initialLiters15Letva: '200', finalLiters15Letva: '1200' }])).toEqual({ sonde: 1000, letva: 1000, discharged: 1000 })
})

it('recomputes client-supplied totals and preserves a real zero reading', () => {
  const result = parseReceiptRecord({
    tankMeasurements: [{ initialSonde: '0', finalSonde: '1000', initialLetva15: '0', finalLetva15: '950' }],
    meterReading: 50, announcedQuantity: 1000,
    deliveryNoteQuantity: 999999, dischargedQuantity: 999999, finalDifference: 999999,
  })
  expect(result).toMatchObject({ deliveryNoteQuantity: 1050, dischargedQuantity: 950, differenceQuantity: 50, finalDifference: 100 })
})

it('rejects malformed receipt writes before persistence', () => {
  expect(() => parseReceiptRecord({ tankMeasurements: 'invalid' })).toThrow()
  expect(() => parseReceiptRecord({ meterReading: -1 })).toThrow()
})

it('does not combine an incomplete letva pair with a sonde reading', () => {
  expect(receiptTotals([{ initialSonde: '100', finalSonde: '1100', initialLetva15: '200' }])).toEqual({ sonde: 1000, letva: 0, discharged: 1000 })
})

it('keeps legacy letva-only records calculable when saved again', () => {
  expect(parseReceiptRecord({ tankMeasurements: [{ initialLiters15Letva: '100', finalLiters15Letva: '1100' }], meterReading: 50 })).toMatchObject({ deliveryNoteQuantity: 1050, dischargedQuantity: 1000, finalDifference: 50 })
})
