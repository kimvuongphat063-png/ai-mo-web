#!/usr/bin/env python3
"""Regenerate the Gi & Shi images used by the native app UI and the launcher icon.

Developer tool, not needed for a normal build: the generated WebP files are committed.
Source art lives outside the project (family-owned Gi & Shi assets), by default in
../assets-src/gishi relative to the project root. Requires Pillow.

    python tools/build_app_assets.py [--src ../assets-src/gishi]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / "app" / "src" / "main" / "res"

# (source file, output name, target height or width, mode)
MASCOTS = [
    ("gi-wave.png", "mascot_gi_wave", 360),
    ("shi-wave.png", "mascot_shi_wave", 360),
    ("shi-puzzled.png", "mascot_shi_puzzled", 420),
    ("gi-think.png", "mascot_gi_think", 420),
    ("shi-sparkle.png", "mascot_shi_sparkle", 420),
    ("st-both-wave.png", "mascot_both_wave", 460),
    ("st-both-highfive.png", "mascot_both_highfive", 420),
]


def trim_alpha(im: Image.Image, pad: int = 6) -> Image.Image:
    im = im.convert("RGBA")
    alpha = im.getchannel("A").point(lambda a: 255 if a > 8 else 0)
    box = alpha.getbbox()
    if not box:
        return im
    l, t, r, b = box
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def fit_height(im: Image.Image, h: int) -> Image.Image:
    w = round(im.width * h / im.height)
    return im.resize((w, h), Image.LANCZOS)


def save_webp(im: Image.Image, path: Path, quality: int = 86) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=quality, method=6)
    print(f"wrote {path.relative_to(ROOT)} {im.width}x{im.height} {path.stat().st_size // 1024}KB")


def launcher(src: Path) -> None:
    icon = Image.open(src / "icon.png").convert("RGBA")
    corner = icon.getpixel((8, 8))
    bg_hex = "#%02X%02X%02X" % corner[:3]
    # Foreground layer is 108dp; the launcher mask shows roughly the central 72dp.
    canvas = 432
    visible = 300  # slightly beyond 72dp (288px) so mask edges land on the sky background
    crop = int(icon.width * 0.06)
    art = icon.crop((crop, crop, icon.width - crop, icon.height - crop)).resize((visible, visible), Image.LANCZOS)
    fg = Image.new("RGBA", (canvas, canvas), corner)
    off = (canvas - visible) // 2
    fg.paste(art, (off, off))
    save_webp(fg, RES / "drawable-nodpi" / "ic_launcher_foreground.webp", quality=90)
    # Preview with a circle mask for manual review (not shipped).
    preview = fg.copy()
    mask = Image.new("L", (canvas, canvas), 0)
    ImageDraw.Draw(mask).ellipse((72, 72, canvas - 72, canvas - 72), fill=255)
    out = Image.new("RGBA", (canvas, canvas), (255, 255, 255, 255))
    out.paste(preview, (0, 0), mask)
    (ROOT / "build").mkdir(exist_ok=True)
    out.save(ROOT / "build" / "launcher-preview.png")
    values = RES / "values" / "ic_launcher_background.xml"
    values.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
        f'    <color name="ic_launcher_background">{bg_hex}</color>\n</resources>\n',
        encoding="utf-8",
    )
    print("launcher background", bg_hex)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(ROOT.parent / "assets-src" / "gishi"))
    args = ap.parse_args()
    src = Path(args.src)
    if not src.is_dir():
        print(f"source folder not found: {src}", file=sys.stderr)
        return 2
    out = RES / "drawable-nodpi"
    for name, target, height in MASCOTS:
        im = trim_alpha(Image.open(src / name))
        save_webp(fit_height(im, height), out / f"{target}.webp")
    sky = Image.open(src / "bg-sky.png").convert("RGB")
    sky = sky.resize((1024, round(sky.height * 1024 / sky.width)), Image.LANCZOS)
    save_webp(sky, out / "bg_sky.webp", quality=80)
    title = trim_alpha(Image.open(src / "title-gishi-playground.png"))
    save_webp(title.resize((560, round(title.height * 560 / title.width)), Image.LANCZOS), out / "title_gishi.webp")
    launcher(src)
    return 0


if __name__ == "__main__":
    sys.exit(main())
