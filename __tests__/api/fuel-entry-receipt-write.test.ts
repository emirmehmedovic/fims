/** @jest-environment node */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/fuel-entries/route'

let mockRole = 'ADMIN'

jest.mock('@/lib/api/withAuth', () => ({
  withAuth: (handler: (...args: unknown[]) => unknown) => (req: NextRequest, context: unknown) =>
    handler(req, context, { user: { id: 'admin', role: mockRole, warehouses: [{ id: 'warehouse' }] } }),
}))
jest.mock('@/lib/prisma', () => ({ prisma: { fuelEntry: { create: jest.fn() }, auditLog: { create: jest.fn() } } }))
jest.mock('@/lib/utils/file-upload', () => ({ saveFile: jest.fn(), validateFile: jest.fn() }))
jest.mock('@/lib/utils/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() }, isPrismaError: () => false }))
jest.mock('@/lib/utils/declaration-number', () => ({ generateDeclarationNumber: async () => '0125/26' }))

function request(receipt: unknown) {
  const body = new FormData()
  body.set('entryDate', '2026-10-18')
  body.set('warehouseId', 'warehouse')
  body.set('productName', 'Diesel')
  body.set('quantity', '1000')
  body.set('receiptRecord', JSON.stringify(receipt))
  return new NextRequest('http://localhost/api/fuel-entries', { method: 'POST', body })
}

beforeEach(() => { jest.resetAllMocks(); mockRole = 'ADMIN' })

it('creates entry and receipt with a single nested write', async () => {
  jest.mocked(prisma.fuelEntry.create).mockResolvedValue({ id: 'entry', registrationNumber: 125, warehouse: { code: 'TEST' } } as never)
  const response = await POST(request({ tankMeasurements: [{ initialSonde: '100', finalSonde: '1100' }], meterReading: 50 }), { params: Promise.resolve({}) })
  expect(response.status).toBe(201)
  expect(prisma.fuelEntry.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
    receiptRecord: { create: expect.objectContaining({ dischargedQuantity: 1000, deliveryNoteQuantity: 1050 }) },
  }) }))
})

it('does not create an entry when receipt validation fails', async () => {
  const response = await POST(request({ tankMeasurements: 'invalid' }), { params: Promise.resolve({}) })
  expect(response.status).toBe(400)
  expect(prisma.fuelEntry.create).not.toHaveBeenCalled()
})

it('returns failure instead of success when the nested write fails', async () => {
  jest.mocked(prisma.fuelEntry.create).mockRejectedValue(new Error('Receipt write failed'))
  const response = await POST(request({ tankMeasurements: [] }), { params: Promise.resolve({}) })
  expect(response.status).toBe(500)
  expect(prisma.auditLog.create).not.toHaveBeenCalled()
})

it('rejects creation in an unassigned warehouse for an operator', async () => {
  mockRole = 'OPERATOR'
  const req = request({ tankMeasurements: [] })
  const body = await req.formData()
  body.set('warehouseId', 'unassigned')
  const response = await POST(new NextRequest(req.url, { method: 'POST', body }), { params: Promise.resolve({}) })
  expect(response.status).toBe(403)
  expect(prisma.fuelEntry.create).not.toHaveBeenCalled()
})

it('identifies missing fields without writing an entry', async () => {
  const response = await POST(new NextRequest('http://localhost/api/fuel-entries', { method: 'POST', body: new FormData() }), { params: Promise.resolve({}) })
  expect(response.status).toBe(400)
  expect(await response.json()).toMatchObject({ error: expect.stringContaining('Datum ulaza, Skladište, Naziv proizvoda, Količina (litara)'), details: { localized: true } })
  expect(prisma.fuelEntry.create).not.toHaveBeenCalled()
})

it('identifies the invalid receipt measurement', async () => {
  const response = await POST(request({ tankMeasurements: [{ initialSonde: '-5' }] }), { params: Promise.resolve({}) })
  expect(response.status).toBe(400)
  expect((await response.json()).error).toContain('Rezervoar 1: Početno stanje sonde')
  expect(prisma.fuelEntry.create).not.toHaveBeenCalled()
})

it('does not expose unexpected database errors', async () => {
  jest.mocked(prisma.fuelEntry.create).mockRejectedValue(new Error('secret database details'))
  const response = await POST(request({}), { params: Promise.resolve({}) })
  const body = await response.json()
  expect(body.error).toContain('Prije ponovnog slanja provjerite listu prijava')
  expect(body.error).not.toContain('secret')
})


it('warns against duplicate creation when audit fails after saving', async () => {
  jest.mocked(prisma.fuelEntry.create).mockResolvedValue({ id: 'entry', registrationNumber: 125, warehouse: { code: 'TEST' } } as never)
  jest.mocked(prisma.auditLog.create).mockRejectedValue(new Error('Audit unavailable'))
  const response = await POST(request({}), { params: Promise.resolve({}) })
  expect(response.status).toBe(500)
  expect((await response.json()).error).toContain('Nemojte kreirati novu prijavu')
})
