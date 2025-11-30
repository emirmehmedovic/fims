import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function randomDate(daysBack: number): Date {
  const now = new Date()
  const pastDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime())
  return new Date(randomTime)
}

function generateDeliveryNoteNumber(): string {
  return `OTP-${randomInt(1000, 9999)}/${new Date().getFullYear()}`
}

function generateCustomsDeclarationNumber(): string {
  return `CD-${randomInt(10000, 99999)}-${randomInt(2024, 2024)}`
}

function generateTestReportNumber(): string {
  return `LR-${randomInt(1000, 9999)}/${new Date().getFullYear()}`
}

function generateLabAccreditationNumber(): string {
  return `BAS LA-${randomInt(100, 999)}`
}

async function main() {
  console.log('🌱 Starting 1000 fuel entries seed...\n')

  // Get existing admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
  })

  if (!adminUser) {
    console.error('❌ No admin user found.')
    return
  }

  console.log(`✅ Using admin user: ${adminUser.name}\n`)

  // Get existing data
  const warehouses = await prisma.warehouse.findMany({ where: { isActive: true } })
  const products = await prisma.product.findMany({ where: { isActive: true } })
  const countries = await prisma.country.findMany({ where: { isActive: true } })
  const locations = await prisma.pickupLocation.findMany({ where: { isActive: true } })
  const characteristics = await prisma.fuelCharacteristic.findMany({ where: { isActive: true } })
  const suppliers = await prisma.supplier.findMany({ where: { isActive: true } })
  const transporters = await prisma.transporter.findMany({ where: { isActive: true } })

  console.log(`📦 Found: ${warehouses.length} warehouses, ${products.length} products, ${suppliers.length} suppliers\n`)

  const laboratories = [
    'Institut za kvalitet BiH',
    'Laboratorij HIFA',
    'INA Laboratorij',
    'SGS Sarajevo',
    'Bureau Veritas BiH'
  ]

  const drivers = [
    'Mehmed Hodžić',
    'Ivan Marić',
    'Dragan Kovačević',
    'Amir Delić',
    'Senad Mušić',
    'Edin Hasanović',
    'Mirza Begović',
    'Jasmin Hadžić',
    'Nedim Selimović',
    'Adnan Čaušević'
  ]

  const orderOpeners = [
    'Amra Hadžić',
    'Selma Begić',
    'Lejla Mujić',
    'Aida Kovačević',
    'Merima Delić'
  ]

  // Get current max registration number
  const lastEntry = await prisma.fuelEntry.findFirst({
    orderBy: { registrationNumber: 'desc' }
  })
  let regNumber = (lastEntry?.registrationNumber || 0) + 1

  console.log(`📝 Starting from registration number: ${regNumber}\n`)

  const certificatePath = '/uploads/certificates/cert_12346_1764451382559.pdf'
  const certificateFileName = 'cert_12346_1764451382559.pdf'

  const TOTAL_ENTRIES = 1000
  const BATCH_SIZE = 50

  console.log(`📝 Creating ${TOTAL_ENTRIES} fuel entries (last 5 months)...\n`)

  for (let i = 0; i < TOTAL_ENTRIES; i++) {
    const entryDate = randomDate(150) // Last 5 months (150 days)
    const isHigherQuality = Math.random() > 0.5
    const selectedProduct = randomElement(products)
    const selectedWarehouse = randomElement(warehouses)
    const selectedCountry = randomElement(countries)
    const selectedLocation = randomElement(locations)
    const selectedSupplier = randomElement(suppliers)
    const selectedTransporter = randomElement(transporters)

    // Random characteristics if higher quality
    const selectedCharacteristics = isHigherQuality 
      ? randomElements(characteristics.map(c => c.name), randomInt(1, 3))
      : []

    const deliveryNoteDate = new Date(entryDate.getTime() - randomInt(1, 5) * 24 * 60 * 60 * 1000)
    const customsDeclarationDate = new Date(entryDate.getTime() - randomInt(1, 7) * 24 * 60 * 60 * 1000)
    const testReportDate = new Date(entryDate.getTime() - randomInt(1, 10) * 24 * 60 * 60 * 1000)

    // Random certificate - 80% chance to have certificate
    const hasCertificate = Math.random() > 0.2

    await prisma.fuelEntry.create({
      data: {
        registrationNumber: regNumber,
        entryDate,
        warehouseId: selectedWarehouse.id,
        productName: selectedProduct.name,
        quantity: randomInt(5000, 35000),
        
        deliveryNoteNumber: generateDeliveryNoteNumber(),
        deliveryNoteDate,
        customsDeclarationNumber: Math.random() > 0.3 ? generateCustomsDeclarationNumber() : null,
        customsDeclarationDate: Math.random() > 0.3 ? customsDeclarationDate : null,
        
        isHigherQuality,
        improvedCharacteristics: selectedCharacteristics,
        countryOfOrigin: `${selectedCountry.name} (${selectedCountry.code})`,
        
        laboratoryName: randomElement(laboratories),
        labAccreditationNumber: generateLabAccreditationNumber(),
        testReportNumber: generateTestReportNumber(),
        testReportDate,
        
        operatorId: adminUser.id,
        orderOpenedBy: randomElement(orderOpeners),
        
        pickupLocation: selectedLocation.name,
        supplierId: selectedSupplier.id,
        transporterId: selectedTransporter.id,
        driverName: randomElement(drivers),
        
        certificatePath: hasCertificate ? certificatePath : null,
        certificateFileName: hasCertificate ? certificateFileName : null,
        certificateUploadedAt: hasCertificate ? entryDate : null,
        
        createdBy: adminUser.id,
        createdAt: entryDate,
      }
    })

    regNumber++
    
    if ((i + 1) % BATCH_SIZE === 0) {
      const percent = Math.round(((i + 1) / TOTAL_ENTRIES) * 100)
      console.log(`  ✓ Created ${i + 1}/${TOTAL_ENTRIES} entries (${percent}%)...`)
    }
  }

  console.log('\n✅ Seed completed successfully!')
  console.log(`\n📊 Total fuel entries created: ${TOTAL_ENTRIES}`)
  
  const totalEntries = await prisma.fuelEntry.count()
  console.log(`📊 Total entries in database: ${totalEntries}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
