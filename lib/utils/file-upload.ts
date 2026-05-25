import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads/certificates'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

/**
 * Validate file type by magic numbers (file signature)
 * More secure than relying on MIME type which can be spoofed
 */
async function validateFileMagicNumber(file: File): Promise<{ valid: boolean; error?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // Check if file has content
    if (bytes.length === 0) {
      return { valid: false, error: 'File is empty' }
    }

    // PDF: Starts with %PDF (0x25 0x50 0x44 0x46)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return { valid: true }
    }

    // JPEG: Starts with 0xFF 0xD8 0xFF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return { valid: true }
    }

    // PNG: Starts with 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4E &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0D &&
      bytes[5] === 0x0A &&
      bytes[6] === 0x1A &&
      bytes[7] === 0x0A
    ) {
      return { valid: true }
    }

    return {
      valid: false,
      error: 'Invalid file content. File does not match allowed formats (PDF, JPEG, PNG).'
    }
  } catch (error) {
    console.error('[FILE_UPLOAD] Error validating file magic number:', error)
    return { valid: false, error: 'Error reading file content' }
  }
}

export async function validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' }
  }

  // Check MIME type (first line of defense)
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only PDF, JPEG, and PNG are allowed' }
  }

  // SECURITY: Validate file content by magic numbers (prevents MIME type spoofing)
  const magicNumberValidation = await validateFileMagicNumber(file)
  if (!magicNumberValidation.valid) {
    console.warn('[FILE_UPLOAD] Magic number validation failed:', {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      error: magicNumberValidation.error
    })
    return magicNumberValidation
  }

  return { valid: true }
}

export async function saveFile(file: File, registrationNumber: number): Promise<string> {
  // Ensure upload directory exists
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }

  // Sanitize filename to prevent path traversal
  const originalName = path.basename(file.name) // Remove any path components
  const extension = path.extname(originalName).slice(1).toLowerCase()

  // Additional validation - ensure extension is in allowed list
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png']
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error('Invalid file extension')
  }

  // Generate unique filename
  const timestamp = Date.now()
  const filename = `cert_${registrationNumber}_${timestamp}.${extension}`
  const filepath = path.join(UPLOAD_DIR, filename)

  // Convert file to buffer and save
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filepath, buffer)

  // Return relative path for database
  return `/uploads/certificates/${filename}`
}

export function getFileUrl(filepath: string | null): string | null {
  if (!filepath) return null
  return filepath.startsWith('/') ? filepath : `/${filepath}`
}
