# Script to switch between local and production environments
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("local", "production")]
    [string]$Environment
)

$envFile = ".env.local"

if ($Environment -eq "local") {
    $apiUrl = "http://localhost:8000"
    Write-Host "Switching to LOCAL development..." -ForegroundColor Green
    Write-Host "Backend URL: $apiUrl" -ForegroundColor Yellow
} else {
    $apiUrl = "https://jobstalker2-production.up.railway.app"
    Write-Host "Switching to PRODUCTION..." -ForegroundColor Green
    Write-Host "Backend URL: $apiUrl" -ForegroundColor Yellow
}

# Update .env.local file
Set-Content -Path $envFile -Value "VITE_API_BASE_URL=$apiUrl"

Write-Host "`n✅ Updated $envFile" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANT: Restart your frontend dev server for changes to take effect!" -ForegroundColor Yellow
Write-Host "   Run: npm run dev" -ForegroundColor Cyan

