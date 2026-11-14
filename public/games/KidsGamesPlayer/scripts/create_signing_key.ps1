# Creates the project's release signing key ONCE, in .local-signing\ (git-ignored, excluded
# from every ZIP). Never overwrites an existing key: keep and back up this key to be able to
# update the installed app later (see docs/SIGNING.md). The password is random, passed to
# keytool through environment variables (not on the command line) and never printed.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Dir = Join-Path $Root '.local-signing'
$Store = Join-Path $Dir 'kidsgamesplayer-release.p12'
$Props = Join-Path $Dir 'keystore.properties'

if ((Test-Path $Store) -or (Test-Path $Props)) {
    Write-Host "Signing key already exists in $Dir - nothing changed."
    exit 0
}

$JavaHome = $env:JAVA_HOME
if (-not $JavaHome) { $JavaHome = 'C:\Program Files\Android\Android Studio\jbr' }
$Keytool = Join-Path $JavaHome 'bin\keytool.exe'
if (-not (Test-Path $Keytool)) { throw "keytool not found; set JAVA_HOME to a JDK 17+" }

New-Item -ItemType Directory -Force -Path $Dir | Out-Null
# Restrict the folder to the current user before writing any secret.
& icacls $Dir /inheritance:r /grant:r "$($env:USERNAME):(OI)(CI)F" | Out-Null

$bytes = New-Object byte[] 24
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$Password = [Convert]::ToBase64String($bytes).Replace('+', 'A').Replace('/', 'B').TrimEnd('=')

$env:KGP_STOREPASS = $Password
try {
    # keytool writes progress to stderr; Windows PowerShell would treat that as an error.
    $ErrorActionPreference = 'Continue'
    & $Keytool -genkeypair -storetype PKCS12 -keystore $Store -alias kgp-release `
        -keyalg RSA -keysize 4096 -validity 10000 `
        -dname "CN=Kids Games Player, OU=Family, O=Family, C=VN" `
        -storepass:env KGP_STOREPASS -keypass:env KGP_STOREPASS 2>$null | Out-Null
    $code = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($code -ne 0 -or -not (Test-Path $Store)) { throw "keytool failed ($code)" }
} finally {
    Remove-Item Env:\KGP_STOREPASS -ErrorAction SilentlyContinue
}

@(
    '# Release signing secrets. Keep private. Never commit or zip. See docs/SIGNING.md',
    'storeFile=kidsgamesplayer-release.p12',
    "storePassword=$Password",
    'keyAlias=kgp-release',
    "keyPassword=$Password"
) | Set-Content -Path $Props -Encoding ascii
$Password = $null
Write-Host "Created release key in $Dir (password stored only in keystore.properties)."
