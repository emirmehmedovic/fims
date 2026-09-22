# Plan realizacije: Zapisnik o prijemu goriva

## Status: IMPLEMENTIRANO

---

## Realizirano

### Faza 1: Baza podataka ✅

**Nove tabele:**

1. **CorrectionFactor** - Master podaci za faktore korekcije
   - `productName` - naziv proizvoda (npr. "EURODIESEL BAS EN 590")
   - `temperature` - temperatura u °C
   - `factor` - faktor korekcije (6 decimala)
   - Unique constraint na kombinaciju (productName, temperature)

2. **FuelReceiptRecord** - Zapisnik o prijemu goriva
   - Vezan 1:1 na FuelEntry
   - `tankMeasurements` - JSON polje s mjerenjima rezervoara
   - Polja za izračune (announcedQuantity, dischargedQuantity, itd.)
   - Checkbox polja za dokumentaciju

### Faza 2: API Endpoints ✅

- `GET/POST /api/correction-factors` - Lista i kreiranje
- `GET/PUT/DELETE /api/correction-factors/[id]` - CRUD za pojedinačni
- `GET /api/correction-factors/lookup` - Traženje faktora po proizvodu/temperaturi
- `GET/POST /api/correction-factors/bulk` - Bulk import i sample podaci
- `GET /api/exports/receipt-record/[entryId]` - PDF export zapisnika
- Ažuriran `/api/fuel-entries` za prihvatanje receiptRecord podataka
- Ažuriran `/api/fuel-entries/[id]` za vraćanje receiptRecord

### Faza 3: PDF Generator ✅

- Kreiran `lib/utils/pdf-generator-zapisnik.ts`
- Landscape A4 format
- Header s HIFA-PETROL memorandumom
- Tabela mjerenja rezervoara (R1-R10)
- Izračuni: najavljena, istočena, razlika, brojčanik, manjak/višak
- Dokumentacija checklist
- Potpisi: primio, vozač, pečat

### Faza 4: Frontend komponente ✅

1. **TankMeasurementsForm** (`components/fuel-entries/TankMeasurementsForm.tsx`)
   - Dinamički redovi za R1-R10
   - Auto-lookup faktora korekcije po temperaturi
   - Auto-izračun litara na 15°C
   - Prikaz istočenog po rezervoaru

2. **ReceiptCalculations** (`components/fuel-entries/ReceiptCalculations.tsx`)
   - Input polja: najavljena, brojčanik, otpremnica
   - Auto-izračun: istočeno, razlike, konačni manjak/višak
   - Upozorenja za velike razlike (1% warning, 2% error)

3. **DocumentationChecklist** (`components/fuel-entries/DocumentationChecklist.tsx`)
   - 7 checkbox stavki s ikonama
   - Vizualni prikaz označenih/neoznačenih

4. **CreateFuelEntryModal** - integracija
   - Nova sekcija "Zapisnik o prijemu goriva" (samo za PUMPA)
   - Gradijentni okvir za vizualno razdvajanje

5. **ViewFuelEntryModal** - prikaz zapisnika
   - Tabela mjerenja s izračunima
   - Prikaz količina i razlika
   - Documentation badges
   - Download/Print dugmad za Zapisnik PDF

### Faza 5: Master Data stranica ✅

- `/dashboard/master-data/correction-factors`
- Lista faktora grupisana po proizvodu
- Dodavanje/uređivanje/brisanje faktora
- "Učitaj standardne faktore" za seed podatke
- Filter po proizvodu
- Dostupno samo ADMIN/SUPER_ADMIN

---

## Korištenje

### Za PUMPA korisnike:

1. Pri kreiranju nove prijave, ispod certifikata pojavljuje se sekcija "Zapisnik o prijemu goriva"
2. Odaberite rezervoare (R1-R10) i unesite:
   - Početno stanje: sonda (litara), temperatura
   - Završno stanje: sonda (litara), temperatura
3. Faktor korekcije se automatski učitava prema proizvodu i temperaturi
4. Litara na 15°C se automatski izračunava
5. Unesite najavljenu količinu, brojčanik cisterne, količinu s otpremnice
6. Sistem automatski izračunava razlike i upozorava na velike odstupanja
7. Označite dokumentaciju koja je prisutna
8. Pri spremanju, zapisnik se sprema zajedno s prijavom

### Za ADMIN korisnike:

1. Master Podaci → Faktori korekcije
2. Kliknite "Učitaj standardne faktore" za inicijalne vrijednosti
3. Faktori se mogu ručno dodavati/uređivati/brisati
4. Standardni faktori su bazirani na koeficijentima termičke ekspanzije:
   - Dizel: 0.00083/°C
   - Benzin: 0.00123/°C
   - LPG: 0.00180/°C

---

## Napomena

Ova implementacija je kompletna i spremna za testiranje.
Kad potvrdite da sve radi ispravno, commitat ćemo i pushati promjene.

---

## Struktura fajlova

```
prisma/
  schema.prisma                          # Ažurirano s CorrectionFactor i FuelReceiptRecord

app/api/
  correction-factors/
    route.ts                             # NOVO - lista i kreiranje
    [id]/route.ts                        # NOVO - CRUD pojedinačni
    lookup/route.ts                      # NOVO - lookup po temp
    bulk/route.ts                        # NOVO - bulk import
  exports/
    receipt-record/[entryId]/route.ts    # NOVO - PDF export
  fuel-entries/
    route.ts                             # Ažurirano - prima receiptRecord
    [id]/route.ts                        # Ažurirano - vraća receiptRecord

app/dashboard/
  master-data/
    page.tsx                             # Ažurirano - link na faktore
    correction-factors/page.tsx          # NOVO - upravljanje faktorima

components/fuel-entries/
  TankMeasurementsForm.tsx               # NOVO
  ReceiptCalculations.tsx                # NOVO
  DocumentationChecklist.tsx             # NOVO
  CreateFuelEntryModal.tsx               # Ažurirano - sekcija za zapisnik
  ViewFuelEntryModal.tsx                 # Ažurirano - prikaz zapisnika

lib/utils/
  pdf-generator-zapisnik.ts              # NOVO - PDF generator
```
