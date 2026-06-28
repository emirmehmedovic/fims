import puppeteer from 'puppeteer'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import QRCode from 'qrcode'
import { PDFDocument } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'
import { formatDateSarajevo, formatDateTimeSarajevo } from '@/lib/utils/date'

// Detect if running on Vercel/serverless
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME

interface FuelEntryData {
  id: string
  registrationNumber: number
  declarationNumber?: string | null
  entryDate: Date
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: Date | null
  customsDeclarationNumber: string | null
  customsDeclarationDate: Date | null
  isHigherQuality: boolean
  improvedCharacteristics: string[]
  countryOfOrigin: string | null
  laboratoryName: string | null
  labAccreditationNumber: string | null
  testReportNumber: string | null
  testReportDate: Date | null
  orderOpenedBy: string | null
  pickupLocation: string | null
  driverName: string | null
  certificatePath: string | null
  warehouse: {
    name: string
    code: string
    location: string | null
  }
  operator: {
    name: string
    email: string
  }
  supplier: {
    name: string
    code: string
  } | null
  transporter: {
    name: string
    code: string
  } | null
  laboratory: {
    id: string
    name: string
    address: string | null
    accreditationNumber: string | null
  } | null
  createdAt: Date
}

const formatDate = (date: Date | null): string => {
  if (!date) return '-'
  return formatDateSarajevo(date)
}

const formatDateTime = (date: Date | null): string => {
  if (!date) return '-'
  return formatDateTimeSarajevo(date)
}

