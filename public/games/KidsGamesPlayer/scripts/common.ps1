# Shared helpers for the Windows scripts: locate JDK and Android SDK without touching
# global configuration (only the project's local.properties is written).
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

function Find-JavaHome {
    $candidates = @($env:JAVA_HOME,
        'C:\Program Files\Android\Android Studio\jbr')
    $candidates += (Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory -ErrorAction SilentlyContinue | ForEach-Object FullName)
    foreach ($c in $candidates) {
        if ($c -and (Test-Path (Join-Path $c 'bin\java.exe'))) { return $c }
    }
    throw 'JDK 17+ not found. Install Temurin 17/21 or set JAVA_HOME.'
}

function Find-AndroidSdk {
    $lp = Join-Path $Root 'local.properties'
    if (Test-Path $lp) {
        $line = Get-Content $lp | Where-Object { $_ -match '^sdk\.dir=' } | Select-Object -First 1
        if ($line) {
            $p = ($line -replace '^sdk\.dir=', '') -replace '\\:', ':' -replace '\\\\', '\'
            if (Test-Path $p) { return $p }
        }
    }
    foreach ($c in @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, (Join-Path $env:LOCALAPPDATA 'Android\Sdk'))) {
        if ($c -and (Test-Path (Join-Path $c 'platform-tools'))) { return $c }
    }
    throw 'Android SDK not found. Install command-line tools or set ANDROID_HOME.'
}

function Initialize-Toolchain {
    $env:JAVA_HOME = Find-JavaHome
    $sdk = Find-AndroidSdk
    $env:ANDROID_HOME = $sdk
    $lp = Join-Path $Root 'local.properties'
    if (-not (Test-Path $lp)) {
        $escaped = $sdk -replace '\\', '\\' -replace ':', '\:'
        "sdk.dir=$escaped" | Set-Content -Path $lp -Encoding ascii
    }
    return $sdk
}

function Find-Python {
    foreach ($c in @('python', 'py', 'python3')) {
        $cmd = Get-Command $c -ErrorAction SilentlyContinue
        if ($cmd) { return $cmd.Source }
    }
    return $null
}
