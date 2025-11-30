import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/suppliers/:id - Get single supplier
export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params

    const supplier = await prisma.supplier.findUnique({
      where: { id }
    })

    if (!supplier) {
      return errorResponse('Supplier not found', 404)
    }

    return successResponse(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return errorResponse('Failed to fetch supplier', 500)
  }
})

// PATCH /api/suppliers/:id - Update supplier
export const PATCH = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { name, code, address, contactPerson, phone, email, isActive } = body

    const existing = await prisma.supplier.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Supplier not found', 404)
    }

    // If code is being changed, check for duplicates
    if (code && code !== existing.code) {
      const duplicate = await prisma.supplier.findUnique({
        where: { code }
      })
      if (duplicate) {
        return errorResponse('Supplier with this code already exists', 400)
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(address !== undefined && { address }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return successResponse(supplier)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return errorResponse('Failed to update supplier', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// DELETE /api/suppliers/:id - Soft delete supplier
export const DELETE = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params

    const existing = await prisma.supplier.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('Supplier not found', 404)
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false }
    })

    return successResponse(supplier)
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return errorResponse('Failed to delete supplier', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
