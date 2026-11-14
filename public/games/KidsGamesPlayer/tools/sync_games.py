#!/usr/bin/env python3
"""Keep SDK copies in sync and pack the sample games.

    python tools/sync_games.py            # sync SDK, pack samples (ready/ + APK builtin assets)
    python tools/sync_games.py --check    # fail if SDK copies or builtin packages are stale

Outputs:
  build/ready/KidsGames/<Game>/          packed samples with family.* ids (for the samples ZIP)
  app/src/main/assets/builtin/<Game>/    the same games with builtin.* ids, bundled in the APK
"""
from __future__ import annotations

import argparse
import filecmp
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SDK = ROOT / "games-template" / "MauGame" / "player-sdk.js"
SAMPLES = ["BongBong", "GhepMau", "LatThe"]
SDK_COPIES = [ROOT / "sample-games" / g / "player-sdk.js" for g in SAMPLES] + [
    ROOT / "test-fixtures" / "webview" / "sdkboot" / "player-sdk.js",
]
BUILTIN = ROOT / "app" / "src" / "main" / "assets" / "builtin"
READY = ROOT / "build" / "ready" / "KidsGames"
PACK = ROOT / "tools" / "pack_game.py"


def builtin_id(family_id: str) -> str:
    return "builtin." + family_id.split(".", 1)[1]


def pack(src: Path, out: Path, extra: list[str]) -> None:
    cmd = [sys.executable, str(PACK), "--input", str(src), "--output", str(out), "--overwrite", "--quiet", *extra]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        print(r.stdout + r.stderr)
        raise SystemExit(f"pack failed for {src}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    import json

    stale = [p for p in SDK_COPIES if not p.exists() or not filecmp.cmp(SDK, p, shallow=False)]
    if args.check:
        if stale:
            print("stale player-sdk.js copies:", *[str(p.relative_to(ROOT)) for p in stale], sep="\n  ")
            return 1
    else:
        for p in stale:
            shutil.copyfile(SDK, p)
            print("synced", p.relative_to(ROOT))

    for g in SAMPLES:
        src = ROOT / "sample-games" / g
        gid = json.loads((src / "game.json").read_text(encoding="utf-8"))["id"]
        if args.check:
            continue
        pack(src, READY / g, [])
        staging = ROOT / "build" / "builtin-staging" / g
        pack(src, staging, ["--id", builtin_id(gid), "--allow-builtin-id"])
        # The APK copy is a generated folder owned by this script; replace it wholesale,
        # without the packer's hidden marker file.
        if (BUILTIN / g).exists():
            shutil.rmtree(BUILTIN / g)
        shutil.copytree(staging, BUILTIN / g, ignore=shutil.ignore_patterns(".kgp-pack-output"))
        print(f"packed {g}: {gid} -> ready/, {builtin_id(gid)} -> APK assets")
    return 0


if __name__ == "__main__":
    sys.exit(main())