export async function generateQRCode(data: string): Promise<string> {
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

export function generatePDFTemplate(entry: FuelEntryData, qrCodeDataUrl: string, headerBase64: string, stampBase64: string, footerBase64: string): string {
  // Use delivery note date as the declaration date, fallback to today
  const declarationDate = entry.deliveryNoteDate
    ? formatDateSarajevo(entry.deliveryNoteDate)
    : formatDateSarajevo(new Date())

  // Format customs declaration or delivery note info (priority: customs first)
  let documentInfo = ''
  if (entry.customsDeclarationNumber && entry.customsDeclarationDate) {
    documentInfo = `${entry.customsDeclarationNumber}, ${formatDate(entry.customsDeclarationDate)}`
  } else if (entry.deliveryNoteNumber && entry.deliveryNoteDate) {
    documentInfo = `${entry.deliveryNoteNumber}, ${formatDate(entry.deliveryNoteDate)}`
  }

  // Fixed characteristics for higher quality fuel based on product type
  const productNameLower = entry.productName.toLowerCase()
  const isDiesel = productNameLower.includes('dizel') ||
                   productNameLower.includes('ulsd') ||
                   productNameLower.startsWith('ed ') ||
                   productNameLower === 'ed' ||
                   productNameLower.includes('bas en 590')
  const isBenzin = productNameLower.includes('benzin') ||
                   productNameLower.includes('bmb') ||
                   productNameLower.includes('bas en 228')

  let characteristicsBullets = ''
  if (entry.isHigherQuality) {
    if (isDiesel) {
      characteristicsBullets = `
      <ul style="margin: 0; padding-left: 5mm; list-style-type: disc;">
        <li>Poboljšana protočnost i funkcionalnost na niskim temperaturama</li>
        <li>Mirni rad motora</li>
        <li>Poboljšanje podmazivanja</li>
        <li>Obezbjeđena antikorozivna zaštita</li>
        <li>Antipenski efekat</li>
      </ul>`
    } else if (isBenzin) {
      characteristicsBullets = `
      <ul style="margin: 0; padding-left: 5mm; list-style-type: disc;">
        <li>Održavanje čistoće motora</li>
        <li>Brže i lakše pokretanje motora</li>
        <li>Smanjenje potrošnje</li>
        <li>Smanjenje emisije štetnih gasova</li>
      </ul>`
    }
  }

  return `
<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8">
  <title>Izjava o usklađenosti - ${entry.declarationNumber || entry.registrationNumber}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
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
      padding: 12mm 20mm;
    }

    /* Title */
    .document-title {
      text-align: center;
      margin-bottom: 6mm;
    }
    .document-title h1 {
      font-size: 14px;
      font-weight: 700;
      color: #000;
      text-transform: uppercase;
      line-height: 1.4;
      margin-bottom: 0;
    }

    /* Content */
    .content {
      flex: 1;
    }

    .field {
      margin-bottom: 1.5mm;
      line-height: 1.6;
    }

    .field-label {
      font-weight: 600;
      display: inline;
      color: #000;
    }

    .field-value {
      display: inline;
      font-weight: 400;
      color: #000;
    }

    .checkbox-field {
      margin: 3mm 0;
      padding: 2mm 0;
    }

    .checkbox {
      display: inline-block;
      width: 3.5mm;
      height: 3.5mm;
      border: 1.5px solid #000;
      margin-right: 2mm;
      vertical-align: middle;
      position: relative;
    }

    .checkbox.checked::after {
      content: '✓';
      position: absolute;
      top: -2mm;
      left: 0.3mm;
      font-size: 13px;
      font-weight: 700;
      color: #000;
    }

    .section-spacing {
      margin-top: 4mm;
    }

    .subsection {
      margin-left: 5mm;
      margin-top: 1mm;
    }

    .subsection ul {
      margin: 1mm 0 0 0;
      padding-left: 5mm;
      line-height: 1.5;
    }

    .subsection li {
      margin-bottom: 1mm;
      font-weight: 400;
      color: #000;
    }

    /* Declaration */
    .declaration {
      margin: 4mm 0;
      text-align: justify;
      line-height: 1.5;
    }

    /* Signature area */
    .signature-area {
      margin-top: 6mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .date-section {
      flex: 0 0 40%;
    }

    .signature-section {
      flex: 0 0 50%;
      text-align: right;
    }

    .signature-section img {
      width: 50mm;
      height: auto;
      margin-bottom: 2mm;
    }

    .signature-label {
      font-size: 10px;
      text-align: center;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Title -->
    <div class="document-title">
      <h1>IZJAVA O USKLAĐENOSTI SA STANDARDIMA<br>KVALITETA TEČNIH NAFTNIH GORIVA</h1>
      <div style="margin-top: 4mm; font-size: 13px; font-weight: 600;">BROJ: ${entry.declarationNumber || entry.registrationNumber}</div>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="field">
        <span class="field-label">Registracijski broj dobavljača:</span>
        <span class="field-value">${entry.supplier?.code || '-'}</span>
      </div>

      <div class="field">
        <span class="field-label">Matični broj dobavljača:</span>
        <span class="field-value">4200999090005</span>
      </div>

      <div class="field">
        <span class="field-label">Naziv dobavljača:</span>
        <span class="field-value">HIFA-PETROL d.o.o. Sarajevo</span>
      </div>

      <div class="field">
        <span class="field-label">Adresa dobavljača:</span>
        <span class="field-value">Hotonj bb</span>
      </div>

      <div class="field">
        <span class="field-label">Broj telefona/Fax/e-mail:</span>
        <span class="field-value">033/584 370, Fax: 033/584 482, email:info@hifapetrol.ba</span>
      </div>

      <div class="field">
        <span class="field-label">Mjesto sjedišta:</span>
        <span class="field-value">Hotonj bb, 71320 Vogošća</span>
      </div>

      <div class="field">
        <span class="field-label">Ime i prezime odgovorne osobe u pravnom licu:</span>
        <span class="field-value">Halid Kadrić, zamjenik direktora</span>
      </div>

      <div class="field section-spacing">
        <span class="field-label">Naziv proizvoda:</span>
        <span class="field-value">${entry.productName}</span>
      </div>

      <div class="field">
        <span class="field-label">Količina pošiljke:</span>
        <span class="field-value">${entry.quantity.toLocaleString()} L</span>
      </div>

      <div class="field">
        <span class="field-label">Broj otpremnice i datum ili broj carinske deklaracije i datum:</span>
        <span class="field-value">${documentInfo}</span>
      </div>

      <div class="checkbox-field section-spacing">
        <span class="checkbox ${entry.isHigherQuality ? 'checked' : ''}"></span>
        <span class="field-label">Tekuće naftno gorivo višeg kvalitetnog nivoa</span>
      </div>
${entry.isHigherQuality ? `
      <div class="field subsection">
        <span class="field-label">Poboljšane karakteristike:</span>
        ${characteristicsBullets}
      </div>` : ''}

      <div class="field section-spacing">
        <span class="field-label">Tečno naftno gorivo proizvedeno u:</span>
        <span class="field-value">${entry.countryOfOrigin || ''}</span>
      </div>

      <div class="field section-spacing">
        <span class="field-label">Tečno naftno gorivo je ispitano u akreditiranoj laboratoriji:</span>
        <span class="field-value">${entry.laboratory?.name || entry.laboratoryName || ''}</span>
      </div>

      <div class="field subsection">
        <span class="field-label">Naziv i sjedište laboratorije:</span>
        <span class="field-value">${entry.laboratory ? `${entry.laboratory.name}${entry.laboratory.address ? ', ' + entry.laboratory.address : ''}` : (entry.laboratoryName || '')}</span>
      </div>

      <div class="field subsection">
        <span class="field-label">Broj rješenja akreditacije laboratorije:</span>
        <span class="field-value">${entry.laboratory?.accreditationNumber || entry.labAccreditationNumber || ''}</span>
      </div>

      <div class="field subsection">
        <span class="field-label">Broj i datum izvještaja o ispitivanju:</span>
        <span class="field-value">${entry.testReportNumber || ''}${entry.testReportDate ? ', ' + formatDate(entry.testReportDate) : ''}</span>
      </div>

      <!-- Declaration -->
      <div class="declaration section-spacing">
        Pod punom materijalnom i krivičnom odgovornošću izjavljujem da tečno naftno gorivo,
        na koje se odnosi ova izjava, odgovara kvalitetu i graničnim vrijednostima definiranim
        Odlukom o kvalitetu tečnih naftnih goriva („Službeni glasnik BiH", broj: 10/24).
      </div>

      <!-- Signature Area -->
      <div class="signature-area">
        <div class="date-section">
          <div>U Sarajevu</div>
          <div>Dana ${declarationDate}</div>
        </div>

        <div class="signature-section">
          <img src="${stampBase64}" alt="Pečat i potpis" />
          <div class="signature-label">Zamjenik direktora</div>
        </div>
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

// Helper function to create browser instance
async function createBrowser() {
  if (isServerless) {
    const executablePath = await chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
    )
    return await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: true,
    })
  } else {
    return await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
}

// OPTIMIZED: Accepts optional browser instance for reuse
export async function generatePDF(
  entry: FuelEntryData,
  browserInstance?: any
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

  const htmlContent = generatePDFTemplate(entry, qrCodeDataUrl, headerBase64, stampBase64, footerBase64)

  // Use provided browser or create new one
  const browser = browserInstance || await createBrowser()
  const shouldCloseBrowser = !browserInstance // Only close if we created it

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

    await page.close() // Always close the page
    return Buffer.from(pdfBuffer)
  } finally {
    if (shouldCloseBrowser) {
      await browser.close()
    }
  }
}

export async function mergePDFs(mainPdfBuffer: Buffer, certificatePath: string | null): Promise<Buffer> {
  if (!certificatePath) {
    return mainPdfBuffer
  }

  try {
    // Remove leading slash from certificatePath to avoid path.join issues
    const cleanPath = certificatePath.startsWith('/') ? certificatePath.slice(1) : certificatePath
    // Check if certificate file exists
    const fullPath = path.join(process.cwd(), 'public', cleanPath)
    console.log('[PDF] Attempting to merge certificate from:', fullPath)
    await fs.access(fullPath)

    // Check if certificate is a PDF
    if (!cleanPath.toLowerCase().endsWith('.pdf')) {
      // For non-PDF files (images), just return the main PDF
      console.log('[PDF] Certificate is not a PDF, skipping merge')
      return mainPdfBuffer
    }

    console.log('[PDF] Reading certificate file...')
    const certificateBytes = await fs.readFile(fullPath)
    
    const mainPdf = await PDFDocument.load(mainPdfBuffer)
    const certificatePdf = await PDFDocument.load(certificateBytes)
    
    const copiedPages = await mainPdf.copyPages(
      certificatePdf,
      certificatePdf.getPageIndices()
    )
    
    copiedPages.forEach(page => {
      mainPdf.addPage(page)
    })
    
    const mergedPdfBytes = await mainPdf.save()
    return Buffer.from(mergedPdfBytes)
  } catch (error) {
    console.error('Error merging PDFs:', error)
    // If merge fails, return the main PDF
    return mainPdfBuffer
  }
}

// OPTIMIZED: Accepts optional browser instance for bulk operations
export async function generateFuelEntryPDF(
  entry: FuelEntryData,
  includeCertificate: boolean = true,
  browserInstance?: any
): Promise<Buffer> {
  const mainPdf = await generatePDF(entry, browserInstance)

  if (includeCertificate && entry.certificatePath) {
    return await mergePDFs(mainPdf, entry.certificatePath)
  }

  return mainPdf
}

// Helper to create shared browser for bulk operations
export async function createSharedBrowser() {
  return await createBrowser()
}
