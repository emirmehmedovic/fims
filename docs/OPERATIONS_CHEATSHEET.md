# 🚀 FIMS Operations Cheatsheet

Brzi referentni vodič za svakodnevne operacije na production serveru.

---

## 🔐 SSH pristup

```bash
# Login na server
ssh fims@your-server-ip

# Sa SSH key-em
ssh -i ~/.ssh/id_ed25519 fims@your-server-ip
```

---

## 📦 PM2 komande

### Osnovne operacije

```bash
# Status svih aplikacija
pm2 status

# Detaljne informacije
pm2 info fims

# Real-time monitoring
pm2 monit

# Lista procesa
pm2 list
```

### Start/Stop/Restart

```bash
# Start aplikacije
pm2 start ecosystem.config.js

# Restart
pm2 restart fims

# Stop
pm2 stop fims

# Delete iz PM2
pm2 delete fims

# Reload (zero-downtime restart)
pm2 reload fims

# Restart all
pm2 restart all
```

### Logs

```bash
# Real-time logs
pm2 logs fims

# Poslednje 100 linija
pm2 logs fims --lines 100

# Samo error logs
pm2 logs fims --err

# Samo output logs
pm2 logs fims --out

# Flush all logs
pm2 flush

# Clear logs za jednu app
pm2 flush fims
```

### Scaling

```bash
# Scale na 4 instance
pm2 scale fims 4

# Scale +2 instance
pm2 scale fims +2

# Scale -1 instance
pm2 scale fims -1
```

### Persist i Startup

```bash
# Sačuvaj trenutnu konfiguraciju
pm2 save

# Setup startup script
pm2 startup

# Unstartup
pm2 unstartup systemd
```

---

## 🗄️ PostgreSQL komande

### Connection

```bash
# Login kao postgres user
sudo -i -u postgres
psql

# Direktan login u fims bazu
sudo -i -u postgres psql -d fims

# Sa custom user-om
PGPASSWORD='lozinka' psql -h localhost -U fims_user -d fims
```

### Database queries

```sql
-- Lista baza
\l

-- Connect to database
\c fims

-- Lista tabela
\dt

-- Describe table
\d users

-- Count users
SELECT COUNT(*) FROM users;

-- Recent fuel entries
SELECT * FROM fuel_entries ORDER BY created_at DESC LIMIT 10;

-- Database size
SELECT pg_size_pretty(pg_database_size('fims'));

-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'fims';

-- Kill query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = 12345;

-- Exit
\q
```

### Backup i Restore

```bash
# Manual backup
PGPASSWORD='lozinka' pg_dump -h localhost -U fims_user -d fims > backup.sql

# Compressed backup
PGPASSWORD='lozinka' pg_dump -h localhost -U fims_user -d fims | gzip > backup.sql.gz

# Restore
PGPASSWORD='lozinka' psql -h localhost -U fims_user -d fims < backup.sql

# Restore from compressed
gunzip -c backup.sql.gz | PGPASSWORD='lozinka' psql -h localhost -U fims_user -d fims
```

---

## 🌐 Nginx komande

### Service management

```bash
# Status
sudo systemctl status nginx

# Start
sudo systemctl start nginx

# Stop
sudo systemctl stop nginx

# Restart
sudo systemctl restart nginx

# Reload (bez downtime-a)
sudo systemctl reload nginx

# Enable on boot
sudo systemctl enable nginx
```

### Configuration

```bash
# Test konfiguracije
sudo nginx -t

# Edituj site config
sudo vim /etc/nginx/sites-available/fims

# Provjeri active sites
ls -la /etc/nginx/sites-enabled/
```

### Logs

```bash
# Access log (real-time)
sudo tail -f /var/log/nginx/fims_access.log

# Error log (real-time)
sudo tail -f /var/log/nginx/fims_error.log

# Last 100 lines
sudo tail -n 100 /var/log/nginx/fims_access.log

# Search for errors
sudo grep "error" /var/log/nginx/fims_error.log

# Count 502 errors
sudo grep "502" /var/log/nginx/fims_access.log | wc -l
```

