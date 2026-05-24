# 🚀 FIMS Deployment Guide

Kompletan vodič za deployment FIMS (Fuel Inventory Management System) aplikacije na production server.

---

## 📋 Sadržaj

1. [Sistemski zahtevi](#sistemski-zahtevi)
2. [Priprema servera](#priprema-servera)
3. [Instalacija zavisnosti](#instalacija-zavisnosti)
4. [PostgreSQL setup](#postgresql-setup)
5. [Deployment aplikacije](#deployment-aplikacije)
6. [PM2 konfiguracija](#pm2-konfiguracija)
7. [Nginx reverse proxy](#nginx-reverse-proxy)
8. [SSL certifikat (Certbot)](#ssl-certifikat-certbot)
9. [Firewall konfiguracija](#firewall-konfiguracija)
10. [Cron job setup](#cron-job-setup)
11. [Backup strategija](#backup-strategija)
12. [Monitoring i logging](#monitoring-i-logging)
13. [Sigurnosne preporuke](#sigurnosne-preporuke)
14. [Troubleshooting](#troubleshooting)

---

## 1. Sistemski zahtevi

### Minimum specifikacije:
- **OS:** Ubuntu 22.04 LTS ili noviji / Debian 11+
- **CPU:** 2 cores (4+ preporučeno)
- **RAM:** 4GB (8GB+ preporučeno)
- **Disk:** 20GB+ SSD
- **Network:** Javna IP adresa i pristup portovima 80, 443

### Softver:
- **Node.js:** v20.x ili noviji (v23+ preporučeno)
- **PostgreSQL:** 14+ (16 preporučeno)
- **Nginx:** 1.18+
- **PM2:** Latest
- **Git:** Latest

---

## 2. Priprema servera

### 2.1 Inicijalni login i update

```bash
# SSH u server
ssh root@your-server-ip

# Update sistema
apt update && apt upgrade -y

# Instalacija osnovnih alata
apt install -y curl wget git vim htop ufw build-essential
```

### 2.2 Kreiranje non-root korisnika

```bash
# Kreiranje novog korisnika
adduser fims

# Dodavanje u sudo grupu
usermod -aG sudo fims

# Switching to new user
su - fims
```

### 2.3 SSH key setup (opciono ali preporučeno)

```bash
# Na svom lokalnom računaru generišite SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Kopirajte public key na server
ssh-copy-id fims@your-server-ip
```

---

## 3. Instalacija zavisnosti

### 3.1 Node.js instalacija (via nvm)

```bash
# Instalacija NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell
source ~/.bashrc

# Instalacija Node.js
nvm install 23
nvm use 23
nvm alias default 23

# Verifikacija
node --version  # Should show v23.x.x
npm --version   # Should show 10.x.x
```

### 3.2 PostgreSQL instalacija

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import signing key
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null

# Update and install
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Verifikacija
sudo systemctl status postgresql

# Omogući auto-start
sudo systemctl enable postgresql
```

### 3.3 PM2 instalacija

```bash
# Globalna instalacija PM2
npm install -g pm2

# Setup PM2 startup script
pm2 startup systemd
# (Izvršite komandu koju PM2 outputuje)

# Verifikacija
pm2 --version
```

### 3.4 Nginx instalacija

```bash
sudo apt install -y nginx

# Start i enable
sudo systemctl start nginx
sudo systemctl enable nginx

# Verifikacija
sudo systemctl status nginx
```

---

## 4. PostgreSQL setup

### 4.1 Kreiranje baze i korisnika

```bash
# Login kao postgres user
sudo -i -u postgres

# Pristup PostgreSQL CLI
psql

# Kreiranje baze i korisnika
CREATE DATABASE fims;
CREATE USER fims_user WITH ENCRYPTED PASSWORD 'SIGURNA_LOZINKA_OVDE';
GRANT ALL PRIVILEGES ON DATABASE fims TO fims_user;

# PostgreSQL 15+ dodatno trebaju:
\c fims
GRANT ALL ON SCHEMA public TO fims_user;
GRANT CREATE ON SCHEMA public TO fims_user;

# Exit
\q
exit
```

### 4.2 PostgreSQL tuning (opciono)

```bash
sudo vim /etc/postgresql/16/main/postgresql.conf
```

Preporučene izmjene za 4GB RAM:
```ini
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
max_connections = 100
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 4.3 Omogućavanje remote pristupa (ako treba)

```bash
sudo vim /etc/postgresql/16/main/postgresql.conf
```

Promjena:
```ini
listen_addresses = 'localhost'  # ili '*' za sve interfejse
```

```bash
sudo vim /etc/postgresql/16/main/pg_hba.conf
```

Dodaj liniju:
```
host    fims    fims_user    127.0.0.1/32    md5
```

```bash
sudo systemctl restart postgresql
```

---

## 5. Deployment aplikacije

### 5.1 Kreiranje direktorija

```bash
# Kreiranje app direktorija
mkdir -p ~/apps
cd ~/apps

# Kloniranje projekta
git clone https://github.com/your-username/fims.git
cd fims
```

### 5.2 Environment varijable

```bash
# Kreiranje .env fajla
cp .env.example .env
vim .env
```

**BITNO:** Popunite sve varijable:

```env
# Database
DATABASE_URL="postgresql://fims_user:SIGURNA_LOZINKA_OVDE@localhost:5432/fims"

# NextAuth
NEXTAUTH_SECRET="GENERISITE_RANDOM_STRING_64_KARAKTERA"
NEXTAUTH_URL="https://vasa-domena.com"

# Upstash Redis (OPCIONO - za rate limiting)
# Ako ne koristite, ostavite prazno ili komentirajte
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Node Environment
NODE_ENV="production"

# SMTP (za auto-send email funkcionalnost)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="FIMS <no-reply@yourdomain.com>"
SMTP_SECURE="false"

# Cron (za scheduled tasks)
CRON_SECRET="GENERISITE_DRUGI_RANDOM_STRING"
```

**Generisanje sigurnih secret-a:**
```bash
# Za NEXTAUTH_SECRET
openssl rand -base64 64

# Za CRON_SECRET
openssl rand -base64 32
```

### 5.3 Instalacija dependencies

```bash
npm ci --production=false
```

### 5.4 Prisma setup

```bash
# Generisanje Prisma Client-a
npm run prisma:generate

# Pokretanje migracija
npm run prisma:migrate

# Seed baze (kreira admin korisnika)
npm run prisma:seed
```

**Default admin kredencijali nakon seed-a:**
- Email: `admin@fims.local`
- Password: `Admin123!`

⚠️ **BITNO:** Promijenite admin lozinku odmah nakon prvog logina!

### 5.5 Build aplikacije

```bash
npm run build
```

Verifikacija build-a:
```bash
ls -lh .next/
```

### 5.6 Test lokalno

```bash
# Test run
npm start
```

Otvori drugi terminal i testiraj:
```bash
curl http://localhost:3000
```

Ako radi, zaustavi sa `Ctrl+C`.

---

## 6. PM2 konfiguracija

### 6.1 Kreiranje PM2 ecosystem fajla

```bash
vim ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'fims',
    script: 'npm',
    args: 'start',
    cwd: '/home/fims/apps/fims',
    instances: 2,  // Broj instanci (2x CPU cores optimalno)
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/fims/logs/fims-error.log',
    out_file: '/home/fims/logs/fims-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    time: true
  }]
}
```

### 6.2 Kreiranje logs direktorija

```bash
mkdir -p ~/logs
```

### 6.3 Pokretanje aplikacije sa PM2

```bash
# Start aplikacije
pm2 start ecosystem.config.js

# Provera statusa
pm2 status

# Logs
pm2 logs fims

# Monitoring
pm2 monit
```

### 6.4 Čuvanje PM2 procesa

```bash
# Sačuvaj trenutnu konfiguraciju
pm2 save

# Setup auto-restart pri reboot-u
pm2 startup systemd
# (Izvršite komandu koju PM2 outputuje ako već niste)
```

### 6.5 Korisne PM2 komande

```bash
# Restart aplikacije
pm2 restart fims

# Stop aplikacije
pm2 stop fims

# Delete iz PM2
pm2 delete fims

# Reload bez downtime-a
pm2 reload fims

# Flush logs
pm2 flush

# Monitor CPU/Memory
pm2 monit
```

---

## 7. Nginx reverse proxy

### 7.1 Kreiranje Nginx konfiguracije

```bash
sudo vim /etc/nginx/sites-available/fims
```

**Početna HTTP konfiguracija (prije SSL-a):**

```nginx
# Redirect HTTP to HTTPS (dodati kasnije nakon SSL-a)
server {
    listen 80;
    listen [::]:80;
    server_name vasa-domena.com www.vasa-domena.com;

    # Za sada, proxy na aplikaciju
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Client max body size (za PDF/file uploads)
    client_max_body_size 50M;

    # Access and error logs
    access_log /var/log/nginx/fims_access.log;
    error_log /var/log/nginx/fims_error.log;
}
```

### 7.2 Aktiviranje konfiguracije

```bash
# Kreiranje symbolic link
sudo ln -s /etc/nginx/sites-available/fims /etc/nginx/sites-enabled/

# Test konfiguracije
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7.3 Testiranje

```bash
curl -I http://vasa-domena.com
```

---

## 8. SSL certifikat (Certbot)

### 8.1 Instalacija Certbot

```bash
# Install snapd (ako već nije)
sudo apt install -y snapd
sudo snap install core
sudo snap refresh core

# Install Certbot
sudo snap install --classic certbot

# Link certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 8.2 Dobijanje SSL certifikata

**BITNO:** Prije nego pokrenete Certbot:
1. DNS zapis (A record) mora pokazivati na vaš server IP
2. Firewall mora dozvoliti portove 80 i 443
3. Nginx mora biti pokrenut

```bash
# Automatsko dobijanje i konfiguracija SSL-a
sudo certbot --nginx -d vasa-domena.com -d www.vasa-domena.com
```

Certbot će:
- Dobiti SSL certifikat od Let's Encrypt
- Automatski konfigurisati Nginx za HTTPS
- Podesiti HTTP -> HTTPS redirect

### 8.3 Verifikacija SSL-a

```bash
# Provjera SSL konfiguracije
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Test
curl -I https://vasa-domena.com
```

### 8.4 Auto-renewal setup

Certbot automatski kreira cron job za renewal. Verifikacija:

```bash
# Test renewal
sudo certbot renew --dry-run

# Provjera timer-a
sudo systemctl status snap.certbot.renew.timer
```

### 8.5 Finalna Nginx konfiguracija (nakon SSL-a)

Certbot će automatski kreirati SSL konfiguraciju. Provjeri:

```bash
sudo cat /etc/nginx/sites-available/fims
```

Trebala bi izgledati otprilike ovako:

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name vasa-domena.com www.vasa-domena.com;

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name vasa-domena.com www.vasa-domena.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/vasa-domena.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vasa-domena.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Client max body size
    client_max_body_size 50M;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Access and error logs
    access_log /var/log/nginx/fims_access.log;
    error_log /var/log/nginx/fims_error.log;
}
```

---

## 9. Firewall konfiguracija

### 9.1 UFW setup

```bash
# Check UFW status
sudo ufw status

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (BITNO - prvo ovo!)
sudo ufw allow 22/tcp
# Ili za specifičnu IP:
# sudo ufw allow from YOUR_IP_ADDRESS to any port 22

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status numbered
```

### 9.2 Rate limiting (opciono)

```bash
# Rate limit SSH
sudo ufw limit 22/tcp
```

---

## 10. Cron job setup

FIMS ima auto-send funkcionalnost koja koristi cron job za slanje izvještaja.

### 10.1 Kreiranje cron job-a

```bash
# Edit crontab
crontab -e
```

Dodaj liniju (primjer: svaki dan u 8:00):

```cron
# FIMS Auto-send - svaki dan u 8:00
0 8 * * * curl -X POST https://vasa-domena.com/api/cron/auto-send \
  -H "Authorization: Bearer VAŠ_CRON_SECRET_IZ_ENV" \
  -H "Content-Type: application/json" \
  -d '{"dateFrom":"2025-01-01","dateTo":"2025-12-31","includeCertificates":true}' \
  >> /home/fims/logs/cron-auto-send.log 2>&1
```

**Primjeri cron rasporeda:**
```cron
# Svaki dan u 8:00
0 8 * * *

# Svaki radni dan (pon-pet) u 9:00
0 9 * * 1-5

# Prvog dana u mjesecu u 10:00
0 10 1 * *

# Svaki sat
0 * * * *
```

### 10.2 Testiranje cron job-a manualno

```bash
curl -X POST https://vasa-domena.com/api/cron/auto-send \
  -H "Authorization: Bearer VAŠ_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFrom": "2025-01-01",
    "dateTo": "2025-12-31",
    "includeCertificates": true
  }'
```

### 10.3 Monitoring cron logova

```bash
tail -f ~/logs/cron-auto-send.log
```

---

## 11. Backup strategija

### 11.1 Database backup script

```bash
mkdir -p ~/backups
vim ~/backups/backup-db.sh
```

```bash
#!/bin/bash

# Configuration
DB_NAME="fims"
DB_USER="fims_user"
BACKUP_DIR="/home/fims/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fims_backup_$DATE.sql.gz"
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD='VAŠA_DB_LOZINKA' pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "[$DATE] Database backup successful: $BACKUP_FILE"

    # Delete old backups
    find $BACKUP_DIR -name "fims_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "[$DATE] Old backups cleaned up (retention: $RETENTION_DAYS days)"
else
    echo "[$DATE] Database backup FAILED!"
    exit 1
fi
```

```bash
# Učini executable
chmod +x ~/backups/backup-db.sh

# Test
~/backups/backup-db.sh
```

### 11.2 Application files backup

```bash
vim ~/backups/backup-files.sh
```

```bash
#!/bin/bash

# Configuration
APP_DIR="/home/fims/apps/fims"
BACKUP_DIR="/home/fims/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fims_files_$DATE.tar.gz"
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup uploads and important files
tar -czf $BACKUP_FILE \
    -C $APP_DIR \
    public/uploads \
    .env \
    ecosystem.config.js

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "[$DATE] Files backup successful: $BACKUP_FILE"

    # Delete old backups
    find $BACKUP_DIR -name "fims_files_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    echo "[$DATE] Old file backups cleaned up (retention: $RETENTION_DAYS days)"
else
    echo "[$DATE] Files backup FAILED!"
    exit 1
fi
```

```bash
chmod +x ~/backups/backup-files.sh
```

### 11.3 Automatski backup sa cron-om

```bash
crontab -e
```

```cron
# Database backup - svaki dan u 2:00
0 2 * * * /home/fims/backups/backup-db.sh >> /home/fims/logs/backup.log 2>&1

# Files backup - svaki dan u 3:00
0 3 * * * /home/fims/backups/backup-files.sh >> /home/fims/logs/backup.log 2>&1
```

### 11.4 Restore procedure

**Database restore:**
```bash
# Restore iz backup-a
gunzip -c /home/fims/backups/postgres/fims_backup_YYYYMMDD_HHMMSS.sql.gz | \
  PGPASSWORD='VAŠA_DB_LOZINKA' psql -h localhost -U fims_user -d fims
```

**Files restore:**
```bash
# Restore files
cd /home/fims/apps/fims
tar -xzf /home/fims/backups/files/fims_files_YYYYMMDD_HHMMSS.tar.gz
```

---

## 12. Monitoring i logging

### 12.1 PM2 monitoring

```bash
# Real-time monitoring
pm2 monit

# List procesa
pm2 list

# Detaljni info
pm2 info fims

# CPU i Memory usage
pm2 status
```

### 12.2 Log management

**Application logs:**
```bash
# Real-time logs
pm2 logs fims

# Samo errors
pm2 logs fims --err

# Poslednje linije
pm2 logs fims --lines 100

# Flush logs
pm2 flush
```

**Nginx logs:**
```bash
# Access log
sudo tail -f /var/log/nginx/fims_access.log

# Error log
sudo tail -f /var/log/nginx/fims_error.log
```

**PostgreSQL logs:**
```bash
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 12.3 Disk usage monitoring

```bash
# Ukupan disk usage
df -h

# Direktorij size
du -sh ~/apps/fims
du -sh ~/backups
du -sh ~/logs

# Najveći fajlovi
du -ah ~/apps/fims | sort -rh | head -20
```

### 12.4 Log rotation

Nginx već ima log rotation. Za PM2 logs:

```bash
pm2 install pm2-logrotate

# Konfiguracija (opciono)
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## 13. Sigurnosne preporuke

### 13.1 Disable root SSH login

```bash
sudo vim /etc/ssh/sshd_config
```

Promijeni:
```
PermitRootLogin no
PasswordAuthentication no  # Ako koristiš SSH keys
```

```bash
sudo systemctl restart sshd
```

### 13.2 Fail2Ban instalacija

```bash
sudo apt install -y fail2ban

# Kreiranje lokalne konfiguracije
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vim /etc/fail2ban/jail.local
```

Osnovna konfiguracija:
```ini
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600
```

```bash
# Start i enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### 13.3 Redovni update-i

```bash
# Automatski security update-i
sudo apt install -y unattended-upgrades

# Konfiguracija
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 13.4 Environment variables zaštita

```bash
# Permisije na .env fajl
chmod 600 ~/apps/fims/.env

# Provjera
ls -la ~/apps/fims/.env
```

### 13.5 PostgreSQL security

```bash
# Promjena postgres user lozinke
sudo -i -u postgres
psql

ALTER USER postgres WITH PASSWORD 'NOVA_JAKA_LOZINKA';
\q
exit
```

---

## 14. Troubleshooting

### 14.1 Aplikacija se ne pokreće

**Check PM2 status:**
```bash
pm2 status
pm2 logs fims --err --lines 50
```

**Česti uzroci:**
1. Pogrešne environment varijable
2. Database connection error
3. Port već zauzet
4. Nedovoljno memory-a

**Rješenje:**
```bash
# Provjeri .env
cat ~/apps/fims/.env

# Provjeri database
PGPASSWORD='lozinka' psql -h localhost -U fims_user -d fims -c "SELECT 1;"

# Provjeri port
sudo lsof -i :3000

# Restart aplikacije
pm2 restart fims
```

### 14.2 502 Bad Gateway (Nginx)

**Uzroci:**
- PM2 aplikacija nije pokrenuta
- Port mismatch
- Timeout

**Rješenje:**
```bash
# Provjeri PM2
pm2 status

# Provjeri Nginx konfiguraciju
sudo nginx -t

# Restart oboje
pm2 restart fims
sudo systemctl restart nginx
```

### 14.3 SSL problemi

```bash
# Provjeri certifikat
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Test SSL
curl -vI https://vasa-domena.com
```

### 14.4 Database problemi

**Connection timeout:**
```bash
# Provjeri da li PostgreSQL radi
sudo systemctl status postgresql

# Restart
sudo systemctl restart postgresql
```

**Migrations failed:**
```bash
cd ~/apps/fims
npm run prisma:migrate
```

**Schema mismatch:**
```bash
npm run prisma:generate
pm2 restart fims
```

### 14.5 Performance problemi

**High CPU:**
```bash
# Provjeri PM2 metrics
pm2 monit

# Provjeri procese
top
htop
```

**High Memory:**
```bash
# Restart aplikacije
pm2 restart fims

# Provjeri memory limit u ecosystem.config.js
```

**Slow database:**
```bash
# Check active queries
sudo -i -u postgres
psql -d fims

SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

# Kill slow query
SELECT pg_terminate_backend(pid);
```

### 14.6 Log problemi

**Logs preveliki:**
```bash
# Flush PM2 logs
pm2 flush

# Manualno brisanje
rm -rf ~/logs/*.log

# Restart log rotation
pm2 restart pm2-logrotate
```

### 14.7 Disk space

```bash
# Check disk usage
df -h

# Najceći fajlovi
du -ah /home/fims | sort -rh | head -20

# Clean APT cache
sudo apt clean
sudo apt autoclean

# Clean old logs
sudo journalctl --vacuum-time=7d
```

---

## 📝 Deployment checklist

Pre go-live, provjeri:

- [ ] Server ima dovoljno resursa (CPU, RAM, Disk)
- [ ] Node.js, PostgreSQL, Nginx, PM2 instalirani
- [ ] PostgreSQL baza kreirana i konfigurirana
- [ ] DNS A record pokazuje na server IP
- [ ] `.env` fajl popunjen sa svim varijablama
- [ ] `NEXTAUTH_SECRET` i `CRON_SECRET` generirani i jaki
- [ ] Database migracije pokrenute
- [ ] Admin korisnik kreiran (prisma seed)
- [ ] Next.js build uspješan
- [ ] PM2 aplikacija radi (`pm2 status`)
- [ ] Nginx reverse proxy konfigurisan
- [ ] SSL certifikat instaliran (Certbot)
- [ ] HTTPS radi bez upozorenja
- [ ] Firewall (UFW) omogućen
- [ ] Fail2Ban instaliran
- [ ] Root SSH login onemogućen
- [ ] Backup script-ovi kreirani i testirani
- [ ] Cron job-ovi konfigurisani
- [ ] Log rotation setup
- [ ] Default admin lozinka promijenjena
- [ ] SMTP postavke testirane
- [ ] Auto-send funkcionalnost testirana

---

## 🔄 Update procedure

Kada deployment-uješ novu verziju:

```bash
# 1. Pull latest code
cd ~/apps/fims
git pull origin main

# 2. Install new dependencies (ako ih ima)
npm ci --production=false

# 3. Run migrations (ako ih ima)
npm run prisma:migrate

# 4. Generate Prisma Client
npm run prisma:generate

# 5. Build
npm run build

# 6. Reload PM2 (zero-downtime)
pm2 reload fims

# 7. Check logs
pm2 logs fims --lines 50
```

---

## 🆘 Support i kontakt

Za pitanja ili probleme:

- **Email:** admin@fims.local
- **GitHub Issues:** [Link ka repo]
- **Dokumentacija:** `/docs` direktorijum

---

**Version:** 1.0.0
**Last Updated:** 2025-01-21
**Author:** FIMS Team
