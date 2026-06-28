/**
 * Convert certificate path to API download URL
 *
 * Input:  /uploads/certificates/cert_12345_1234567890.pdf
 * Output: /api/certificates/download/cert_12345_1234567890.pdf
 */
export function getCertificateDownloadUrl(certificatePath: string | null): string | null {
  if (!certificatePath) return null

  // Extract filename from path
  const filename = certificatePath.split('/').pop()
  if (!filename) return null

  return `/api/certificates/download/${filename}`
}
