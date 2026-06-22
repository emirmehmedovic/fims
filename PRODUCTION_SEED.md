# Ubacivanje Poslovnica na Produkciji

Ovaj dokument opisuje kako sigurno ubaciti poslovnice u produkcijsku bazu podataka.

## 📋 Preduslovi

Prije pokretanja seed skripte na produkciji:

1. ✅ **Backup baze podataka**
   ```bash
   # Za PostgreSQL
   pg_dump -h host -U user -d database > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. ✅ **Testiranje na development bazi**
   ```bash
   npm run seed:stations
   ```

3. ✅ **Provjera DATABASE_URL**
   ```bash
   echo $DATABASE_URL
   # Trebalo bi da prikaže produkcijski URL
   ```

## 🚀 Pokretanje na Produkciji

### Opcija 1: Sigurna Skripta (Preporučeno)

Ova skripta traži eksplicitnu potvrdu prije pokretanja:

```bash
# Postavite DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Pokrenite skriptu
./scripts/seed-stations-production.sh
```

Skripta će zatražiti da unesete `YES` za potvrdu.

### Opcija 2: Direktno Pokretanje

```bash
# Postavite DATABASE_URL i pokrenite
DATABASE_URL="postgresql://..." npm run seed:stations
```

### Opcija 3: SSH na Produkcijski Server

Ako radite preko SSH-a:

```bash
# Spojite se na server
ssh user@production-server

# Navigirajte do aplikacije
cd /path/to/fims

# Postavite environment
export DATABASE_URL="vaš_production_url"

# Pokrenite seed
npm run seed:stations
```

## 📊 Očekivani Izlaz

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

## 🔒 Sigurnosne Mjere

### Skripta JE Sigurna Za:
- ✅ Višestruko pokretanje (idempotentna)
- ✅ Ne briše postojeće podatke
- ✅ Ažurira postojeće poslovnice po `code` šifri
- ✅ Kreira samo nove poslovnice

### Skripta NEĆE:
- ❌ Brisati poslovnice
- ❌ Mijenjati `code` šifre
- ❌ Deaktivirati postojeće poslovnice
- ❌ Brisati veze sa fuel entry zapisima

## 🐛 Troubleshooting

### Problem: "Cannot connect to database"

**Rješenje:**
1. Provjerite da li je `DATABASE_URL` pravilno postavljen
2. Provjerite mrežnu konekciju
3. Provjerite firewall pravila

```bash
# Test konekcije
psql "$DATABASE_URL" -c "SELECT 1"
```

### Problem: "Prisma client not generated"

**Rješenje:**
```bash
npx prisma generate
```

### Problem: "Station with code XXX already exists"

**Ovo NIJE greška!** Skripta će automatski ažurirati postojeću poslovnicu.

### Problem: Skripta se prekinula u sredini

**Rješenje:**
Sigurno je jednostavno ponovo pokrenuti skriptu - ona će nastaviti tamo gdje je stala:
- Kreirane poslovnice će biti preskočene (update)
- Nekreirane će biti dodane

```bash
# Jednostavno pokrenite ponovo
npm run seed:stations
```

## 📝 Provjera Nakon Seeda

1. **Provjerite broj poslovnica:**
   ```sql
   SELECT COUNT(*) FROM stations;
   -- Očekivano: 62
   ```

2. **Provjerite aktivne poslovnice:**
   ```sql
   SELECT COUNT(*) FROM stations WHERE is_active = true;
   -- Očekivano: 62
   ```

3. **Provjerite poslovnice po tipu:**
   ```sql
   SELECT
     SUBSTRING(code FROM '^[A-Z]+') as type,
     COUNT(*) as count
   FROM stations
   GROUP BY SUBSTRING(code FROM '^[A-Z]+');

   -- Očekivano:
   -- BP  (Benzinske pumpe): 58
   -- SKL (Skladišta): 1
   -- LUK (Luke): 2
   -- OST (Ostalo): 1
   ```

4. **Prijavite se u aplikaciju:**
   - Idite na http://vaš-domen/dashboard/master-data
   - Otvorite tab "Poslovnice"
   - Provjerite da li su sve poslovnice prikazane

## 🔄 Rollback (Ako Nešto Krene Naopako)

Ako trebate vratiti izmjene:

```bash
# Vratite backup
psql -h host -U user -d database < backup_YYYYMMDD_HHMMSS.sql
```

Ili ručno obrišite nove poslovnice:

```sql
-- Lista novododanih poslovnica (kreiranih danas)
SELECT id, name, code, created_at
FROM stations
WHERE DATE(created_at) = CURRENT_DATE;

-- Ako želite obrisati sve (BUDITE OPREZNI!)
-- DELETE FROM stations WHERE DATE(created_at) = CURRENT_DATE;
```

## 📞 Podrška

Ako imate problema, kontaktirajte razvojni tim sa sljedećim informacijama:

1. Izlaz komande (`npm run seed:stations`)
2. Screenshot greške
3. Verzija Node.js (`node --version`)
4. Verzija npm (`npm --version`)
5. DATABASE_URL (samo host, bez passworda!)

## ✨ Nakon Uspješnog Seeda

Nakon što seed uspješno prođe:

1. ✅ Testirajte kreiranje fuel entry-ja sa odabranom poslovnicom
2. ✅ Provjerite da li se poslovnice prikazuju u dropdownu
3. ✅ Provjerite da li se poslovnice mogu pretraživati
4. ✅ Obavijestite korisničku podršku da su poslovnice dostupne
