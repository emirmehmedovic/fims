/** Messages shared by the create endpoint and form; never display raw server errors. */
export const CREATE_UNCONFIRMED = 'Nije moguće potvrditi da je prijava spremljena. Prije ponovnog slanja provjerite listu prijava. Ako prijava nije na listi, pokušajte ponovo ili kontaktirajte administratora.'

export const createFieldLabels: Record<string, string> = {
  entryDate: 'Datum ulaza', warehouseId: 'Skladište', productName: 'Naziv proizvoda', quantity: 'Količina (litara)',
  deliveryNoteDate: 'Datum otpremnice', customsDeclarationDate: 'Datum carinske deklaracije', testReportDate: 'Datum izvještaja laboratorije',
  tankerRegistration: 'Registarska oznaka cisterne', tankMeasurements: 'Mjerenja rezervoara', tankNumber: 'Broj rezervoara',
  initialSonde: 'Početno stanje sonde', finalSonde: 'Završno stanje sonde', initialLetva: 'Početno stanje letve', finalLetva: 'Završno stanje letve',
  initialSonde15: 'Početno stanje sonde na 15 °C', finalSonde15: 'Završno stanje sonde na 15 °C',
  initialLetva15: 'Početno stanje letve na 15 °C', finalLetva15: 'Završno stanje letve na 15 °C',
  announcedQuantity: 'Najavljena količina (L)', meterReading: 'Prodata količina u toku istakanja (L)',
}

export function validateCreateFields(data: FormData): string | null {
  const required = ['entryDate', 'warehouseId', 'productName', 'quantity']
  const missing = required.filter(key => typeof data.get(key) !== 'string' || !String(data.get(key)).trim())
  if (missing.length) return `Nije moguće kreirati prijavu. Popunite obavezna polja: ${missing.map(key => createFieldLabels[key]).join(', ')}.`
  const quantity = String(data.get('quantity')).trim()
  if (!/^\d+$/.test(quantity) || Number(quantity) < 1 || Number(quantity) > 50000) {
    return 'Polje „Količina (litara)” mora sadržavati cijeli broj od 1 do 50.000.'
  }
  for (const field of ['entryDate', 'deliveryNoteDate', 'customsDeclarationDate', 'testReportDate']) {
    const value = data.get(field)
    if (!value) continue
    const date = new Date(String(value))
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      return `Polje „${createFieldLabels[field]}” sadrži neispravan datum. Unesite važeći datum.`
    }
  }
  return null
}

export function createResponseError(status: number, body: unknown): string {
  if (body && typeof body === 'object' && 'details' in body && 'error' in body) {
    const details = body.details
    if (details && typeof details === 'object' && 'localized' in details && details.localized === true && typeof body.error === 'string') return body.error
  }
  if (status === 401) return 'Vaša prijava u sistem je istekla. Ponovo se prijavite pa pokušajte kreirati prijavu goriva.'
  if (status === 403) return 'Nemate dozvolu za ovu radnju ili je sigurnosna provjera istekla. Osvježite stranicu i pokušajte ponovo. Ako se problem ponovi, kontaktirajte administratora.'
  if (status === 413) return 'Priložena datoteka je prevelika. Odaberite manji certifikat (najviše 10 MB).'
  if (status === 429) return 'Poslali ste previše zahtjeva. Sačekajte kratko pa pokušajte ponovo.'
  return CREATE_UNCONFIRMED
}
