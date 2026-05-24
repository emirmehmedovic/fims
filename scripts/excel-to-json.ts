/**
 * Export Excel clients to JSON file
 *
 * Usage: npx tsx scripts/excel-to-json.ts
 */
import * as XLSX from 'xlsx'
import { writeFileSync } from 'fs'
import { join } from 'path'

const excelPath = '/Users/emir_mw/Downloads/New Microsoft Excel Worksheet.xlsx'
const jsonPath = join(__dirname, '../data/clients-import.json')

interface Client {
  name: string
  code: string
}

async function exportToJson() {
  console.log('📖 Reading Excel file:', excelPath)

  try {
    const workbook = XLSX.readFile(excelPath)
    const sheetName = 'poveznica'
    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found`)
    }

    // Convert to array
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' })

    console.log(`✅ Found ${rawData.length} rows\n`)

    // Parse and clean data
    const clients: Client[] = []
    const skipped: string[] = []

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i]
      const rowNum = i + 1

      const name = String(row[0] || '').trim()
      const codeRaw = String(row[1] || '').trim()

      // Skip empty rows
      if (!name && !codeRaw) {
        continue
      }

      // Validate
      if (!name) {
        skipped.push(`Row ${rowNum}: Missing name`)
        continue
      }

      // Clean code (remove "PP: " prefix)
      const code = codeRaw.replace(/^PP:\s*/i, '').trim()

      if (!code) {
        skipped.push(`Row ${rowNum}: Missing code for "${name}"`)
        continue
      }

      clients.push({ name, code })
    }

    console.log(`📊 Extracted ${clients.length} valid clients`)
    if (skipped.length > 0) {
      console.log(`⚠️  Skipped ${skipped.length} rows`)
    }

    // Create data directory if doesn't exist
    const fs = require('fs')
    const dataDir = join(__dirname, '../data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Write to JSON file
    writeFileSync(jsonPath, JSON.stringify(clients, null, 2), 'utf-8')

    console.log(`\n✅ Exported to: ${jsonPath}`)
    console.log(`📦 Total clients: ${clients.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

exportToJson()
