import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/withAuth'
import { errorResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads/certificates'

// GET /api/certificates/download/[filename] - Download certificate file
export const GET = withAuth(async (
  req: NextRequest,
  context: { params: Promise<{ filename: string }> },
  session
) => {
  try {
    const { filename } = await context.params

    // Security: Prevent path traversal attacks
    const sanitizedFilename = path.basename(filename)

    // Validate filename format (only allow our certificate naming pattern)
    if (!sanitizedFilename.match(/^cert_\d+_\d+\.(pdf|jpg|jpeg|png)$/i)) {
      return errorResponse('Invalid filename format', 400)
    }

    // Security: Verify user has access to this certificate (IDOR prevention)
    const userRole = session.user.role
    const userWarehouses = session.user.warehouses || []

    // Find the fuel entry that has this certificate
    const fuelEntry = await prisma.fuelEntry.findFirst({
      where: {
        certificatePath: {
          contains: sanitizedFilename
        }
      },
      select: {
        id: true,
        warehouseId: true,
        operatorId: true
      }
    })

    if (fuelEntry) {
      // Check access based on role
      if (userRole === 'PUMPA') {
        // PUMPA users can only access their own certificates
        if (fuelEntry.operatorId !== session.user.id) {
          return errorResponse('Access denied', 403)
        }
      } else if (userRole === 'OPERATOR' || userRole === 'VIEWER') {
        // OPERATOR/VIEWER can only access certificates from their warehouses
        const hasAccess = userWarehouses.some((w: any) => w.id === fuelEntry.warehouseId)
        if (!hasAccess) {
          return errorResponse('Access denied', 403)
        }
      }
      // ADMIN and SUPER_ADMIN can access all certificates
    }
    // If no fuel entry found, allow download (orphaned file or shared certificate)

    // Try multiple possible locations
    const possiblePaths = [
      path.join(process.cwd(), UPLOAD_DIR.replace('./', ''), sanitizedFilename),
      path.join(process.cwd(), 'public', 'uploads', sanitizedFilename),
      path.join(process.cwd(), 'public', 'uploads', 'certificates', sanitizedFilename),
    ]

    let filepath = ''
    for (const p of possiblePaths) {
      if (existsSync(p)) {
        filepath = p
        break
      }
    }

    // Check if file exists
    if (!filepath) {
      return errorResponse('Certificate not found', 404)
    }

    // Read file
    const fileBuffer = await readFile(filepath)

    // Determine content type
    const ext = path.extname(sanitizedFilename).toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === '.pdf') contentType = 'application/pdf'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.png') contentType = 'image/png'

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${sanitizedFilename}"`,
        'Cache-Control': 'private, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Error downloading certificate:', error)
    return errorResponse('Failed to download certificate', 500)
  }
})
