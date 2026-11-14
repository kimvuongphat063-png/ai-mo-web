# Detects the toolchain and reports what is missing. With -Install it installs the pinned SDK
# packages through the Android CLI / sdkmanager, but only if the SDK licenses were already
# accepted by the machine owner (it never accepts a license on anyone's behalf).
param([switch]$Install)
. (Join-Path $PSScriptRoot 'common.ps1')

$ok = $true
try { $java = Find-JavaHome; Write-Host "JDK:      $java" } catch { Write-Host "JDK:      MISSING ($_)"; $ok = $false }
try { $sdk = Find-AndroidSdk; Write-Host "SDK:      $sdk" } catch { Write-Host "SDK:      MISSING ($_)"; $ok = $false }
if ($sdk) {
    $need = @{ 'platforms\android-37.0' = 'platforms/android-37.0'; 'build-tools\36.0.0' = 'build-tools/36.0.0'; 'platform-tools' = 'platform-tools' }
    foreach ($k in $need.Keys) {
        if (Test-Path (Join-Path $sdk $k)) { Write-Host "  ok      $k" }
        else {
            Write-Host "  MISSING $k"
            $ok = $false
            if ($Install) {
                if (-not (Test-Path (Join-Path $sdk 'licenses\android-sdk-license'))) {
                    Write-Host '  BLOCKED: SDK license not accepted on this machine; the owner must accept it once.'
                    continue
                }
                $cli = Join-Path $sdk 'cmdline-tools\latest\bin\android.exe'
                if (Test-Path $cli) { & $cli --sdk=$sdk sdk install $need[$k] }
                else { & (Join-Path $sdk 'cmdline-tools\latest\bin\sdkmanager.bat') ($need[$k] -replace '/', ';') }
            }
        }
    }
}
$py = Find-Python
if ($py) { Write-Host "Python:   $py (tools/*.py, standard library only)" } else { Write-Host 'Python:   MISSING (needed for pack/preview tools only)' }
Write-Host "Gradle:   wrapper 9.6.0 (downloaded and checksum-verified by gradlew on first run)"
if (-not $ok) { exit 1 }
