#!/usr/bin/env bash
# Shared helpers: locate JDK and Android SDK without touching global configuration.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

find_java_home() {
  for c in "${JAVA_HOME:-}" /usr/lib/jvm/temurin-21-jdk* /usr/lib/jvm/java-17-openjdk* \
           "/Applications/Android Studio.app/Contents/jbr/Contents/Home"; do
    if [ -n "$c" ] && [ -x "$c/bin/java" ]; then echo "$c"; return 0; fi
  done
  echo "JDK 17+ not found; set JAVA_HOME" >&2; return 1
}

find_android_sdk() {
  if [ -f "$ROOT/local.properties" ]; then
    local d; d="$(sed -n 's/^sdk\.dir=//p' "$ROOT/local.properties" | sed 's/\:/:/g; s/\\/\/g')"
    if [ -n "$d" ] && [ -d "$d" ]; then echo "$d"; return 0; fi
  fi
  for c in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" "$HOME/Android/Sdk" "$HOME/Library/Android/sdk"; do
    if [ -n "$c" ] && [ -d "$c/platform-tools" ]; then echo "$c"; return 0; fi
  done
  echo "Android SDK not found; set ANDROID_HOME" >&2; return 1
}

init_toolchain() {
  JAVA_HOME="$(find_java_home)"; export JAVA_HOME
  ANDROID_HOME="$(find_android_sdk)"; export ANDROID_HOME
  [ -f "$ROOT/local.properties" ] || echo "sdk.dir=$ANDROID_HOME" > "$ROOT/local.properties"
}

find_python() { command -v python3 || command -v python || true; }
