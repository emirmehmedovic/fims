# 🔧 Production Database Fix - Aditivi Error

## Problem

Pokušaj dodavanja aditiva na produkciji rezultuje greškom:
```
500 Internal Server Error
{success: false, error: "Failed to create lookup item"}
```

## Uzrok

Baza podataka na produkciji **nema kolone** `manufacturers` i `type` u tabeli `fuel_characteristics`.

Ove kolone postoje u Prisma shemi i u lokalnoj bazi (dodane kroz `prisma db push`), ali na produkciji fali migration fajl koji ih kreira.

## Rješenje

Kreirana je nova migracija koja dodaje nedostajuće kolone:
- `20260531191600_add_fuel_characteristics_and_entry_fields`

### Šta migracija dodaje:

**U tabelu `fuel_characteristics`:**
- `manufacturers` (TEXT[]) - niz proizvođača aditiva
- `type` (TEXT) - vrsta aditiva

**U tabelu `fuel_entries`:**
- `additive_details` (TEXT) - detalji o aditivu
- `client_id` (TEXT) - reference na klijenta
- `laboratory_id` (TEXT) - reference na laboratoriju
- `vehicle_registration` (TEXT) - registracija vozila
- Foreign key constraints za client_id i laboratory_id

## Deployment na Produkciju

### ⚠️ VAŽNO: NE KORISTI `prisma db push` NA PRODUKCIJI!

Razlozi:
1. ❌ Nije trackirano u version control
2. ❌ Može biti opasno na produkciji
3. ❌ Ne kreira migration fajlove za buduće deploymente
4. ❌ Teško je rollback-ovati ako nešto pođe po zlu
5. ✅ Umjesto toga, koristi `prisma migrate deploy`

### Način 1: Koristi Deployment Script (Preporučeno)

```bash
# 1. Setuj production DATABASE_URL
export DATABASE_URL='postgresql://user:password@host/database'

# 2. Pokreni deployment script
./scripts/deploy-migration.sh
```

Script će:
- Provjeriti da li je DATABASE_URL setovan
- Tražiti potvrdu prije deployovanja
- Pokrenuti `prisma migrate deploy`
- Prikazati status

### Način 2: Manualno preko Prisma CLI

```bash
# 1. Setuj production DATABASE_URL
export DATABASE_URL='postgresql://user:password@host/database'

# 2. Deploy migrations
npx prisma migrate deploy
```

### Način 3: Preko Deployment Platforme (Vercel/Railway/etc)

Ako koristiš CI/CD:

1. **Push migraciju u git:**
   ```bash
   git add prisma/migrations/20260531191600_add_fuel_characteristics_and_entry_fields
   git commit -m "Add missing fuel_characteristics and fuel_entries columns"
   git push
   ```

2. **Konfiguriši build command** da uključi migrate deploy:
   ```bash
   npx prisma migrate deploy && npm run build
   ```

3. **Deploy** će automatski pokrenuti migracije

## Verifikacija

Nakon deploymenta, provjeri da li radi:

1. Idi na `/dashboard/master-data`
2. Klikni na "Aditivi" tab
3. Pokušaj dodati novi aditiv sa proizvođačima
4. Treba da radi bez greške!

## Rollback (ako zatreba)

Ako nešto pođe po zlu, možeš rollback-ovati:

```bash
# Connect to production DB and run:
ALTER TABLE fuel_characteristics DROP COLUMN IF EXISTS manufacturers;
ALTER TABLE fuel_characteristics DROP COLUMN IF EXISTS type;
ALTER TABLE fuel_entries DROP COLUMN IF EXISTS additive_details;
ALTER TABLE fuel_entries DROP COLUMN IF EXISTS client_id;
ALTER TABLE fuel_entries DROP COLUMN IF EXISTS laboratory_id;
ALTER TABLE fuel_entries DROP COLUMN IF EXISTS vehicle_registration;
```

## Provjera Drift-a u Budućnosti

Da provjeriš da li postoje još neke razlike između sheme i baze:

```bash
npx prisma migrate status
```

Ako vidiš drift, ne koristi `db push` nego kreiraj migraciju:

```bash
npx prisma migrate dev --name describe_changes_here
```

## Za Tim

1. **UVIJEK** koristi `prisma migrate dev` umjesto `prisma db push` tokom development-a
2. **NIKAD** ne koristi `prisma db push` na produkciji
3. Commit migration fajlove u git
4. Deploy migracije preko CI/CD ili `prisma migrate deploy`
