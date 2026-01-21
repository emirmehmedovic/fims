import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '10')
    const recipient = searchParams.get('recipient')

    const skip = (page - 1) * limit
    const where = recipient
      ? { items: { some: { recipientEmails: { has: recipient.toLowerCase() } } } }
      : {}

    const [batches, total] = await Promise.all([
      prisma.autoSendBatch.findMany({
        where,
        include: {
          items: {
            orderBy: { sequence: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.autoSendBatch.count({ where })
    ])

    const entryIds = Array.from(new Set(batches.flatMap(batch => batch.items.flatMap(item => item.entryIds))))
    const entries = await prisma.fuelEntry.findMany({
      where: { id: { in: entryIds } },
      select: { id: true, registrationNumber: true }
    })
    const entryMap = new Map(entries.map(entry => [entry.id, entry.registrationNumber]))

    const formatted = batches.map(batch => ({
      id: batch.id,
      dateFrom: batch.dateFrom,
      dateTo: batch.dateTo,
      totalEntries: batch.totalEntries,
      batchSize: batch.batchSize,
      totalBatches: batch.totalBatches,
      recipientsCount: batch.recipientsCount,
      createdAt: batch.createdAt,
      items: batch.items.map(item => ({
        id: item.id,
        sequence: item.sequence,
        entriesCount: item.entriesCount,
        status: item.status,
        sentAt: item.sentAt,
        recipientEmails: item.recipientEmails,
        entryNumbers: item.entryIds.map(id => entryMap.get(id)).filter(Boolean)
      }))
    }))

    return successResponse({
      items: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching auto-send batch history:', error)
    return errorResponse('Failed to fetch history', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
