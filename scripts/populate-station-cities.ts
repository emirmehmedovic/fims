/**
 * Script to populate city field for all stations
 * Extracts city from station name (format: "Hifa Petrol City" or "Hifa Petrol City 2")
 *
 * Run with: npx tsx scripts/populate-station-cities.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Extract city from station name
// Format: "Hifa Petrol Banja Luka" -> "Banja Luka"
// Format: "Hifa Petrol Banja Luka 2" -> "Banja Luka"
function extractCityFromName(name: string): string | null {
  if (!name) return null

  // Remove "Hifa Petrol " prefix
  let city = name.replace(/^Hifa Petrol\s+/i, '')

  // Remove trailing number (e.g., " 2", " 3")
  city = city.replace(/\s+\d+$/, '')

  return city.trim() || null
}

// Special mappings for non-Hifa stations
const specialMappings: Record<string, string> = {
  'LUK-001': 'Ploče',
  'LUK-002': 'Koper',
  'OST-001': 'Rijeka',
  'SKL-001': 'Pančevo'
}

async function main() {
  console.log('Fetching all stations...')

  const stations = await prisma.station.findMany({
    orderBy: { code: 'asc' }
  })

  console.log(`Found ${stations.length} stations\n`)

  let updated = 0
  let skipped = 0
  const needsReview: { code: string; name: string }[] = []

  for (const station of stations) {
    // Check for special mappings first
    let city: string | null = specialMappings[station.code] || null

    // If no special mapping, extract from name
    if (!city && station.name.startsWith('Hifa Petrol')) {
      city = extractCityFromName(station.name)
    }

    if (city) {
      await prisma.station.update({
        where: { id: station.id },
        data: { city }
      })
      console.log(`[OK] ${station.code} - ${station.name}: Set city to "${city}"`)
      updated++
    } else {
      console.log(`[REVIEW] ${station.code} - ${station.name}: Could not extract city`)
      needsReview.push({
        code: station.code,
        name: station.name
      })
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Needs manual review: ${needsReview.length}`)

  if (needsReview.length > 0) {
    console.log('\nStations that need manual city assignment:')
    needsReview.forEach(s => {
      console.log(`  - ${s.code}: ${s.name}`)
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
