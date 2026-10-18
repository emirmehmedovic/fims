/** @jest-environment node */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PATCH } from '@/app/api/fuel-entries/[id]/route'
import { GET } from '@/app/api/exports/additive-declaration/[entryId]/route'
import { generateAdditiveDeclarationPDF } from '@/lib/utils/pdf-generator-additive'

let mockRole = 'ADMIN'

jest.mock('@/lib/api/withAuth', () => ({
  withAuth: (handler: Function) => (req: NextRequest, context: unknown) =>
    handler(req, context, { user: { id: 'operator', role: mockRole, warehouses: [{ id: 'warehouse' }] } }),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    fuelEntry: { findUnique: jest.fn(), update: jest.fn() },
    fuelCharacteristic: { findMany: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}))
jest.mock('@/lib/utils/file-upload', () => ({ saveFile: jest.fn(), validateFile: jest.fn() }))
jest.mock('@/lib/utils/pdf-generator-additive', () => ({ generateAdditiveDeclarationPDF: jest.fn() }))

const additiveDetails = [{ name: 'Imported additive', addedAt: '2026-10-18T10:00', quantity: 2 }]
const entry = { id: 'entry', isHigherQuality: true, improvedCharacteristics: ['Imported additive'], additiveDetails }

beforeEach(() => {
  jest.clearAllMocks()
  mockRole = 'ADMIN'
  jest.mocked(prisma.fuelEntry.findUnique).mockResolvedValue(entry as never)
  jest.mocked(prisma.fuelEntry.update).mockResolvedValue(entry as never)
})

it.each([false, true])('clears imported additives when quality is unchecked (stale payload: %s)', async (stalePayload) => {
  const form = new FormData()
  form.set('isHigherQuality', 'false')
  if (stalePayload) {
    form.append('improvedCharacteristics[]', 'Imported additive')
    form.set('additiveDetails', JSON.stringify(additiveDetails))
  }
  const response = await PATCH(new NextRequest('http://localhost/api/fuel-entries/entry', {
    method: 'PATCH', body: form,
  }), { params: Promise.resolve({ id: 'entry' }) })
  expect(response.status).toBe(200)
  expect(prisma.fuelEntry.update).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ isHigherQuality: false, improvedCharacteristics: [], additiveDetails: [] }),
  }))
})

it('preserves additive data on unrelated edits to higher-quality fuel', async () => {
  const form = new FormData()
  form.set('driverName', 'Updated driver')
  const response = await PATCH(new NextRequest('http://localhost/api/fuel-entries/entry', {
    method: 'PATCH', body: form,
  }), { params: Promise.resolve({ id: 'entry' }) })
  expect(response.status).toBe(200)
  const data = jest.mocked(prisma.fuelEntry.update).mock.calls[0][0].data
  expect(data).not.toHaveProperty('additiveDetails')
  expect(data).not.toHaveProperty('improvedCharacteristics')
})

it('rejects declaration generation for ordinary fuel even with leftover imported additives', async () => {
  jest.mocked(prisma.fuelEntry.findUnique).mockResolvedValue({ ...entry, isHigherQuality: false } as never)
  const response = await GET(new NextRequest('http://localhost/api/exports/additive-declaration/entry'), {
    params: Promise.resolve({ entryId: 'entry' }),
  })
  expect(response.status).toBe(400)
  expect(generateAdditiveDeclarationPDF).not.toHaveBeenCalled()
  expect(prisma.fuelCharacteristic.findMany).not.toHaveBeenCalled()
})

it('validates receipt data before changing the fuel entry', async () => {
  const form = new FormData()
  form.set('receiptRecord', JSON.stringify({ tankMeasurements: 'invalid' }))
  const response = await PATCH(new NextRequest('http://localhost/api/fuel-entries/entry', { method: 'PATCH', body: form }), { params: Promise.resolve({ id: 'entry' }) })
  expect(response.status).toBe(400)
  expect(prisma.fuelEntry.update).not.toHaveBeenCalled()
})

it('persists receipt and entry in one nested atomic update with server-derived totals', async () => {
  const form = new FormData()
  form.set('receiptRecord', JSON.stringify({ tankMeasurements: [{ initialSonde: '100', finalSonde: '1100' }], meterReading: 50, deliveryNoteQuantity: 99999 }))
  const response = await PATCH(new NextRequest('http://localhost/api/fuel-entries/entry', { method: 'PATCH', body: form }), { params: Promise.resolve({ id: 'entry' }) })
  expect(response.status).toBe(200)
  expect(prisma.fuelEntry.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
    receiptRecord: { upsert: {
      create: expect.objectContaining({ deliveryNoteQuantity: 1050 }),
      update: expect.objectContaining({ deliveryNoteQuantity: 1050 }),
    } },
  }) }))
})

it('rejects moving an accessible entry into an unassigned warehouse', async () => {
  mockRole = 'OPERATOR'
  const body = new FormData()
  body.set('warehouseId', 'unassigned')
  const response = await PATCH(new NextRequest('http://localhost/api/fuel-entries/entry', { method: 'PATCH', body }), { params: Promise.resolve({ id: 'entry' }) })
  expect(response.status).toBe(403)
  expect(prisma.fuelEntry.update).not.toHaveBeenCalled()
})

it('clears all removed additives even when higher quality remains checked', async () => {
  const body = new FormData()
  body.set('isHigherQuality', 'true')
  body.set('improvedCharacteristics[]', '')
  body.set('additiveDetails', '[]')
  const response = await PATCH(new NextRequest('http://localhost/api/fuel-entries/entry', { method: 'PATCH', body }), { params: Promise.resolve({ id: 'entry' }) })
  expect(response.status).toBe(200)
  expect(prisma.fuelEntry.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isHigherQuality: true, improvedCharacteristics: [], additiveDetails: [] }) }))
})
