const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '../data/import')
const API_BASE = 'http://localhost:3000'

// API endpoints mapping
const endpoints = {
  suppliers: '/api/suppliers',
  transporters: '/api/transporters',
  laboratories: '/api/laboratories',
  products: '/api/lookups',
  countries: '/api/lookups'
}

// For lookups, we need to specify the type
const lookupTypes = {
  products: 'products',
  countries: 'countries'
}

async function importData(type, data) {
  const endpoint = endpoints[type]
  const isLookup = type === 'products' || type === 'countries'

  console.log(`\n📥 Importing ${data.length} ${type}...`)

  let successCount = 0
  let errorCount = 0
  const errors = []

  for (const item of data) {
    try {
      const body = isLookup
        ? { type: lookupTypes[type], ...item }
        : item

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        successCount++
        process.stdout.write('.')
      } else {
        errorCount++
        errors.push({ item: item.name, error: result.error })
        process.stdout.write('x')
      }
    } catch (error) {
      errorCount++
      errors.push({ item: item.name, error: error.message })
      process.stdout.write('x')
    }
  }

  console.log(`\n   ✅ Success: ${successCount}`)
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`)
    errors.slice(0, 5).forEach(({ item, error }) => {
      console.log(`      - ${item}: ${error}`)
    })
    if (errors.length > 5) {
      console.log(`      ... and ${errors.length - 5} more errors`)
    }
  }
}

async function main() {
  console.log('🚀 Starting Master Data Import')
  console.log('================================\n')

  // Check if data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.error('❌ Data directory not found:', DATA_DIR)
    console.log('\n💡 Run the conversion script first:')
    console.log('   node scripts/convert-excel-to-json.js')
    process.exit(1)
  }

  // Import order (dependencies first)
  const importOrder = ['countries', 'products', 'suppliers', 'transporters', 'laboratories']

  for (const type of importOrder) {
    const filePath = path.join(DATA_DIR, `${type}.json`)

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${type} (file not found)`)
      continue
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    await importData(type, data)
  }

  console.log('\n\n✨ Import complete!')
  console.log('\n💡 Check the Master Data page to verify the imports.')
}

// Run the import
main().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})
