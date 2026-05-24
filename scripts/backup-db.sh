#!/bin/bash

################################################################################
# FIMS Database Backup Script
#
# Description:
#   Automated PostgreSQL database backup with compression and retention policy
#
# Usage:
#   ./backup-db.sh
#
# Cron example (daily at 2:00 AM):
#   0 2 * * * /home/fims/apps/fims/scripts/backup-db.sh >> /home/fims/logs/backup.log 2>&1
################################################################################

# Exit on error
set -e

# Configuration
DB_NAME="fims"
DB_USER="fims_user"
DB_PASSWORD=""  # SET THIS OR USE .pgpass file
DB_HOST="localhost"
DB_PORT="5432"

# Backup directory
BACKUP_DIR="/home/fims/backups/postgres"
LOG_FILE="/home/fims/logs/backup.log"

# Retention policy (days)
RETENTION_DAYS=7

# Timestamp
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fims_backup_$DATE.sql.gz"

################################################################################
# Functions
################################################################################

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $1"
    exit 1
}

################################################################################
# Main
################################################################################

log "=== Starting database backup ==="

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Check if database password is set
if [ -z "$DB_PASSWORD" ]; then
    # Try to use .pgpass file
    if [ ! -f ~/.pgpass ]; then
        error "Database password not set and ~/.pgpass not found. Please configure database credentials."
    fi
    log "Using credentials from ~/.pgpass"

    # Backup without password (using .pgpass)
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>&1 | gzip > "$BACKUP_FILE"
else
    # Backup with password
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>&1 | gzip > "$BACKUP_FILE"
fi

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Database backup successful: $BACKUP_FILE (Size: $BACKUP_SIZE)"
else
    error "Database backup failed!"
fi

# Verify backup file is not empty
if [ ! -s "$BACKUP_FILE" ]; then
    error "Backup file is empty: $BACKUP_FILE"
fi

# Delete old backups based on retention policy
log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "fims_backup_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete -print | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
    log "Deleted $DELETED_COUNT old backup(s)"
else
    log "No old backups to delete"
fi

# List current backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "fims_backup_*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Current backups: $BACKUP_COUNT files (Total size: $TOTAL_SIZE)"

log "=== Backup completed successfully ==="
log ""

exit 0
