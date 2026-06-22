# Seed Podaci - Poslovnice

Ovaj direktorijum sadrži JSON fajl sa podacima o poslovnicama i skriptu za njihovo ubacivanje u bazu podataka.

## Fajlovi

- **`stations.json`** - JSON fajl sa svim poslovnicama (benzinske pumpe, skladišta, luke, ostalo)
- **`seed-stations.ts`** - TypeScript skripta za ubacivanje poslovnica u bazu

## Pokretanje Seed Skripte

### Development (lokalna baza)

```bash
npm run seed:stations
```

### Production

Prije pokretanja na produkciji, uvjerite se da ste:
1. Postavili `DATABASE_URL` environment varijablu na produkcijsku bazu
2. Napravili backup baze podataka

```bash
# Postavite DATABASE_URL za produkciju
export DATABASE_URL="postgresql://user:password@host:port/database"

# Pokrenite seed
npm run seed:stations
```

Ili direktno sa DATABASE_URL:

```bash
DATABASE_URL="postgresql://..." npm run seed:stations
```

## Kako Radi Skripta?

Skripta je **idempotentna** - sigurna je za višestruko pokretanje:

1. **Ako poslovnica ne postoji** (provjera po `code` šifri) → **kreira novu**
2. **Ako poslovnica već postoji** → **ažurira naziv i adresu**
3. Ispisuje statistiku: koliko kreiranih, ažuriranih i preskočenih

### Primjer Izlaza:

```
🌱 Seeding stations...
  ✓ Created: Hifa Petrol Travnik (BP-001)
  ✓ Created: Hifa Petrol Derventa 2 (BP-002)
  ✓ Updated: Hifa Petrol Grude (BP-003)
  ...

✅ Seeding completed!
   📊 Statistics:
      - Created: 58
      - Updated: 4
      - Skipped: 0
      - Total:   62
```

## Dodavanje Novih Poslovnica

Da dodate nove poslovnice:

1. Otvorite `stations.json`
2. Dodajte novi objekat sa sljedećim poljima:

```json
{
  "name": "Naziv Poslovnice",
  "code": "BP-XXX",
  "address": "Ulica, Grad, Entitet/Država",
  "type": "Benzinska pumpa"
}
```

3. Pokrenite `npm run seed:stations`

### Tipovi Poslovnica

- `Benzinska pumpa` - Koristi kod format `BP-XXX`
- `Skladište` - Koristi kod format `SKL-XXX`
- `Luka` - Koristi kod format `LUK-XXX`
- `Ostalo` - Koristi kod format `OST-XXX`

### Pravila za Kodove

- **Jedinstveni** - Svaka poslovnica mora imati jedinstvenu šifru
- **Format** - Koristi prefix prema tipu (BP, SKL, LUK, OST) + broj sa vodećim nulama
- **Primjer**: `BP-001`, `BP-002`, `SKL-001`, `LUK-001`

## Sigurnost

- ✅ **Sigurno za produkciju** - Ne briše postojeće podatke
- ✅ **Idempotentno** - Može se pokretati više puta bez problema
- ✅ **Provjera duplikata** - Provjera po `code` šifri prije kreiranja
- ✅ **Rollback friendly** - Ako nešto krene naopako, samo zaustavite skriptu

## Troubleshooting

### "Cannot read properties of undefined (reading 'station')"

Ovo znači da Prisma klijent nije regenerisan nakon dodavanja Station modela. Pokrenite:

```bash
npx prisma generate
```

### "Database connection failed"

Provjerite da li je `DATABASE_URL` environment varijabla pravilno postavljena:

```bash
echo $DATABASE_URL
```

### "Station with code XXX already exists"

Ovo je OK - skripta će automatski ažurirati postojeću poslovnicu umjesto kreiranja nove.
