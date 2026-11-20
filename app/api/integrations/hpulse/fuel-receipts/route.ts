import { NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api/response"

/**
 * HPulse integracija (HPulse plan 43 F): HPulse povlači ulaze goriva po stanici i proizvodu za
 * dnevni i sedmični izvještaj poslovođe. Samo čitanje, zaštićeno ključem HPULSE_API_KEY
 * (Authorization: Bearer ...), sa ograničenjem broja zahtjeva. Period je najviše 31 dan.
 *
 * GET /api/integrations/hpulse/fuel-receipts?from=YYYY-MM-DD&to=YYYY-MM-DD
 */

const attempts = new Map<string, { count: number; windowStart: number }>()
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 30

function rateLimited(ip: string) {
  const now = Date.now()
  const e = attempts.get(ip)
  if (!e || now - e.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now })
    return false
  }
  e.count++
  return e.count > MAX_PER_WINDOW
}

function safeCompare(a: string, b: string) {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

export const GET = async (req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (rateLimited(ip)) return errorResponse("Too many requests", 429)

  const secret = process.env.HPULSE_API_KEY
  if (!secret || secret.length < 32) {
    console.error("[HPULSE] HPULSE_API_KEY nije postavljen ili je kraći od 32 znaka")
    return errorResponse("Integration not configured", 503)
  }
  const auth = req.headers.get("authorization")
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token || !safeCompare(token, secret)) {
    console.warn(`[HPULSE] Neovlašten pokušaj sa IP: ${ip}`)
    return errorResponse("Unauthorized", 401)
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from") ?? ""
  const to = searchParams.get("to") ?? ""
  if (!DAY.test(from) || !DAY.test(to) || from > to) return errorResponse("Invalid period", 400)
  // dan prije i poslije: lokalni dan (Europe/Sarajevo) računa HPulse iz entryDate
  const gte = new Date(`${from}T00:00:00Z`)
  gte.setUTCDate(gte.getUTCDate() - 1)
  const lt = new Date(`${to}T00:00:00Z`)
  lt.setUTCDate(lt.getUTCDate() + 2)
  if (lt.getTime() - gte.getTime() > 33 * 86_400_000) return errorResponse("Period too long", 400)

  const entries = await prisma.fuelEntry.findMany({
    where: { entryDate: { gte, lt }, stationId: { not: null } },
    orderBy: { entryDate: "asc" },
    take: 5000,
    select: {
      id: true,
      registrationNumber: true,
      entryDate: true,
      productName: true,
      quantity: true,
      isActive: true,
      isHigherQuality: true,
      additiveDetails: true,
      updatedAt: true,
      station: { select: { code: true, name: true } },
      receiptRecord: { select: { hasAdditives: true } },
    },
  })

  return successResponse({
    from,
    to,
    entries: entries.map((e) => ({
      id: e.id,
      registrationNumber: e.registrationNumber,
      entryDate: e.entryDate.toISOString(),
      stationCode: e.station?.code ?? null,
      stationName: e.station?.name ?? null,
      productName: e.productName,
      quantity: e.quantity,
      active: e.isActive,
      additivized: e.isHigherQuality || Boolean(e.receiptRecord?.hasAdditives),
      additiveDetails: e.additiveDetails ?? [],
      updatedAt: e.updatedAt.toISOString(),
    })),
  })
}
