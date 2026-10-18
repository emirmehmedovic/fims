import type { Prisma } from '@prisma/client'

export interface FuelEntryUser {
  id: string
  role: string
  warehouses?: { id: string }[]
}

export function canAccessFuelEntry(user: FuelEntryUser, entry: { operatorId: string; warehouseId: string }): boolean {
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true
  if (user.role === 'PUMPA') return entry.operatorId === user.id
  if (user.role === 'OPERATOR' || user.role === 'VIEWER') {
    return !!user.warehouses?.some(warehouse => warehouse.id === entry.warehouseId)
  }
  return false
}

export function canWriteReceipt(role: string): boolean {
  return ['ADMIN', 'SUPER_ADMIN', 'PUMPA'].includes(role)
}

export function fuelEntryAccessFilter(user: FuelEntryUser): Prisma.FuelEntryWhereInput {
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return {}
  if (user.role === 'PUMPA') return { operatorId: user.id }
  if (user.role === 'OPERATOR' || user.role === 'VIEWER') {
    return { warehouseId: { in: user.warehouses?.map(warehouse => warehouse.id) ?? [] } }
  }
  return { id: { in: [] } }
}
