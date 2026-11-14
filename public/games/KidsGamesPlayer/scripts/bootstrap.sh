#!/usr/bin/env bash
# Detects the toolchain and reports what is missing (never accepts SDK licenses for anyone).
source "$(dirname "$0")/common.sh"
ok=0
JH="$(find_java_home)" && echo "JDK:    $JH" || ok=1
SDK="$(find_android_sdk)" && echo "SDK:    $SDK" || ok=1
if [ -n "${SDK:-}" ]; then
  for p in platforms/android-37.0 build-tools/36.0.0 platform-tools; do
    if [ -d "$SDK/$p" ]; then echo "  ok      $p"; else echo "  MISSING $p  (install: \$SDK/cmdline-tools/latest/bin/android sdk install $p)"; ok=1; fi
  done
fi
PY="$(find_python)"; [ -n "$PY" ] && echo "Python: $PY" || echo "Python: MISSING (only needed for tools/)"
exit $ok
