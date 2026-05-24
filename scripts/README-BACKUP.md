# 🔄 FIMS Backup & Restore Scripts

Automatizovane backup i restore skripte za FIMS aplikaciju.

---

## 📋 Dostupne skripte

### 1. `backup-db.sh`
**PostgreSQL database backup skripta**

**Funkcionalnost:**
- Kreira compressed backup PostgreSQL baze
- Automatski retention policy (čisti stare backup-e)
- Logging svih operacija
- Verifikacija uspješnosti backup-a

**Korištenje:**
```bash
# Manualno pokretanje
./scripts/backup-db.sh

# Konfiguracija
# Edituj skriptu i podesi:
# - DB_PASSWORD (ili koristi ~/.pgpass)
# - BACKUP_DIR (gdje se čuvaju backup-i)
# - RETENTION_DAYS (koliko dana čuvati backup-e)
```

**Konfiguracija PostgreSQL password-a (preporučeno):**

Opcija 1 - Korištenje `.pgpass` fajla (sigurnije):
```bash
# Kreiranje .pgpass fajla
echo "localhost:5432:fims:fims_user:YOUR_PASSWORD" > ~/.pgpass

# Permisije
chmod 600 ~/.pgpass
```

Opcija 2 - Hardcode u skripti (manje sigurno):
```bash
# Edituj skriptu
vim scripts/backup-db.sh

# Promijeni liniju:
DB_PASSWORD="your-password-here"
```

**Cron job setup (automatski daily backup):**
```bash
crontab -e
```

Dodaj:
```cron
# Database backup - svaki dan u 2:00
0 2 * * * /home/fims/apps/fims/scripts/backup-db.sh >> /home/fims/logs/backup.log 2>&1
```

**Logovi:**
```bash
# Provjeri backup log
tail -f ~/logs/backup.log

# Lista backup-a
ls -lh ~/backups/postgres/
```

---

### 2. `backup-files.sh`
**Application files backup skripta**

**Funkcionalnost:**
- Backup-uje važne app fajlove (uploads, .env, configs)
- Compressed tar.gz arhiva
- Automatski retention policy
- Logging

**Šta se backup-uje:**
- `public/uploads/` - Upload-ovani fajlovi (certifikati)
- `.env` - Environment varijable
- `ecosystem.config.js` - PM2 konfiguracija
- `prisma/schema.prisma` - Database schema

**Korištenje:**
```bash
# Manualno pokretanje
./scripts/backup-files.sh

# Konfiguracija
# Edituj skriptu i podesi:
# - APP_DIR (putanja do aplikacije)
# - BACKUP_DIR (gdje se čuvaju backup-i)
# - RETENTION_DAYS (koliko dana čuvati)
```

**Cron job setup:**
```bash
crontab -e
```

Dodaj:
```cron
# Files backup - svaki dan u 3:00
0 3 * * * /home/fims/apps/fims/scripts/backup-files.sh >> /home/fims/logs/backup.log 2>&1
```

**Provjera backup-a:**
```bash
# Lista backup-a
ls -lh ~/backups/files/

# Pregled sadržaja backup-a
tar -tzf ~/backups/files/fims_files_YYYYMMDD_HHMMSS.tar.gz
```

---

### 3. `restore-db.sh`
**Database restore skripta**

**Funkcionalnost:**
- Restore-uje database iz backup fajla
- Kreira safety backup prije restore-a
- Interaktivno potvrđivanje (da ne bi slučajno)
- Logging svih operacija

**⚠️ UPOZORENJE:**
Ova skripta će PREBRISATI trenutnu bazu! Koristi samo kada si siguran!

**Korištenje:**
```bash
# Restore iz backup-a
./scripts/restore-db.sh /home/fims/backups/postgres/fims_backup_20250121_120000.sql.gz

# Skripta će:
# 1. Kreirati safety backup trenutne baze
# 2. Pitati za potvrdu
# 3. Restore-ovati iz zadatog backup-a
# 4. Verifikovati uspješnost
```

