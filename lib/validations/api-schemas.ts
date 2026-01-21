import { z } from 'zod'

/**
 * User API Schemas
 */
export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'], {
    message: "Invalid role"
  }),
  warehouseIds: z.array(z.string().cuid("Invalid warehouse ID")).min(1, "At least one warehouse must be assigned"),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER']).optional(),
  warehouseIds: z.array(z.string().cuid()).min(1).optional(),
  isActive: z.boolean().optional(),
})

/**
 * Fuel Entry API Schemas
 */
export const createFuelEntrySchema = z.object({
  entryDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  warehouseId: z.string().cuid("Invalid warehouse ID"),
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().int().positive("Quantity must be a positive number").or(
    z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive())
  ),
  deliveryNoteNumber: z.string().optional().nullable(),
  deliveryNoteDate: z.string().datetime().optional().nullable(),
  customsDeclarationNumber: z.string().optional().nullable(),
  customsDeclarationDate: z.string().datetime().optional().nullable(),
  isHigherQuality: z.boolean().default(false),
  improvedCharacteristics: z.array(z.string()).default([]),
  countryOfOrigin: z.string().optional().nullable(),
  laboratoryName: z.string().optional().nullable(),
  labAccreditationNumber: z.string().optional().nullable(),
  testReportNumber: z.string().optional().nullable(),
  testReportDate: z.string().datetime().optional().nullable(),
  orderOpenedBy: z.string().optional().nullable(),
  pickupLocation: z.string().optional().nullable(),
  supplierId: z.string().cuid().optional().nullable(),
  transporterId: z.string().cuid().optional().nullable(),
  driverName: z.string().optional().nullable(),
})

/**
 * Warehouse API Schemas
 */
export const createWarehouseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").max(20, "Code must be less than 20 characters"),
  location: z.string().min(2, "Location is required"),
  capacity: z.number().int().positive("Capacity must be a positive number"),
  description: z.string().optional().nullable(),
})

export const updateWarehouseSchema = createWarehouseSchema.partial()
