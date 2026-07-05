#!/bin/bash

# AWGP Audio Hub - Restore Script (Linux/macOS)
# Restores MongoDB database and local uploads folder from backup

# Default settings
MONGODB_URI="mongodb://127.0.0.1:27017/awgp_audio_catalog"

# Parse arguments
BACKUP_PATH=""
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -b|--backup-path)
      BACKUP_PATH="$2"
      shift; shift
      ;;
    -u|--mongodb-uri)
      MONGODB_URI="$2"
      shift; shift
      ;;
    *)
      if [ -z "$BACKUP_PATH" ]; then
        BACKUP_PATH="$1"
      else
        echo "Unknown option: $1"
        exit 1
      fi
      shift
      ;;
  esac
done

# Check if backup path is provided
if [ -z "$BACKUP_PATH" ]; then
  echo "Usage: $0 -b <backup-path> [-u <mongodb-uri>]"
  echo "Example: $0 -b ../backups/awgp_backup_20260704_123456"
  exit 1
fi

# Check if backup path exists
if [ ! -d "$BACKUP_PATH" ]; then
  echo "❌ Backup path not found: $BACKUP_PATH"
  exit 1
fi

echo "=== Starting AWGP Audio Hub Restore ==="
echo "Restoring from: $BACKUP_PATH"

# Ask for confirmation
read -p "Are you sure you want to continue? This will overwrite existing data. (yes/no) " confirmation
if [ "$confirmation" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Step 1: Restore MongoDB database
echo ""
echo "[1/2] Restoring MongoDB database..."
DB_BACKUP_PATH="$BACKUP_PATH/database"
if [ -d "$DB_BACKUP_PATH" ]; then
  if command -v mongorestore &> /dev/null; then
    mongorestore --uri="$MONGODB_URI" --drop "$DB_BACKUP_PATH"
    if [ $? -eq 0 ]; then
      echo "✓ MongoDB database restore successful"
    else
      echo "⚠ MongoDB restore failed (mongorestore exited with code $?)"
    fi
  else
    echo "⚠ mongorestore not found in PATH. Skipping database restore."
    echo "  Install MongoDB Database Tools from: https://www.mongodb.com/try/download/database-tools"
  fi
else
  echo "⚠ Database backup not found in $DB_BACKUP_PATH"
fi

# Step 2: Restore uploads folder
echo ""
echo "[2/2] Restoring uploads folder..."
UPLOADS_BACKUP_PATH="$BACKUP_PATH/uploads"
if [ -d "$UPLOADS_BACKUP_PATH" ]; then
  UPLOADS_DEST="$(dirname "$0")/../backend/uploads"
  
  # Backup existing uploads first
  if [ -d "$UPLOADS_DEST" ]; then
    EXISTING_BACKUP="$UPLOADS_DEST.before-restore.$(date +%Y%m%d_%H%M%S)"
    mv "$UPLOADS_DEST" "$EXISTING_BACKUP"
    echo "  Existing uploads backed up to: $EXISTING_BACKUP"
  fi
  
  # Copy backup
  cp -r "$UPLOADS_BACKUP_PATH" "$UPLOADS_DEST"
  echo "✓ Uploads folder restore successful"
else
  echo "⚠ Uploads backup not found in $UPLOADS_BACKUP_PATH"
fi

echo ""
echo "=== Restore Complete! ==="