**Konfiguracija:**
```bash
# Edituj skriptu i podesi:
# - DB_PASSWORD (ili koristi ~/.pgpass kao i kod backup-a)
```

**Nakon uspješnog restore-a:**
```bash
# Restart aplikacije
pm2 restart fims

# Provjeri da sve radi
pm2 logs fims
```

---

## 🔧 Setup procedure

### 1. Inicijalni setup

```bash
# Kreiranje potrebnih direktorija
mkdir -p ~/backups/postgres
mkdir -p ~/backups/files
mkdir -p ~/logs

# Permisije na skripte (već uradjeno)
chmod +x ~/apps/fims/scripts/*.sh
```

### 2. Konfiguracija PostgreSQL pristupa

**Preporučena metoda - .pgpass fajl:**
```bash
# Kreiranje .pgpass
echo "localhost:5432:fims:fims_user:VAŠA_LOZINKA" > ~/.pgpass

# Važne permisije!
chmod 600 ~/.pgpass

# Test
psql -h localhost -U fims_user -d fims -c "SELECT 1;"
```

### 3. Test backup skripti

```bash
# Test database backup
./scripts/backup-db.sh

# Provjeri da li je uspjelo
ls -lh ~/backups/postgres/

# Test files backup
./scripts/backup-files.sh

# Provjeri
ls -lh ~/backups/files/
```

### 4. Setup cron job-ova

```bash
crontab -e
```

Dodaj:
```cron
# FIMS Automated Backups

# Database backup - svaki dan u 2:00 AM
0 2 * * * /home/fims/apps/fims/scripts/backup-db.sh >> /home/fims/logs/backup.log 2>&1

# Files backup - svaki dan u 3:00 AM
0 3 * * * /home/fims/apps/fims/scripts/backup-files.sh >> /home/fims/logs/backup.log 2>&1
```

### 5. Verifikacija cron job-ova

```bash
# Lista cron job-ova
crontab -l

# Check cron service
sudo systemctl status cron

# Monitor logs sutra nakon scheduled time-a
tail -f ~/logs/backup.log
```

---

## 📊 Monitoring backup-a

### Check backup status

```bash
# Posljednji database backup
ls -lht ~/backups/postgres/ | head -5

# Posljednji files backup
ls -lht ~/backups/files/ | head -5

# Total backup size
du -sh ~/backups/
```

### Check backup logs

```bash
# Real-time monitoring
tail -f ~/logs/backup.log

# Posljednjih 50 linija
tail -n 50 ~/logs/backup.log

# Provjeri za errors
grep -i "error" ~/logs/backup.log
grep -i "failed" ~/logs/backup.log
```

### Backup statistike

```bash
# Broj database backup-a
find ~/backups/postgres/ -name "fims_backup_*.sql.gz" | wc -l

# Broj files backup-a
find ~/backups/files/ -name "fims_files_*.tar.gz" | wc -l

# Najstariji backup
find ~/backups/postgres/ -name "fims_backup_*.sql.gz" -type f | sort | head -1

# Najnoviji backup
find ~/backups/postgres/ -name "fims_backup_*.sql.gz" -type f | sort | tail -1
```

---

## 🔄 Restore procedure

### 1. Database restore

```bash
# 1. Lista dostupnih backup-a
ls -lh ~/backups/postgres/

# 2. Odaberi backup koji želiš restore-ovati
BACKUP_FILE=~/backups/postgres/fims_backup_20250121_020000.sql.gz

# 3. Stop aplikaciju (opciono ali preporučeno)
pm2 stop fims

# 4. Restore
./scripts/restore-db.sh $BACKUP_FILE

# 5. Restart aplikacije
pm2 restart fims

# 6. Provjeri logs
pm2 logs fims
```

### 2. Files restore

