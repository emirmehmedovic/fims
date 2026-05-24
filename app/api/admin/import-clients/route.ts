import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/withAuth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { readFileSync } from 'fs'
import { join } from 'path'

interface Client {
  name: string
  code: string
}

interface ImportResult {
  created: number
  updated: number
  skipped: number
  errors: number
  total: number
  errorDetails: string[]
  duration: number
}

// POST /api/admin/import-clients - Import clients from JSON file
export const POST = withAuth(async (req: NextRequest, context, session) => {
  const startTime = Date.now()

  try {
    console.log('[IMPORT_CLIENTS] Starting import...')

    // Read JSON file from data directory
    const jsonPath = join(process.cwd(), 'data', 'clients-import.json')
    console.log('[IMPORT_CLIENTS] Reading file:', jsonPath)

    let clients: Client[]
    try {
      const jsonData = readFileSync(jsonPath, 'utf-8')
      clients = JSON.parse(jsonData)
    } catch (error: any) {
      console.error('[IMPORT_CLIENTS] Error reading JSON file:', error)
      return errorResponse(`Failed to read clients file: ${error.message}`, 500)
    }

    console.log(`[IMPORT_CLIENTS] Loaded ${clients.length} clients from JSON`)

    // Validate data
    const invalid = clients.filter(c => !c.name || !c.code)
    if (invalid.length > 0) {
      return errorResponse(`Invalid data: ${invalid.length} clients missing name or code`, 400)
    }

    // Import to database
    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    const errorDetails: string[] = []

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]

      try {
        // Check if client exists by code
        const existing = await prisma.client.findUnique({
          where: { code: client.code }
        })

        if (existing) {
          // Update if name is different
          if (existing.name !== client.name) {
            await prisma.client.update({
              where: { id: existing.id },
              data: { name: client.name }
            })
            updated++
          } else {
            skipped++
          }
        } else {
          // Create new client
          await prisma.client.create({
            data: {
              name: client.name,
              code: client.code,
              isActive: true
            }
          })
          created++
        }
      } catch (error: any) {
        errors++
        errorDetails.push(`${client.name} (${client.code}): ${error.message}`)
        console.error(`[IMPORT_CLIENTS] Error with client ${client.code}:`, error)
      }

      // Log progress every 100 clients
      if ((i + 1) % 100 === 0) {
        console.log(`[IMPORT_CLIENTS] Progress: ${i + 1}/${clients.length}`)
      }
    }

    const duration = Date.now() - startTime

    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Client',
        changes: {
          action: 'bulk_import',
          created,
          updated,
          skipped,
          errors,
          total: clients.length,
          duration
        }
      }
    })

    const result: ImportResult = {
      created,
      updated,
      skipped,
      errors,
      total: clients.length,
      errorDetails,
      duration
    }

    console.log('[IMPORT_CLIENTS] Completed:', result)

    return successResponse(result)
  } catch (error) {
    console.error('[IMPORT_CLIENTS] Fatal error:', error)
    return errorResponse('Failed to import clients', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])

// GET /api/admin/import-clients - Get import file info
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const jsonPath = join(process.cwd(), 'data', 'clients-import.json')

    let fileInfo
    try {
      const jsonData = readFileSync(jsonPath, 'utf-8')
      const clients: Client[] = JSON.parse(jsonData)

      // Check how many already exist
      const codes = clients.map(c => c.code).filter(Boolean)
      const existingCount = await prisma.client.count({
        where: {
          code: { in: codes }
        }
      })

      fileInfo = {
        totalInFile: clients.length,
        alreadyExists: existingCount,
        wouldCreate: clients.length - existingCount,
        filePath: 'data/clients-import.json'
      }
    } catch (error: any) {
      return errorResponse(`File not found or invalid: ${error.message}`, 404)
    }

    return successResponse(fileInfo)
  } catch (error) {
    console.error('[IMPORT_CLIENTS] Error getting file info:', error)
    return errorResponse('Failed to get import info', 500)
  }
}, ['SUPER_ADMIN', 'ADMIN'])
