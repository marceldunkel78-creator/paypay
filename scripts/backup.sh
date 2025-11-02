#!/bin/bash

# ==============================================
# Automated Backup Script
# ==============================================

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="time_account_backup_$DATE.tar.gz"

echo "💾 Creating backup: $BACKUP_FILE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Export database
echo "🗄️  Exporting database..."
docker-compose exec -T mysql mysqldump \
    -u root -p$DB_ROOT_PASSWORD \
    time_account_db > $BACKUP_DIR/database_$DATE.sql

# Create complete backup
echo "📦 Creating complete backup..."
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git \
    --exclude=backups/*.tar.gz \
    .

# Keep only last 7 backups
echo "🧹 Cleaning old backups..."
cd $BACKUP_DIR
ls -t time_account_backup_*.tar.gz | tail -n +8 | xargs -r rm --

echo "✅ Backup completed: $BACKUP_DIR/$BACKUP_FILE"