import { DefaultSession } from "next-auth"

interface SessionWarehouse {
  id: string
  name: string
  code: string
}

interface SessionStation {
  id: string
  name: string
  code: string
  address: string | null
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      warehouses?: SessionWarehouse[]
      stations?: SessionStation[]
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    warehouses?: SessionWarehouse[]
    stations?: SessionStation[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}
