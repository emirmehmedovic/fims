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
  console.log('🌱 Starting demo data seed...\n')

  // Get existing admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
  })

  if (!adminUser) {
    console.error('❌ No admin user found. Please create an admin user first.')
    return
  }

  console.log(`✅ Using admin user: ${adminUser.name} (${adminUser.email})\n`)

  // ============================================
  // 1. CREATE WAREHOUSES
  // ============================================
  console.log('📦 Creating warehouses...')
  
  const warehousesData = [
    { name: 'Skladište Tešanj 1', code: 'TS-001', location: 'Tešanj, Industrijska zona', capacity: 500000, description: 'Glavno skladište u Tešnju' },
    { name: 'Skladište Tešanj 2', code: 'TS-002', location: 'Tešanj, Poslovna zona', capacity: 300000, description: 'Pomoćno skladište u Tešnju' },
    { name: 'Skladište Tešanj 3', code: 'TS-003', location: 'Tešanj, Jelah', capacity: 200000, description: 'Skladište Jelah' },
    { name: 'Skladište Sarajevo 1', code: 'SA-001', location: 'Sarajevo, Vogošća', capacity: 800000, description: 'Glavno skladište u Sarajevu' },
    { name: 'Skladište Sarajevo 2', code: 'SA-002', location: 'Sarajevo, Ilidža', capacity: 400000, description: 'Skladište Ilidža' },
    { name: 'Skladište Sarajevo 3', code: 'SA-003', location: 'Sarajevo, Hadžići', capacity: 350000, description: 'Skladište Hadžići' },
  ]

  const warehouses = []
  for (const wh of warehousesData) {
    const warehouse = await prisma.warehouse.upsert({
      where: { code: wh.code },
      update: wh,
      create: wh
    })
    warehouses.push(warehouse)
    console.log(`  ✓ ${warehouse.name} (${warehouse.code})`)
  }

  // Assign all warehouses to admin user
  for (const wh of warehouses) {
    await prisma.userWarehouse.upsert({
      where: { userId_warehouseId: { userId: adminUser.id, warehouseId: wh.id } },
      update: {},
      create: { userId: adminUser.id, warehouseId: wh.id }
    })
  }
  console.log(`  ✓ Assigned all warehouses to ${adminUser.name}\n`)

  // ============================================
  // 2. CREATE MASTER DATA - PRODUCTS
  // ============================================
  console.log('🛢️ Creating products...')
  
  const productsData = [
    { name: 'Eurodizel EN 590', description: 'Standardni eurodizel prema EN 590' },
    { name: 'Eurodizel Premium', description: 'Premium dizel sa aditivima' },
    { name: 'Benzin BMB 95', description: 'Bezolovni motorni benzin 95' },
    { name: 'Benzin BMB 98', description: 'Bezolovni motorni benzin 98' },
    { name: 'Lož ulje ekstra lako', description: 'Ekstra lako lož ulje za grijanje' },
    { name: 'Mazut', description: 'Teško lož ulje' },
  ]

  const products = []
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { name: p.name },
      update: p,
      create: p
    })
    products.push(product)
    console.log(`  ✓ ${product.name}`)
  }

  // ============================================
  // 3. CREATE MASTER DATA - COUNTRIES
  // ============================================
  console.log('\n🌍 Creating countries...')
  
  const countriesData = [
    { name: 'Bosna i Hercegovina', code: 'BiH' },
    { name: 'Hrvatska', code: 'HR' },
    { name: 'Srbija', code: 'RS' },
    { name: 'Slovenija', code: 'SI' },
    { name: 'Mađarska', code: 'HU' },
    { name: 'Austrija', code: 'AT' },
  ]

  const countries = []
  for (const c of countriesData) {
    const country = await prisma.country.upsert({
      where: { name: c.name },
      update: c,
      create: c
    })
    countries.push(country)
    console.log(`  ✓ ${country.name} (${country.code})`)
  }

  // ============================================
  // 4. CREATE MASTER DATA - PICKUP LOCATIONS
  // ============================================
  console.log('\n📍 Creating pickup locations...')
  
  const locationsData = [
    { name: 'Rafinerija Brod', address: 'Brod, Republika Srpska' },
    { name: 'Rafinerija Sisak', address: 'Sisak, Hrvatska' },
    { name: 'Rafinerija Rijeka', address: 'Rijeka, Hrvatska' },
    { name: 'Terminal Ploče', address: 'Ploče, Hrvatska' },
    { name: 'Terminal Omišalj', address: 'Omišalj, Hrvatska' },
    { name: 'NIS Pančevo', address: 'Pančevo, Srbija' },
  ]

  const locations = []
  for (const l of locationsData) {
    const location = await prisma.pickupLocation.upsert({
      where: { name: l.name },
      update: l,
      create: l
    })
    locations.push(location)
    console.log(`  ✓ ${location.name}`)
  }

  // ============================================
  // 5. CREATE MASTER DATA - FUEL CHARACTERISTICS
  // ============================================
  console.log('\n✨ Creating fuel characteristics...')
  
  const characteristicsData = [
    { name: 'Aditivirano', description: 'Gorivo sa dodatnim aditivima' },
    { name: 'Zimska kvaliteta', description: 'Prilagođeno za zimske uvjete' },
    { name: 'Niskosumporni', description: 'Nizak sadržaj sumpora' },
    { name: 'Biokomponenta', description: 'Sadrži biokomponentu' },
    { name: 'Premium aditivi', description: 'Premium paket aditiva' },
  ]

  const characteristics = []
  for (const ch of characteristicsData) {
    const characteristic = await prisma.fuelCharacteristic.upsert({
      where: { name: ch.name },
      update: ch,
      create: ch
    })
    characteristics.push(characteristic)
    console.log(`  ✓ ${characteristic.name}`)
  }

  // ============================================
  // 6. CREATE SUPPLIERS
  // ============================================
  console.log('\n🏢 Creating suppliers...')
  
  const suppliersData = [
    { name: 'HIFA Petrol d.o.o.', code: 'HIFA-001', address: 'Tešanj, BiH', contactPerson: 'Amir Hadžić', phone: '+387 32 650 100', email: 'info@hifapetrol.ba' },
    { name: 'INA d.d.', code: 'INA-001', address: 'Zagreb, Hrvatska', contactPerson: 'Ivan Horvat', phone: '+385 1 6450 000', email: 'info@ina.hr' },
    { name: 'NIS a.d.', code: 'NIS-001', address: 'Novi Sad, Srbija', contactPerson: 'Marko Petrović', phone: '+381 21 481 1111', email: 'info@nis.rs' },
    { name: 'Petrol d.d.', code: 'PETROL-001', address: 'Ljubljana, Slovenija', contactPerson: 'Janez Novak', phone: '+386 1 471 7575', email: 'info@petrol.si' },
    { name: 'MOL Hungary', code: 'MOL-001', address: 'Budapest, Mađarska', contactPerson: 'László Nagy', phone: '+36 1 464 0000', email: 'info@mol.hu' },
  ]

  const suppliers = []
  for (const s of suppliersData) {
    const supplier = await prisma.supplier.upsert({
      where: { code: s.code },
      update: s,
      create: s
    })
    suppliers.push(supplier)
    console.log(`  ✓ ${supplier.name} (${supplier.code})`)
  }

  // ============================================
  // 7. CREATE TRANSPORTERS
  // ============================================
  console.log('\n🚛 Creating transporters...')
  
  const transportersData = [
    { name: 'HIFA Transport d.o.o.', code: 'HT-001', address: 'Tešanj, BiH', contactPerson: 'Senad Mujić', phone: '+387 32 650 200', email: 'transport@hifapetrol.ba' },
    { name: 'Euro Trans d.o.o.', code: 'ET-001', address: 'Sarajevo, BiH', contactPerson: 'Edin Begić', phone: '+387 33 123 456', email: 'info@eurotrans.ba' },
    { name: 'Adriatic Transport', code: 'AT-001', address: 'Split, Hrvatska', contactPerson: 'Ante Jurić', phone: '+385 21 345 678', email: 'info@adriatictrans.hr' },
    { name: 'Balkan Logistics', code: 'BL-001', address: 'Beograd, Srbija', contactPerson: 'Dragan Jovanović', phone: '+381 11 234 5678', email: 'info@balkanlog.rs' },
    { name: 'Central Europe Transport', code: 'CET-001', address: 'Beč, Austrija', contactPerson: 'Hans Müller', phone: '+43 1 234 5678', email: 'info@cetrans.at' },
  ]

  const transporters = []
  for (const t of transportersData) {
    const transporter = await prisma.transporter.upsert({
      where: { code: t.code },
      update: t,
      create: t
    })
    transporters.push(transporter)
    console.log(`  ✓ ${transporter.name} (${transporter.code})`)
  }

  // ============================================
  // 8. CREATE FUEL ENTRIES
  // ============================================
  console.log('\n📝 Creating 100 fuel entries...')

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

  const certificatePath = '/uploads/certificates/cert_12346_1764451382559.pdf'
  const certificateFileName = 'cert_12346_1764451382559.pdf'

  for (let i = 0; i < 100; i++) {
    const entryDate = randomDate(90) // Last 3 months
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
        
        certificatePath,
        certificateFileName,
        certificateUploadedAt: entryDate,
        
        createdBy: adminUser.id,
        createdAt: entryDate,
      }
    })

    regNumber++
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Created ${i + 1}/100 entries...`)
    }
  }

  console.log('\n✅ Demo data seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`  - Warehouses: ${warehouses.length}`)
  console.log(`  - Products: ${products.length}`)
  console.log(`  - Countries: ${countries.length}`)
  console.log(`  - Pickup Locations: ${locations.length}`)
  console.log(`  - Fuel Characteristics: ${characteristics.length}`)
  console.log(`  - Suppliers: ${suppliers.length}`)
  console.log(`  - Transporters: ${transporters.length}`)
  console.log(`  - Fuel Entries: 100`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
