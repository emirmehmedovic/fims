import puppeteer from 'puppeteer'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import QRCode from 'qrcode'
import fs from 'fs/promises'
import path from 'path'
import { formatDateSarajevo } from '@/lib/utils/date'
import { getDocumentLocation } from '@/lib/utils/pdf-helpers'

// Detect if running on Vercel/serverless
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME

interface TankMeasurement {
  tankNumber: string
  // Sonda - već očitava na 15°C, direktan unos
  initialSonde?: string
  finalSonde?: string
  // Letva - sirova vrijednost
  initialLetva?: string
  finalLetva?: string
  // Temperatura i faktor (za korekciju Letve)
  initialTemp?: string
  finalTemp?: string
  initialFactor?: string
  finalFactor?: string
  // Letva preračunato na 15°C
  initialLetva15?: string
  finalLetva15?: string
  // Old field names (for backwards compatibility with old data)
  initialSonde15?: string
  finalSonde15?: string
  initialLiters15Sonde?: string
  finalLiters15Sonde?: string
  initialLiters15Letva?: string
  finalLiters15Letva?: string
}

// Helper to get Sonda 15°C values
// NOTE: Sonda already reads at 15°C, so we use raw Sonda value directly
// For backwards compatibility, also check old field names
function getSonde15(m: TankMeasurement, type: 'initial' | 'final'): string {
  if (type === 'initial') {
    // New logic: Sonda is already at 15°C, use raw value
    // Fallback: check old field names for backwards compatibility
    return m.initialSonde || m.initialSonde15 || m.initialLiters15Sonde || ''
  }
  return m.finalSonde || m.finalSonde15 || m.finalLiters15Sonde || ''
}

function getLetva15(m: TankMeasurement, type: 'initial' | 'final'): string {
  if (type === 'initial') {
    return m.initialLetva15 || m.initialLiters15Letva || ''
  }
  return m.finalLetva15 || m.finalLiters15Letva || ''
}

function getSondeRaw(m: TankMeasurement, type: 'initial' | 'final'): string {
  if (type === 'initial') {
    return m.initialSonde || ''
  }
  return m.finalSonde || ''
}

function getLetvaRaw(m: TankMeasurement, type: 'initial' | 'final'): string {
  if (type === 'initial') {
    return m.initialLetva || ''
  }
  return m.finalLetva || ''
}

interface WeighingData {
  tara: string
  neto: string
  bruto: string
  specificWeight: string
  tempOnTanker: string
  litersWithCorrection: string
  deliveryNoteWeight: string
  weightDifference: string
}

// Interface accepts both parsed types and raw JSON (for Prisma compatibility)
interface FuelReceiptRecordData {
  id: string
  tankerRegistration?: string | null
  tankMeasurements: TankMeasurement[] | unknown
  announcedQuantity: number | null
  dischargedQuantity: number | null
  differenceQuantity: number | null
  meterReading: number | null
  deliveryNoteQuantity: number | null
  finalDifference: number | null
  hasDeliveryNote: boolean
  hasQualityCertificate: boolean
  hasComplianceDeclaration: boolean
  isWaterMeasured: boolean
  hasWaterInTank: boolean
  isVisualInspectionDone: boolean
  hasAdditives: boolean
  isLastUnload: boolean
  isTankCheckedAfterLastUnload: boolean
  fuelFoundOnLastUnload: string | null
  hasWeighing: boolean
  weighingData: WeighingData | unknown | null
  // Allow additional fields from Prisma
  [key: string]: unknown
}

// Interface for fuel entry data used in Zapisnik PDF generation
// Compatible with Prisma query results (includes optional id fields on relations)
interface FuelEntryData {
  id: string
  registrationNumber: number
  declarationNumber?: string | null
  entryDate: Date
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: Date | null
  driverName: string | null
  vehicleRegistration: string | null
  transporter: {
    id?: string
    name: string
    code: string
  } | null
  warehouse: {
    id?: string
    code: string
    name: string
    location?: string | null
  } | null
  station: {
    id?: string
    name: string
    code: string
    address: string
    city?: string | null
  } | null
  receiptRecord: FuelReceiptRecordData | null
  // Allow additional fields from Prisma that we don't use
  [key: string]: unknown
}

