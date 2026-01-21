import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"

// Wrap handlers to capture request context
const { handlers } = NextAuth(authOptions)

// Custom wrapper to extract IP and User Agent from request
async function handleWithRequestContext(req: Request) {
  // Store request context globally for this request
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                    req.headers.get('x-real-ip') ||
                    'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  // Store in global scope for authorize callback to access
  // @ts-ignore
  globalThis.__authRequestContext = { ipAddress, userAgent }

  return req
}

export async function GET(req: Request) {
  await handleWithRequestContext(req)
  // @ts-ignore - NextAuth handlers type compatibility
  return handlers.GET(req)
}

export async function POST(req: Request) {
  await handleWithRequestContext(req)
  // @ts-ignore - NextAuth handlers type compatibility
  return handlers.POST(req)
}
