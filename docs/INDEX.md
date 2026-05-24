# 📚 FIMS Deployment Documentation Index

Pregled sve deployment dokumentacije i alata za FIMS aplikaciju.

---

## 🎯 Gdje početi?

### Za prvi deployment:
1. Pročitaj **[QUICK_DEPLOY.md](/QUICK_DEPLOY.md)** za brzi pregled
2. Prati **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** korak po korak
3. Koristi **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** da pratiš napredak

### Za svakodnevne operacije:
- **[OPERATIONS_CHEATSHEET.md](./OPERATIONS_CHEATSHEET.md)** - Brza referenca za sve komande

### Za backup i restore:
- **[/scripts/README-BACKUP.md](/scripts/README-BACKUP.md)** - Kompletna backup dokumentacija

---

## 📁 Struktura dokumentacije

```
fims/
├── QUICK_DEPLOY.md                      # ⚡ Brzi deployment vodič
├── ecosystem.config.js                  # 🔧 PM2 konfiguracija
│
├── docs/                                # 📚 Glavna dokumentacija
│   ├── INDEX.md                         # 📋 Ovaj fajl - index
│   ├── README.md                        # 📖 Pregled dokumentacije
│   ├── DEPLOYMENT_GUIDE.md              # 🚀 Glavni deployment vodič
│   ├── DEPLOYMENT_CHECKLIST.md          # ✅ Pre/Post deployment checklist
│   └── OPERATIONS_CHEATSHEET.md         # ⚡ Svakodnevne operacije
│
└── scripts/                             # 🛠️ Deployment i maintenance skripte
    ├── README-BACKUP.md                 # 📖 Backup dokumentacija
    ├── backup-db.sh                     # 💾 Database backup skripta
    ├── backup-files.sh                  # 📁 Files backup skripta
    └── restore-db.sh                    # 🔄 Database restore skripta
```

---

## 📖 Dokumenti po kategorijama

### 🚀 Deployment & Setup

#### [QUICK_DEPLOY.md](/QUICK_DEPLOY.md)
**Brza referenca za deployment u 5 koraka**

Koristi za:
- Brzi pregled deployment procesa
- Quick reference tokom deployment-a
- Najčešće komande i troubleshooting

Dužina: ~5 min čitanja

---

#### [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
**Kompletan, detaljan deployment vodič**

Sadržaj:
- Sistemski zahtevi i priprema servera
- Instalacija zavisnosti (Node.js, PostgreSQL, Nginx, PM2)
- PostgreSQL setup i tuning
- Application deployment
- PM2 process management
- Nginx reverse proxy konfiguracija
- SSL certifikati sa Certbot-om
- Firewall setup (UFW)
- Cron job konfiguracija
- Backup strategija
- Monitoring i logging
- Sigurnosne preporuke
- Detaljni troubleshooting guide

Koristi za:
- Prvi production deployment
- Referenca za sve deployment korake
- Troubleshooting problema

Dužina: ~60 min čitanja i implementacije

---

#### [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
**Pre i post deployment checklist**

Sadržaj:
- Pre-deployment priprema
- Deployment koraci
- Post-deployment verifikacija
- Update procedure
- Sign-off dokumentacija

Koristi za:
- Praćenje napretka tokom deployment-a
- Osiguranje da ništa nije preskočeno
- Dokumentacija completion status-a
- Audit trail

Dužina: Checklist format

---

### ⚡ Operations & Maintenance

#### [OPERATIONS_CHEATSHEET.md](./OPERATIONS_CHEATSHEET.md)
**Brza referenca za svakodnevne operacije**

Sadržaj:
- PM2 komande (start, stop, restart, logs, scaling)
- PostgreSQL queries i management
- Nginx konfiguracija i logs
- SSL/Certbot management
- Firewall (UFW) rules
- System monitoring (disk, CPU, memory)
- Application updates
- Quick troubleshooting guide

Koristi za:
- Svakodnevno upravljanje serverom
- Brzo pronalaženje komandi
- Troubleshooting hitnih problema
- Reference tokom maintenance-a

Dužina: Cheat sheet format - ~10 min pregled

---

### 💾 Backup & Restore

#### [/scripts/README-BACKUP.md](/scripts/README-BACKUP.md)
**Kompletna backup i restore dokumentacija**

Sadržaj:
- Pregled backup skripti
- Setup procedure
- Automatizacija sa cron job-ovima
- Monitoring backup-a
- Restore procedure (database i files)
- Best practices
- Offsite backup strategija
- Troubleshooting

Koristi za:
- Setup backup sistema
- Konfiguracija automatskih backup-a
- Restore procedure
- Disaster recovery planning

