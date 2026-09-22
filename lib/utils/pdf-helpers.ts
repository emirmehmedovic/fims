import { DEFAULT_WAREHOUSE_CODE, DEFAULT_CITY } from '@/lib/constants'

interface WarehouseInfo {
  code: string
  location?: string | null
  name?: string
}

interface StationInfo {
  address?: string | null
  city?: string | null
}

/**
 * Extract city from address string
 * Format expected: "Street, City, Region"
 * Returns the second part (City) or falls back to DEFAULT_CITY
 */
export function extractCityFromAddress(address: string | null | undefined): string {
  if (!address) return DEFAULT_CITY
  const parts = address.split(',').map(p => p.trim())
  if (parts.length >= 2) {
    return parts[1]
  }
  return parts[0] || DEFAULT_CITY
}

/**
 * Get document location based on warehouse and station
 * Priority:
 * 1. Station's city field (if set)
 * 2. For DEFAULT warehouse - extract city from station address
 * 3. Warehouse location field
 * 4. Extract from warehouse name (e.g., "TERMINAL TEŠANJ" -> "Tešanj")
 * 5. Fallback to DEFAULT_CITY
 */
export function getDocumentLocation(
  warehouse: WarehouseInfo | null,
  station: StationInfo | null
): string {
  // If station has city field, use it directly
  if (station?.city) {
    return station.city
  }

  // If no warehouse or warehouse is DEFAULT, use station city from address
  if (!warehouse || warehouse.code === DEFAULT_WAREHOUSE_CODE) {
    return extractCityFromAddress(station?.address)
  }

  // Otherwise use warehouse location
  if (warehouse.location) {
    return warehouse.location
  }

  // Try to extract location from warehouse name (e.g., "TERMINAL TEŠANJ" -> "Tešanj")
  const name = warehouse.name || ''
  const match = name.match(/TERMINAL\s+(\w+)/i)
  if (match) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
  }

  return DEFAULT_CITY
}
