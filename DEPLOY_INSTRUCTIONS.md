# Deployment Instructions - Auth Fix

## Problem riješen:
- JWT token bio prevelik zbog slanja punih warehouse/station objekata
- Sada šalje samo ID-eve → token <1KB

## Koraci za deployment:

### 1. Build aplikacije
```bash
npm run build
```

### 2. Deploy na server (deploy kod na produkciju)
```bash
# Kopiraj build fajlove na server
# ili koristi svoj deployment proces (pm2, docker, itd)
```

### 3. Postavi PRODUKCIJSKE environment varijable na serveru

Kreiraj ili updatuj `.env.production` fajl na serveru:

```bash
# Database (već imaš ovo)
DATABASE_URL="your-production-database-url"

# NextAuth - KRITIČNO!
NEXTAUTH_URL="https://your-production-domain.com"  # ← Tvoj pravi domain
NEXTAUTH_SECRET="YmKuDz2w9OzzF3M9uiMf2x4+XgXK9Ryk9FQdF++hNAk="  # ← NOVI secret (generisan)

# Environment
NODE_ENV="production"

# Ostale varijable...
```

**VAŽNO:**
- Zamijeni `https://your-production-domain.com` sa pravim URL-om (npr. `https://fims.tvoja-domena.com`)
- Koristi generisani NEXTAUTH_SECRET iznad (ili generiši novi)
- `NODE_ENV` MORA biti "production"

### 4. Restartuj aplikaciju
```bash
# Ako koristiš PM2:
pm2 restart fims

# Ako koristiš systemd:
sudo systemctl restart fims

# Ili tvoj način restartovanja
```

### 5. CLEAR browser cache i cookies na SVIM uređajima

**Zbog STAROG JWT tokena u browser-u, korisnici se moraju:**
- Obrisati cookies za tvoj sajt
- Ili koristiti Incognito/Private mode za prvi login

### 6. Testiranje
```bash
# Na serveru, provjeri logove:
pm2 logs fims --lines 50

# Filtriraj samo auth logove:
pm2 logs fims | grep '\[AUTH\]'
```

## Kako testirati:

1. **Sa telefona** (u Incognito mode):
   - Otvori sajt
   - Pokušaj login sa korisnikom koji IMA dodijeljene poslovnice
   - Trebalo bi da radi ✅

2. **Sa desktop browser-a** (obriši cookies ili incognito):
   - Isto kao gore

3. **Ako ne radi**, pošalji logove:
```bash
pm2 logs fims --lines 100 | grep -E '\[AUTH\]|error|Error'
```

## Ako generišeš NOVI NEXTAUTH_SECRET:
```bash
node -e "console.log('NEXTAUTH_SECRET=\"' + require('crypto').randomBytes(32).toString('base64') + '\"')"
```

---

## Zašto je ovo riješilo problem:

**PRIJE:**
- `authorize()` vraćao PUNE warehouse/station objekte → 4-5KB JWT → ne staje u cookie

**SADA:**
- `authorize()` vraća samo ID-eve → <500 bytes JWT → staje u cookie
- `session()` callback fetch-uje pune podatke iz baze kada treba

**Rezultat:** Login radi za sve korisnike, bez obzira koliko poslovnica imaju! 🎉
