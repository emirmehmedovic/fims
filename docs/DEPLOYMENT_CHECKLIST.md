# ✅ FIMS Deployment Checklist

Pre-deployment i post-deployment checklist za FIMS aplikaciju.

---

## 📋 Pre-Deployment Checklist

### Server Priprema

- [ ] Server ima adekvatne resurse (min. 4GB RAM, 2 CPU cores, 20GB disk)
- [ ] OS je update-ovan (Ubuntu 22.04 LTS ili noviji)
- [ ] Non-root user kreiran (`fims`)
- [ ] SSH key authentication postavljen
- [ ] Root SSH login onemogućen

### Software Instalacija

- [ ] Node.js v20+ instaliran (via nvm)
- [ ] PostgreSQL 14+ instaliran i pokrenut
- [ ] Nginx instaliran i pokrenut
- [ ] PM2 instaliran globalno
- [ ] Git instaliran
- [ ] Certbot instaliran (za SSL)

### Database Setup

- [ ] PostgreSQL baza `fims` kreirana
- [ ] Database user `fims_user` kreiran sa lozinkom
- [ ] Privileges grant-ovani na bazu
- [ ] PostgreSQL connection testiran
- [ ] `.pgpass` fajl kreiran (za backup skripte)

### Application Setup

- [ ] Repository kloniran u `~/apps/fims`
- [ ] `.env` fajl kreiran iz `.env.example`
- [ ] `DATABASE_URL` pravilno postavljen
- [ ] `NEXTAUTH_SECRET` generisan (64+ chars)
- [ ] `NEXTAUTH_URL` postavljen na production URL
- [ ] `CRON_SECRET` generisan
- [ ] `UPLOAD_DIR` postavljen (default: `./public/uploads/certificates`)
- [ ] SMTP postavke konfigurisane i testirane
- [ ] Dependencies instalirani (`npm ci`)
- [ ] Prisma Client generisan
- [ ] Database migrations pokrenute
- [ ] Database seed-ovan (admin user kreiran)
- [ ] Upload folder kreiran (`public/uploads/certificates`)
- [ ] Upload folder permisije postavljene (`chmod 755`)
- [ ] Next.js build uspješan (`npm run build`)

### DNS & Network

- [ ] DNS A record pokazuje na server IP
- [ ] Domain resolves properly (`nslookup yourdomain.com`)
- [ ] Port 80 dostupan (za Certbot verification)
- [ ] Port 443 dostupan (za HTTPS)
- [ ] Port 22 dostupan (za SSH)

---

## 🚀 Deployment Checklist

### PM2 Configuration

- [ ] `ecosystem.config.js` kreiran i konfigurisan
- [ ] Paths u ecosystem.config.js tačni
- [ ] Log direktorij kreiran (`~/logs`)
- [ ] PM2 aplikacija pokreće se uspješno
- [ ] PM2 status pokazuje "online"
- [ ] PM2 logs nemaju errors
- [ ] PM2 startup script konfigurisan
- [ ] PM2 konfiguracija sačuvana (`pm2 save`)

### Nginx Configuration

- [ ] Nginx config fajl kreiran (`/etc/nginx/sites-available/fims`)
- [ ] Symbolic link kreiran (`/etc/nginx/sites-enabled/fims`)
- [ ] Nginx config test prolazi (`nginx -t`)
- [ ] Server name tačan u konfigu
- [ ] Proxy pass pokazuje na `localhost:3000`
- [ ] Client max body size podešen (50M)
- [ ] Nginx restartovan bez errors

### SSL Certificate

- [ ] Certbot instaliran
- [ ] SSL certifikat dobijen (`certbot --nginx`)
- [ ] HTTPS radi bez browser upozorenja
- [ ] HTTP → HTTPS redirect funkcioniše
- [ ] SSL test prolazi (SSL Labs A rating)
- [ ] Auto-renewal konfigurisan
- [ ] Auto-renewal timer aktivan

### Firewall (UFW)

- [ ] UFW instaliran
- [ ] SSH port (22) dozvoljen **PRIJE enable-ovanja!**
- [ ] HTTP port (80) dozvoljen
- [ ] HTTPS port (443) dozvoljen
- [ ] UFW enabled
- [ ] UFW status verified
- [ ] SSH pristup još uvijek radi nakon enable-ovanja

### Security

- [ ] Fail2Ban instaliran i konfigurisan
- [ ] Root login onemogućen u SSH config
- [ ] Password authentication onemogućen (ako koristiš keys)
- [ ] `.env` fajl ima permisije 600
- [ ] PostgreSQL postgres user lozinka promijenjena
- [ ] Unattended-upgrades konfigurisani (auto security updates)
- [ ] Security headers prisutni (provjerite browser dev tools)

