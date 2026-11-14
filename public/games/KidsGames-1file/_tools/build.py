#!/usr/bin/env python3
"""Assemble each game into ONE self-contained index.html (+ minimal game.json).

    python _tools/build.py              # every game
    python _tools/build.py ToNet ToChu  # some games

index.html = SDK verbatim (first <script> in <head>, between KIDS-SDK v1 BEGIN/END markers)
           + CSS + the data: URLs the game asks for + _src/common/*.js + _src/<Game>/*.js.
Run _tools/assets.py first (images) and _tools/check.py afterwards (lint).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "_src"
ASSETS = ROOT / "_build" / "assets"
SDK = ROOT.parent / "KidsGamesPlayer" / "games-template" / "MauGame" / "player-sdk.js"

POSES = ["gi_cheer", "gi_clap", "gi_wave", "shi_cheer", "shi_clap", "shi_wave"]

# id is permanent (changing it loses saved progress). Bump version when a game changes.
GAMES = {
    "ToNet": dict(id="family.to-net", title="Tô nét", version="1.0.0", bg="#FFF4D6", sort=110,
                  js=["common/kit.js", "common/trace.js", "ToNet/game.js"], assets=POSES + ["gi_point", "shi_puzzled"]),
    "ToChu": dict(id="family.to-chu", title="Tô chữ cái", version="1.0.0", bg="#E7F4FF", sort=120,
                  js=["common/kit.js", "common/trace.js", "common/glyphs.js", "common/art.js", "ToChu/game.js"],
                  assets=POSES + ["shi_sparkle"]),
    "ToSo": dict(id="family.to-so", title="Tô số và đếm", version="1.0.0", bg="#EAF8E6", sort=130,
                 js=["common/kit.js", "common/trace.js", "common/glyphs.js", "common/art.js", "ToSo/game.js"],
                 assets=POSES + ["shi_puzzled", "gi_think"]),
    "PopIt": dict(id="family.pop-it", title="Pop-it", version="1.0.0", bg="#FDE8F0", sort=140,
                  js=["common/kit.js", "PopIt/game.js"], assets=POSES),
    "BongBongMau": dict(id="family.bong-bong-mau", title="Bắt bóng đúng màu", version="1.0.0", bg="#DDF3FF",
                        sort=150, js=["common/kit.js", "BongBongMau/game.js"],
                        assets=POSES + ["gi_point", "shi_sparkle"]),
    "ToMau": dict(id="family.to-mau", title="Tô màu Gi & Shi", version="1.0.0", bg="#FFFFFF", sort=160,
                  js=["common/kit.js", "ToMau/game.js"],
                  assets=POSES + ["coloring_%d" % i for i in range(1, 7)] + ["coloring_%d_thumb" % i for i in range(1, 7)]),
    "NoiDiem": dict(id="family.noi-diem", title="Nối các điểm", version="1.0.0", bg="#F3ECFF", sort=170,
                    js=["common/kit.js", "NoiDiem/game.js"], assets=POSES + ["gi_point"]),
    "GhepBong": dict(id="family.ghep-bong", title="Tìm bóng", version="1.0.0", bg="#FFF0E0", sort=180,
                     js=["common/kit.js", "common/art.js", "GhepBong/game.js"], assets=POSES + ["gi_think"]),
    "XepHinh": dict(id="family.xep-hinh", title="Xếp hình Gi & Shi", version="1.0.0", bg="#E6F7F1", sort=190,
                    js=["common/kit.js", "XepHinh/game.js"],
                    assets=POSES + ["scene_%d" % i for i in range(1, 7)] + ["scene_%d_thumb" % i for i in range(1, 7)]),
    "DanGo": dict(id="family.dan-go", title="Đàn gõ cầu vồng", version="1.0.0", bg="#FFF8E7", sort=200,
                  js=["common/kit.js", "common/art.js", "DanGo/game.js"], assets=POSES + ["shi_sparkle"]),
}

CSS = """html, body {
  margin: 0;
  height: 100%;
  background: %BG%;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
body {
  display: flex;
  align-items: center;
  justify-content: center;
}
canvas {
  display: block;
  touch-action: none;
}"""


def build(name: str) -> Path:
    g = GAMES[name]
    sdk = SDK.read_text(encoding="utf-8").rstrip("\n")
    assets = []
    for a in g["assets"]:
        url = (ASSETS / (a + ".txt")).read_text(encoding="ascii").strip()
        assets.append('"%s": "%s"' % (a, url))
    code = []
    for rel in g["js"]:
        code.append("/* ---- %s ---- */\n%s" % (rel, (SRC / rel).read_text(encoding="utf-8").rstrip("\n")))
    code.append("K.bgColor = %s;" % json.dumps(g["bg"]))
    html = "\n".join([
        "<!doctype html>",
        '<html lang="vi">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">',
        "<title>%s</title>" % g["title"],
        "<script>",
        "/* KIDS-SDK v1 BEGIN */",
        sdk,
        "/* KIDS-SDK v1 END */",
        "</script>",
        "<style>",
        CSS.replace("%BG%", g["bg"]),
        "</style>",
        "</head>",
        "<body>",
        '<canvas id="game" aria-label="%s"></canvas>' % g["title"],
        "<script>",
        "var ASSETS = {\n" + ",\n".join(assets) + "\n};",
        "</script>",
        "<script>",
        "\n\n".join(code),
        "</script>",
        "</body>",
        "</html>",
        "",
    ])
    out = ROOT / name
    out.mkdir(exist_ok=True)
    (out / "index.html").write_text(html, encoding="utf-8", newline="\n")
    manifest = {"schemaVersion": 1, "id": g["id"], "title": g["title"], "version": g["version"],
                "playerApiVersion": 1, "backgroundColor": g["bg"], "sortOrder": g["sort"]}
    (out / "game.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return out / "index.html"


def main(argv: list[str]) -> int:
    names = argv or list(GAMES)
    for n in names:
        if n not in GAMES:
            print("unknown game", n)
            return 2
        missing = [rel for rel in GAMES[n]["js"] if not (SRC / rel).is_file()]
        if missing:
            print("skip %s (missing %s)" % (n, ", ".join(missing)))
            continue
        p = build(n)
        print("%-12s %8.1f KB  %s" % (n, p.stat().st_size / 1024, p.relative_to(ROOT).as_posix()))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
