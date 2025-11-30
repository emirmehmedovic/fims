import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

export const authOptions = {
  trustHost: true,
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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

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
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await compare(
          password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        })

        // Log login attempt
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entityType: "User",
            // entityId is FK to FuelEntry, so we don't set it for User login
            ipAddress: null,
            userAgent: null,
          }
        })

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
