import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import crypto from "crypto"

// Simple in-memory rate limiter for verification endpoint
// In production, use Redis-based rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute per IP

function getRateLimitKey(ip: string): string {
  // Hash the IP for privacy
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const key = getRateLimitKey(ip)
  const now = Date.now()
  
  const record = rateLimitMap.get(key)
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW }
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now }
  }
  
  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetIn: record.resetTime - now }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60 * 1000) // Clean up every minute

// Validate that ID looks like a valid CUID
function isValidCuid(id: string): boolean {
  // CUID format: starts with 'c', followed by lowercase letters and numbers
  // Length is typically 25 characters
  return /^c[a-z0-9]{20,30}$/.test(id)
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    // Get client IP
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const ip = forwardedFor?.split(',')[0]?.trim() || 
               headersList.get('x-real-ip') || 
               'unknown'
    
    // Check rate limit
    const rateLimit = checkRateLimit(ip)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Previše zahtjeva. Molimo pokušajte ponovo za minutu.',
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000))
          }
        }
      )
    }
    
    // Validate ID format to prevent injection attacks
    if (!id || !isValidCuid(id)) {
      return NextResponse.json(
        { success: false, error: 'Nevažeći identifikator dokumenta' },
        { 
          status: 400,
          headers: {
            'X-RateLimit-Remaining': String(rateLimit.remaining)
          }
        }
      )
    }
    
    // Fetch all data for verification display
    const entry = await prisma.fuelEntry.findUnique({
      where: { id },
      select: {
        id: true,
        registrationNumber: true,
        entryDate: true,
        productName: true,
        quantity: true,
        isActive: true,
        createdAt: true,
        // Document info
        deliveryNoteNumber: true,
        deliveryNoteDate: true,
        customsDeclarationNumber: true,
        customsDeclarationDate: true,
        // Quality info
        isHigherQuality: true,
        improvedCharacteristics: true,
        countryOfOrigin: true,
        // Laboratory info
        laboratoryName: true,
        labAccreditationNumber: true,
        testReportNumber: true,
        testReportDate: true,
        // Personnel
        orderOpenedBy: true,
        // Logistics
        pickupLocation: true,
        driverName: true,
        // Certificate
        certificatePath: true,
        // Relations
        warehouse: {
          select: {
            name: true,
            code: true,
            location: true
          }
        },
        operator: {
          select: {
            name: true
          }
        },
        supplier: {
          select: {
            name: true,
            code: true
          }
        },
        transporter: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })
    
    if (!entry) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dokument nije pronađen',
          verified: false
        },
        { 
          status: 404,
          headers: {
            'X-RateLimit-Remaining': String(rateLimit.remaining)
          }
        }
      )
    }
    
    if (!entry.isActive) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dokument je deaktiviran',
          verified: false
        },
        { 
          status: 410,
          headers: {
            'X-RateLimit-Remaining': String(rateLimit.remaining)
          }
        }
      )
    }
    
    // Return all verification data
    return NextResponse.json({
      success: true,
      verified: true,
      data: {
        // Basic info
        registrationNumber: entry.registrationNumber,
        entryDate: entry.entryDate,
        productName: entry.productName,
        quantity: entry.quantity,
        countryOfOrigin: entry.countryOfOrigin,
        // Warehouse
        warehouse: entry.warehouse.name,
        warehouseCode: entry.warehouse.code,
        warehouseLocation: entry.warehouse.location,
        // Document info
        deliveryNoteNumber: entry.deliveryNoteNumber,
        deliveryNoteDate: entry.deliveryNoteDate,
        customsDeclarationNumber: entry.customsDeclarationNumber,
        customsDeclarationDate: entry.customsDeclarationDate,
        // Quality info
        isHigherQuality: entry.isHigherQuality,
        improvedCharacteristics: entry.improvedCharacteristics,
        // Laboratory info
        laboratoryName: entry.laboratoryName,
        labAccreditationNumber: entry.labAccreditationNumber,
        testReportNumber: entry.testReportNumber,
        testReportDate: entry.testReportDate,
        // Personnel & Logistics
        operator: entry.operator.name,
        orderOpenedBy: entry.orderOpenedBy,
        pickupLocation: entry.pickupLocation,
        driverName: entry.driverName,
        // Supplier & Transporter
        supplier: entry.supplier?.name,
        supplierCode: entry.supplier?.code,
        transporter: entry.transporter?.name,
        transporterCode: entry.transporter?.code,
        // Certificate
        hasCertificate: !!entry.certificatePath,
        // Metadata
        issuedAt: entry.createdAt
      }
    }, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    })
    
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Greška pri verifikaciji' },
      { status: 500 }
    )
  }
}
