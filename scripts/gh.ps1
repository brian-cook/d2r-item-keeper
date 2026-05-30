# GitHub CLI helper - use when `gh` is not on PATH yet (e.g. right after install).
# Tries PATH first, then common install locations.
$ErrorActionPreference = "Stop"

$candidates = @(
    "gh",
    "$env:ProgramFiles\GitHub CLI\gh.exe",
    "${env:ProgramFiles(x86)}\GitHub CLI\gh.exe",
    "$env:LOCALAPPDATA\Programs\GitHub CLI\gh.exe"
)

$gh = $null
foreach ($c in $candidates) {
    $cmd = Get-Command $c -ErrorAction SilentlyContinue
    if ($cmd) { $gh = $cmd.Source; break }
    if (Test-Path $c) { $gh = $c; break }
}

if (-not $gh) {
    Write-Host "GitHub CLI not found. Install it with: winget install GitHub.cli"
    Write-Host "Then restart your terminal so 'gh' is on PATH."
    exit 1
}

& $gh @args
