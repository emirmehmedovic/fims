import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { logger } from '@/lib/utils/logger'

export async function middleware(request: NextRequest) {
  logger.debug('[MIDDLEWARE] Processing:', request.nextUrl.pathname)

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  })

  logger.debug('[MIDDLEWARE] Token exists:', !!token)
  if (token) {
    logger.debug('[MIDDLEWARE] User authenticated')
  } else {
    logger.debug('[MIDDLEWARE] Could not retrieve token')
  }

  const isAuthPage = request.nextUrl.pathname === '/login'
  const pathname = request.nextUrl.pathname

  // Admin-only routes
  const adminOnlyRoutes = [
    '/dashboard/statistics',
    '/dashboard/warehouses',
    '/dashboard/users',
    '/dashboard/master-data',
    '/dashboard/audit-logs',
    '/dashboard/auto-send'
  ]

  // Ako nema tokena i nije auth stranica, redirectaj na login
  if (!token && !isAuthPage) {
    logger.debug('[MIDDLEWARE] No token, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Ako ima token i pokušava pristupiti login stranici, redirectaj na dashboard
  if (token && isAuthPage) {
    logger.debug('[MIDDLEWARE] Has token on login page, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check role-based access for admin-only routes
  if (token && adminOnlyRoutes.some(route => pathname.startsWith(route))) {
    const userRole = token.role as string
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'

    if (!isAdmin) {
      logger.debug('[MIDDLEWARE] Non-admin user trying to access admin route, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  logger.debug('[MIDDLEWARE] Allowing access to:', request.nextUrl.pathname)
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