---

## 🔒 SSL/Certbot komande

```bash
# Lista certifikata
sudo certbot certificates

# Renew all certificates
sudo certbot renew

# Force renew
sudo certbot renew --force-renewal

# Dry run (test)
sudo certbot renew --dry-run

# Renew specific domain
sudo certbot renew --cert-name vasa-domena.com

# Delete certificate
sudo certbot delete --cert-name vasa-domena.com

# Check auto-renewal timer
sudo systemctl status snap.certbot.renew.timer
```

---

## 🔥 Firewall (UFW)

```bash
# Status
sudo ufw status
sudo ufw status numbered
sudo ufw status verbose

# Enable/Disable
sudo ufw enable
sudo ufw disable

# Allow port
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow from specific IP
sudo ufw allow from 192.168.1.100 to any port 22

# Delete rule (by number)
sudo ufw delete 3

# Reset firewall
sudo ufw reset
```

---

## 📊 System monitoring

### Disk usage

```bash
# Disk space
df -h

# Directory size
du -sh /home/fims/apps/fims
du -sh /home/fims/backups
du -sh /home/fims/logs

# Largest directories
du -h /home/fims | sort -rh | head -10

# Find large files
find /home/fims -type f -size +100M -exec ls -lh {} \;
```

### Memory i CPU

```bash
# Memory usage
free -h

# CPU info
lscpu
cat /proc/cpuinfo

# Top processes (interactive)
top

# Better top
htop

# Current load
uptime
w

# Process tree
pstree
```

### Network

```bash
# Open ports
sudo netstat -tulpn

# Alternative
sudo ss -tulpn

# Check specific port
sudo lsof -i :3000
sudo lsof -i :80

# Network connections
sudo netstat -an | grep ESTABLISHED

# Test connectivity
ping google.com
curl -I https://vasa-domena.com
```

---

## 🔍 Logs pregled

### Application logs

```bash
# PM2 logs
pm2 logs fims

# Custom log files
tail -f ~/logs/fims-error.log
tail -f ~/logs/fims-out.log
tail -f ~/logs/backup.log
tail -f ~/logs/cron-auto-send.log
```

### System logs

```bash
# System messages
sudo journalctl -xe

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Auth logs (login attempts)
sudo tail -f /var/log/auth.log

# Fail2Ban logs
sudo tail -f /var/log/fail2ban.log
```

---

## 🔄 Application updates

### Quick update

```bash
cd ~/apps/fims

# Stash any local changes
git stash

# Pull latest
git pull origin main

# Install dependencies
npm ci --production=false

# Run migrations (if any)
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate

# Build
npm run build

# Reload app (zero-downtime)
pm2 reload fims

# Check logs
pm2 logs fims --lines 50
```

### Rollback

```bash
cd ~/apps/fims

# Check git log
git log --oneline -10

# Rollback to previous commit
git reset --hard COMMIT_HASH

# Rebuild
npm run build

# Restart
pm2 restart fims
```

---

## 🗄️ Backup komande

### Manual backup

```bash
# Database backup
~/backups/backup-db.sh

# Files backup
~/backups/backup-files.sh

# Check backups
ls -lh ~/backups/postgres/
ls -lh ~/backups/files/
```

### Restore

```bash
# List available backups
ls -lh ~/backups/postgres/

# Restore database
gunzip -c ~/backups/postgres/fims_backup_YYYYMMDD_HHMMSS.sql.gz | \
  PGPASSWORD='lozinka' psql -h localhost -U fims_user -d fims

# Restore files
cd ~/apps/fims
tar -xzf ~/backups/files/fims_files_YYYYMMDD_HHMMSS.tar.gz
```

---

## 🐛 Quick troubleshooting

### App ne radi

```bash
# 1. Check PM2 status
pm2 status

# 2. Check logs
pm2 logs fims --err --lines 50

# 3. Check if port is in use
sudo lsof -i :3000

# 4. Restart app
pm2 restart fims

# 5. Check database connection
PGPASSWORD='lozinka' psql -h localhost -U fims_user -d fims -c "SELECT 1;"
```

