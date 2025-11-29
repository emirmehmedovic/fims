# FIMS - Fuel Inventory Management System

Sistem za evidenciju goriva za Tuzla International Airport.

## 🚀 Tehnologije

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL 16 (Neon)
- **ORM:** Prisma
- **Authentication:** NextAuth.js v5
- **Styling:** Tailwind CSS (Apple-like dizajn)

## 📦 Setup

### 1. Instaliraj dependencies

```bash
npm install
```

### 2. Generiši Prisma Client

```bash
npm run prisma:generate
```

### 3. Pokreni migracije

```bash
npm run prisma:migrate
```

### 4. Seeduj bazu (kreira admin korisnika)

```bash
npm run prisma:seed
```

## 🏃 Pokretanje

### Development

```bash
npm run dev
```

Aplikacija će biti dostupna na: http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

## 🔐 Default Kredencijali

**Email:** `admin@fims.local`
**Password:** `Admin123!`

## 📚 Korisne Komande

```bash
# Prisma Studio (GUI za bazu)
npm run prisma:studio

# Generiši novi migration
npm run prisma:migrate

# Seed bazu
npm run prisma:seed

# Build projekat
npm run build

# Lint
npm run lint
```

## 🗂️ Struktura Projekta

```
fims/
├── app/
│   ├── api/
│   │   └── auth/[...nextauth]/  # NextAuth API route
│   ├── dashboard/               # Dashboard stranica
│   ├── login/                   # Login stranica
│   └── globals.css             # Global stilovi
├── lib/
│   ├── prisma.ts               # Prisma singleton
│   └── utils/                  # Helper funkcije
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seed script
│   └── migrations/             # Database migrations
├── types/
│   └── next-auth.d.ts         # TypeScript type definitions
└── .env                        # Environment variables
```

## 📝 Database Schema

### Glavni Modeli:
- **User** - Korisnici sistema
- **Warehouse** - Skladišta
- **FuelEntry** - Ulazi goriva
- **Supplier** - Dobavljači
- **Transporter** - Prijevoznici
- **AuditLog** - Audit logovi

## 🔄 Next Steps (Sprint 1)

1. ✅ Setup projekta i infrastrukture
2. User Management CRUD
3. Warehouse Management
4. Fuel Entry forma
5. PDF generisanje
6. Dashboard statistike

## 📄 Dokumentacija

Kompletna dokumentacija projekta se nalazi u `/docs` folderu:
- `FUEL_INVENTORY_SPEC.md` - Tehnička specifikacija
- `API_EXAMPLES.md` - API primjeri
- `UTILITIES.md` - Helper funkcije i snippeti
- `QUICK_START.md` - Vodič za brzi početak

## 🐛 Troubleshooting

### Prisma Client nije generisan
```bash
npm run prisma:generate
```

### Database connection greška
Provjeri `DATABASE_URL` u `.env` fajlu.

### NextAuth redirect loop
Provjeri da je `NEXTAUTH_URL` postavljen na `http://localhost:3000`

---

**Version:** 1.0.0
**Last Updated:** November 28, 2024
