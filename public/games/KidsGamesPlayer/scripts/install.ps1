# Installs (or updates in place) the APK on ONE explicitly chosen device. Never uninstalls,
# never clears data, never changes device policy.
#   .\scripts\install.ps1 -Serial emulator-5554 [-Apk dist\KidsGamesPlayer-v1.0.0.apk]
param([Parameter(Mandatory = $true)][string]$Serial, [string]$Apk)
. (Join-Path $PSScriptRoot 'common.ps1')
$sdk = Find-AndroidSdk
$adb = Join-Path $sdk 'platform-tools\adb.exe'
if (-not $Apk) { $Apk = Get-ChildItem (Join-Path $Root 'dist') -Filter 'KidsGamesPlayer-v*.apk' | Select-Object -First 1 -ExpandProperty FullName }
if (-not $Apk -or -not (Test-Path $Apk)) { throw 'APK not found; build and package first, or pass -Apk.' }
$devices = & $adb devices | Select-String "^$([regex]::Escape($Serial))\s+device$"
if (-not $devices) { throw "Device $Serial is not connected/authorized (check 'adb devices' and the USB debugging prompt on the phone)." }
& $adb -s $Serial install -r $Apk
exit $LASTEXITCODE
