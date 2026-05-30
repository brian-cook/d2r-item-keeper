# Build release (optional) and create a Desktop shortcut to D2R Item Keeper.
param(
    [switch]$SkipBuild,
    [switch]$DevShortcut
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$ReleaseExe = Join-Path $Root "src-tauri\target\release\d2r-item-keeper.exe"
$LauncherBat = Join-Path $Root "Launch D2R Item Keeper.bat"
$LauncherPs1 = Join-Path $Root "scripts\launch-d2r-keeper.ps1"
$Icon = Join-Path $Root "src-tauri\icons\icon.ico"
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "D2R Item Keeper.lnk"

$env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path

if (-not $SkipBuild -and -not $DevShortcut -and -not (Test-Path $ReleaseExe)) {
    Write-Host "Building release app (first time only). This may take several minutes..."
    Push-Location $Root
    try {
        npm run tauri:build
    } finally {
        Pop-Location
    }
}

$Wsh = New-Object -ComObject WScript.Shell
$Shortcut = $Wsh.CreateShortcut($ShortcutPath)

if ($DevShortcut) {
    $Shortcut.TargetPath = "powershell.exe"
    $Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$LauncherPs1`" -Dev"
    $Shortcut.WorkingDirectory = $Root
    $Shortcut.Description = "D2R Item Keeper (dev mode)"
} elseif (Test-Path $ReleaseExe) {
    $Shortcut.TargetPath = $ReleaseExe
    $Shortcut.WorkingDirectory = Split-Path $ReleaseExe -Parent
    $Shortcut.Description = "D2R Item Keeper"
} else {
    $Shortcut.TargetPath = $LauncherBat
    $Shortcut.WorkingDirectory = $Root
    $Shortcut.Description = "D2R Item Keeper"
}

if (Test-Path $Icon) {
    $Shortcut.IconLocation = $Icon
}

$Shortcut.Save()

Write-Host ""
Write-Host "Desktop shortcut created:"
Write-Host "  $ShortcutPath"
Write-Host "  Target: $($Shortcut.TargetPath)"
Write-Host ""
if (Test-Path $ReleaseExe) {
    Write-Host "Double-click to start (release build)."
} else {
    Write-Host "Using launcher .bat until you run: npm run desktop:install"
}
