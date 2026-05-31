# Import Master Data from Excel Files

This directory contains scripts to import master data from Excel files into the FIMS system.

## Overview

The import process consists of two steps:
1. **Convert Excel to JSON**: Reads xlsx files and converts them to JSON format
2. **Import to Database**: Uploads the JSON data to the database via API endpoints

## Files

- `convert-excel-to-json.js` - Converts Excel files to JSON
- `import-master-data.js` - Imports JSON files into the database
- `inspect-excel.js` - Helper script to inspect Excel file structure

## Excel Files

The following Excel files are processed from:
`/Users/emir_mw/evidencija/docs/FW_ Aplikacija - izjave o usklađenosti/`

| Excel File | Type | Items | API Endpoint |
|------------|------|-------|--------------|
| Dobavljači.xlsx | suppliers | 46 | /api/suppliers |
| Prevoznik.xlsx | transporters | 104 | /api/transporters |
| Labaratorije.xlsx | laboratories | 7 | /api/laboratories |
| Vrste goriva.xlsx | products | 16 | /api/lookups |
| Zemlje porijekla.xlsx | countries | 5 | /api/lookups |

**Note**: Aditivi (fuel characteristics) are skipped as requested.

## Usage

### Quick Start (All at once)

```bash
# Make sure the dev server is running
npm run dev

# In another terminal, run:
npm run import:all
```

### Step by Step

1. **Convert Excel files to JSON**:
   ```bash
   npm run import:convert
   ```
   This creates JSON files in `data/import/` directory.

2. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

3. **Import the data**:
   ```bash
   npm run import:data
   ```

### Individual Scripts

```bash
# Convert only
node scripts/convert-excel-to-json.js

# Import only (requires JSON files to exist)
node scripts/import-master-data.js

# Inspect Excel structure (useful for debugging)
node scripts/inspect-excel.js
```

## Output

### Convert Script
- Creates JSON files in `data/import/`:
  - `suppliers.json`
  - `transporters.json`
  - `laboratories.json`
  - `products.json`
  - `countries.json`

### Import Script
- Shows progress with dots (`.`) for success and `x` for errors
- Displays summary of successful and failed imports
- Lists first 5 errors if any occur

## Data Mapping

### Suppliers (Dobavljači)
- Name from "Supplier" column
- Auto-generated code: SUP-001, SUP-002, etc.
- Empty fields: address, contactPerson, phone, email

### Transporters (Prevoznici)
- Name from "Carrier" column
- Auto-generated code: TRN-001, TRN-002, etc.
- Empty fields: address, contactPerson, phone, email

### Laboratories (Laboratorije)
- Name from "Tečno naftno gorivo je ispitano u akreditiranoj labaratoriji:" column
- Accreditation number from "Broj rješenja akreditacije labaratorije:" column
- Empty fields: address, contactPerson, phone, email

### Products (Vrste goriva)
- Name from "Petroleum product" column
- Empty description field

### Countries (Zemlje porijekla)
- Name from first column value
- Empty code field

## Notes

- Duplicate entries (based on name) are automatically removed
- Empty rows are filtered out
- The import maintains the order: countries → products → suppliers → transporters → laboratories
- All imported items are set as active by default
- You can later edit the imported data through the Master Data UI to add missing information (addresses, contact details, etc.)

## Troubleshooting

**"Data directory not found"**
- Run the convert script first: `npm run import:convert`

**"Connection refused"**
- Make sure the dev server is running: `npm run dev`

**Import errors**
- Check the console output for specific error messages
- Verify the API endpoints are working
- Check that you have admin permissions

## Future Enhancements

Possible improvements:
- Add support for importing contact information if available in source Excel files
- Batch import API endpoint for better performance
- Rollback functionality in case of errors
- Import validation and duplicate detection on the server side
