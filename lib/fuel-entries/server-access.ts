import { prisma } from '@/lib/prisma'
import type { FuelEntryUser } from './access'

export async function canUseWarehouse(user: FuelEntryUser, warehouseId: string): Promise<boolean> {
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true
  if (user.role === 'OPERATOR') return !!user.warehouses?.some(warehouse => warehouse.id === warehouseId)
  if (user.role === 'PUMPA') {
    return !!await prisma.warehouse.findFirst({
      where: { id: warehouseId, code: 'DEF-001', isActive: true },
      select: { id: true },
    })
  }
  return false
}