### Backup Configuration

- [ ] Backup direktoriji kreirani (`~/backups/postgres`, `~/backups/files`)
- [ ] Backup skripte executable (`chmod +x`)
- [ ] `.pgpass` pravilno postavljen za backup skripte
- [ ] Manual backup test uspješan (database)
- [ ] Manual backup test uspješan (files)
- [ ] Cron job-ovi konfigurisani za automatic backups
- [ ] Backup logs se kreiraju pravilno
- [ ] Retention policy testiran (stari backup-i se brišu)

### Cron Jobs

- [ ] Auto-send cron job konfigurisan
- [ ] Database backup cron job konfigurisan (npr. 2 AM)
- [ ] Files backup cron job konfigurisan (npr. 3 AM)
- [ ] Cron job-ovi testirani manualno
- [ ] Cron logs se kreiraju (`~/logs/`)
- [ ] Cron service pokrenut (`systemctl status cron`)

---

## ✨ Post-Deployment Checklist

### Application Testing

- [ ] Aplikacija dostupna na HTTPS URL-u
- [ ] Login stranica radi
- [ ] Admin login uspješan sa default kredencijalima
- [ ] Admin lozinka **PROMIJENJENA**
- [ ] Dashboard se učitava
- [ ] Fuel entry kreiranje radi
- [ ] PDF generation radi
- [ ] PDF download radi
- [ ] Email slanje testirano (SMTP)
- [ ] Auto-send funkcionalnost testirana
- [ ] File upload radi (certificates)
- [ ] Warehouse CRUD radi
- [ ] User management radi
- [ ] Master data CRUD radi (suppliers, transporters, etc.)
- [ ] Statistics prikazuju podatke
- [ ] Audit logs se kreiraju

### Performance Testing

- [ ] PM2 monitoring pokazuje normalne metrics
- [ ] Memory usage stabilan (check `pm2 monit`)
- [ ] CPU usage razuman
- [ ] Database connection pool radi
- [ ] Response times prihvatljivi
- [ ] Nginx access logs pokazuju 200 responses
- [ ] Nginx error logs nemaju kritičnih errors

### Monitoring Setup

- [ ] PM2 logs redovno pregledani
- [ ] Nginx logs dostupni i čitljivi
- [ ] PostgreSQL logs dostupni
- [ ] Disk space monitoring setup
- [ ] Backup success monitoring
- [ ] Email alerting setup (opciono)

### Documentation

- [ ] Admin dobio deployment dokumentaciju
- [ ] Default kredencijali podijeljeni sa admin-om
- [ ] Backup procedure dokumentovana i podijeljenja
- [ ] Emergency contacts lista kreirana
- [ ] Server pristup (SSH keys) dokumentovan
- [ ] Database credentials sigurno čuvani (password manager)

---

## 🔄 Update Checklist

Za buduće update-e aplikacije:

- [ ] Git pull latest code
- [ ] Dependencies update (`npm ci`)
- [ ] Database migrations run (ako ih ima)
- [ ] Prisma Client regenerated
- [ ] Build uspješan
- [ ] PM2 reload (zero-downtime)
- [ ] Logs provjereni za errors
- [ ] Smoke test (login, osnovne funkcionalnosti)

---

## 🆘 Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| System Admin | | |
| Database Admin | | |
| App Developer | | |
| Server Provider | | |
| DNS Provider | | |

---

## 📊 Server Information

| Item | Value |
|------|-------|
| Server IP | |
| Domain | |
| SSH User | `fims` |
| App Path | `/home/fims/apps/fims` |
| Database Name | `fims` |
| Database User | `fims_user` |
| Node Version | v23+ |
| PostgreSQL Version | 16+ |
| PM2 App Name | `fims` |
| Backup Location | `/home/fims/backups` |

---

## 📝 Notes

Dodatne napomene tokom deployment-a:

```
[Prostor za bilješke tokom deployment-a]




```

---

## ✅ Sign-Off

| Stage | Date | Signature | Notes |
|-------|------|-----------|-------|
| Pre-Deployment Review | | | |
| Deployment | | | |
| Post-Deployment Testing | | | |
| Production Go-Live | | | |

---

**Checklist Version:** 1.0.0
**Last Updated:** 2025-01-21

---

## 🔗 References

- [Full Deployment Guide](/docs/DEPLOYMENT_GUIDE.md)
- [Operations Cheatsheet](/docs/OPERATIONS_CHEATSHEET.md)
- [Backup Documentation](/scripts/README-BACKUP.md)
