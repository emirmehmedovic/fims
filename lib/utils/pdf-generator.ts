import puppeteer from 'puppeteer'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import QRCode from 'qrcode'
import { PDFDocument } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

// Detect if running on Vercel/serverless
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME

interface FuelEntryData {
  id: string
  registrationNumber: number
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
  createdAt: Date
}

const formatDate = (date: Date | null): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateTime = (date: Date | null): string => {
  if (!date) return '-'
  return new Date(date).toLocaleString('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  const currentDate = new Date().toLocaleDateString('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return `
<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8">
  <title>Izjava o usklađenosti - ${entry.registrationNumber}</title>
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
      height: 297mm;
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
    .characteristics-tag {
      background: #e0e0e0;
      color: #1a1a1a;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 9px;
      margin-right: 3px;
      display: inline-block;
      margin-top: 2px;
    }
    
    /* Sections grid */
    .sections-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2mm;
      margin-bottom: 2mm;
    }
    
    .section {
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 3px;
      padding: 2mm;
    }
    
    .section-title {
      font-size: 10px;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      margin-bottom: 1.5mm;
      padding-bottom: 1mm;
      border-bottom: 1px solid #ddd;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1mm;
      align-items: center;
    }
    .info-label {
      font-size: 10px;
      color: #555;
    }
    .info-value {
      font-size: 11px;
      color: #1a1a1a;
      font-weight: 500;
      text-align: right;
    }
    .info-value.highlight {
      color: #1a1a1a;
      font-weight: 700;
      font-size: 12px;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
    }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-info { background: #e2e3e5; color: #383d41; }
    
    /* Declaration */
    .declaration {
      background: #f5f5f5;
      border: 2px solid #1a1a1a;
      border-radius: 4px;
      padding: 4mm;
      margin: 4mm 0;
    }
    .declaration-text {
      font-size: 12px;
      line-height: 1.6;
      color: #1a1a1a;
      text-align: justify;
      font-weight: 500;
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
      width: 45mm;
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
      <!-- Title -->
      <div class="document-title">
        <h1>Izjava o usklađenosti</h1>
        <div class="registration-badge">Registarski broj: ${entry.registrationNumber}</div>
      </div>

      <!-- Sections Grid -->
      <div class="sections-grid">
        <!-- Osnovne informacije -->
        <div class="section">
          <div class="section-title">Osnovne informacije</div>
          <div class="info-row">
            <span class="info-label">Datum ulaza:</span>
            <span class="info-value">${formatDate(entry.entryDate)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Skladište:</span>
            <span class="info-value">${entry.warehouse.code} - ${entry.warehouse.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Naziv proizvoda:</span>
            <span class="info-value highlight">${entry.productName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Količina:</span>
            <span class="info-value highlight">${entry.quantity.toLocaleString()} L</span>
          </div>
          <div class="info-row">
            <span class="info-label">Zemlja porijekla:</span>
            <span class="info-value">${entry.countryOfOrigin || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Viša kvaliteta:</span>
            <span class="info-value">${entry.isHigherQuality ? '<span class="badge badge-success">Da</span>' : '<span class="badge badge-info">Ne</span>'}</span>
          </div>
          ${entry.isHigherQuality && entry.improvedCharacteristics.length > 0 ? `
          <div class="info-row" style="flex-wrap: wrap;">
            <span class="info-label">Karakteristike:</span>
            <span class="info-value" style="flex: 1; text-align: right;">
              ${entry.improvedCharacteristics.map(char => `<span class="characteristics-tag">${char}</span>`).join('')}
            </span>
          </div>
          ` : ''}
        </div>

        <!-- Dokumentacija -->
        <div class="section">
          <div class="section-title">Dokumentacija</div>
          <div class="info-row">
            <span class="info-label">Broj otpremnice:</span>
            <span class="info-value">${entry.deliveryNoteNumber || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Datum otpremnice:</span>
            <span class="info-value">${formatDate(entry.deliveryNoteDate)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Broj carinske dekl.:</span>
            <span class="info-value">${entry.customsDeclarationNumber || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Datum carinske dekl.:</span>
            <span class="info-value">${formatDate(entry.customsDeclarationDate)}</span>
          </div>
        </div>

        <!-- Laboratorij -->
        <div class="section">
          <div class="section-title">Laboratorijske informacije</div>
          <div class="info-row">
            <span class="info-label">Naziv laboratorije:</span>
            <span class="info-value">${entry.laboratoryName || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Broj akreditacije:</span>
            <span class="info-value">${entry.labAccreditationNumber || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Broj izvještaja:</span>
            <span class="info-value">${entry.testReportNumber || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Datum izvještaja:</span>
            <span class="info-value">${formatDate(entry.testReportDate)}</span>
          </div>
        </div>

        <!-- Transport -->
        <div class="section">
          <div class="section-title">Dobavljač i transport</div>
          <div class="info-row">
            <span class="info-label">Dobavljač:</span>
            <span class="info-value">${entry.supplier?.name || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Prevoznik:</span>
            <span class="info-value">${entry.transporter?.name || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Vozač:</span>
            <span class="info-value">${entry.driverName || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Lokacija preuzimanja:</span>
            <span class="info-value">${entry.pickupLocation || '-'}</span>
          </div>
        </div>
      </div>

      <!-- Evidencija - full width -->
      <div class="section">
        <div class="section-title">Evidencija</div>
        <div style="display: flex; gap: 8mm;">
          <div style="flex: 1;">
            <div class="info-row">
              <span class="info-label">Operator:</span>
              <span class="info-value">${entry.operator.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Narudžbu otvorio:</span>
              <span class="info-value">${entry.orderOpenedBy || '-'}</span>
            </div>
          </div>
          <div style="flex: 1;">
            <div class="info-row">
              <span class="info-label">Datum kreiranja:</span>
              <span class="info-value">${formatDateTime(entry.createdAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Certifikat:</span>
              <span class="info-value">${entry.certificatePath ? '<span class="badge badge-success">Priložen</span>' : '<span class="badge badge-info">Nije priložen</span>'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Declaration -->
      <div class="declaration">
        <p class="declaration-text">
          Pod punom materijalnom i krivičnom odgovornošću izjavljujem da tečno naftno gorivo, 
          na koje se odnosi ova izjava, odgovara kvalitetu i graničnim vrijednostima definiranim 
          Odlukom o kvalitetu tečnih naftnih goriva ("Službeni glasnik BiH", broj: 10/24).
        </p>
      </div>

      <!-- Signature Area -->
      <div class="signature-area">
        <div class="date-section">
          <div class="date-label">U Sarajevu,</div>
          <div class="date-value">${currentDate}</div>
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

export async function generatePDF(entry: FuelEntryData): Promise<Buffer> {
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

  let browser
  
  if (isServerless) {
    // Vercel/Serverless: use puppeteer-core with @sparticuz/chromium
    // Use external chromium from CDN for Vercel
    const executablePath = await chromium.executablePath(
      'https://github.com/nicholasgriffintn/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
    )
    browser = await puppeteerCore.launch({
      args: [...chromium.args, '--disable-gpu', '--disable-dev-shm-usage'],
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

export async function mergePDFs(mainPdfBuffer: Buffer, certificatePath: string | null): Promise<Buffer> {
  if (!certificatePath) {
    return mainPdfBuffer
  }

  try {
    // Check if certificate file exists
    const fullPath = path.join(process.cwd(), 'public', certificatePath)
    await fs.access(fullPath)

    // Check if certificate is a PDF
    if (!certificatePath.toLowerCase().endsWith('.pdf')) {
      // For non-PDF files (images), just return the main PDF
      return mainPdfBuffer
    }

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

export async function generateFuelEntryPDF(entry: FuelEntryData, includeCertificate: boolean = true): Promise<Buffer> {
  const mainPdf = await generatePDF(entry)
  
  if (includeCertificate && entry.certificatePath) {
    return await mergePDFs(mainPdf, entry.certificatePath)
  }
  
  return mainPdf
}
