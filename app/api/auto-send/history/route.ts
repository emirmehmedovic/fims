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
    const batchId = searchParams.get('batchId')

    const skip = (page - 1) * limit
    const where: any = {}
    if (recipient) {
      where.recipientEmails = { has: recipient.toLowerCase() }
    }
    if (batchId) {
      where.batchId = batchId
    }

    const [items, total] = await Promise.all([
      prisma.autoSendBatchItem.findMany({
        where,
        include: {
          batch: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.autoSendBatchItem.count({ where })
    ])

    const entryIds = Array.from(new Set(items.flatMap(item => item.entryIds)))
    const entries = await prisma.fuelEntry.findMany({
      where: { id: { in: entryIds } },
      select: { id: true, registrationNumber: true }
    })
    const entryMap = new Map(entries.map(entry => [entry.id, entry.registrationNumber]))

    const formatted = items.map(item => ({
      id: item.id,
      status: item.status,
      sentAt: item.sentAt,
      entriesCount: item.entriesCount,
      sequence: item.sequence,
      recipientEmails: item.recipientEmails,
      entryNumbers: item.entryIds.map(id => entryMap.get(id)).filter(Boolean),
      batch: {
        id: item.batch.id,
        dateFrom: item.batch.dateFrom,
        dateTo: item.batch.dateTo,
        totalEntries: item.batch.totalEntries,
        totalBatches: item.batch.totalBatches,
        batchSize: item.batch.batchSize
      }
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
    console.error('Error fetching auto-send history:', error)
    return errorResponse('Failed to fetch history', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
