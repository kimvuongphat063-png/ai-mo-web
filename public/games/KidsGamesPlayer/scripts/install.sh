#!/usr/bin/env bash
# Installs/updates the APK on ONE explicitly chosen device; never uninstalls or clears data.
#   scripts/install.sh SERIAL [APK]
source "$(dirname "$0")/common.sh"
SERIAL="${1:?usage: install.sh SERIAL [APK]}"
APK="${2:-$(ls "$ROOT"/dist/KidsGamesPlayer-v*.apk | head -1)}"
ADB="$(find_android_sdk)/platform-tools/adb"
"$ADB" devices | grep -q "^$SERIAL[[:space:]]*device$" || { echo "device $SERIAL not connected/authorized" >&2; exit 1; }
"$ADB" -s "$SERIAL" install -r "$APK"
