# Repeatable build: debug + unit tests + lint, then signed release + lint, plus the Python
# tool tests. Logs go to logs\build-<time>.log; the exit code is non-zero on any failure.
#   .\scripts\build.ps1                  # everything except device tests
#   .\scripts\build.ps1 -Connected       # also run instrumentation tests on the connected device
param([switch]$Connected, [switch]$SkipRelease)
. (Join-Path $PSScriptRoot 'common.ps1')
$null = Initialize-Toolchain
Set-Location $Root
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'logs') | Out-Null
$log = Join-Path $Root ("logs\build-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))

function Invoke-Step([string]$name, [scriptblock]$block) {
    Write-Host "== $name"
    "== $name" | Add-Content $log
    $ErrorActionPreference = 'Continue'
    & $block 2>&1 | Tee-Object -FilePath $log -Append | Out-Host
    $code = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($code -ne 0) { Write-Host "FAILED: $name (exit $code). Log: $log"; exit $code }
}

$py = Find-Python
if ($py) {
    Invoke-Step 'game packages up to date' { & $py tools\sync_games.py --check }
    Invoke-Step 'python tool tests' { & $py -m unittest discover -s tools\tests }
}
Invoke-Step 'debug build, unit tests, lint' { .\gradlew.bat --no-daemon :app:assembleDebug :app:testDebugUnitTest :app:lintDebug }
if ($Connected) {
    Invoke-Step 'instrumentation tests (connected device)' { .\gradlew.bat --no-daemon :app:connectedDebugAndroidTest }
}
if (-not $SkipRelease) {
    if (-not (Test-Path (Join-Path $Root '.local-signing\keystore.properties'))) {
        Write-Host 'No release key yet: running scripts\create_signing_key.ps1 (keep the key for future updates).'
        & (Join-Path $PSScriptRoot 'create_signing_key.ps1')
    }
    Invoke-Step 'release build + lint' { .\gradlew.bat --no-daemon :app:assembleRelease :app:lintRelease }
}
Write-Host "OK. Log: $log"
