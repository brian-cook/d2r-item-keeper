# GitHub CLI helper — use when `gh` is not on PATH (restart terminal after winget install).
$GhExe = "C:\Program Files\GitHub CLI\gh.exe"

if (-not (Test-Path $GhExe)) {
    Write-Host "GitHub CLI not found. Install with: winget install GitHub.cli"
    exit 1
}

& $GhExe @args
