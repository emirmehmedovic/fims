import puppeteer from 'puppeteer'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import QRCode from 'qrcode'
import fs from 'fs/promises'
import path from 'path'
import { formatDateSarajevo, formatDateTimeSarajevo } from '@/lib/utils/date'

// Detect if running on Vercel/serverless
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME

interface AdditiveDetail {
  name: string
  addedAt: string
  quantity: string
}

interface FuelCharacteristic {
  id: string
  name: string
  description: string | null
  manufacturers: string[]
  type: string | null
}

interface FuelEntryAdditiveData {
  id: string
  registrationNumber: number
  declarationNumber?: string | null
  entryDate: Date
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: Date | null
  vehicleRegistration: string | null
  additiveDetails: AdditiveDetail[]
  warehouse: {
    name: string
    code: string
    location: string | null
  }
  operator: {
    name: string
    email: string
  }
  client: {
    name: string
    code: string | null
  } | null
  station: {
    id: string
    name: string
    code: string
    address: string
  } | null
  createdAt: Date
}

const formatDate = (date: Date | null): string => {
  if (!date) return '-'
  return formatDateSarajevo(date)
}

const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return '-'
  return formatDateTimeSarajevo(dateTimeString)
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

function convertMgKgToMlM3(mgKg: number): number {
  // Convert mg/kg to ml/m³ for diesel fuel
  // Formula: ml/m³ = (mg/kg × fuel_density_kg/L) / 1000
  // Diesel density ≈ 0.85 kg/L
  const fuelDensity = 0.85
  return (mgKg * fuelDensity) / 1000
}