async function loadImageAsBase64(imagePath: string): Promise<string> {
  try {
    const fullPath = path.join(process.cwd(), 'public', imagePath)
    const imageBuffer = await fs.readFile(fullPath)
    const ext = path.extname(imagePath).toLowerCase().replace('.', '')
    const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`
  } catch (error) {
    console.error(`Error loading image ${imagePath}:`, error)
    return ''
  }
}

async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    return qrDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    return ''
  }
}

function generateTankRows(measurements: TankMeasurement[]): string {
  if (!measurements || measurements.length === 0) {
    return `
      <tr>
        <td class="tank-label" colspan="6">Nema unesenih mjerenja rezervoara</td>
      </tr>
    `
  }

  let rows = ''
  for (const m of measurements) {
    const tankLabel = m.tankNumber || 'R1'

    // Sonda already reads at 15°C - use raw value directly
    const initialSonde = getSonde15(m, 'initial') || '-'
    const finalSonde = getSonde15(m, 'final') || '-'

    // Letva raw value
    const initialLetvaRaw = getLetvaRaw(m, 'initial') || '-'
    const finalLetvaRaw = getLetvaRaw(m, 'final') || '-'

    // Letva at 15°C (calculated)
    const initialLetva15 = getLetva15(m, 'initial') || '-'
    const finalLetva15 = getLetva15(m, 'final') || '-'

    rows += `
      <tr class="tank-header-row">
        <td colspan="6"><span class="tank-badge">${tankLabel}</span></td>
      </tr>
      <tr class="column-header-row">
        <td class="col-label"></td>
        <td class="col-header highlight">Sonda (L) 15°C</td>
        <td class="col-header">Letva (L)</td>
        <td class="col-header">Temp (°C)</td>
        <td class="col-header">Faktor</td>
        <td class="col-header highlight">Letva 15°C</td>
      </tr>
      <tr class="data-row">
        <td class="row-label">POČETNO STANJE</td>
        <td class="highlight-cell">${initialSonde}</td>
        <td>${initialLetvaRaw}</td>
        <td>${m.initialTemp || '15'}</td>
        <td>${m.initialFactor || '1'}</td>
        <td class="highlight-cell">${initialLetva15}</td>
      </tr>
      <tr class="data-row">
        <td class="row-label">ZAVRŠNO STANJE</td>
        <td class="highlight-cell">${finalSonde}</td>
        <td>${finalLetvaRaw}</td>
        <td>${m.finalTemp || '15'}</td>
        <td>${m.finalFactor || '1'}</td>
        <td class="highlight-cell">${finalLetva15}</td>
      </tr>
    `
  }

  return rows
}

function generateZapisnikTemplate(
  entry: FuelEntryData,
  headerBase64: string,
  footerBase64: string,
  qrCodeDataUrl: string
): string {
  const record = entry.receiptRecord
  const measurements = (record?.tankMeasurements || []) as TankMeasurement[]

  // Calculate totals for Sonda and Letva at 15°C
  let totalDischargedSonda15 = 0
  let totalDischargedLetva15 = 0

  for (const m of measurements) {
    const initialSonda15 = parseInt(getSonde15(m, 'initial')) || 0
    const finalSonda15 = parseInt(getSonde15(m, 'final')) || 0
    const initialLetva15 = parseInt(getLetva15(m, 'initial')) || 0
    const finalLetva15 = parseInt(getLetva15(m, 'final')) || 0

    totalDischargedSonda15 += finalSonda15 - initialSonda15
    totalDischargedLetva15 += finalLetva15 - initialLetva15
  }

  const declarationDate = entry.deliveryNoteDate
    ? formatDateSarajevo(new Date(entry.deliveryNoteDate))
    : formatDateSarajevo(new Date())

  // Dynamic location based on warehouse/station
  const documentLocation = getDocumentLocation(entry.warehouse, entry.station)

  const announced = record?.announcedQuantity || 0
  const meter = record?.meterReading || 0
  const deliveryNote = record?.deliveryNoteQuantity || 0

  // Calculate differences (announced - discharged)
  const diffSonda15 = announced - totalDischargedSonda15
  const diffLetva15 = announced - totalDischargedLetva15

  // Final difference (delivery note - discharged) - use Letva as primary
  const finalDiffSonda = deliveryNote - totalDischargedSonda15
  const finalDiffLetva = deliveryNote - totalDischargedLetva15
  const isPositiveSonda = finalDiffSonda >= 0
  const isPositiveLetva = finalDiffLetva >= 0

  const prilogBroj = entry.declarationNumber || String(entry.registrationNumber)

  return `
<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8">
  <title>Zapisnik o prijemu goriva - ${entry.declarationNumber || entry.registrationNumber}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, sans-serif;
      font-size: 8px;
      line-height: 1.2;
      color: #000;
      background: white;
      width: 210mm;
      height: 297mm;
    }

    .page {
      width: 210mm;
      height: 297mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Header - full width */
    .header-container {
      width: 100%;
      flex-shrink: 0;
    }
    .header-image {
      width: 100%;
      height: auto;
      display: block;
    }

    /* Main content */
    .main-content {
      flex: 1;
      padding: 2mm 8mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Title */
    .prilog-broj {
      text-align: center;
      font-size: 9px;
      font-weight: 700;
      color: #000;
      margin-bottom: 1mm;
      text-transform: uppercase;
    }

    .document-title {
      text-align: center;
      margin-bottom: 2mm;
    }
    .document-title h1 {
      font-size: 12px;
      font-weight: 700;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 2px solid #000;
      padding: 1.5mm 4mm;
      display: inline-block;
    }

    /* Info grid */
    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      margin-bottom: 2mm;
      border: 1px solid #000;
    }

    .info-item {
      display: flex;
      align-items: center;
      padding: 1mm 2mm;
      border-bottom: 1px solid #ccc;
      border-right: 1px solid #ccc;
    }

    .info-item:nth-child(2n) {
      border-right: none;
    }

    .info-item:nth-last-child(-n+2) {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #333;
      font-size: 7px;
      text-transform: uppercase;
      min-width: 22mm;
    }

    .info-value {
      font-weight: 700;
      color: #000;
      font-size: 8px;
    }

    /* Tables - unified black & white style */
    .table-container {
      margin-bottom: 1.5mm;
      border: 1px solid #000;
      overflow: hidden;
    }

    .table-title {
      text-align: center;
      font-size: 8px;
      font-weight: 700;
      color: #000;
      text-transform: uppercase;
      padding: 1mm;
      background: #f0f0f0;
      border-bottom: 1px solid #000;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7px;
    }

    td, th {
      border: 1px solid #000;
      padding: 1mm;
      text-align: center;
    }

    .tank-header-row td {
      background: #f0f0f0;
      padding: 0.8mm;
      text-align: left;
      border-bottom: 1px solid #000;
    }

    .tank-badge {
      display: inline-block;
      background: #fff;
      color: #000;
      padding: 0.5mm 2mm;
      font-weight: 700;
      font-size: 7px;
      border: 1px solid #000;
    }

    .column-header-row td {
      background: #f0f0f0;
      font-weight: 700;
      font-size: 6px;
      text-transform: uppercase;
      color: #000;
      padding: 0.8mm;
    }

    .col-label {
      width: 20%;
    }

    .col-header {
      width: 16%;
    }

    .col-header.highlight {
      background: #e0e0e0 !important;
      font-weight: 700;
    }

    .data-row td {
      background: white;
    }

    .row-label {
      text-align: left !important;
      font-weight: 600;
      background: #f5f5f5 !important;
      font-size: 6px;
    }

    .highlight-cell {
      background: #f0f0f0 !important;
      font-weight: 700;
    }

    /* Calculations table */
    .calc-row td {
      font-weight: 600;
      padding: 1mm;
    }

    .calc-label {
      text-align: left !important;
      background: #f5f5f5 !important;
      width: 35%;
      font-size: 7px;
    }

    .calc-value {
      background: white;
    }

    .total-row td {
      background: #f0f0f0 !important;
      font-weight: 700;
      font-size: 8px;
      border-top: 2px solid #000;
    }

    .total-positive {
      background: #e0e0e0 !important;
    }

    .total-negative {
      background: #e0e0e0 !important;
    }

    .total-label {
      text-align: left !important;
    }

    /* Documentation checklist */
    .docs-section {
      margin: 1.5mm 0;
      border: 1px solid #000;
    }

    .docs-header {
      background: #f0f0f0;
      color: #000;
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1mm 2mm;
      border-bottom: 1px solid #000;
    }

    .docs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .docs-column {
      padding: 1.5mm 2mm;
    }

    .docs-column:first-child {
      border-right: 1px solid #000;
    }

    .doc-row {
      display: flex;
      align-items: center;
      padding: 1mm 0;
      font-size: 7px;
      border-bottom: 1px solid #ddd;
    }

    .doc-row:last-child {
      border-bottom: none;
    }

    .doc-checkbox {
      display: inline-block;
      width: 3.5mm;
      height: 3.5mm;
      border: 1px solid #000;
      margin-right: 1.5mm;
      text-align: center;
      line-height: 3mm;
      font-size: 9px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .doc-checkbox.checked {
      background: #000;
      color: #fff;
    }

    .doc-checkbox.unchecked {
      background: #fff;
    }

    .doc-label {
      flex: 1;
      font-size: 7px;
    }

    .doc-row.warning {
      font-weight: 700;
      background: #eee;
      padding: 1mm;
      border: 1px solid #000;
      margin: 0.5mm 0;
    }

    .doc-row.fuel-found {
      font-weight: 600;
      padding-left: 5mm;
    }

    /* Weighing section - compact inline */
    .weighing-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 1mm 3mm;
      padding: 1.5mm 2mm;
      font-size: 7px;
    }

    .weighing-inline span {
      white-space: nowrap;
    }

    .weighing-inline b {
      font-weight: 700;
    }

    /* Statement */
    .statement {
      margin: 1.5mm 0;
      padding: 1.5mm;
      border: 1px solid #000;
      font-size: 6px;
      text-align: justify;
      line-height: 1.3;
    }

    /* Signatures */
    .signature-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: auto;
      padding-top: 1.5mm;
    }

    .signature-box {
      width: 28%;
      text-align: center;
    }

    .signature-box.center-box {
      width: 20%;
    }

    .signature-line {
      border-bottom: 1px solid #000;
      height: 6mm;
      margin-bottom: 1mm;
    }

    .signature-label {
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .stamp-placeholder {
      width: 15mm;
      height: 15mm;
      border: 1px dashed #666;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      font-size: 7px;
      color: #666;
      font-weight: 600;
    }

    /* Bottom section */
    .bottom-section {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8mm;
      padding: 2mm 8mm;
      border-top: 1px solid #000;
      flex-shrink: 0;
    }

    .qr-box {
      text-align: center;
    }
    .qr-box img {
      width: 12mm;
      height: 12mm;
    }
    .qr-box .qr-label {
      font-size: 5px;
      color: #666;
      margin-top: 0.5mm;
    }

    .logo-box {
      text-align: center;
    }
    .logo-box img {
      height: 12mm;
      width: auto;
    }

    .date-box {
      text-align: center;
    }
    .date-label {
      font-size: 6px;
      color: #666;
    }
    .date-value {
      font-size: 8px;
      font-weight: 700;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header - Full Width -->
    <div class="header-container">
      <img src="${headerBase64}" alt="HIFA PETROL" class="header-image" />
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Prilog Broj -->
      <div class="prilog-broj">
        PRILOG BROJ ${prilogBroj}
      </div>

      <!-- Title -->
      <div class="document-title">
        <h1>ZAPISNIK O PRIJEMU GORIVA</h1>
      </div>

      <!-- Basic Info -->
      <div class="info-section">
        <div class="info-item">
          <span class="info-label">Broj otpremnice:</span>
          <span class="info-value">${entry.deliveryNoteNumber || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Datum:</span>
          <span class="info-value">${declarationDate}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Vozač:</span>
          <span class="info-value">${entry.driverName || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Prijevoznik:</span>
          <span class="info-value">${entry.transporter?.name || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Reg. oznaka vozila:</span>
          <span class="info-value">${entry.vehicleRegistration || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Reg. oznaka cisterne:</span>
          <span class="info-value">${record?.tankerRegistration || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Vrsta goriva:</span>
          <span class="info-value">${entry.productName}</span>
        </div>
      </div>

      <!-- Tank Measurements Table -->
      <div class="table-container">
        <div class="table-title">Mjerenja rezervoara</div>
        <table>
          <tbody>
            ${generateTankRows(measurements)}
          </tbody>
        </table>
      </div>

      <!-- Calculations Table -->
      <div class="table-container">
        <div class="table-title">Proračun količina</div>
        <table>
          <tbody>
            <tr class="column-header-row">
              <td class="col-label"></td>
              <td class="col-header">Sonda 15°C</td>
              <td class="col-header">Letva 15°C</td>
            </tr>
            <tr class="calc-row">
              <td class="calc-label">Najavljena količina</td>
              <td class="calc-value" colspan="2">${announced.toLocaleString()} L</td>
            </tr>
            <tr class="calc-row">
              <td class="calc-label">Količina istočenog goriva</td>
              <td class="calc-value">${totalDischargedSonda15.toLocaleString()} L</td>
              <td class="calc-value">${totalDischargedLetva15.toLocaleString()} L</td>
            </tr>
            <tr class="calc-row">
              <td class="calc-label">Razlika (najava - istočeno)</td>
              <td class="calc-value">${diffSonda15.toLocaleString()} L</td>
              <td class="calc-value">${diffLetva15.toLocaleString()} L</td>
            </tr>
            <tr class="calc-row">
              <td class="calc-label">Istočeno po brojčanicima</td>
              <td class="calc-value" colspan="2">${meter.toLocaleString()} L</td>
            </tr>
            <tr class="calc-row">
              <td class="calc-label">Otpremnica</td>
              <td class="calc-value" colspan="2">${deliveryNote.toLocaleString()} L</td>
            </tr>
            <tr class="total-row">
              <td class="total-label">KONAČNI MANJAK/VIŠAK</td>
              <td class="${isPositiveSonda ? 'total-positive' : 'total-negative'}">
                ${isPositiveSonda ? 'VIŠAK' : 'MANJAK'} ${Math.abs(finalDiffSonda).toLocaleString()} L
              </td>
              <td class="${isPositiveLetva ? 'total-positive' : 'total-negative'}">
                ${isPositiveLetva ? 'VIŠAK' : 'MANJAK'} ${Math.abs(finalDiffLetva).toLocaleString()} L
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Documentation Checklist -->
      <div class="docs-section">
        <div class="docs-header">Dokumentacija za preuzimanje od vozača</div>
        <div class="docs-grid">
          <div class="docs-column">
            <div class="doc-row">
              <span class="doc-checkbox ${record?.hasDeliveryNote ? 'checked' : 'unchecked'}">${record?.hasDeliveryNote ? '✓' : ''}</span>
              <span class="doc-label">Otpremnica</span>
            </div>
            <div class="doc-row">
              <span class="doc-checkbox ${record?.hasQualityCertificate ? 'checked' : 'unchecked'}">${record?.hasQualityCertificate ? '✓' : ''}</span>
              <span class="doc-label">Certifikat o kvalitetu</span>
            </div>
            <div class="doc-row">
              <span class="doc-checkbox ${record?.hasComplianceDeclaration ? 'checked' : 'unchecked'}">${record?.hasComplianceDeclaration ? '✓' : ''}</span>
              <span class="doc-label">Izjava o usklađenosti</span>
            </div>
            <div class="doc-row">
              <span class="doc-checkbox ${record?.isWaterMeasured ? 'checked' : 'unchecked'}">${record?.isWaterMeasured ? '✓' : ''}</span>
              <span class="doc-label">Voda mjerena u cisterni</span>
            </div>
            <div class="doc-row ${record?.hasWaterInTank ? 'warning' : ''}">
              <span class="doc-checkbox ${record?.hasWaterInTank ? 'checked' : 'unchecked'}">${record?.hasWaterInTank ? '✓' : ''}</span>
              <span class="doc-label">Voda u cisterni${record?.hasWaterInTank ? ' - OBUSTAVA istakanja!' : ''}</span>
            </div>
          </div>
          <div class="docs-column">
            <div class="doc-row">
              <span class="doc-checkbox ${record?.isVisualInspectionDone ? 'checked' : 'unchecked'}">${record?.isVisualInspectionDone ? '✓' : ''}</span>
              <span class="doc-label">Vizuelni pregled komore</span>
            </div>
            <div class="doc-row">
              <span class="doc-checkbox ${record?.hasAdditives ? 'checked' : 'unchecked'}">${record?.hasAdditives ? '✓' : ''}</span>
              <span class="doc-label">Aditiviranje</span>
            </div>
            <div class="doc-row">
              <span class="doc-checkbox ${record?.isLastUnload ? 'checked' : 'unchecked'}">${record?.isLastUnload ? '✓' : ''}</span>
              <span class="doc-label">Poslijednji istovar</span>
            </div>
            <div class="doc-row">
              <span class="doc-checkbox ${record?.isTankCheckedAfterLastUnload ? 'checked' : 'unchecked'}">${record?.isTankCheckedAfterLastUnload ? '✓' : ''}</span>
              <span class="doc-label">Provjera cisterne na zadnjem istovaru uočeno gorivo</span>
            </div>
            ${record?.fuelFoundOnLastUnload ? `
            <div class="doc-row fuel-found">
              <span class="doc-label">→ Istočena količina uočenog goriva: ${record.fuelFoundOnLastUnload} L</span>
            </div>
            ` : ''}
          </div>
        </div>
      </div>

      ${record?.hasWeighing && record?.weighingData ? (() => {
        const w = record.weighingData as WeighingData
        return `
      <!-- Weighing Section - Compact -->
      <div class="docs-section">
        <div class="docs-header">Ako je u blizini vaga - vaga se cisterna</div>
        <div class="weighing-inline">
          <span>Tara: <b>${w.tara || '-'}</b></span>
          <span>Bruto: <b>${w.bruto || '-'}</b></span>
          <span>Neto: <b>${w.neto || '-'}</b></span>
          <span>Spec. težina: <b>${w.specificWeight || '-'}</b></span>
          <span>Temp: <b>${w.tempOnTanker || '-'}</b>°C</span>
          <span>Litara s kor.: <b>${w.litersWithCorrection || '-'}</b></span>
          <span>Otpremnica: <b>${w.deliveryNoteWeight || '-'}</b></span>
          <span>Razlika: <b>${w.weightDifference || '-'}</b></span>
        </div>
      </div>
      `})() : ''}

      <!-- Statement -->
      <div class="statement">
        Potpisom ovog dokumenta izjavljujem da je procedura istovara u potpunosti ispoštovana i da su svi podaci
        navedeni na zapisniku provjereni i tačni, cisterna provjerena poslije zadnjeg istovara.
      </div>

      <!-- Signatures -->
      <div class="signature-area">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">PRIMALAC GORIVA</div>
        </div>

        <div class="signature-box center-box">
          <div class="stamp-placeholder">M.P.</div>
        </div>

        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">VOZAČ</div>
        </div>
      </div>
    </div>

    <!-- Bottom Section -->
    <div class="bottom-section">
      <div class="qr-box">
        ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR Code" /><div class="qr-label">Skeniraj za verifikaciju</div>` : ''}
      </div>
      <div class="date-box">
        <div class="date-label">${documentLocation},</div>
        <div class="date-value">${declarationDate}</div>
      </div>
      <div class="logo-box">
        <img src="${footerBase64}" alt="HIFA PETROL" />
      </div>
    </div>
  </div>
</body>
</html>
  `
}

export async function generateZapisnikPDF(entry: FuelEntryData): Promise<Buffer> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/verify/${entry.id}`

  // Load images as base64
  const [headerBase64, footerBase64, qrCodeDataUrl] = await Promise.all([
    loadImageAsBase64('hifa-header.png'),
    loadImageAsBase64('Screenshot_8.png'),
    generateQRCode(verificationUrl)
  ])

  const htmlContent = generateZapisnikTemplate(entry, headerBase64, footerBase64, qrCodeDataUrl)

  let browser

  if (isServerless) {
    // Vercel/Serverless: use puppeteer-core with @sparticuz/chromium-min
    const executablePath = await chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
    )
    browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: true,
    })
  } else {
    // Local/Private server: use regular puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }

  try {
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}
