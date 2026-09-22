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
  // Sonda (električna)
  initialSonde: string
  finalSonde: string
  // Letva (ručno mjerenje)
  initialLetva: string
  finalLetva: string
  // Temperatura i faktor
  initialTemp: string
  finalTemp: string
  initialFactor: string
  finalFactor: string
  // Izračunato na 15°C
  initialLiters15Sonde: string
  finalLiters15Sonde: string
  initialLiters15Letva: string
  finalLiters15Letva: string
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
        <td class="tank-label" colspan="7">Nema unesenih mjerenja rezervoara</td>
      </tr>
    `
  }

  let rows = ''
  for (const m of measurements) {
    const tankLabel = m.tankNumber || 'R1'

    rows += `
      <tr class="tank-header-row">
        <td colspan="7"><span class="tank-badge">${tankLabel}</span></td>
      </tr>
      <tr class="column-header-row">
        <td class="col-label"></td>
        <td class="col-header">Sonda (L)</td>
        <td class="col-header">Letva (L)</td>
        <td class="col-header">Temp (°C)</td>
        <td class="col-header">Faktor</td>
        <td class="col-header highlight">Sonda 15°C</td>
        <td class="col-header highlight">Letva 15°C</td>
      </tr>
      <tr class="data-row">
        <td class="row-label">POČETNO STANJE</td>
        <td>${m.initialSonde || '-'}</td>
        <td>${m.initialLetva || '-'}</td>
        <td>${m.initialTemp || '-'}</td>
        <td>${m.initialFactor || '-'}</td>
        <td class="highlight-cell">${m.initialLiters15Sonde || '-'}</td>
        <td class="highlight-cell">${m.initialLiters15Letva || '-'}</td>
      </tr>
      <tr class="data-row">
        <td class="row-label">ZAVRŠNO STANJE</td>
        <td>${m.finalSonde || '-'}</td>
        <td>${m.finalLetva || '-'}</td>
        <td>${m.finalTemp || '-'}</td>
        <td>${m.finalFactor || '-'}</td>
        <td class="highlight-cell">${m.finalLiters15Sonde || '-'}</td>
        <td class="highlight-cell">${m.finalLiters15Letva || '-'}</td>
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
    const initialSonda15 = parseInt(m.initialLiters15Sonde) || 0
    const finalSonda15 = parseInt(m.finalLiters15Sonde) || 0
    const initialLetva15 = parseInt(m.initialLiters15Letva) || 0
    const finalLetva15 = parseInt(m.finalLiters15Letva) || 0

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
      font-size: 9px;
      line-height: 1.3;
      color: #1a1a1a;
      background: white;
      width: 210mm;
      height: 297mm;
    }

    .page {
      width: 210mm;
      height: 297mm;
      display: flex;
      flex-direction: column;
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
      padding: 3mm 10mm;
      display: flex;
      flex-direction: column;
    }

    /* Title */
    .prilog-broj {
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 1.5mm;
      text-transform: uppercase;
    }

    .document-title {
      text-align: center;
      margin-bottom: 3mm;
    }
    .document-title h1 {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
      color: white;
      padding: 2mm 5mm;
      border-radius: 3px;
      display: inline-block;
    }

    /* Info grid */
    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5mm;
      margin-bottom: 3mm;
      background: #f8fafc;
      padding: 2mm;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    .info-item {
      display: flex;
      align-items: center;
      padding: 1mm 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .info-item:last-child,
    .info-item:nth-last-child(2) {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #64748b;
      font-size: 7px;
      text-transform: uppercase;
      min-width: 24mm;
    }

    .info-value {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 9px;
    }

    /* Tables */
    .table-container {
      margin-bottom: 2.5mm;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
      background: #f8fafc;
    }

    .table-title {
      text-align: center;
      font-size: 9px;
      font-weight: 700;
      color: #1e3a5f;
      text-transform: uppercase;
      padding: 1.5mm;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
    }

    td, th {
      border: 1px solid #cbd5e1;
      padding: 1.2mm 1.5mm;
      text-align: center;
    }

    .tank-header-row td {
      background: #f1f5f9;
      padding: 1mm;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .tank-badge {
      display: inline-block;
      background: #e2e8f0;
      color: #1e3a5f;
      padding: 0.8mm 2.5mm;
      border-radius: 2px;
      font-weight: 700;
      font-size: 8px;
      border: 1px solid #cbd5e1;
    }

    .column-header-row td {
      background: #f8fafc;
      font-weight: 600;
      font-size: 6.5px;
      text-transform: uppercase;
      color: #64748b;
      padding: 0.8mm;
      border-bottom: 1px solid #e2e8f0;
    }

    .col-label {
      width: 25%;
    }

    .col-header {
      width: 12.5%;
    }

    .col-header.highlight {
      background: #e2e8f0 !important;
      color: #1e3a5f;
      font-weight: 700;
    }

    .data-row td {
      background: white;
    }

    .row-label {
      text-align: left !important;
      font-weight: 600;
      background: #f8fafc !important;
      font-size: 7px;
      color: #64748b;
    }

    .highlight-cell {
      background: #f1f5f9 !important;
      font-weight: 700;
      color: #1e3a5f;
    }

    /* Calculations table */
    .calc-row td {
      font-weight: 600;
      padding: 1.5mm;
    }

    .calc-label {
      text-align: left !important;
      background: #f8fafc !important;
      width: 35%;
      font-size: 8px;
      color: #64748b;
    }

    .calc-value {
      background: white;
    }

    .calc-highlight {
      background: #f1f5f9 !important;
      color: #1e3a5f;
      font-weight: 700;
    }

    .total-row td {
      background: #f1f5f9 !important;
      font-weight: 700;
      font-size: 9px;
      border-top: 2px solid #e2e8f0;
    }

    .total-positive {
      background: #d1fae5 !important;
      color: #065f46 !important;
    }

    .total-negative {
      background: #fee2e2 !important;
      color: #991b1b !important;
    }

    .total-label {
      text-align: left !important;
      color: #1e3a5f;
    }

    /* Compact documentation section */
    .docs-compact {
      margin: 1.5mm 0;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 2px;
      padding: 1.5mm;
    }

    .docs-title {
      font-size: 7px;
      font-weight: 700;
      color: #1e3a5f;
      text-transform: uppercase;
      margin-bottom: 1mm;
    }

    .docs-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 1mm;
    }

    .doc-item {
      display: inline-flex;
      align-items: center;
      padding: 0.5mm 1.5mm;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 2px;
      font-size: 6px;
      color: #94a3b8;
    }

    .doc-item::before {
      content: '✗';
      margin-right: 1mm;
      color: #dc2626;
      font-size: 7px;
    }

    .doc-item.checked {
      background: #ecfdf5;
      border-color: #10b981;
      color: #065f46;
    }

    .doc-item.checked::before {
      content: '✓';
      color: #10b981;
    }

    .doc-item.warning {
      background: #fef2f2;
      border-color: #dc2626;
      color: #991b1b;
      font-weight: 600;
    }

    .doc-item.warning::before {
      content: '⚠';
      color: #dc2626;
    }

    .doc-item.fuel-found {
      background: #fffbeb;
      border-color: #f59e0b;
      color: #92400e;
      font-weight: 600;
    }

    .doc-item.fuel-found::before {
      content: '⛽';
    }

    /* Weighing inline */
    .weighing-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
      font-size: 7px;
      color: #374151;
    }

    .weighing-inline b {
      color: #1e3a5f;
    }

    /* Statement */
    .statement {
      margin: 1.5mm 0;
      padding: 1.5mm;
      border: 1px solid #1e3a5f;
      border-radius: 2px;
      font-size: 6.5px;
      text-align: justify;
      background: #f0f9ff;
      color: #1e3a5f;
      line-height: 1.3;
    }

    /* Signatures */
    .signature-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: auto;
      padding-top: 2mm;
    }

    .signature-box {
      width: 30%;
      text-align: center;
    }

    .signature-box.center-box {
      width: 25%;
    }

    .signature-line {
      border-bottom: 1px solid #1a1a1a;
      height: 8mm;
      margin-bottom: 1mm;
    }

    .signature-label {
      font-size: 7px;
      font-weight: 700;
      color: #1e3a5f;
      text-transform: uppercase;
    }

    .stamp-placeholder {
      width: 18mm;
      height: 18mm;
      border: 1px dashed #94a3b8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      font-size: 8px;
      color: #94a3b8;
      font-weight: 600;
    }

    /* Bottom section */
    .bottom-section {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10mm;
      padding: 2.5mm 10mm;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      flex-shrink: 0;
    }

    .qr-box {
      text-align: center;
    }
    .qr-box img {
      width: 16mm;
      height: 16mm;
    }
    .qr-box .qr-label {
      font-size: 5.5px;
      color: #64748b;
      margin-top: 0.5mm;
    }

    .logo-box {
      text-align: center;
    }
    .logo-box img {
      height: 16mm;
      width: auto;
      border-radius: 3px;
    }

    .date-box {
      text-align: center;
    }
    .date-label {
      font-size: 6.5px;
      color: #64748b;
    }
    .date-value {
      font-size: 9px;
      font-weight: 700;
      color: #1e3a5f;
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
          <span class="info-label">Reg. oznaka:</span>
          <span class="info-value">${entry.vehicleRegistration || '-'}</span>
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

      <!-- Documentation Checkboxes - Compact inline layout -->
      <div class="docs-compact">
        <div class="docs-title">Dokumentacija i provjere</div>
        <div class="docs-inline">
          <span class="doc-item ${record?.hasDeliveryNote ? 'checked' : ''}">Otpremnica</span>
          <span class="doc-item ${record?.hasQualityCertificate ? 'checked' : ''}">Certifikat</span>
          <span class="doc-item ${record?.hasComplianceDeclaration ? 'checked' : ''}">Izjava</span>
          <span class="doc-item ${record?.isWaterMeasured ? 'checked' : ''}">Voda mjerena</span>
          <span class="doc-item ${record?.hasWaterInTank ? 'warning' : ''}">Voda u cisterni${record?.hasWaterInTank ? ' ⚠' : ''}</span>
          <span class="doc-item ${record?.isVisualInspectionDone ? 'checked' : ''}">Vizuelni pregled</span>
          <span class="doc-item ${record?.hasAdditives ? 'checked' : ''}">Aditiviranje</span>
          <span class="doc-item ${record?.isLastUnload ? 'checked' : ''}">Zadnji istovar</span>
          <span class="doc-item ${record?.isTankCheckedAfterLastUnload ? 'checked' : ''}">Provjera cisterne</span>
          ${record?.fuelFoundOnLastUnload ? `<span class="doc-item fuel-found">Gorivo na zad. ist.: ${record.fuelFoundOnLastUnload} L</span>` : ''}
        </div>
      </div>

      ${record?.hasWeighing && record?.weighingData ? (() => {
        const w = record.weighingData as WeighingData
        return `
      <!-- Weighing Section - Compact -->
      <div class="docs-compact">
        <div class="docs-title">Vaganje cisterne</div>
        <div class="weighing-inline">
          <span>Tara: <b>${w.tara || '-'}</b> kg</span>
          <span>Bruto: <b>${w.bruto || '-'}</b> kg</span>
          <span>Neto: <b>${w.neto || '-'}</b> kg</span>
          <span>Spec.tež.: <b>${w.specificWeight || '-'}</b></span>
          <span>Temp: <b>${w.tempOnTanker || '-'}</b> °C</span>
          <span>L s kor.: <b>${w.litersWithCorrection || '-'}</b></span>
          <span>Otpr.: <b>${w.deliveryNoteWeight || '-'}</b> L</span>
          <span>Razl.: <b>${w.weightDifference || '-'}</b> L</span>
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
