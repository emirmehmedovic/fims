import { prisma } from '@/lib/prisma'
import { generateFuelEntryPDF } from '@/lib/utils/pdf-generator'
import { buildFuelEntriesEmailHTML } from '@/lib/utils/email-templates'
import { sendEmail } from '@/lib/utils/email'
import {
  formatDateInputValueSarajevo,
  formatDateSarajevo,
  shiftDateInputValueSarajevo,
  startOfDaySarajevo,
  startOfNextDaySarajevo
} from '@/lib/utils/date'
import fs from 'fs/promises'
import path from 'path'

interface AutoSendParams {
  dateFrom?: string
  dateTo?: string
  recipientIds?: string[]
  includeCertificates?: boolean
  initiatedBy?: string
}

interface AutoSendCreateResult {
  success: boolean
  message?: string
  batchId?: string
  batches?: number
  sent?: number
  entries?: number
  dateFrom?: string
  dateTo?: string
}

const BATCH_SIZE = 5
const HEADER_CID = 'hifa-header'

const chunkArray = <T,>(items: T[], size: number) => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const resolveDateRange = (dateFrom?: string, dateTo?: string) => {
  const today = formatDateInputValueSarajevo(new Date())
  const defaultDate = shiftDateInputValueSarajevo(today, -1)
  const dateFromValue = dateFrom || defaultDate
  const dateToValue = dateTo || dateFromValue

  const rangeStart = startOfDaySarajevo(dateFromValue)
  const rangeEnd = startOfNextDaySarajevo(dateToValue)

  return { dateFromValue, dateToValue, rangeStart, rangeEnd }
}

const readHeaderImage = async () => {
  const headerPath = path.join(process.cwd(), 'public', 'hifa-header.png')
  return fs.readFile(headerPath)
}

const fetchRecipients = async (recipientIds?: string[]) => {
  return prisma.autoEmailRecipient.findMany({
    where: {
      ...(recipientIds && recipientIds.length > 0
        ? { id: { in: recipientIds }, isActive: true }
        : { isActive: true })
    },
    orderBy: { email: 'asc' }
  })
}

export const createAutoSendBatch = async ({
  dateFrom,
  dateTo,
  recipientIds,
  includeCertificates = true,
  initiatedBy
}: AutoSendParams): Promise<AutoSendCreateResult> => {
  const { dateFromValue, dateToValue, rangeStart, rangeEnd } = resolveDateRange(dateFrom, dateTo)

  const recipients = await fetchRecipients(recipientIds)
  if (recipients.length === 0) {
    return { success: false, message: 'Nema aktivnih adresa za slanje.' }
  }

  const entries = await prisma.fuelEntry.findMany({
    where: {
      entryDate: { gte: rangeStart, lt: rangeEnd },
      isActive: true
    },
    include: {
      warehouse: {
        select: {
          id: true,
          name: true,
          code: true,
          location: true
        }
      },
      operator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      supplier: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      transporter: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    orderBy: { entryDate: 'asc' },
    take: 100
  })

  if (entries.length === 0) {
    return { success: false, message: 'Nema prijava za odabrani period.' }
  }

  const entryBatches = chunkArray(entries, BATCH_SIZE)
  const totalBatches = entryBatches.length

  const batchRecord = await prisma.autoSendBatch.create({
    data: {
      dateFrom: rangeStart,
      dateTo: rangeEnd,
      totalEntries: entries.length,
      batchSize: BATCH_SIZE,
      totalBatches,
      recipientsCount: recipients.length,
      createdBy: initiatedBy
    }
  })

  await prisma.autoSendBatchItem.createMany({
    data: entryBatches.map((batchEntries, index) => ({
      batchId: batchRecord.id,
      sequence: index + 1,
      entryIds: batchEntries.map(entry => entry.id),
      recipientEmails: recipients.map(recipient => recipient.email),
      entriesCount: batchEntries.length,
      includeCertificates
    }))
  })

  return {
    success: true,
    batchId: batchRecord.id,
    batches: totalBatches,
    sent: recipients.length,
    entries: entries.length,
    dateFrom: dateFromValue,
    dateTo: dateToValue
  }
}

export const processAutoSendBatch = async (batchId: string, initiatedBy?: string) => {
  const headerBuffer = await readHeaderImage()

  const batch = await prisma.autoSendBatch.findUnique({
    where: { id: batchId }
  })

  if (!batch) {
    throw new Error('Batch not found')
  }

  const batchItems = await prisma.autoSendBatchItem.findMany({
    where: { batchId },
    orderBy: { sequence: 'asc' }
  })

  const dateFromLabel = formatDateSarajevo(batch.dateFrom)
  const dateToLabel = formatDateSarajevo(new Date(batch.dateTo.getTime() - 1))
  const subject = `Automatski izvještaj - prijave goriva (${dateFromLabel} do ${dateToLabel})`

  for (const item of batchItems) {
    if (item.status === 'SENT') {
      continue
    }

    try {
      const entries = await prisma.fuelEntry.findMany({
        where: { id: { in: item.entryIds } },
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
              location: true
            }
          },
          operator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          transporter: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      })

      const entryMap = new Map(entries.map(entry => [entry.id, entry]))
      const orderedEntries = item.entryIds.map(entryId => entryMap.get(entryId)).filter(Boolean)
      const totalQuantity = orderedEntries.reduce((sum, entry) => sum + (entry?.quantity || 0), 0)

      const attachments = []
      for (const entry of orderedEntries) {
        const pdfBuffer = await generateFuelEntryPDF(entry as any, item.includeCertificates)
        attachments.push({
          filename: `Izjava_${entry?.registrationNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        })
      }

      const html = buildFuelEntriesEmailHTML({
        entries: orderedEntries.map(entry => ({
          registrationNumber: entry?.registrationNumber || 0,
          entryDate: entry?.entryDate || new Date(),
          warehouseCode: entry?.warehouse.code || '',
          warehouseName: entry?.warehouse.name || '',
          productName: entry?.productName || '',
          quantity: entry?.quantity || 0
        })),
        dateFromLabel,
        dateToLabel,
        totalQuantity,
        batchNumber: item.sequence,
        totalBatches: batch.totalBatches
      })

      await sendEmail({
        to: item.recipientEmails,
        subject: `${subject} • Paket ${item.sequence}/${batch.totalBatches}`,
        html,
        attachments: [
          ...attachments,
          {
            filename: 'hifa-header.png',
            content: headerBuffer,
            contentType: 'image/png',
            cid: HEADER_CID
          }
        ]
      })

      await prisma.autoSendBatchItem.update({
        where: { id: item.id },
        data: { status: 'SENT', sentAt: new Date(), errorMessage: null }
      })
    } catch (error: any) {
      await prisma.autoSendBatchItem.update({
        where: { id: item.id },
        data: { status: 'FAILED', errorMessage: error?.message || 'Slanje nije uspjelo' }
      })
    }
  }

  const [sentCount, failedCount] = await Promise.all([
    prisma.autoSendBatchItem.count({ where: { batchId, status: 'SENT' } }),
    prisma.autoSendBatchItem.count({ where: { batchId, status: 'FAILED' } })
  ])

  if (initiatedBy) {
    await prisma.auditLog.create({
      data: {
        userId: initiatedBy,
        action: 'AUTO_SEND',
        entityType: 'FuelEntry',
        changes: {
          batchId,
          entriesCount: batch.totalEntries,
          batchSize: batch.batchSize,
          totalBatches: batch.totalBatches,
          sentBatches: sentCount,
          failedBatches: failedCount
        }
      }
    })
  }

  return { sentBatches: sentCount, failedBatches: failedCount }
}
