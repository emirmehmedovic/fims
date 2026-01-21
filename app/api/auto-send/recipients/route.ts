import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const parseEmails = (raw: string) => {
  return raw
    .split(/[;,]/g)
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export const GET = withAuth(async () => {
  try {
    const recipients = await prisma.autoEmailRecipient.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return successResponse(recipients)
  } catch (error) {
    console.error('Error fetching auto-send recipients:', error)
    return errorResponse('Failed to fetch recipients', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json()
    const rawEmail = body.email ? String(body.email) : ''
    const name = body.name ? String(body.name).trim() : null
    const emails = parseEmails(rawEmail)

    if (emails.length === 0) {
      return errorResponse('Email address is required', 400)
    }

    const invalidEmails = emails.filter(email => !isValidEmail(email))
    if (invalidEmails.length > 0) {
      return errorResponse(`Invalid email address: ${invalidEmails.join(', ')}`, 400)
    }

    await prisma.autoEmailRecipient.createMany({
      data: emails.map(email => ({
        email,
        name,
        isActive: true,
        createdBy: session.user.id
      })),
      skipDuplicates: true
    })

    return successResponse({ count: emails.length })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return errorResponse('Email already exists', 400)
    }
    console.error('Error creating auto-send recipient:', error)
    return errorResponse('Failed to create recipient', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
