import { formatDateSarajevo, formatDateTimeSarajevo } from '@/lib/utils/date'

interface FuelEntrySummary {
  registrationNumber: number
  entryDate: Date | string
  warehouseCode: string
  warehouseName: string
  productName: string
  quantity: number
}

interface FuelEntryEmailTemplateParams {
  entries: FuelEntrySummary[]
  dateFromLabel: string
  dateToLabel: string
  totalQuantity: number
  batchNumber?: number
  totalBatches?: number
}

export const buildFuelEntriesEmailHTML = ({
  entries,
  dateFromLabel,
  dateToLabel,
  totalQuantity,
  batchNumber,
  totalBatches
}: FuelEntryEmailTemplateParams) => {
  const rows = entries.map(entry => `
    <tr>
      <td>${entry.registrationNumber}</td>
      <td>${formatDateSarajevo(entry.entryDate)}</td>
      <td>${entry.warehouseCode}</td>
      <td>${entry.productName}</td>
      <td style="text-align:right;">${entry.quantity.toLocaleString()} L</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8" />
  <style>
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f3f5f9; color: #111827; }
    .wrapper { max-width: 720px; margin: 0 auto; padding: 32px 20px 40px; }
    .card { background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
    .header { background: #ffffff; padding: 16px 20px 0; border-bottom: 1px solid #e5e7eb; }
    .header-image { width: 100%; height: auto; display: block; }
    .header-title { font-size: 20px; font-weight: 700; margin: 12px 0 6px; color: #111827; }
    .header-sub { font-size: 13px; color: #6b7280; margin: 0 0 12px; }
    .content { padding: 24px; }
    .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #eef2ff; color: #4338ca; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .meta-card { background: #f9fafb; border-radius: 12px; padding: 12px; border: 1px solid #e5e7eb; }
    .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin: 0 0 6px; }
    .meta-value { font-size: 15px; font-weight: 600; margin: 0; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    th { text-align: left; background: #f3f4f6; color: #4b5563; text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; }
    .footer { padding: 18px 24px; background: #f9fafb; font-size: 12px; color: #6b7280; }
    .muted { color: #6b7280; font-size: 13px; margin: 0 0 12px; }
    @media (max-width: 600px) {
      .wrapper { padding: 16px 12px 24px; }
      .header { padding: 12px 12px 0; text-align: center; }
      .header-image { width: 100%; max-width: none; height: auto; margin: 0 auto; }
      .header-title { font-size: 18px; }
      .content { padding: 18px; }
      .meta-grid { grid-template-columns: 1fr; }
      th, td { padding: 8px 10px; font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="cid:hifa-header" alt="HIFA Petrol" class="header-image" />
        <h1 class="header-title">Automatski izvještaj o prijavama goriva</h1>
        <p class="header-sub">FIMS • Interni izvještaj</p>
      </div>
      <div class="content">
        ${batchNumber && totalBatches ? `<div class="pill">Paket ${batchNumber}/${totalBatches}</div>` : ''}
        <p class="muted">Period izvještaja: ${dateFromLabel} - ${dateToLabel}</p>
        <div class="meta-grid">
          <div class="meta-card">
            <p class="meta-label">Broj prijava</p>
            <p class="meta-value">${entries.length}</p>
          </div>
          <div class="meta-card">
            <p class="meta-label">Ukupna količina</p>
            <p class="meta-value">${totalQuantity.toLocaleString()} L</p>
          </div>
          <div class="meta-card">
            <p class="meta-label">Generisano</p>
            <p class="meta-value">${formatDateTimeSarajevo(new Date())}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Reg. broj</th>
              <th>Datum</th>
              <th>Skladište</th>
              <th>Proizvod</th>
              <th style="text-align:right;">Količina</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5">Nema prijava za odabrani period.</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="footer">
        Ovaj email je automatski generisan. Ako niste ovlasteni da primate izvjestaje, obavijestite administratora.
      </div>
    </div>
  </div>
</body>
</html>
  `
}
