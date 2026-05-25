# ⚡ FIMS Quick Deploy Reference

Brza referenca za deployment FIMS aplikacije. Za detaljne instrukcije vidi [/docs/DEPLOYMENT_GUIDE.md](/docs/DEPLOYMENT_GUIDE.md).

---

## 📦 Što trebate

- Ubuntu 22.04+ server sa min. 4GB RAM
- Domena koja pokazuje na server IP
- Root ili sudo pristup

---

## 🚀 Quick Deploy (5 koraka)

### 1️⃣ Priprema servera

```bash
# Update sistema
sudo apt update && sudo apt upgrade -y

# Osnovni alati
sudo apt install -y curl wget git vim build-essential

# Non-root user
sudo adduser fims
sudo usermod -aG sudo fims
su - fims
```

### 2️⃣ Instalacija software-a

```bash
# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 23
nvm use 23

# PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null
sudo apt update
sudo apt install -y postgresql-16

# PM2 i Nginx
npm install -g pm2
sudo apt install -y nginx
```

### 3️⃣ Database setup

```bash
# Kreiranje baze
sudo -i -u postgres psql << EOF
CREATE DATABASE fims;
CREATE USER fims_user WITH ENCRYPTED PASSWORD 'PROMIJENI_OVO';
GRANT ALL PRIVILEGES ON DATABASE fims TO fims_user;
\c fims
GRANT ALL ON SCHEMA public TO fims_user;
EOF
```

### 4️⃣ Aplikacija setup

```bash
# Kloniranje
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/your-username/fims.git
cd fims

# Environment
cp .env.example .env
vim .env  # Popuni sve varijable!

# Build
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Setup upload folder
mkdir -p public/uploads/certificates
chmod 755 public/uploads/certificates

npm run build

# PM2
mkdir -p ~/logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5️⃣ Nginx + SSL

```bash
# Nginx config
sudo vim /etc/nginx/sites-available/fims
# Kopiraj config iz DEPLOYMENT_GUIDE.md

sudo ln -s /etc/nginx/sites-available/fims /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# SSL
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d vasa-domena.com
```

---

## 🔑 Environment Variables (minimum)

```env
DATABASE_URL="postgresql://fims_user:LOZINKA@localhost:5432/fims"
NEXTAUTH_SECRET="$(openssl rand -base64 64)"
NEXTAUTH_URL="https://vasa-domena.com"
NODE_ENV="production"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="email@gmail.com"
SMTP_PASS="app-password"
SMTP_FROM="FIMS <noreply@domena.com>"
SMTP_SECURE="false"

CRON_SECRET="$(openssl rand -base64 32)"

# File Uploads
UPLOAD_DIR="./public/uploads/certificates"
```

---

## 🛠️ Najčešće komande

```bash
# PM2
pm2 status
pm2 logs fims
pm2 restart fims
pm2 monit

# Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/fims_error.log

# Database
sudo -i -u postgres psql -d fims

# Backup
./scripts/backup-db.sh
./scripts/backup-files.sh

# Update aplikacije
cd ~/apps/fims
git pull
npm ci
npm run prisma:migrate
npm run build
pm2 reload fims
```

---

## 📞 Troubleshooting

### App ne radi
```bash
pm2 logs fims --err
pm2 restart fims
```

### 502 Bad Gateway
```bash
pm2 status  # Provjeri da li app radi
sudo nginx -t
sudo systemctl restart nginx
```

### Database error
```bash
PGPASSWORD='lozinka' psql -h localhost -U fims_user -d fims -c "SELECT 1;"
```

---

## 📚 Kompletna dokumentacija

- **[DEPLOYMENT_GUIDE.md](/docs/DEPLOYMENT_GUIDE.md)** - Detaljan deployment guide
- **[OPERATIONS_CHEATSHEET.md](/docs/OPERATIONS_CHEATSHEET.md)** - Svakodnevne operacije
- **[DEPLOYMENT_CHECKLIST.md](/docs/DEPLOYMENT_CHECKLIST.md)** - Pre/post deployment checklist
- **[README-BACKUP.md](/scripts/README-BACKUP.md)** - Backup strategija

---

## ⚠️ Važno nakon deployment-a

1. ✅ Promijeni admin lozinku (default: `admin@fims.local` / `Admin123!`)
2. ✅ Setup backup cron job-ova
3. ✅ Instaliraj Fail2Ban
4. ✅ Onemogući root SSH login
5. ✅ Testiraj sve funkcionalnosti

---

**Version:** 1.0.0