Dužina: ~30 min čitanja i setup-a

---

### 🔧 Configuration Files

#### [/ecosystem.config.js](/ecosystem.config.js)
**PM2 process manager konfiguracija**

Sadržaj:
- Cluster mode setup
- Instance scaling konfiguracija
- Logging paths
- Auto-restart postavke
- Memory limits
- Graceful shutdown

Koristi za:
- PM2 deployment
- Performance tuning
- Process management

Format: JavaScript config file

---

## 🗺️ Deployment Flow

```
1. Priprema
   ↓
   QUICK_DEPLOY.md (brzi pregled)
   ↓
2. Deployment
   ↓
   DEPLOYMENT_GUIDE.md (detaljne instrukcije)
   +
   DEPLOYMENT_CHECKLIST.md (praćenje napretka)
   ↓
3. Backup Setup
   ↓
   /scripts/README-BACKUP.md
   ↓
4. Production Management
   ↓
   OPERATIONS_CHEATSHEET.md (svakodnevne operacije)
```

---

## 🎓 Learning Path

### Novi administrator:
1. **Dan 1:** Pročitaj README.md i QUICK_DEPLOY.md
2. **Dan 2-3:** Prati DEPLOYMENT_GUIDE.md i deployuj na test server
3. **Dan 4:** Setup backup-e (README-BACKUP.md)
4. **Dan 5:** Memorize OPERATIONS_CHEATSHEET.md
5. **Dan 6+:** Production deployment sa DEPLOYMENT_CHECKLIST.md

### Iskusan administrator:
1. **30 min:** QUICK_DEPLOY.md
2. **2 sata:** DEPLOYMENT_GUIDE.md (skim za specifičnosti)
3. **1 sat:** Setup backup-a
4. **Go-live:** Koristi DEPLOYMENT_CHECKLIST.md

---

## 🔍 Quick Reference

### Najčešće tražene informacije:

| Pitanje | Gdje naći |
|---------|-----------|
| Kako deployovati aplikaciju? | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |
| Kako restartovati app? | [OPERATIONS_CHEATSHEET.md](./OPERATIONS_CHEATSHEET.md#pm2-komande) |
| Kako uraditi backup? | [README-BACKUP.md](/scripts/README-BACKUP.md) |
| Kako restore-ovati database? | [README-BACKUP.md](/scripts/README-BACKUP.md#restore-procedure) |
| SSL certifikat renewal? | [OPERATIONS_CHEATSHEET.md](./OPERATIONS_CHEATSHEET.md#sslcertbot-komande) |
| 502 Bad Gateway fix? | [OPERATIONS_CHEATSHEET.md](./OPERATIONS_CHEATSHEET.md#quick-troubleshooting) |
| Environment varijable? | [QUICK_DEPLOY.md](/QUICK_DEPLOY.md#-environment-variables-minimum) |
| Update procedure? | [OPERATIONS_CHEATSHEET.md](./OPERATIONS_CHEATSHEET.md#-application-updates) |

---

## 📞 Additional Resources

### Internal Documentation
- [Main README](/README.md) - Project overview
- [Prisma Schema](/prisma/schema.prisma) - Database structure
- [.env.example](/.env.example) - Environment variables template

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [PM2 Docs](https://pm2.keymetrics.io/docs)
- [Nginx Docs](https://nginx.org/en/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Certbot Docs](https://certbot.eff.org/docs/)

---

## 🆘 Getting Help

### Deployment Issues
1. Check [DEPLOYMENT_GUIDE.md - Troubleshooting](./DEPLOYMENT_GUIDE.md#14-troubleshooting)
2. Check [OPERATIONS_CHEATSHEET.md - Quick Troubleshooting](./OPERATIONS_CHEATSHEET.md#-quick-troubleshooting)
3. Review server logs:
   ```bash
   pm2 logs fims
   sudo tail -f /var/log/nginx/fims_error.log
   ```

### Backup/Restore Issues
1. Check [README-BACKUP.md - Troubleshooting](/scripts/README-BACKUP.md#-troubleshooting)
2. Verify permissions and credentials
3. Check backup logs: `tail -f ~/logs/backup.log`

---

## 📝 Maintaining Documentation

Kada update-uješ dokumentaciju:

1. Update version number i "Last Updated" datum
2. Održi konzistentnost između dokumenata
3. Testiraj sve komande prije dodavanja u docs
4. Update INDEX.md (ovaj fajl) ako dodaješ nove dokumente

---

**Index Version:** 1.0.0
**Last Updated:** 2025-01-21
**Documentation Maintainer:** FIMS Team
