import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"
import { saveFile, validateFile } from "@/lib/utils/file-upload"

// POST /api/fuel-entries/:id/upload-certificate - Upload certificate for existing entry
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const params = await context.params
    const { id } = params

    // Check if fuel entry exists
    const existingEntry = await prisma.fuelEntry.findUnique({
      where: { id },
      select: {
        id: true,
        registrationNumber: true,
        isActive: true,
        certificatePath: true
      }
    })

    if (!existingEntry) {
      return errorResponse('Fuel entry not found', 404)
    }

    if (!existingEntry.isActive) {
      return errorResponse('Cannot upload certificate to deleted entry', 400)
    }

    const formData = await req.formData()
    const certificate = formData.get('certificate') as File | null

    if (!certificate || certificate.size === 0) {
      return errorResponse('Certificate file is required', 400)
    }

    // Validate file
    const validation = await validateFile(certificate)
    if (!validation.valid) {
      return errorResponse(validation.error || 'Invalid file', 400)
    }

    // Save file
    const certificatePath = await saveFile(certificate, existingEntry.registrationNumber)

    // Update fuel entry with certificate info
    const updatedEntry = await prisma.fuelEntry.update({
      where: { id },
      data: {
        certificatePath,
        certificateFileName: certificate.name,
        certificateUploadedAt: new Date()
      },
      select: {
        id: true,
        registrationNumber: true,
        certificatePath: true,
        certificateFileName: true,
        certificateUploadedAt: true
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'FuelEntry',
        entityId: id,
        changes: {
          action: 'certificate_upload',
          before: { certificatePath: existingEntry.certificatePath },
          after: { certificatePath, certificateFileName: certificate.name }
        }
      }
    })

    return successResponse({
      message: 'Certificate uploaded successfully',
      data: updatedEntry
    })
  } catch (error) {
    console.error('Error uploading certificate:', error)
    return errorResponse('Failed to upload certificate', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'])
