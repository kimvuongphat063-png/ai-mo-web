#!/usr/bin/env bash
# Assembles dist/ from the signed release APK (verified), source/sample ZIPs and checksums.
source "$(dirname "$0")/common.sh"
init_toolchain
cd "$ROOT"
PY="$(find_python)"; [ -n "$PY" ] || { echo "Python 3 required" >&2; exit 1; }
"$PY" tools/sync_games.py
BT="$(ls -d "$ANDROID_HOME"/build-tools/* | sort -r | head -1)"
"$PY" tools/package_delivery.py --apksigner "$BT/apksigner"
