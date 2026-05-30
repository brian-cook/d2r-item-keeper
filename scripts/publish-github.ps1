# Create GitHub repo and push (run after: powershell -File scripts/gh.ps1 auth login)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Gh = Join-Path $PSScriptRoot "gh.ps1"

Push-Location $Root
try {
    & $Gh auth status
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Not logged in. Run:"
        Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/gh.ps1 auth login"
        exit 1
    }
    & $Gh repo create d2r-item-keeper --public --source=. --remote=origin --push `
        --description "Desktop overlay for D2R item keep/chuck decisions (Season 14)"
} finally {
    Pop-Location
}
