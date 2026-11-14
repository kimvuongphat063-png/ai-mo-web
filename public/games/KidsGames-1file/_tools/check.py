#!/usr/bin/env python3
"""Lint every built game the way brief §8 asks.

    python _tools/check.py              # every game folder that has an index.html
    python _tools/check.py ToNet

Per game: pack_game.py --validate-only (only the inline-SDK error is accepted, no old-WebView
warning, remote-URL warning only for the SVG namespace), forbidden strings outside the SDK block,
APIs/CSS newer than Chromium 69, ES2017 parse of every inline script (acorn), size <= 1.5 MB,
minimal game.json without "files". Writes _build/lint/<Game>.txt and prints a summary.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PACK = ROOT.parent / "KidsGamesPlayer" / "tools" / "pack_game.py"
LINT = ROOT / "_build" / "lint"
GAMES = ["ToNet", "ToChu", "ToSo", "PopIt", "BongBongMau", "ToMau", "NoiDiem", "GhepBong", "XepHinh", "DanGo"]
MAX_SIZE = int(1.5 * 1024 * 1024)

ACCEPTED_ERROR = "playerApiVersion is 1 but index.html does not load player-sdk.js"
FORBIDDEN = ["https://", "alert(", "confirm(", "prompt(", "eval(", "new Function", "fetch(", "XMLHttpRequest",
             "?.", "??", "inset:", "roundRect", "speechSynthesis", "new Audio(", "new AudioContext"]
NEW_JS = [
    (r"\.replaceAll\(", "replaceAll"), (r"\.at\(", ".at()"), (r"allSettled", "Promise.allSettled"),
    (r"Promise\.any", "Promise.any"), (r"\bglobalThis\b", "globalThis"), (r"structuredClone", "structuredClone"),
    (r"fromEntries", "Object.fromEntries"), (r"\.flat\(", "Array.flat"), (r"\.flatMap\(", "flatMap"),
    (r"\.matchAll\(", "matchAll"), (r"\bimport\s*\(", "dynamic import"), (r"<script[^>]*type=[\"']module", "ES module"),
]
NEW_CSS = [
    (r"(?<![-\w])inset\s*:", "inset"), (r"(?<![-\w])gap\s*:", "gap"), (r"aspect-ratio", "aspect-ratio"),
    (r":(?:is|where|has)\(", ":is/:where/:has"), (r"\b(?:clamp|min|max)\(", "clamp/min/max"),
    (r"\d(?:dvh|svh|lvh)\b", "dvh/svh"), (r"backdrop-filter", "backdrop-filter"),
]
MANIFEST_KEYS = {"schemaVersion", "id", "title", "version", "playerApiVersion", "backgroundColor", "sortOrder"}


def check(name: str) -> tuple[bool, list[str]]:
    d = ROOT / name
    out: list[str] = []
    ok = True
    html_path = d / "index.html"
    html = html_path.read_text(encoding="utf-8")

    # 1. pack_game.py --validate-only
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    r = subprocess.run([sys.executable, str(PACK), "--input", str(d), "--validate-only"],
                       capture_output=True, text=True, encoding="utf-8", env=env)
    out.append("$ pack_game.py --input %s --validate-only  (exit %d)" % (name, r.returncode))
    out += ["  " + ln for ln in r.stdout.strip().splitlines()]
    for ln in r.stdout.splitlines():
        if ln.startswith("ERROR:") and ACCEPTED_ERROR not in ln:
            ok = False
            out.append("FAIL unexpected pack error: " + ln)
        if ln.startswith("WARNING:"):
            if "old WebView" in ln:
                ok = False
                out.append("FAIL old WebView warning: " + ln)
            elif "remote URL" in ln and "http://www.w3.org/2000/svg" not in ln:
                ok = False
                out.append("FAIL remote URL warning: " + ln)

    # 2. forbidden strings outside the SDK block
    a = html.find("/* KIDS-SDK v1 BEGIN */")
    b = html.find("/* KIDS-SDK v1 END */")
    if a < 0 or b < a:
        ok = False
        out.append("FAIL SDK markers missing")
        rest = html
    else:
        rest = html[:a] + html[b:]
        first_script = html.find("<script")
        if html.find("<script", 0) != html.rfind("<script", 0, a) or first_script > html.find("</head>"):
            ok = False
            out.append("FAIL SDK is not the first <script> in <head>")
    hits = [s for s in FORBIDDEN if s in rest]
    out.append("forbidden strings outside SDK: " + (", ".join(hits) if hits else "none"))
    if hits:
        ok = False
    # SDK must be verbatim
    sdk_ref = (ROOT.parent / "KidsGamesPlayer" / "games-template" / "MauGame" / "player-sdk.js").read_text(encoding="utf-8").rstrip("\n")
    if a >= 0 and html[a + len("/* KIDS-SDK v1 BEGIN */") + 1:b].rstrip("\n") != sdk_ref:
        ok = False
        out.append("FAIL embedded SDK differs from games-template/MauGame/player-sdk.js")
    else:
        out.append("embedded SDK: identical to games-template/MauGame/player-sdk.js")

    # 3. APIs / CSS newer than Chromium 69
    js_hits = [label for rx, label in NEW_JS if re.search(rx, rest)]
    style = "\n".join(re.findall(r"(?is)<style>(.*?)</style>", html))
    css_hits = [label for rx, label in NEW_CSS if re.search(rx, style)]
    out.append("new JS APIs: " + (", ".join(js_hits) if js_hits else "none"))
    out.append("new CSS: " + (", ".join(css_hits) if css_hits else "none"))
    if js_hits or css_hits:
        ok = False

    # 4. ES2017 parse
    r = subprocess.run(["node", str(HERE / "es2017check.js"), str(html_path)], capture_output=True, text=True)
    out += ["es2017: " + ln for ln in r.stdout.strip().splitlines()]
    if r.returncode != 0:
        ok = False

    # 5. size
    size = html_path.stat().st_size
    out.append("index.html size: %d bytes (%.2f MB)" % (size, size / 1048576))
    if size > MAX_SIZE:
        ok = False
        out.append("FAIL index.html larger than 1.5 MB")

    # 6. game.json + icon
    m = json.loads((d / "game.json").read_text(encoding="utf-8"))
    if set(m) != MANIFEST_KEYS or "files" in m:
        ok = False
        out.append("FAIL game.json keys: %s" % sorted(m))
    else:
        out.append("game.json: %s" % json.dumps(m, ensure_ascii=False))
    icon = d / "icon.png"
    if icon.is_file():
        from PIL import Image
        with Image.open(icon) as im:
            out.append("icon.png: %dx%d %s" % (im.width, im.height, im.format))
            if im.size != (256, 256) or im.format != "PNG":
                ok = False
                out.append("FAIL icon must be a 256x256 PNG")
    else:
        ok = False
        out.append("FAIL icon.png missing")
    extra = sorted(p.name for p in d.iterdir() if p.name not in ("index.html", "game.json", "icon.png"))
    if extra:
        ok = False
        out.append("FAIL unexpected files in game folder: " + ", ".join(extra))
    out.append("RESULT: " + ("PASS" if ok else "FAIL"))
    return ok, out


def main(argv: list[str]) -> int:
    names = argv or [g for g in GAMES if (ROOT / g / "index.html").is_file()]
    LINT.mkdir(parents=True, exist_ok=True)
    all_ok = True
    for n in names:
        ok, lines = check(n)
        (LINT / (n + ".txt")).write_text("\n".join(lines) + "\n", encoding="utf-8")
        all_ok &= ok
        print("%-12s %s" % (n, "PASS" if ok else "FAIL"))
        if not ok:
            for ln in lines:
                if "FAIL" in ln or "error" in ln.lower():
                    print("    " + ln)
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
