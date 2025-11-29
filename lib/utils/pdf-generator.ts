import puppeteer from 'puppeteer'
import QRCode from 'qrcode'
import { PDFDocument } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

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

export function generatePDFTemplate(entry: FuelEntryData, qrCodeDataUrl: string): string {
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Izjava o usklađenosti - ${entry.registrationNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1a1a1a;
      padding: 40px;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 20px;
    }
    
    .header h1 {
      font-size: 22px;
      font-weight: 600;
      color: #0066cc;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .header .subtitle {
      font-size: 14px;
      color: #666;
    }
    
    .registration-badge {
      display: inline-block;
      background: #0066cc;
      color: white;
      padding: 8px 20px;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 600;
      margin-top: 15px;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #0066cc;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e0e0e0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 9px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 2px;
    }
    
    .info-value {
      font-size: 11px;
      color: #1a1a1a;
      font-weight: 500;
    }
    
    .info-value.highlight {
      color: #0066cc;
      font-weight: 600;
    }
    
    .characteristics-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    
    .characteristic-tag {
      background: #e6f0ff;
      color: #0066cc;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .qr-section {
      text-align: center;
    }
    
    .qr-section img {
      width: 80px;
      height: 80px;
    }
    
    .qr-section .qr-label {
      font-size: 8px;
      color: #888;
      margin-top: 4px;
    }
    
    .signature-section {
      text-align: center;
      min-width: 200px;
    }
    
    .signature-line {
      border-top: 1px solid #1a1a1a;
      margin-top: 50px;
      padding-top: 8px;
    }
    
    .signature-label {
      font-size: 10px;
      color: #666;
    }
    
    .watermark {
      position: fixed;
      bottom: 20px;
      left: 40px;
      font-size: 9px;
      color: #ccc;
    }
    
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
    }
    
    .badge-success {
      background: #e6f7ed;
      color: #1a8754;
    }
    
    .badge-info {
      background: #e6f0ff;
      color: #0066cc;
    }
    
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Izjava o usklađenosti</h1>
    <div class="subtitle">Evidencija ulaza goriva u skladište</div>
    <div class="registration-badge">Registarski broj: ${entry.registrationNumber}</div>
  </div>

  <div class="section">
    <div class="section-title">Osnovne informacije</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Datum ulaza</span>
        <span class="info-value">${formatDate(entry.entryDate)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Skladište</span>
        <span class="info-value">${entry.warehouse.code} - ${entry.warehouse.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Naziv proizvoda</span>
        <span class="info-value highlight">${entry.productName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Količina</span>
        <span class="info-value highlight">${entry.quantity.toLocaleString()} L</span>
      </div>
      <div class="info-item">
        <span class="info-label">Viša kvaliteta</span>
        <span class="info-value">
          ${entry.isHigherQuality 
            ? '<span class="badge badge-success">Da</span>' 
            : '<span class="badge badge-info">Ne</span>'}
        </span>
      </div>
      <div class="info-item">
        <span class="info-label">Zemlja porijekla</span>
        <span class="info-value">${entry.countryOfOrigin || '-'}</span>
      </div>
    </div>
    ${entry.improvedCharacteristics.length > 0 ? `
    <div style="margin-top: 15px;">
      <span class="info-label">Poboljšane karakteristike</span>
      <div class="characteristics-list">
        ${entry.improvedCharacteristics.map(char => `
          <span class="characteristic-tag">${char}</span>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>

  <div class="section">
    <div class="section-title">Dokumentacija</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Broj otpremnice</span>
        <span class="info-value">${entry.deliveryNoteNumber || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Datum otpremnice</span>
        <span class="info-value">${formatDate(entry.deliveryNoteDate)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Broj carinske deklaracije</span>
        <span class="info-value">${entry.customsDeclarationNumber || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Datum carinske deklaracije</span>
        <span class="info-value">${formatDate(entry.customsDeclarationDate)}</span>
      </div>
    </div>
  </div>

  ${entry.laboratoryName || entry.testReportNumber ? `
  <div class="section">
    <div class="section-title">Laboratorijske informacije</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Naziv laboratorije</span>
        <span class="info-value">${entry.laboratoryName || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Broj akreditacije</span>
        <span class="info-value">${entry.labAccreditationNumber || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Broj izvještaja</span>
        <span class="info-value">${entry.testReportNumber || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Datum izvještaja</span>
        <span class="info-value">${formatDate(entry.testReportDate)}</span>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Dobavljač i transport</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Dobavljač</span>
        <span class="info-value">${entry.supplier ? `${entry.supplier.code} - ${entry.supplier.name}` : '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Prevoznik</span>
        <span class="info-value">${entry.transporter ? `${entry.transporter.code} - ${entry.transporter.name}` : '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Vozač</span>
        <span class="info-value">${entry.driverName || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Lokacija preuzimanja</span>
        <span class="info-value">${entry.pickupLocation || '-'}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Evidencija</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Operator</span>
        <span class="info-value">${entry.operator.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Narudžbu otvorio</span>
        <span class="info-value">${entry.orderOpenedBy || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Datum kreiranja</span>
        <span class="info-value">${formatDateTime(entry.createdAt)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Certifikat</span>
        <span class="info-value">
          ${entry.certificatePath 
            ? '<span class="badge badge-success">Priložen</span>' 
            : '<span class="badge badge-info">Nije priložen</span>'}
        </span>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="qr-section">
      ${qrCodeDataUrl ? `
        <img src="${qrCodeDataUrl}" alt="QR Code" />
        <div class="qr-label">Skeniraj za verifikaciju</div>
      ` : ''}
    </div>
    <div class="signature-section">
      <div class="signature-line">
        <div class="signature-label">Potpis odgovorne osobe</div>
      </div>
    </div>
  </div>

  <div class="watermark">
    Generirano: ${currentDate} | FIMS - Fuel Inventory Management System
  </div>
</body>
</html>
  `
}

export async function generatePDF(entry: FuelEntryData): Promise<Buffer> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/verify/${entry.id}`
  
  const qrCodeDataUrl = await generateQRCode(verificationUrl)
  const htmlContent = generatePDFTemplate(entry, qrCodeDataUrl)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
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
