/**
 * Import clients from JSON file to database
 *
 * Usage: npx tsx scripts/import-clients-from-json.ts
 *
 * Options:
 *   --dry-run    Show what would be imported without actually importing
 *   --limit N    Import only first N clients (for testing)
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
const jsonPath = join(__dirname, '../data/clients-import.json')

interface Client {
  name: string
  code: string
}

async function importClients() {
  // Parse command line args
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1]) : undefined

  console.log('🔄 Starting client import from JSON...')
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
  }
  if (limit) {
    console.log(`⚡ Limit: ${limit} clients\n`)
  }

  try {
    // Read JSON file
    console.log('📖 Reading JSON file:', jsonPath)
    const jsonData = readFileSync(jsonPath, 'utf-8')
    const allClients: Client[] = JSON.parse(jsonData)

    console.log(`✅ Loaded ${allClients.length} clients from JSON`)

    // Apply limit if specified
    const clients = limit ? allClients.slice(0, limit) : allClients
    console.log(`📊 Processing ${clients.length} clients\n`)

    // Validate data
    const invalid: string[] = []
    clients.forEach((client, idx) => {
      if (!client.name || !client.code) {
        invalid.push(`Client ${idx + 1}: Missing ${!client.name ? 'name' : 'code'}`)
      }
    })

    if (invalid.length > 0) {
      console.error('❌ Invalid data found:')
      invalid.forEach(msg => console.error(`   ${msg}`))
      process.exit(1)
    }

    if (isDryRun) {
      console.log('📋 DRY RUN - Would process these clients:\n')
      clients.slice(0, 10).forEach((client, idx) => {
        console.log(`   ${idx + 1}. ${client.name} (${client.code})`)
      })
      if (clients.length > 10) {
        console.log(`   ... and ${clients.length - 10} more`)
      }
      console.log('\n✅ Dry run completed. Run without --dry-run to import.')
      return
    }

    // Import to database
    console.log('💾 Importing to database...\n')

    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    const errorDetails: string[] = []

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]
      const progress = `[${i + 1}/${clients.length}]`

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
            console.log(`${progress} ✏️  Updated: ${client.name} (${client.code})`)
            updated++
          } else {
            console.log(`${progress} ⏭️  Skipped: ${client.name} (${client.code})`)
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
          console.log(`${progress} ✅ Created: ${client.name} (${client.code})`)
          created++
        }
      } catch (error: any) {
        errors++
        const errorMsg = `${client.name} (${client.code}): ${error.message}`
        errorDetails.push(errorMsg)
        console.log(`${progress} ❌ Error: ${errorMsg}`)
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 IMPORT SUMMARY')
    console.log('='.repeat(70))
    console.log(`✅ Created:        ${created.toString().padStart(5)}`)
    console.log(`✏️  Updated:        ${updated.toString().padStart(5)}`)
    console.log(`⏭️  Skipped:        ${skipped.toString().padStart(5)}`)
    console.log(`❌ Errors:         ${errors.toString().padStart(5)}`)
    console.log(`${'─'.repeat(70)}`)
    console.log(`📦 Total:          ${clients.length.toString().padStart(5)}`)
    console.log('='.repeat(70))

    if (errorDetails.length > 0) {
      console.log('\n❌ Error details:')
      errorDetails.forEach(msg => console.log(`   - ${msg}`))
    }

    console.log('\n✅ Import completed successfully!')

  } catch (error) {
    console.error('\n❌ Fatal error during import:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importClients()
