#!/bin/bash

# AWGP Audio Hub - Backup Script (Linux/macOS)
# Backs up MongoDB database and local uploads folder

# Default settings
BACKUP_DIR="../backups"
MONGODB_URI="mongodb://127.0.0.1:27017/awgp_audio_catalog"

# Parse arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -d|--backup-dir)
      BACKUP_DIR="$2"
      shift; shift
      ;;
    -u|--mongodb-uri)
      MONGODB_URI="$2"
      shift; shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create timestamp for unique backup filenames
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="awgp_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_PATH"

echo "=== Starting AWGP Audio Hub Backup ==="
echo "Backup directory: $BACKUP_PATH"

# Step 1: Backup MongoDB database using mongodump
echo ""
echo "[1/2] Backing up MongoDB database..."
if command -v mongodump &> /dev/null; then
  DB_BACKUP_PATH="$BACKUP_PATH/database"
  mongodump --uri="$MONGODB_URI" --out="$DB_BACKUP_PATH"
  if [ $? -eq 0 ]; then
    echo "✓ MongoDB database backup successful"
  else
    echo "⚠ MongoDB backup failed (mongodump exited with code $?)"
  fi
else
  echo "⚠ mongodump not found in PATH. Skipping database backup."
  echo "  Install MongoDB Database Tools from: https://www.mongodb.com/try/download/database-tools"
fi

# Step 2: Backup uploads folder
echo ""
echo "[2/2] Backing up uploads folder..."
UPLOADS_SOURCE="$(dirname "$0")/../backend/uploads"
if [ -d "$UPLOADS_SOURCE" ]; then
  UPLOADS_BACKUP_PATH="$BACKUP_PATH/uploads"
  cp -r "$UPLOADS_SOURCE" "$UPLOADS_BACKUP_PATH"
  echo "✓ Uploads folder backup successful"
else
  echo "⚠ Uploads folder not found at $UPLOADS_SOURCE"
fi

# Create summary file
SUMMARY_PATH="$BACKUP_PATH/backup-summary.txt"
cat > "$SUMMARY_PATH" << EOF
AWGP Audio Hub Backup
======================
Date: $(date)
Backup Name: $BACKUP_NAME
MongoDB URI: $MONGODB_URI
EOF

echo ""
echo "=== Backup Complete! ==="
echo "Backup saved to: $BACKUP_PATH"
