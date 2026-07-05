# AWGP Audio Hub - Restore Script
# Very simple, no complex syntax!

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupPath
)

$MongoDBUri = "mongodb://127.0.0.1:27017/awgp_audio_catalog"

# Check if backup exists
if (-not (Test-Path $BackupPath)) {
    Write-Host "ERROR: Backup not found at $BackupPath"
    exit 1
}

Write-Host "=== Starting Restore ==="
Write-Host "Restoring from: $BackupPath"

# Ask for confirmation
$confirm = Read-Host "Are you sure? This will overwrite data. (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Restore cancelled"
    exit 0
}

# Step 1: Restore MongoDB
Write-Host ""
Write-Host "[1/2] Restoring MongoDB..."
$mongorestoreExists = $null -ne (Get-Command "mongorestore" -ErrorAction SilentlyContinue)
$dbPath = Join-Path $BackupPath "database"
if ($mongorestoreExists -and (Test-Path $dbPath)) {
    mongorestore --uri="$MongoDBUri" --drop "$dbPath"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: MongoDB restored"
    } else {
        Write-Host "WARNING: MongoDB restore failed"
    }
} else {
    Write-Host "SKIP: No MongoDB backup or mongorestore not found"
}

# Step 2: Restore uploads
Write-Host ""
Write-Host "[2/2] Restoring uploads..."
$uploadsBackupPath = Join-Path $BackupPath "uploads"
$uploadsDest = Join-Path $PSScriptRoot "../backend/uploads"
if (Test-Path $uploadsBackupPath) {
    # Backup existing first
    if (Test-Path $uploadsDest) {
        $existingBackup = "$uploadsDest.before-restore.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Move-Item -Path $uploadsDest -Destination $existingBackup -Force
        Write-Host "Existing uploads saved to: $existingBackup"
    }
    Copy-Item -Path $uploadsBackupPath -Destination $uploadsDest -Recurse -Force
    Write-Host "OK: Uploads restored"
} else {
    Write-Host "SKIP: No uploads backup"
}

Write-Host ""
Write-Host "=== All Done! ==="
