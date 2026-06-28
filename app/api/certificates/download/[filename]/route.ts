import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/withAuth'
import { errorResponse } from '@/lib/api/response'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads/certificates'

// GET /api/certificates/download/[filename] - Download certificate file
export const GET = withAuth(async (
  req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) => {
  try {
    const { filename } = await context.params

    // Security: Prevent path traversal attacks
    const sanitizedFilename = path.basename(filename)

    // Validate filename format (only allow our certificate naming pattern)
    if (!sanitizedFilename.match(/^cert_\d+_\d+\.(pdf|jpg|jpeg|png)$/i)) {
      return errorResponse('Invalid filename format', 400)
    }

    const filepath = path.join(process.cwd(), UPLOAD_DIR.replace('./', ''), sanitizedFilename)

    // Check if file exists
    if (!existsSync(filepath)) {
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