```bash
# 1. Lista dostupnih backup-a
ls -lh ~/backups/files/

# 2. Stop aplikaciju
pm2 stop fims

# 3. Restore (manual)
cd ~/apps/fims
tar -xzf ~/backups/files/fims_files_20250121_030000.tar.gz

# 4. Restart aplikacije
pm2 restart fims
```

### 3. Full restore (database + files)

```bash
# 1. Stop aplikaciju
pm2 stop fims

# 2. Restore database
./scripts/restore-db.sh ~/backups/postgres/fims_backup_20250121_020000.sql.gz

# 3. Restore files
cd ~/apps/fims
tar -xzf ~/backups/files/fims_files_20250121_030000.tar.gz

# 4. Restart aplikacije
pm2 restart fims

# 5. Provjeri sve funkcionalnosti
```

---

## 📝 Best practices

### Backup strategija

1. **Automatizacija:** Uvijek koristi cron job-ove za automatic backup-e
2. **Retention:** Čuvaj backup-e minimalno 7 dana (podesi prema potrebama)
3. **Offsite backup:** Redovno kopiraj backup-e na drugi server/cloud
4. **Testiranje:** Periodično testiraj restore procedure
5. **Monitoring:** Provjeravaj logs da li backup-i uspijevaju

### Retention policy preporuke

| Type | Retention |
|------|-----------|
| Daily backups | 7 dana |
| Weekly backups | 4 sedmice |
| Monthly backups | 12 mjeseci |
| Yearly backups | 5 godina (compliance) |

### Offsite backup

**Kopiraj backup-e na remote server:**
```bash
# Rsync na remote server (setup SSH keys prvo)
rsync -avz ~/backups/ remote-server:/backups/fims/

# Ili koristi cron
crontab -e

# Add:
# Offsite backup - svaki dan u 5:00 AM
0 5 * * * rsync -avz ~/backups/ remote-server:/backups/fims/ >> ~/logs/offsite-backup.log 2>&1
```

**Kopiraj na cloud (AWS S3 primjer):**
```bash
# Install AWS CLI
sudo apt install -y awscli

# Configure
aws configure

# Sync to S3
aws s3 sync ~/backups/ s3://your-bucket/fims-backups/

# Cron job
0 6 * * * aws s3 sync ~/backups/ s3://your-bucket/fims-backups/ >> ~/logs/s3-backup.log 2>&1
```

---

## 🆘 Troubleshooting

### Backup fails - "Permission denied"

```bash
# Fix permissions
chmod 700 ~/backups/postgres
chmod 700 ~/backups/files

# Fix script permissions
chmod +x ~/apps/fims/scripts/*.sh
```

### Backup fails - "Authentication failed"

```bash
# Check .pgpass
cat ~/.pgpass
chmod 600 ~/.pgpass

# Test database connection
psql -h localhost -U fims_user -d fims -c "SELECT 1;"
```

### Restore fails - "Database is being accessed"

```bash
# Stop aplikaciju
pm2 stop fims

# Terminate connections
sudo -i -u postgres psql -d fims -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'fims' AND pid <> pg_backend_pid();
"

# Try restore again
```

### Disk space full

```bash
# Check disk space
df -h

# Clean old backups manually
find ~/backups/postgres/ -name "fims_backup_*.sql.gz" -mtime +30 -delete
find ~/backups/files/ -name "fims_files_*.tar.gz" -mtime +30 -delete

# Clean logs
pm2 flush
sudo journalctl --vacuum-time=7d
```

---

## 📞 Support

Za dodatna pitanja oko backup-a i restore-a, vidi:
- [DEPLOYMENT_GUIDE.md](../docs/DEPLOYMENT_GUIDE.md#11-backup-strategija)
- [OPERATIONS_CHEATSHEET.md](../docs/OPERATIONS_CHEATSHEET.md#-backup-komande)

---

**Version:** 1.0.0
**Last Updated:** 2025-01-21
