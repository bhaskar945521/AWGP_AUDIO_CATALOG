# AWGP Audio Hub - Backup Script (Windows)
# Backs up MongoDB database and local uploads folder

param(
    [Parameter(Mandatory=$false)]
    [Alias("d")]
    [string]$BackupDir = "../backups",
    
    [Parameter(Mandatory=$false)]
    [Alias("u")]
    [string]$MongoDBUri = "mongodb://127.0.0.1:27017/awgp_audio_catalog"
)

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Create timestamp for unique backup filenames
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "awgp_backup_$Timestamp"
$BackupPath = Join-Path $BackupDir $BackupName

# Create backup directory
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
}

Write-Host "=== Starting AWGP Audio Hub Backup ==="
Write-Host "Backup directory: $BackupPath"

# Step 1: Backup MongoDB database using mongodump
Write-Host ""
Write-Host "[1/2] Backing up MongoDB database..."
try {
    $MongoDump = Get-Command mongodump -ErrorAction Stop
    $DbBackupPath = Join-Path $BackupPath "database"
    & mongodump --uri="$MongoDBUri" --out="$DbBackupPath"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ MongoDB database backup successful"
    } else {
        Write-Host "⚠ MongoDB backup failed (mongodump exited with code $LASTEXITCODE)"
    }
} catch {
    Write-Host "⚠ mongodump not found in PATH. Skipping database backup."
    Write-Host "  Install MongoDB Database Tools from: https://www.mongodb.com/try/download/database-tools"
}

# Step 2: Backup uploads folder
Write-Host ""
Write-Host "[2/2] Backing up uploads folder..."
$UploadsSource = Join-Path $PSScriptRoot ".." "backend" "uploads"
if (Test-Path $UploadsSource) {
    $UploadsBackupPath = Join-Path $BackupPath "uploads"
    Copy-Item -Path $UploadsSource -Destination $UploadsBackupPath -Recurse -Force
    Write-Host "✓ Uploads folder backup successful"
} else {
    Write-Host "⚠ Uploads folder not found at $UploadsSource"
}

# Create summary file
$SummaryPath = Join-Path $BackupPath "backup-summary.txt"
@"
AWGP Audio Hub Backup
======================
Date: $(Get-Date)
Backup Name: $BackupName
MongoDB URI: $MongoDBUri
"@ | Out-File -FilePath $SummaryPath

Write-Host ""
Write-Host "=== Backup Complete! ==="
Write-Host "Backup saved to: $BackupPath
