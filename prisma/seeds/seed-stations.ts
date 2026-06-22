import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

interface StationData {
  name: string
  code: string
  address: string
  type?: string
}

async function seedStations() {
  try {
    console.log('🌱 Seeding stations...')

    // Read stations from JSON file
    const stationsPath = join(__dirname, 'stations.json')
    const stationsData: StationData[] = JSON.parse(readFileSync(stationsPath, 'utf-8'))

    let created = 0
    let skipped = 0
    let updated = 0

    for (const station of stationsData) {
      // Check if station already exists by code
      const existing = await prisma.station.findUnique({
        where: { code: station.code }
      })

      if (existing) {
        // Update existing station
        await prisma.station.update({
          where: { code: station.code },
          data: {
            name: station.name,
            address: station.address,
            isActive: true
          }
        })
        updated++
        console.log(`  ✓ Updated: ${station.name} (${station.code})`)
      } else {
        // Create new station
        await prisma.station.create({
          data: {
            name: station.name,
            code: station.code,
            address: station.address,
            isActive: true
          }
        })
        created++
        console.log(`  ✓ Created: ${station.name} (${station.code})`)
      }
    }

    console.log('\n✅ Seeding completed!')
    console.log(`   📊 Statistics:`)
    console.log(`      - Created: ${created}`)
    console.log(`      - Updated: ${updated}`)
    console.log(`      - Skipped: ${skipped}`)
    console.log(`      - Total:   ${stationsData.length}`)
  } catch (error) {
    console.error('❌ Error seeding stations:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed
seedStations()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
