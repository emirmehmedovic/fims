export { auth as middleware } from "./auth"

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/warehouses/:path*',
    '/fuel-entries/:path*',
    '/admin/:path*',
    '/api/warehouses/:path*',
    '/api/fuel-entries/:path*',
    '/api/users/:path*',
  ]
}
