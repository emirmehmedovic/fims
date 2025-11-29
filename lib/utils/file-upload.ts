import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = './public/uploads/certificates'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

export async function validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only PDF, JPEG, and PNG are allowed' }
  }

  return { valid: true }
}

export async function saveFile(file: File, registrationNumber: number): Promise<string> {
  // Ensure upload directory exists
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }

  // Generate unique filename
  const timestamp = Date.now()
  const extension = file.name.split('.').pop()
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