### 502 Bad Gateway

```bash
# 1. Check PM2
pm2 status

# 2. Start app if stopped
pm2 start ecosystem.config.js

# 3. Check Nginx config
sudo nginx -t

# 4. Restart Nginx
sudo systemctl restart nginx

# 5. Check logs
pm2 logs fims
sudo tail -f /var/log/nginx/fims_error.log
```

### High memory usage

```bash
# 1. Check memory
free -h
pm2 monit

# 2. Restart app
pm2 restart fims

# 3. Check for memory leaks
pm2 logs fims | grep -i "memory"

# 4. Reduce PM2 instances
pm2 scale fims 1
```

### Slow database

```bash
# 1. Check active queries
sudo -i -u postgres psql -d fims -c "
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;
"

# 2. Kill slow query (if needed)
sudo -i -u postgres psql -d fims -c "SELECT pg_terminate_backend(12345);"

# 3. Restart PostgreSQL
sudo systemctl restart postgresql
```

### Disk full

```bash
# 1. Check disk usage
df -h

# 2. Find large files
du -ah /home/fims | sort -rh | head -20

# 3. Clean logs
pm2 flush
sudo journalctl --vacuum-time=7d

# 4. Clean APT cache
sudo apt clean

# 5. Remove old backups
find ~/backups -name "*.gz" -mtime +30 -delete
```

---

## ⚙️ Cron jobs

### View cron jobs

```bash
# Current user crontab
crontab -l

# Edit crontab
crontab -e

# Remove all cron jobs
crontab -r
```

### Test cron manually

```bash
# Test auto-send
curl -X POST https://vasa-domena.com/api/cron/auto-send \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dateFrom":"2025-01-01","dateTo":"2025-12-31"}'

# Check cron logs
tail -f ~/logs/cron-auto-send.log
```

---

## 🔐 Security checks

### Check for failed login attempts

```bash
# Recent failed SSH attempts
sudo grep "Failed password" /var/log/auth.log | tail -20

# Banned IPs (Fail2Ban)
sudo fail2ban-client status sshd

# Unban IP
sudo fail2ban-client set sshd unbanip 192.168.1.100
```

### Update system

```bash
# Update package list
sudo apt update

# Upgrade packages
sudo apt upgrade -y

# Remove unused packages
sudo apt autoremove -y

# Security updates only
sudo apt upgrade -y --with-new-pkgs
```

---

## 📝 Environment variables

### View current .env

```bash
# View (masked)
cat ~/apps/fims/.env | sed 's/=.*/=***HIDDEN***/g'

# Edit .env
vim ~/apps/fims/.env

# After changing .env, restart app
pm2 restart fims
```

---

## 🔄 Service management

### All services status

```bash
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status
```

### Restart all services

```bash
sudo systemctl restart postgresql
sudo systemctl restart nginx
pm2 restart fims
```

---

## 📞 Emergency contacts

```bash
# Check server uptime
uptime

# Reboot server (SAMO U HITNIM SLUČAJEVIMA!)
sudo reboot

# Check system resources before reboot
free -h
df -h
pm2 status
```

---

## 📚 Useful commands

### Git

```bash
# Current branch
git branch

# Git status
git status

# Show last commit
git log -1

# Show changes
git diff

# Reset to origin
git fetch origin
git reset --hard origin/main
```

### NPM

```bash
# Check Node version
node --version

# Check npm version
npm --version

# List global packages
npm list -g --depth=0

# Update npm
npm install -g npm@latest

# Clear cache
npm cache clean --force
```

### File operations

```bash
# Create directory
mkdir -p ~/new-directory

# Copy file
cp source.txt destination.txt

# Move/Rename
mv old-name.txt new-name.txt

# Delete file
rm file.txt

# Delete directory
rm -rf directory/

# Find file
find /home/fims -name "*.log"

# File permissions
chmod 644 file.txt
chmod 755 script.sh
```

---

**Quick Reference Version:** 1.0.0
**Last Updated:** 2025-01-21
