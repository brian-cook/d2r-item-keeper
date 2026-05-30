# Launch D2R Item Keeper (release build preferred).
param(
    [switch]$Dev
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot

$ReleaseExe = Join-Path $Root "src-tauri\target\release\d2r-item-keeper.exe"
$DebugExe = Join-Path $Root "src-tauri\target\debug\d2r-item-keeper.exe"

function Start-App($ExePath) {
    $dir = Split-Path $ExePath -Parent
    Start-Process -FilePath $ExePath -WorkingDirectory $dir
}

function Start-Dev() {
    $env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path
    Push-Location $Root
    try {
        npm run tauri:dev
    } finally {
        Pop-Location
    }
}

if ($Dev) {
    Start-Dev
    exit 0
}

if (Test-Path $ReleaseExe) {
    Start-App $ReleaseExe
    exit 0
}

if (Test-Path $DebugExe) {
    $dist = Join-Path $Root "dist\index.html"
    if (-not (Test-Path $dist)) {
        Push-Location $Root
        npm run build
        Pop-Location
    }
    Start-App $DebugExe
    exit 0
}

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show(
    "D2R Item Keeper is not built yet.`n`nRun this in the project folder:`n  npm run desktop:install",
    "D2R Item Keeper",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
) | Out-Null
exit 1
