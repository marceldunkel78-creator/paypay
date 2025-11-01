# PowerShell migration script for Windows
# This script runs the database migrations for the time account application.

Write-Host "Starting database migration..." -ForegroundColor Green

# Read the SQL file content
$sqlContent = Get-Content -Path "src\db\migrations\001-init.sql" -Raw

# MySQL connection parameters from .env
$username = "Marcel"
$database = "time_account_db"

# Try to find MySQL executable
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "mysql.exe"
)

$mysqlPath = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path -ErrorAction SilentlyContinue) {
        $mysqlPath = $path
        break
    }
}

if ($mysqlPath -eq $null) {
    Write-Host "MySQL executable not found. Please install MySQL or add it to PATH." -ForegroundColor Red
    exit 1
}

Write-Host "Using MySQL at: $mysqlPath" -ForegroundColor Yellow
Write-Host "Please enter your MySQL password for user '$username':" -ForegroundColor Yellow

# Execute the SQL migration
try {
    $sqlContent | & $mysqlPath -u $username -p $database
    Write-Host "Database migration completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}