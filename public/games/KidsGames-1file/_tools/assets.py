#!/usr/bin/env python3
"""Prepare the embedded images (Gi & Shi poses, coloring pages, puzzle scenes).

    python _tools/assets.py            # (re)build every asset into _build/assets/*.txt
    python _tools/assets.py --report   # sizes only

Each output file holds ONE complete data: URL (data:image/webp;base64,... or png). build.py
pastes the ones a game asks for into that game's index.html. Sources are never modified.
Needs Pillow.
"""
from __future__ import annotations

import base64
import io
import sys
from pathlib import Path

from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent                      # KidsGames-1file/
SRC = ROOT.parent / "assets-src-gishi"  # original PNGs (read only)
OUT = ROOT / "_build" / "assets"

# Pose name in the game -> source PNG (1024x1536, transparent background).
POSES = {
    "gi_cheer": "gi-cheer", "gi_clap": "gi-clap", "gi_point": "gi-point-right", "gi_think": "gi-think",
    "gi_wave": "gi-wave", "shi_cheer": "shi-cheer", "shi_clap": "shi-clap", "shi_puzzled": "shi-puzzled",
    "shi_sparkle": "shi-sparkle", "shi_wave": "shi-wave",
}
POSE_HEIGHT = 340
COLORING_SIZE = 1000
SCENE_SIZE = 720
THUMB = 220


def data_url(raw: bytes, mime: str) -> str:
    return "data:%s;base64,%s" % (mime, base64.b64encode(raw).decode("ascii"))


def webp(im: Image.Image, quality: int) -> bytes:
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=quality, method=6, alpha_quality=90)
    return buf.getvalue()


def write(name: str, url: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / (name + ".txt")).write_text(url, encoding="ascii")


def pose(name: str, src: str) -> None:
    im = Image.open(SRC / (src + ".png")).convert("RGBA")
    im = im.crop(im.getbbox())
    w = round(im.width * POSE_HEIGHT / im.height)
    im = im.resize((w, POSE_HEIGHT), Image.LANCZOS)
    write(name, data_url(webp(im, 80), "image/webp"))


def coloring(i: int) -> None:
    """Line art -> pure black lines on white, lines thickened 1 px, 1-bit PNG."""
    im = Image.open(SRC / ("coloring-%02d.png" % i)).convert("L")
    im = im.resize((COLORING_SIZE, COLORING_SIZE), Image.LANCZOS)
    im = im.point(lambda v: 0 if v < 170 else 255)
    im = im.filter(ImageFilter.MinFilter(3))          # dilate black by 1 px: closes small gaps
    bw = im.convert("1", dither=Image.Dither.NONE)
    buf = io.BytesIO()
    bw.save(buf, "PNG", optimize=True)
    write("coloring_%d" % i, data_url(buf.getvalue(), "image/png"))
    th = im.copy()
    th.thumbnail((THUMB, THUMB), Image.LANCZOS)
    write("coloring_%d_thumb" % i, data_url(webp(th.convert("RGB"), 82), "image/webp"))


def scene(i: int) -> None:
    im = Image.open(SRC / ("scene-%02d.png" % i)).convert("RGB")
    big = im.resize((SCENE_SIZE, SCENE_SIZE), Image.LANCZOS)
    write("scene_%d" % i, data_url(webp(big, 78), "image/webp"))
    th = im.resize((THUMB, THUMB), Image.LANCZOS)
    write("scene_%d_thumb" % i, data_url(webp(th, 78), "image/webp"))


def report() -> None:
    total = 0
    for p in sorted(OUT.glob("*.txt")):
        n = p.stat().st_size
        total += n
        print("%-22s %7.1f KB (base64)" % (p.stem, n / 1024))
    print("total %.1f KB" % (total / 1024))


def main(argv: list[str]) -> int:
    if "--report" not in argv:
        for k, v in POSES.items():
            pose(k, v)
        for i in range(1, 7):
            coloring(i)
            scene(i)
    report()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
