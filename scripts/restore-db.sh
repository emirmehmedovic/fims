#!/bin/bash

################################################################################
# FIMS Database Restore Script
#
# Description:
#   Restore PostgreSQL database from backup
#
# Usage:
#   ./restore-db.sh /path/to/backup/fims_backup_20250121_120000.sql.gz
#
# WARNING:
#   This will OVERWRITE the current database!
#   Make sure to backup current database before restoring!
################################################################################

# Exit on error
set -e

# Configuration
DB_NAME="fims"
DB_USER="fims_user"
DB_PASSWORD=""  # SET THIS OR USE .pgpass file
DB_HOST="localhost"
DB_PORT="5432"

LOG_FILE="/home/fims/logs/restore.log"

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

confirm() {
    read -p "$1 [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Operation cancelled by user"
        exit 0
    fi
}

################################################################################
# Main
################################################################################

log "=== Starting database restore ==="

# Check if backup file is provided
if [ -z "$1" ]; then
    error "Usage: $0 /path/to/backup/fims_backup_YYYYMMDD_HHMMSS.sql.gz"
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
fi

# Check if backup file is not empty
if [ ! -s "$BACKUP_FILE" ]; then
    error "Backup file is empty: $BACKUP_FILE"
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup file: $BACKUP_FILE (Size: $BACKUP_SIZE)"

# Confirm with user
echo ""
echo "⚠️  WARNING: This will OVERWRITE the current database '$DB_NAME'!"
echo "   Current database will be LOST unless you have a backup!"
echo ""
confirm "Are you sure you want to continue?"

# Create a safety backup of current database
SAFETY_BACKUP_DIR="/home/fims/backups/postgres"
SAFETY_BACKUP_FILE="$SAFETY_BACKUP_DIR/fims_before_restore_$(date +%Y%m%d_%H%M%S).sql.gz"

log "Creating safety backup of current database..."
mkdir -p "$SAFETY_BACKUP_DIR"

if [ -z "$DB_PASSWORD" ]; then
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>&1 | gzip > "$SAFETY_BACKUP_FILE"
else
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>&1 | gzip > "$SAFETY_BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    log "Safety backup created: $SAFETY_BACKUP_FILE"
else
    error "Failed to create safety backup!"
fi

# Restore database
log "Restoring database from backup..."

if [ -z "$DB_PASSWORD" ]; then
    gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>&1 | tee -a "$LOG_FILE"
else
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>&1 | tee -a "$LOG_FILE"
fi

# Check if restore was successful
if [ $? -eq 0 ]; then
    log "Database restore successful!"
    log "Safety backup is available at: $SAFETY_BACKUP_FILE"
else
    error "Database restore failed! You can restore from safety backup: $SAFETY_BACKUP_FILE"
fi

log "=== Restore completed successfully ==="
log ""

# Suggest next steps
echo ""
echo "✅ Database restored successfully!"
echo ""
echo "Next steps:"
echo "  1. Verify database integrity"
echo "  2. Restart application: pm2 restart fims"
echo "  3. Test application functionality"
echo ""

exit 0
