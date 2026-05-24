# 📚 FIMS Documentation

Dobrodošli u dokumentaciju FIMS (Fuel Inventory Management System) aplikacije.

---

## 📋 Dostupna dokumentacija

### 🚀 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
**Kompletan deployment vodič za production server**

Detaljan, korak-po-korak vodič koji pokriva:
- Sistemske zahteve i pripremu servera
- Instalaciju svih zavisnosti (Node.js, PostgreSQL, Nginx, PM2)
- Konfiguraciju baze podataka
- Build i deployment aplikacije
- PM2 process management setup
- Nginx reverse proxy konfiguraciju
- SSL certifikat sa Certbot-om
- Firewall setup (UFW)
- Cron job konfiguraciju za auto-send
- Backup strategiju
- Monitoring i logging
- Sigurnosne preporuke
- Troubleshooting guide

**Koristiti:** Kada deploying-uješ aplikaciju prvi put na production server.

---

### ⚡ [OPERATIONS_CHEATSHEET.md](./OPERATIONS_CHEATSHEET.md)
**Brzi referentni vodič za svakodnevne operacije**

Cheat sheet sa najčešćim komandama:
- PM2 operacije (start, stop, restart, logs, monitoring)
- PostgreSQL queries i backup/restore
- Nginx konfiguracija i log pregled
- SSL/Certbot management
- Firewall (UFW) rules
- System monitoring (CPU, memory, disk)
- Quick troubleshooting
- Application updates i rollback
- Cron job testiranje
- Security checks

**Koristiti:** Za svakodnevne operacije i brzo rješavanje problema.

---

## 🗂️ Struktura projekta

```
fims/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── login/             # Authentication pages
├── components/            # React components
├── lib/                   # Utility functions, services
├── prisma/               # Database schema & migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/               # Static assets
├── docs/                 # Documentation (ovaj folder)
├── .env.example          # Environment variables template
├── ecosystem.config.js   # PM2 configuration
└── package.json
```

---

## 🔧 Tehnologije

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Authentication:** NextAuth.js v5
- **PDF Generation:** Puppeteer
- **Email:** Nodemailer
- **Process Manager:** PM2
- **Web Server:** Nginx
- **SSL:** Let's Encrypt (Certbot)

---

## 🚦 Quick Start

### Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (creates admin user)
npm run prisma:seed

# Start development server
npm run dev
```

Aplikacija će biti dostupna na: http://localhost:3000

**Default admin kredencijali:**
- Email: `admin@fims.local`
- Password: `Admin123!`

### Production

Prati korake u [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---

## 📝 Environment Variables

Potrebne environment varijable (vidi `.env.example`):

| Varijabla | Opis | Obavezno |
|-----------|------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | NextAuth tajni ključ (64+ chars) | ✅ |
| `NEXTAUTH_URL` | URL aplikacije | ✅ |
| `NODE_ENV` | Environment (development/production) | ✅ |
| `SMTP_HOST` | SMTP server hostname | ✅ |
| `SMTP_PORT` | SMTP port (obično 587) | ✅ |
| `SMTP_USER` | SMTP username/email | ✅ |
| `SMTP_PASS` | SMTP password | ✅ |
| `SMTP_FROM` | From email address | ✅ |
| `SMTP_SECURE` | Use TLS (true/false) | ✅ |
| `CRON_SECRET` | Secret za cron autentifikaciju | ✅ |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (rate limiting) | ❌ |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | ❌ |

---

## 🗄️ Database Schema

### Glavni modeli

- **User** - Korisnici sistema (SUPER_ADMIN, ADMIN, OPERATOR, VIEWER)
- **Warehouse** - Skladišta
- **FuelEntry** - Ulazi goriva (main entity)
- **Supplier** - Dobavljači
- **Transporter** - Prijevoznici
- **Laboratory** - Laboratorije
- **Client** - Klijenti
- **AuditLog** - Audit trail svih akcija
- **AutoEmailRecipient** - Primatelji za auto-send
- **AutoSendBatch** - Batch slanja izvještaja

### Lookup tabele

- **Product** - Proizvodi (vrste goriva)
- **Country** - Države (zemlja porijekla)
- **PickupLocation** - Lokacije preuzimanja
- **FuelCharacteristic** - Karakteristike goriva

---

## 🔒 Security Features

- **Authentication:** NextAuth.js sa bcrypt password hashing
- **Authorization:** Role-based access control (RBAC)
- **Rate Limiting:** Upstash Redis (optional)
- **Audit Logging:** Svi CRUD eventi se loguju
- **Security Headers:** Implementirani u next.config.ts
- **HTTPS:** Enforced u production
- **CSRF Protection:** Next.js built-in
- **SQL Injection Protection:** Prisma ORM prepared statements

---

## 📊 Features

### Core functionality

- ✅ Fuel entry management (CRUD)
- ✅ PDF generation sa QR kodovima
- ✅ Bulk PDF export
- ✅ Auto-send email batching
- ✅ User management sa role-based access
- ✅ Warehouse management
- ✅ Master data management (suppliers, transporters, etc.)
- ✅ Dashboard sa statistikama
- ✅ Audit logging
- ✅ Certificate upload i attachment

### Advanced features

- ✅ Multi-warehouse support
- ✅ Laboratory test report tracking
- ✅ Customs declaration tracking
- ✅ Quality improvement tracking (additives)
- ✅ Client management sa PIB/ID number
- ✅ Scheduled auto-send reports (cron)

---

## 🐛 Troubleshooting

Za česte probleme i rješenja, vidi:
- [DEPLOYMENT_GUIDE.md - Troubleshooting sekcija](./DEPLOYMENT_GUIDE.md#14-troubleshooting)
- [OPERATIONS_CHEATSHEET.md - Quick troubleshooting](./OPERATIONS_CHEATSHEET.md#-quick-troubleshooting)

---

## 🔄 Update Procedure

Kada update-uješ aplikaciju na production:

```bash
cd ~/apps/fims
git pull origin main
npm ci --production=false
npm run prisma:migrate      # Ako ima novih migracija
npm run prisma:generate
npm run build
pm2 reload fims
pm2 logs fims --lines 50
```

Detaljnije u [OPERATIONS_CHEATSHEET.md](./OPERATIONS_CHEATSHEET.md#-application-updates).

---

## 📞 Support

Za pitanja ili probleme:

- **Email:** admin@fims.local
- **GitHub Issues:** [Link ka repository]
- **Dokumentacija:** Ovaj folder (`/docs`)

---

## 📄 License

Private/Internal use only - Tuzla International Airport

---

**Documentation Version:** 1.0.0
**Last Updated:** 2025-01-21
**Maintained by:** FIMS Team
