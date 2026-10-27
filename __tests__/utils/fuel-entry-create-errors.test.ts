import { CREATE_UNCONFIRMED, createResponseError, validateCreateFields } from '@/lib/fuel-entries/create-errors'

function valid() {
  const data = new FormData()
  Object.entries({ entryDate: '2026-10-27', warehouseId: 'warehouse', productName: 'Diesel', quantity: '1000' }).forEach(([key, value]) => data.set(key, value))
  return data
}
it('lists all missing required fields in Bosnian', () => {
  expect(validateCreateFields(new FormData())).toContain('Datum ulaza, Skladište, Naziv proizvoda, Količina (litara)')
})
it.each(['0', '-1', '100abc', '1.5', '50001', 'NaN'])('rejects invalid quantity %s', quantity => {
  const data = valid(); data.set('quantity', quantity)
  expect(validateCreateFields(data)).toContain('cijeli broj od 1 do 50.000')
})
it('identifies invalid calendar dates by field name', () => {
  const data = valid(); data.set('testReportDate', '2026-02-30')
  expect(validateCreateFields(data)).toContain('Datum izvještaja laboratorije')
})
it('accepts valid fields and optional blank dates', () => {
  expect(validateCreateFields(valid())).toBeNull()
})
it('does not expose English or internal server messages', () => {
  expect(createResponseError(500, { error: 'Failed to create fuel entry: database password' })).toBe(CREATE_UNCONFIRMED)
  expect(createResponseError(502, null)).toBe(CREATE_UNCONFIRMED)
})
it('shows localized validation and authentication errors', () => {
  expect(createResponseError(400, { error: 'Nedostaje skladište.', details: { localized: true } })).toBe('Nedostaje skladište.')
  expect(createResponseError(401, { error: 'Unauthorized' })).toContain('Ponovo se prijavite')
  expect(createResponseError(403, null)).toContain('Nemate dozvolu')
})
