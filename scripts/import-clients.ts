/**
 * Import clients from Excel file
 *
 * Usage: npx tsx scripts/import-clients.ts
 */
import * as XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const filePath = '/Users/emir_mw/Downloads/New Microsoft Excel Worksheet.xlsx'

interface ClientRow {
  name: string
  code: string
}

async function importClients() {
  console.log('🔄 Starting client import...\n')

  try {
    // Read Excel file
    console.log('📖 Reading Excel file:', filePath)
    const workbook = XLSX.readFile(filePath)
    const sheetName = 'poveznica' // The sheet with client data
    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found in the Excel file`)
    }

    // Convert to array of arrays
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' })

    console.log(`✅ Found ${rawData.length} rows in "${sheetName}" sheet\n`)

    // Parse and clean data
    const clients: ClientRow[] = []
    const skipped: string[] = []

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i]
      const rowNum = i + 1

      // Extract columns A and B
      const name = String(row[0] || '').trim()
      const codeRaw = String(row[1] || '').trim()

      // Skip empty rows
      if (!name && !codeRaw) {
        continue
      }

      // Validate name
      if (!name) {
        skipped.push(`Row ${rowNum}: Missing name`)
        continue
      }

      // Clean code (remove "PP: " prefix if present)
      let code = codeRaw.replace(/^PP:\s*/i, '').trim()

      // Skip if no code
      if (!code) {
        skipped.push(`Row ${rowNum}: Missing code for "${name}"`)
        continue
      }

      clients.push({ name, code })
    }

    console.log(`📊 Parsed ${clients.length} valid clients`)
    if (skipped.length > 0) {
      console.log(`⚠️  Skipped ${skipped.length} rows:`)
      skipped.slice(0, 10).forEach(msg => console.log(`   - ${msg}`))
      if (skipped.length > 10) {
        console.log(`   ... and ${skipped.length - 10} more`)
      }
      console.log()
    }

    // Import to database
    console.log('💾 Importing to database...\n')

    let created = 0
    let updated = 0
    let errors = 0
    const errorDetails: string[] = []

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]
      const progress = `[${i + 1}/${clients.length}]`

      try {
        // Try to find existing client by code
        const existing = await prisma.client.findUnique({
          where: { code: client.code }
        })

        if (existing) {
          // Update name if different
          if (existing.name !== client.name) {
            await prisma.client.update({
              where: { id: existing.id },
              data: { name: client.name }
            })
            console.log(`${progress} ✏️  Updated: ${client.name} (${client.code})`)
            updated++
          } else {
            console.log(`${progress} ⏭️  Skipped (exists): ${client.name} (${client.code})`)
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
    console.log('\n' + '='.repeat(60))
    console.log('📊 IMPORT SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Created:  ${created}`)
    console.log(`✏️  Updated:  ${updated}`)
    console.log(`⏭️  Skipped:  ${clients.length - created - updated - errors}`)
    console.log(`❌ Errors:   ${errors}`)
    console.log(`📦 Total:    ${clients.length}`)
    console.log('='.repeat(60))

    if (errorDetails.length > 0) {
      console.log('\n❌ Error details:')
      errorDetails.forEach(msg => console.log(`   - ${msg}`))
    }

    console.log('\n✅ Import completed!')

  } catch (error) {
    console.error('❌ Fatal error during import:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importClients()
