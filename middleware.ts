import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  console.log('[MIDDLEWARE] Processing:', request.nextUrl.pathname)

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  })

  console.log('[MIDDLEWARE] Token exists:', !!token)
  if (token) {
    console.log('[MIDDLEWARE] User:', token.email)
  } else {
    console.log('[MIDDLEWARE] Could not retrieve token')
  }

  const isAuthPage = request.nextUrl.pathname === '/login'

  // Ako nema tokena i nije auth stranica, redirectaj na login
  if (!token && !isAuthPage) {
    console.log('[MIDDLEWARE] No token, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Ako ima token i pokušava pristupiti login stranici, redirectaj na dashboard
  if (token && isAuthPage) {
    console.log('[MIDDLEWARE] Has token on login page, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log('[MIDDLEWARE] Allowing access to:', request.nextUrl.pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/warehouses/:path*',
    '/fuel-entries/:path*',
    '/admin/:path*',
    '/api/warehouses/:path*',
    '/api/fuel-entries/:path*',
    '/api/users/:path*',
    '/api/audit-logs/:path*',
    '/api/dashboard/:path*',
    '/api/exports/:path*',
    '/login',
  ]
}
