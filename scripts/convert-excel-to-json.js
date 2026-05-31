const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

const DOCS_DIR = '/Users/emir_mw/evidencija/docs/FW_ Aplikacija - izjave o usklađenosti'
const OUTPUT_DIR = path.join(__dirname, '../data/import')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Mapping of files to their data types
const fileMapping = [
  {
    file: 'Dobavljači.xlsx',
    type: 'suppliers',
    mapping: (row, index) => ({
      name: row['Supplier'] || '',
      code: `SUP-${String(index + 1).padStart(3, '0')}`,
      address: '',
      contactPerson: '',
      phone: '',
      email: ''
    })
  },
  {
    file: 'Prevoznik.xlsx',
    type: 'transporters',
    mapping: (row, index) => ({
      name: row['Carrier'] || '',
      code: `TRN-${String(index + 1).padStart(3, '0')}`,
      address: '',
      contactPerson: '',
      phone: '',
      email: ''
    })
  },
  {
    file: 'Labaratorije.xlsx',
    type: 'laboratories',
    mapping: (row, index) => {
      const labName = row['Tečno naftno gorivo je  ispitano u akreditiranoj labaratoriji:'] ||
                      row['Naziv i sjedište labaratorije:'] || ''
      const accNumber = row['Broj rješenja akreditacije labaratorije:'] || ''

      return {
        name: labName.trim(),
        accreditationNumber: String(accNumber).trim(),
        address: '',
        contactPerson: '',
        phone: '',
        email: ''
      }
    }
  },
  {
    file: 'Vrste goriva.xlsx',
    type: 'products',
    mapping: (row) => ({
      name: row['Petroleum product'] || '',
      description: ''
    })
  },
  {
    file: 'Zemlje porijekla.xlsx',
    type: 'countries',
    mapping: (row) => {
      // Get the first non-empty value from the row
      const countryName = Object.values(row).find(val => val && String(val).trim()) || ''
      return {
        name: String(countryName).trim(),
        code: ''
      }
    }
  }
]

console.log('Converting Excel files to JSON...\n')

fileMapping.forEach(({ file, type, mapping }) => {
  const filePath = path.join(DOCS_DIR, file)

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`)
    return
  }

  console.log(`📄 Processing: ${file}`)

  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet)

    // Map to our structure
    const mappedData = rawData.map((row, index) => mapping(row, index)).filter(item => {
      // Filter out empty rows
      return item.name && item.name.toString().trim() !== ''
    })

    // Remove duplicates based on name
    const uniqueData = mappedData.reduce((acc, current) => {
      const exists = acc.find(item =>
        item.name.toLowerCase().trim() === current.name.toLowerCase().trim()
      )
      if (!exists) {
        acc.push(current)
      }
      return acc
    }, [])

    // Save to JSON file
    const outputPath = path.join(OUTPUT_DIR, `${type}.json`)
    fs.writeFileSync(outputPath, JSON.stringify(uniqueData, null, 2))

    console.log(`   ✅ Converted ${uniqueData.length} items to ${type}.json`)

  } catch (error) {
    console.error(`   ❌ Error processing ${file}:`, error.message)
  }
})

console.log('\n✨ Conversion complete! Files saved to:', OUTPUT_DIR)
