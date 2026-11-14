#!/usr/bin/env python3
"""Pack the 10 game folders (and nothing else) into ../KidsGames-1file.zip.

    python _tools/package.py

Each folder holds exactly index.html, game.json, icon.png. _src, _tools, _screens, _build and the
reports are never packed. Prints the size and SHA-256 of the archive.
"""
from __future__ import annotations

import hashlib
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAMES = ["ToNet", "ToChu", "ToSo", "PopIt", "BongBongMau", "ToMau", "NoiDiem", "GhepBong", "XepHinh", "DanGo"]
FILES = ["index.html", "game.json", "icon.png"]


def main() -> int:
    out = ROOT.parent / "KidsGames-1file.zip"
    for g in GAMES:
        present = sorted(p.name for p in (ROOT / g).iterdir())
        if present != sorted(FILES):
            print("unexpected content in", g, present)
            return 1
    tmp = out.with_suffix(".tmp")
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for g in GAMES:
            for f in FILES:
                z.write(ROOT / g / f, f"{g}/{f}")
    tmp.replace(out)
    with zipfile.ZipFile(out) as z:
        names = z.namelist()
        bad = z.testzip()
    digest = hashlib.sha256(out.read_bytes()).hexdigest()
    print("%s  %d bytes  %d entries  sha256 %s  testzip=%s" % (out.name, out.stat().st_size, len(names), digest, bad or "OK"))
    return 0 if bad is None and len(names) == len(GAMES) * len(FILES) else 1


if __name__ == "__main__":
    sys.exit(main())
