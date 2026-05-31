import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const DATA_DIR = path.join(__dirname, '../data/import')

interface SupplierData {
  name: string
  code: string
  address?: string
  contactPerson?: string
  phone?: string
  email?: string
}

interface TransporterData {
  name: string
  code: string
  address?: string
  contactPerson?: string
  phone?: string
  email?: string
}

interface LaboratoryData {
  name: string
  accreditationNumber?: string
  address?: string
  contactPerson?: string
  phone?: string
  email?: string
}

interface ProductData {
  name: string
  description?: string
}

interface CountryData {
  name: string
  code?: string
}

async function importCountries(data: CountryData[]) {
  console.log(`\n📥 Importing ${data.length} countries...`)
  let successCount = 0
  let errorCount = 0
  const errors: Array<{ item: string; error: string }> = []

  for (const item of data) {
    try {
      await prisma.country.upsert({
        where: { name: item.name },
        update: { code: item.code || null },
        create: {
          name: item.name,
          code: item.code || null,
          isActive: true
        }
      })
      successCount++
      process.stdout.write('.')
    } catch (error: any) {
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

async function importProducts(data: ProductData[]) {
  console.log(`\n📥 Importing ${data.length} products...`)
  let successCount = 0
  let errorCount = 0
  const errors: Array<{ item: string; error: string }> = []

  for (const item of data) {
    try {
      await prisma.product.upsert({
        where: { name: item.name },
        update: { description: item.description || null },
        create: {
          name: item.name,
          description: item.description || null,
          isActive: true
        }
      })
      successCount++
      process.stdout.write('.')
    } catch (error: any) {
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

async function importSuppliers(data: SupplierData[]) {
  console.log(`\n📥 Importing ${data.length} suppliers...`)
  let successCount = 0
  let errorCount = 0
  const errors: Array<{ item: string; error: string }> = []

  for (const item of data) {
    try {
      await prisma.supplier.upsert({
        where: { code: item.code },
        update: {
          name: item.name,
          address: item.address || null,
          contactPerson: item.contactPerson || null,
          phone: item.phone || null,
          email: item.email || null
        },
        create: {
          name: item.name,
          code: item.code,
          address: item.address || null,
          contactPerson: item.contactPerson || null,
          phone: item.phone || null,
          email: item.email || null,
          isActive: true
        }
      })
      successCount++
      process.stdout.write('.')
    } catch (error: any) {
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

async function importTransporters(data: TransporterData[]) {
  console.log(`\n📥 Importing ${data.length} transporters...`)
  let successCount = 0
  let errorCount = 0
  const errors: Array<{ item: string; error: string }> = []

  for (const item of data) {
    try {
      await prisma.transporter.upsert({
        where: { code: item.code },
        update: {
          name: item.name,
          address: item.address || null,
          contactPerson: item.contactPerson || null,
          phone: item.phone || null,
          email: item.email || null
        },
        create: {
          name: item.name,
          code: item.code,
          address: item.address || null,
          contactPerson: item.contactPerson || null,
          phone: item.phone || null,
          email: item.email || null,
          isActive: true
        }
      })
      successCount++
      process.stdout.write('.')
    } catch (error: any) {
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

async function importLaboratories(data: LaboratoryData[]) {
  console.log(`\n📥 Importing ${data.length} laboratories...`)
  let successCount = 0
  let errorCount = 0
  const errors: Array<{ item: string; error: string }> = []

  for (const item of data) {
    try {
      // Laboratories don't have a unique code, so we use name
      const existing = await prisma.laboratory.findFirst({
        where: { name: item.name }
      })

      if (existing) {
        await prisma.laboratory.update({
          where: { id: existing.id },
          data: {
            accreditationNumber: item.accreditationNumber || null,
            address: item.address || null,
            contactPerson: item.contactPerson || null,
            phone: item.phone || null,
            email: item.email || null
          }
        })
      } else {
        await prisma.laboratory.create({
          data: {
            name: item.name,
            accreditationNumber: item.accreditationNumber || null,
            address: item.address || null,
            contactPerson: item.contactPerson || null,
            phone: item.phone || null,
            email: item.email || null,
            isActive: true
          }
        })
      }
      successCount++
      process.stdout.write('.')
    } catch (error: any) {
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
  console.log('🚀 Starting Master Data Import (Direct)')
  console.log('========================================\n')

  // Check if data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.error('❌ Data directory not found:', DATA_DIR)
    console.log('\n💡 Run the conversion script first:')
    console.log('   npm run import:convert')
    process.exit(1)
  }

  try {
    // Import order (dependencies first)
    const importOrder: Array<{ type: string; file: string; fn: (data: any) => Promise<void> }> = [
      { type: 'countries', file: 'countries.json', fn: importCountries },
      { type: 'products', file: 'products.json', fn: importProducts },
      { type: 'suppliers', file: 'suppliers.json', fn: importSuppliers },
      { type: 'transporters', file: 'transporters.json', fn: importTransporters },
      { type: 'laboratories', file: 'laboratories.json', fn: importLaboratories }
    ]

    for (const { type, file, fn } of importOrder) {
      const filePath = path.join(DATA_DIR, file)

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${type} (file not found)`)
        continue
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      await fn(data)
    }

    console.log('\n\n✨ Import complete!')
    console.log('\n💡 Check the Master Data page to verify the imports.')
    console.log('   http://localhost:3000/dashboard/master-data')
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
main()
