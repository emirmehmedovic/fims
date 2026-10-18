/** @jest-environment node */
import { prisma } from '@/lib/prisma'
import { canUseWarehouse } from '@/lib/fuel-entries/server-access'

jest.mock('@/lib/prisma', () => ({ prisma: { warehouse: { findFirst: jest.fn() } } }))

beforeEach(() => jest.clearAllMocks())

it('allows pump users to use the active default warehouse', async () => {
  jest.mocked(prisma.warehouse.findFirst).mockResolvedValue({ id: 'default' } as never)
  expect(await canUseWarehouse({ id: 'pump', role: 'PUMPA' }, 'default')).toBe(true)
  expect(prisma.warehouse.findFirst).toHaveBeenCalledWith({ where: { id: 'default', code: 'DEF-001', isActive: true }, select: { id: true } })
})

it('rejects non-default warehouses for pump users', async () => {
  jest.mocked(prisma.warehouse.findFirst).mockResolvedValue(null)
  expect(await canUseWarehouse({ id: 'pump', role: 'PUMPA' }, 'terminal')).toBe(false)
})

it('allows assigned operator warehouses and administrative users', async () => {
  expect(await canUseWarehouse({ id: 'operator', role: 'OPERATOR', warehouses: [{ id: 'assigned' }] }, 'assigned')).toBe(true)
  expect(await canUseWarehouse({ id: 'admin', role: 'ADMIN' }, 'any')).toBe(true)
  expect(await canUseWarehouse({ id: 'admin', role: 'SUPER_ADMIN' }, 'any')).toBe(true)
  expect(prisma.warehouse.findFirst).not.toHaveBeenCalled()
})