// Normalize function to remove special characters for comparison
const normalizeName = (name: string) =>
  name.replace(/[®™©]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

function generateAdditiveTableRows(
  entry: FuelEntryAdditiveData,
  additives: FuelCharacteristic[]
): string {
  // For now, use the first additive detail (can be extended to handle multiple)
  const detail = entry.additiveDetails[0]
  const normalizedDetailName = normalizeName(detail.name)

  // Find additive using normalized name comparison
  const additive = additives.find(a => {
    const normalizedDbName = normalizeName(a.name)
    return normalizedDbName === normalizedDetailName ||
           normalizedDbName.includes(normalizedDetailName) ||
           normalizedDetailName.includes(normalizedDbName)
  })

  console.log('[PDF Generator] Looking for:', detail.name, '-> Found:', additive?.name || 'NOT FOUND')

  const manufacturers = additive?.manufacturers?.join(', ') || '-'

  // Determine if product is diesel or benzin for fixed characteristics
  const productNameLower = entry.productName.toLowerCase()
  const isDiesel = productNameLower.includes('dizel') ||
                   productNameLower.includes('ulsd') ||
                   productNameLower.startsWith('ed ') ||
                   productNameLower === 'ed' ||
                   productNameLower.includes('bas en 590')
  const isBenzin = productNameLower.includes('benzin') ||
                   productNameLower.includes('bmb') ||
                   productNameLower.includes('bas en 228')

  // Fixed characteristics based on fuel type, with additive name at the top
  const additiveName = detail.name
  let propertiesHtml = ''
  if (isDiesel) {
    propertiesHtml = `
      <div><strong>${additiveName}</strong></div>
      <div>- Poboljšana protočnost i funkcionalnost na niskim temperaturama</div>
      <div>- Mirni rad motora</div>
      <div>- Poboljšanje podmazivanja</div>
      <div>- Obezbjeđena antikorozivna zaštita</div>
      <div>- Antipenski efekat</div>
    `
  } else if (isBenzin) {
    propertiesHtml = `
      <div><strong>${additiveName}</strong></div>
      <div>- Održavanje čistoće motora</div>
      <div>- Brže i lakše pokretanje motora</div>
      <div>- Smanjenje potrošnje</div>
      <div>- Smanjenje emisije štetnih gasova</div>
    `
  } else {
    // Fallback to additive description if fuel type not recognized
    const properties = additive?.description
      ? additive.description.split('\n').map(prop => prop.trim()).filter(Boolean)
      : []
    propertiesHtml = `<div><strong>${additiveName}</strong></div>` + (properties.length > 0
      ? properties.map(prop => `<div>- ${prop}</div>`).join('')
      : '')
  }

  return `
    <tr>
      <td class="row-number">1</td>
      <td class="row-label">DATUM I VRIJEME ADITIVIRANJA</td>
      <td class="row-value">${formatDateTime(detail.addedAt)}</td>
    </tr>
    <tr>
      <td class="row-number">2</td>
      <td class="row-label">POSLOVNA JEDINICA</td>
      <td class="row-value">${entry.station ? `${entry.station.name}, ${entry.station.address}` : '-'}</td>
    </tr>
    <tr>
      <td class="row-number">3</td>
      <td class="row-label">BROJ OTPREMNICE</td>
      <td class="row-value">${entry.deliveryNoteNumber || '-'}</td>
    </tr>
    <tr>
      <td class="row-number">4</td>
      <td class="row-label">REG. OZNAKA VOZILA</td>
      <td class="row-value">${entry.vehicleRegistration || '-'}</td>
    </tr>
    <tr>
      <td class="row-number">5</td>
      <td class="row-label">VRSTA GORIVA</td>
      <td class="row-value">${entry.productName}</td>
    </tr>
    <tr>
      <td class="row-number">6</td>
      <td class="row-label">KOLIČINA GORIVA</td>
      <td class="row-value">${entry.quantity.toLocaleString()}</td>
    </tr>
    <tr>
      <td class="row-number">7</td>
      <td class="row-label">NAZIV I SVOJSTVA ADITIVA</td>
      <td class="row-value properties-cell">${propertiesHtml}</td>
    </tr>
    <tr>
      <td class="row-number">8</td>
      <td class="row-label">PROIZVOĐAČ ADITIVA</td>
      <td class="row-value">${manufacturers}</td>
    </tr>
    <tr>
      <td class="row-number">9</td>
      <td class="row-label">VRSTA ADITIVA</td>
      <td class="row-value">${additive?.name || detail.name}</td>
    </tr>
    <tr>
      <td class="row-number">10</td>
      <td class="row-label">KOLIČINA DODANOG ADITIVA</td>
      <td class="row-value">${detail.quantity}</td>
    </tr>
  `
}

// Fixed additive dosage values (ml/m³)
const ADDITIVE_DOSAGES: Record<string, { mlM3: number }> = {
  'hitec 46014 fuel additive': { mlM3: 0.000115 },
  'hitec 66105 fuel additive': { mlM3: 0.000264 }
}

function convertMlM3ToMgKg(mlM3: number): number {
  // Reverse formula: mg/kg = (ml/m³ × 1000) / fuel_density
  const fuelDensity = 0.85
  return (mlM3 * 1000) / fuelDensity
}

function generateAdditiveFormulas(
  entry: FuelEntryAdditiveData,
  additives: FuelCharacteristic[]
): string {
  // Use the first additive detail
  const detail = entry.additiveDetails[0]
  const normalizedDetailName = normalizeName(detail.name)

  // Find matching additive
  const additive = additives.find(a => {
    const normalizedDbName = normalizeName(a.name)
    return normalizedDbName === normalizedDetailName ||
           normalizedDbName.includes(normalizedDetailName) ||
           normalizedDetailName.includes(normalizedDbName)
  })

  const additiveName = additive?.name || detail.name

  // Look up fixed dosage based on normalized name
  const dosageKey = Object.keys(ADDITIVE_DOSAGES).find(key =>
    normalizedDetailName.includes(key) || key.includes(normalizedDetailName)
  )

  let quantityMlM3: number
  let quantityMgKg: number

  if (dosageKey) {
    // Use fixed values
    quantityMlM3 = ADDITIVE_DOSAGES[dosageKey].mlM3
    quantityMgKg = convertMlM3ToMgKg(quantityMlM3)
  } else {
    // Fallback to user-entered quantity
    quantityMgKg = parseFloat(detail.quantity) || 0
    quantityMlM3 = convertMgKgToMlM3(quantityMgKg)
  }

  return `
    <p class="formula-text">
      Prema preporuci proizvođača aditiv <strong>${additiveName}</strong> dodaje se u omjeru
      <strong>${quantityMgKg.toFixed(6)} mg/kg</strong> ili <strong>${quantityMlM3.toFixed(6)} ml/m³</strong>.
    </p>
  `
}

function generateAdditiveDeclarationTemplate(
  entry: FuelEntryAdditiveData,
  additives: FuelCharacteristic[],
  qrCodeDataUrl: string,
  headerBase64: string,
  stampBase64: string,
  footerBase64: string
): string {
  // Use delivery note date like regular declaration, fallback to current date
  const declarationDate = entry.deliveryNoteDate
    ? formatDateSarajevo(new Date(entry.deliveryNoteDate))
    : formatDateSarajevo(new Date())

  // Use declaration number like regular declaration
  const prilogBroj = entry.declarationNumber || String(entry.registrationNumber)

  return `
<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8">
  <title>Izjava o aditiviranju - ${entry.registrationNumber}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.3;
      color: #1a1a1a;
      background: white;
      width: 210mm;
      height: 297mm;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      display: flex;
      flex-direction: column;
    }

    /* Header - full width edge to edge */
    .header-container {
      width: 100%;
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
      font-size: 12px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 3mm;
      text-transform: uppercase;
    }

    .document-title {
      text-align: center;
      margin-bottom: 3mm;
    }
    .document-title h1 {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .registration-badge {
      display: inline-block;
      background: #1a1a1a;
      color: white;
      padding: 4px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 3mm;
    }

    /* Table */
    .table-container {
      margin: 3mm 0;
      border: 2px solid #1a1a1a;
    }

    .table-title {
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      padding: 2mm;
      background: white;
      border-bottom: 2px solid #1a1a1a;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }

    td {
      padding: 2mm 3mm;
      border: 1px solid #1a1a1a;
      vertical-align: top;
    }

    .row-number {
      width: 8mm;
      text-align: center;
      font-weight: 700;
      background: white;
    }

    .row-label {
      width: 50mm;
      font-weight: 600;
      text-transform: uppercase;
      background: white;
      font-size: 9px;
    }

    .row-value {
      background: white;
      font-weight: 500;
    }

    .properties-cell {
      font-size: 9px;
      line-height: 1.4;
    }

    .properties-cell div {
      margin-bottom: 1mm;
    }

    .properties-cell div:last-child {
      margin-bottom: 0;
    }

    /* Formula Section */
    .formula-section {
      padding: 4mm 0;
      margin: 4mm 0;
    }

    .formula-text {
      font-size: 11px;
      line-height: 1.8;
      color: #1a1a1a;
      text-align: left;
      margin-bottom: 2mm;
    }

    .formula-text:last-child {
      margin-bottom: 0;
    }

    /* Signature area */
    .signature-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: auto;
      padding-top: 3mm;
      border-top: 1px solid #eee;
    }

    .date-section {
      flex: 0 0 30%;
    }
    .date-label {
      font-size: 10px;
      color: #666;
    }
    .date-value {
      font-size: 12px;
      font-weight: 600;
      margin-top: 2mm;
    }

    .stamp-section {
      flex: 0 0 45%;
      text-align: right;
    }
    .stamp-section img {
      width: 60mm;
      height: auto;
    }
    .stamp-label {
      font-size: 10px;
      color: #666;
      margin-top: 2mm;
    }

    /* Bottom section - QR and Logo side by side */
    .bottom-section {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10mm;
      padding: 3mm 10mm;
      border-top: 1px solid #eee;
    }

    .qr-box {
      text-align: center;
    }
    .qr-box img {
      width: 20mm;
      height: 20mm;
    }
    .qr-box .qr-label {
      font-size: 7px;
      color: #888;
      margin-top: 1mm;
    }

    .logo-box {
      text-align: center;
    }
    .logo-box img {
      height: 20mm;
      width: auto;
      border-radius: 5px;
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

      <!-- Table -->
      <div class="table-container">
        <div class="table-title">IZJAVA O ADITIVIMA</div>
        <table>
          <tbody>
            ${generateAdditiveTableRows(entry, additives)}
          </tbody>
        </table>
      </div>

      <!-- Formula Section -->
      <div class="formula-section">
        ${generateAdditiveFormulas(entry, additives)}
      </div>

      <!-- Signature Area -->
      <div class="signature-area">
        <div class="date-section">
          <div class="date-label">U Sarajevu,</div>
          <div class="date-value">${declarationDate}</div>
        </div>

        <div class="stamp-section">
          <img src="${stampBase64}" alt="Pečat i potpis" />
          <div class="stamp-label">Potpis odgovorne osobe</div>
        </div>
      </div>
    </div>

    <!-- Bottom Section - QR and Logo side by side -->
    <div class="bottom-section">
      <div class="qr-box">
        ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR Code" /><div class="qr-label">Skeniraj za verifikaciju</div>` : ''}
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

export async function generateAdditiveDeclarationPDF(
  entry: FuelEntryAdditiveData,
  additives: FuelCharacteristic[]
): Promise<Buffer> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/verify/${entry.id}`

  // Load images as base64
  const [qrCodeDataUrl, headerBase64, stampBase64, footerBase64] = await Promise.all([
    generateQRCode(verificationUrl),
    loadImageAsBase64('hifa-header.png'),
    loadImageAsBase64('pecat.png'),
    loadImageAsBase64('Screenshot_8.png')
  ])

  const htmlContent = generateAdditiveDeclarationTemplate(
    entry,
    additives,
    qrCodeDataUrl,
    headerBase64,
    stampBase64,
    footerBase64
  )

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
