#!/bin/bash

################################################################################
# FIMS Files Backup Script
#
# Description:
#   Backup important application files (uploads, configs, etc.)
#
# Usage:
#   ./backup-files.sh
#
# Cron example (daily at 3:00 AM):
#   0 3 * * * /home/fims/apps/fims/scripts/backup-files.sh >> /home/fims/logs/backup.log 2>&1
################################################################################

# Exit on error
set -e

# Configuration
APP_DIR="/home/fims/apps/fims"
BACKUP_DIR="/home/fims/backups/files"
LOG_FILE="/home/fims/logs/backup.log"

# Retention policy (days)
RETENTION_DAYS=7

# Timestamp
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fims_files_$DATE.tar.gz"

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

log "=== Starting files backup ==="

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    error "Application directory not found: $APP_DIR"
fi

# Create backup
log "Creating backup of application files..."

# Files and directories to backup
BACKUP_TARGETS=(
    "public/uploads"
    ".env"
    "ecosystem.config.js"
    "prisma/schema.prisma"
)

# Build tar command with existing targets only
TAR_INCLUDES=""
for target in "${BACKUP_TARGETS[@]}"; do
    if [ -e "$APP_DIR/$target" ]; then
        TAR_INCLUDES="$TAR_INCLUDES $target"
    else
        log "WARN: Skipping non-existent target: $target"
    fi
done

# Create backup if we have targets
if [ -n "$TAR_INCLUDES" ]; then
    tar -czf "$BACKUP_FILE" \
        -C "$APP_DIR" \
        $TAR_INCLUDES 2>&1 || error "Failed to create backup archive"
else
    error "No valid backup targets found"
fi

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Files backup successful: $BACKUP_FILE (Size: $BACKUP_SIZE)"
else
    error "Files backup failed!"
fi

# Verify backup file is not empty
if [ ! -s "$BACKUP_FILE" ]; then
    error "Backup file is empty: $BACKUP_FILE"
fi

# List contents of backup (for verification)
log "Backup contents:"
tar -tzf "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"

# Delete old backups based on retention policy
log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "fims_files_*.tar.gz" -type f -mtime +"$RETENTION_DAYS" -delete -print | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
    log "Deleted $DELETED_COUNT old backup(s)"
else
    log "No old backups to delete"
fi

# List current backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "fims_files_*.tar.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Current backups: $BACKUP_COUNT files (Total size: $TOTAL_SIZE)"

log "=== Files backup completed successfully ==="
log ""

exit 0
