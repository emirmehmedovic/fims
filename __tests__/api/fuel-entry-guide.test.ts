/** @jest-environment node */
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/account/fuel-entry-guide/route'
import { prisma } from '@/lib/prisma'
import { FUEL_ENTRY_GUIDE_VERSION, guideKey } from '@/lib/onboarding/fuel-entry-guide'
let mockRole = 'PUMPA'
jest.mock('@/lib/api/withAuth', () => ({ withAuth: (handler: (...args: unknown[]) => unknown) => (req: NextRequest, context: unknown) => handler(req, context, { user: { id: 'current-user', role: mockRole } }) }))
jest.mock('@/lib/prisma', () => ({ prisma: { userGuideCompletion: { findUnique: jest.fn(), upsert: jest.fn() } } }))
jest.mock('@/lib/utils/logger', () => ({ logger: { error: jest.fn() } }))
const context = { params: Promise.resolve({}) }
beforeEach(() => { jest.resetAllMocks(); mockRole = 'PUMPA' })
it('reads completion scoped to the signed-in user and role', async () => {
  jest.mocked(prisma.userGuideCompletion.findUnique).mockResolvedValue({ completedAt: new Date() } as never)
  const res = await GET(new NextRequest('http://localhost/api/account/fuel-entry-guide'), context)
  expect((await res.json()).data.completed).toBe(true)
  expect(prisma.userGuideCompletion.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { userId_guideKey: { userId: 'current-user', guideKey: guideKey('PUMPA') } } }))
})
it('ignores a submitted user ID and persists completion idempotently', async () => {
  const res = await POST(new NextRequest('http://localhost/api/account/fuel-entry-guide', { method: 'POST', body: JSON.stringify({ userId: 'someone-else', version: FUEL_ENTRY_GUIDE_VERSION }) }), context)
  expect(res.status).toBe(200)
  expect(prisma.userGuideCompletion.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { userId: 'current-user', guideKey: guideKey('PUMPA') }, update: {} }))
})
it('rejects a stale guide version without writing', async () => {
  const res = await POST(new NextRequest('http://localhost/api/account/fuel-entry-guide', { method: 'POST', body: JSON.stringify({ version: 'old' }) }), context)
  expect(res.status).toBe(400)
  expect(prisma.userGuideCompletion.upsert).not.toHaveBeenCalled()
})
