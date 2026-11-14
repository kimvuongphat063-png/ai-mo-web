#!/usr/bin/env bash
# Repeatable build: debug + unit tests + lint, signed release + lint, Python tool tests.
#   scripts/build.sh [--connected] [--skip-release]
source "$(dirname "$0")/common.sh"
init_toolchain
cd "$ROOT"; mkdir -p logs
LOG="logs/build-$(date +%Y%m%d-%H%M%S).log"
CONNECTED=0; RELEASE=1
for a in "$@"; do case "$a" in --connected) CONNECTED=1;; --skip-release) RELEASE=0;; esac; done
PY="$(find_python)"
if [ -n "$PY" ]; then
  "$PY" tools/sync_games.py --check 2>&1 | tee -a "$LOG"
  "$PY" -m unittest discover -s tools/tests 2>&1 | tee -a "$LOG"
fi
./gradlew --no-daemon :app:assembleDebug :app:testDebugUnitTest :app:lintDebug 2>&1 | tee -a "$LOG"
[ "$CONNECTED" = 1 ] && ./gradlew --no-daemon :app:connectedDebugAndroidTest 2>&1 | tee -a "$LOG"
if [ "$RELEASE" = 1 ]; then
  [ -f .local-signing/keystore.properties ] || "$(dirname "$0")/create_signing_key.sh"
  ./gradlew --no-daemon :app:assembleRelease :app:lintRelease 2>&1 | tee -a "$LOG"
fi
echo "OK. Log: $LOG"
