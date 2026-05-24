/**
 * Quick script to check Excel file content
 */
import * as XLSX from 'xlsx'

const filePath = '/Users/emir_mw/Downloads/New Microsoft Excel Worksheet.xlsx'

try {
  const workbook = XLSX.readFile(filePath)

  console.log('Total sheets:', workbook.SheetNames.length)
  console.log('Sheet names:', workbook.SheetNames)

  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n=== Sheet ${index + 1}: ${sheetName} ===`)
    const worksheet = workbook.Sheets[sheetName]

    // Get the range
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    console.log('Range:', worksheet['!ref'])
    console.log('Rows:', range.e.r + 1)
    console.log('Cols:', range.e.c + 1)

    // Convert to JSON with different options
    const dataWithHeader = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
    console.log('\nFirst 15 rows (raw):')
    dataWithHeader.slice(0, 15).forEach((row: any, idx: number) => {
      console.log(`Row ${idx + 1}:`, row)
    })

    // Also try as objects
    const dataAsObjects = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
    console.log('\nAs objects (first 5):')
    console.log(dataAsObjects.slice(0, 5))
  })
} catch (error) {
  console.error('Error reading Excel file:', error)
}
