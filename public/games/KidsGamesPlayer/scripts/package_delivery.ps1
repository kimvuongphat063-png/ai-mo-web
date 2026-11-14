# Builds dist\ from the signed release APK: verified APK copy, source ZIP (no secrets/caches),
# samples ZIP, authoring prompt, build report and SHA256SUMS.txt.
. (Join-Path $PSScriptRoot 'common.ps1')
$sdk = Initialize-Toolchain
$py = Find-Python
if (-not $py) { throw 'Python 3 is required for packaging.' }
Set-Location $Root
& $py tools\sync_games.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$bt = Get-ChildItem (Join-Path $sdk 'build-tools') -Directory | Sort-Object Name -Descending | Select-Object -First 1
& $py tools\package_delivery.py --apksigner (Join-Path $bt.FullName 'apksigner.bat')
exit $LASTEXITCODE
