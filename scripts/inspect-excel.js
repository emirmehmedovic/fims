const XLSX = require('xlsx')
const path = require('path')

const DOCS_DIR = '/Users/emir_mw/evidencija/docs/FW_ Aplikacija - izjave o usklađenosti'

const files = [
  'Dobavljači.xlsx',
  'Prevoznik.xlsx',
  'Labaratorije.xlsx',
  'Vrste goriva.xlsx',
  'Zemlje porijekla.xlsx'
]

files.forEach(file => {
  const filePath = path.join(DOCS_DIR, file)

  console.log(`\n${'='.repeat(60)}`)
  console.log(`📄 ${file}`)
  console.log('='.repeat(60))

  try {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    console.log(`Sheet: ${sheetName}`)

    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    console.log(`\nTotal rows: ${data.length}`)

    if (data.length > 0) {
      console.log('\nColumns found:')
      Object.keys(data[0]).forEach(key => {
        console.log(`  - "${key}"`)
      })

      console.log('\nFirst 2 rows:')
      data.slice(0, 2).forEach((row, idx) => {
        console.log(`\nRow ${idx + 1}:`)
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`)
        })
      })
    }
  } catch (error) {
    console.error(`Error: ${error.message}`)
  }
})
