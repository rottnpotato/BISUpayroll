# Payroll Stored Procedures Migration Script (PowerShell)
# This script applies the stored procedures to your PostgreSQL database

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Payroll Stored Procedures Migration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found" -ForegroundColor Red
    Write-Host "Please create .env file with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Load DATABASE_URL from .env
Get-Content .env | ForEach-Object {
    if ($_ -match '^DATABASE_URL=(.+)$') {
        $env:DATABASE_URL = $matches[1]
    }
}

if ([string]::IsNullOrEmpty($env:DATABASE_URL)) {
    Write-Host "❌ Error: DATABASE_URL not set in .env" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Database URL found" -ForegroundColor Green
Write-Host ""

# Check if migration file exists
$migrationFile = ".\prisma\migrations\create_payroll_stored_procedures.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Error: Migration file not found at $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Migration file found" -ForegroundColor Green
Write-Host ""

# Confirm with user
Write-Host "⚠️  This will create stored procedures and triggers in your database." -ForegroundColor Yellow
Write-Host "   Make sure you have a backup of your database before proceeding." -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Do you want to continue? (y/N)"

if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Applying migration..." -ForegroundColor Cyan
Write-Host ""

# Apply migration using Prisma
$result = npx prisma db execute --file $migrationFile --schema .\prisma\schema.prisma

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Verifying installation..." -ForegroundColor Cyan
    Write-Host ""
    
    # Create verification SQL
    $verifySql = @"
SELECT 
    'Functions: ' || COUNT(*)::text as info
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%payroll%'
UNION ALL
SELECT 
    'Triggers: ' || COUNT(*)::text
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%payroll%';
"@
    
    # Save to temp file and execute
    $tempSqlFile = [System.IO.Path]::GetTempFileName() + ".sql"
    $verifySql | Out-File -FilePath $tempSqlFile -Encoding UTF8
    npx prisma db execute --file $tempSqlFile --schema .\prisma\schema.prisma
    Remove-Item $tempSqlFile
    
    Write-Host ""
    Write-Host "✅ Stored procedures and triggers are now active!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📖 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Test with: POST /api/admin/payroll/recalculate" -ForegroundColor White
    Write-Host "   2. Read documentation: PAYROLL_STORED_PROCEDURES.md" -ForegroundColor White
    Write-Host "   3. Monitor database logs for any issues" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "   Check the error messages above" -ForegroundColor Yellow
    Write-Host "   You may need to manually apply the migration using psql" -ForegroundColor Yellow
    exit 1
}
