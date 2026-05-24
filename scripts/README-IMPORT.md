# Import Klijenata - Uputstvo

## 📋 Pregled

Imamo 3 skripte za import klijenata:

1. **excel-to-json.ts** - Exportuje klijente iz Excel-a u JSON
2. **import-clients-from-json.ts** - Importuje klijente iz JSON-a u bazu
3. **check-excel.ts** - Za provjeru sadržaja Excel fajla

## 📂 Fajlovi

- **Excel:** `/Users/emir_mw/Downloads/New Microsoft Excel Worksheet.xlsx`
- **JSON:** `data/clients-import.json` (1242 klijenata)

## 🚀 Kako koristiti

### Korak 1: Export iz Excel-a u JSON (već uradjeno)

```bash
npx tsx scripts/excel-to-json.ts
```

Ovo kreira `data/clients-import.json` sa svim klijentima.

### Korak 2: Pregledaj JSON podatke (opciono)

```bash
# Vidi prvih 20 klijenata
head -50 data/clients-import.json

# Broj ukupnih klijenata
jq '. | length' data/clients-import.json
```

### Korak 3: Test import (DRY RUN)

```bash
# Testira prvih 10 klijenata bez importa
npx tsx scripts/import-clients-from-json.ts --dry-run --limit 10

# Testira sve klijente bez importa
npx tsx scripts/import-clients-from-json.ts --dry-run
```

### Korak 4: Pravi import u bazu

```bash
# Importuj prvih 10 klijenata (za test)
npx tsx scripts/import-clients-from-json.ts --limit 10

# Importuj SVE klijente (1242)
npx tsx scripts/import-clients-from-json.ts
```

## 📊 Šta skripta radi

1. **Provjerava duplikate** - Po `code` polju
2. **Kreira nove** - Ako klijent ne postoji
3. **Updatuje postojeće** - Ako se ime promijenilo
4. **Preskače** - Ako su podaci isti
5. **Loguje greške** - Ako nešto pođe po zlu

## 📝 Format podataka

JSON fajl sadrži objekte sa 2 polja:

```json
{
  "name": "10. JUN d.o.o. Zvornik",
  "code": "23639"
}
```

- `name` - Ime firme (obavezno)
- `code` - Interna šifra bez "PP:" prefixa (obavezno)

Ostala polja (`address`, `phone`, `email`, itd.) se ne popunjavaju - unose se ručno naknadno.

## ⚙️ Opcije

| Opcija | Opis |
|--------|------|
| `--dry-run` | Prikaži šta bi se uradilo bez importa |
| `--limit N` | Importuj samo prvih N klijenata |

## 📋 Primjeri

```bash
# Dry run prvih 5 klijenata
npx tsx scripts/import-clients-from-json.ts --dry-run --limit 5

# Import prvih 50 klijenata
npx tsx scripts/import-clients-from-json.ts --limit 50

# Import svih klijenata
npx tsx scripts/import-clients-from-json.ts
```

## 🔍 Output primjer

```
🔄 Starting client import from JSON...
📖 Reading JSON file: data/clients-import.json
✅ Loaded 1242 clients from JSON
📊 Processing 1242 clients

💾 Importing to database...

[1/1242] ✅ Created: "R-B LOGISTIKA" d.o.o. Gradiška (4955)
[2/1242] ✅ Created: 10. JUN d.o.o. Zvornik (23639)
[3/1242] ⏭️  Skipped: 4. APRIL d.o.o. Bijeljina (24138)
...

======================================================================
📊 IMPORT SUMMARY
======================================================================
✅ Created:         1150
✏️  Updated:           52
⏭️  Skipped:           40
❌ Errors:              0
──────────────────────────────────────────────────────────────────────
📦 Total:           1242
======================================================================

✅ Import completed successfully!
```

## ⚠️ Napomene

- Skripta **NE briše** postojeće klijente
- Skripta **provjerava duplikate** po `code` polju
- Može se pokrenuti **više puta** bez problema
- **Dry run** mod preporučen prije pravog importa
- **--limit** opcija korisna za testiranje

## 🛠️ Modifikacija podataka

Ako želiš mijenjati podatke prije importa:

1. Edituj `data/clients-import.json` fajl
2. Pokreni import ponovo

## 📞 Pomoć

Ako nešto ne radi kako treba:

```bash
# Provjeri Excel fajl
npx tsx scripts/check-excel.ts

# Re-exportuj iz Excel-a
npx tsx scripts/excel-to-json.ts

# Provjeri JSON
cat data/clients-import.json | jq '.[0:5]'
```
