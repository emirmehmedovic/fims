import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

export const authOptions = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  session: {
    strategy: "jwt" as const,
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials')
            return null
          }

          const email = credentials.email as string
          const password = credentials.password as string

          console.log('[AUTH] Attempting login for:', email)

          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              warehouses: {
                include: {
                  warehouse: true
                }
              }
            }
          })

          if (!user || !user.isActive) {
            console.log('[AUTH] User not found or inactive:', email)
            throw new Error("Invalid credentials")
          }

          const isPasswordValid = await compare(
            password,
            user.passwordHash
          )

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password for:', email)
            throw new Error("Invalid credentials")
          }

          console.log('[AUTH] Password valid for:', email)

          // Update last login
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() }
            })
            console.log('[AUTH] Updated last login for:', email)
          } catch (error) {
            console.error('[AUTH] Failed to update last login:', error)
            // Don't fail auth if this fails
          }

          // Log login attempt - skip if it fails
          try {
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: "LOGIN",
                entityType: "User",
                ipAddress: null,
                userAgent: null,
              }
            })
            console.log('[AUTH] Created audit log for:', email)
          } catch (error) {
            console.error('[AUTH] Failed to create audit log:', error)
            // Don't fail auth if audit log fails
          }

          console.log('[AUTH] Login successful for:', email)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            warehouses: user.warehouses.map(uw => ({
              id: uw.warehouse.id,
              name: uw.warehouse.name,
              code: uw.warehouse.code
            }))
          }
        } catch (error) {
          console.error('[AUTH] Login error:', error)
          throw error
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.warehouses = user.warehouses
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.warehouses = token.warehouses
      }
      return session
    }
  }
}

const { handlers } = NextAuth(authOptions)

export const GET = handlers.GET
export const POST = handlers.POST
