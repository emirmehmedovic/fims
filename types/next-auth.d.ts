import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      warehouses?: Array<{
        id: string
        name: string
        code: string
      }>
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    warehouses?: Array<{
      id: string
      name: string
      code: string
    }>
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    warehouses?: Array<{
      id: string
      name: string
      code: string
    }>
  }
}
