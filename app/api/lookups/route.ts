import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// Valid lookup types
const LOOKUP_TYPES = ['products', 'countries', 'pickupLocations', 'fuelCharacteristics'] as const
type LookupType = typeof LOOKUP_TYPES[number]

// Map lookup type to Prisma model
const getLookupModel = (type: LookupType) => {
  switch (type) {
    case 'products':
      return prisma.product
    case 'countries':
      return prisma.country
    case 'pickupLocations':
      return prisma.pickupLocation
    case 'fuelCharacteristics':
      return prisma.fuelCharacteristic
    default:
      return null
  }
}

// GET /api/lookups?type=products - Get all items of a lookup type
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') as LookupType
    const includeInactive = searchParams.get('includeInactive') === 'true'

    if (!type || !LOOKUP_TYPES.includes(type)) {
      return errorResponse(`Invalid lookup type. Valid types: ${LOOKUP_TYPES.join(', ')}`, 400)
    }

    const model = getLookupModel(type)
    if (!model) {
      return errorResponse('Invalid lookup type', 400)
    }

    const where: any = {}
    if (!includeInactive) {
      where.isActive = true
    }

    const items = await (model as any).findMany({
      where,
      orderBy: { name: 'asc' }
    })

    return successResponse(items)
  } catch (error) {
    console.error('Error fetching lookup items:', error)
    return errorResponse('Failed to fetch lookup items', 500)
  }
})

// POST /api/lookups - Create new lookup item
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const { type, name, description, code, address } = body

    console.log('POST /api/lookups - Received:', { type, name, validTypes: LOOKUP_TYPES })

    if (!type || !LOOKUP_TYPES.includes(type as LookupType)) {
      return errorResponse(`Invalid lookup type. Valid types: ${LOOKUP_TYPES.join(', ')}`, 400)
    }

    if (!name || name.trim() === '') {
      return errorResponse('Name is required', 400)
    }

    const model = getLookupModel(type)
    if (!model) {
      return errorResponse('Invalid lookup type', 400)
    }

    // Check if name already exists
    const existing = await (model as any).findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return errorResponse('Item with this name already exists', 400)
    }

    // Build data object based on type
    const data: any = { name: name.trim() }
    
    if (type === 'products' || type === 'fuelCharacteristics') {
      if (description) data.description = description
    }
    
    if (type === 'countries') {
      if (code) data.code = code
    }
    
    if (type === 'pickupLocations') {
      if (address) data.address = address
    }

    const item = await (model as any).create({ data })

    return successResponse(item)
  } catch (error) {
    console.error('Error creating lookup item:', error)
    return errorResponse('Failed to create lookup item', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
