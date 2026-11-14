#!/usr/bin/env python3
"""Draw icon.png (256x256) for every game with Pillow (drawn at 1024 px, then downsampled).

    python _tools/icons.py            # all games
    python _tools/icons.py ToNet      # one game

Rounded square in the game's main color + one big symbol (no long text).
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT.parent / "assets-src-gishi"
S = 1024  # working size


def base(top: str, bottom: str) -> Image.Image:
    """Vertical gradient inside a rounded square with a soft inner highlight."""
    grad = Image.new("RGBA", (S, S))
    t = Image.new("RGBA", (S, S), top)
    b = Image.new("RGBA", (S, S), bottom)
    mask = Image.linear_gradient("L").resize((S, S))
    grad = Image.composite(b, t, mask)
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).rounded_rectangle((16, 16, S - 16, S - 16), radius=210, fill=255)
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(grad, (0, 0), m)
    hl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(hl).rounded_rectangle((16, 16, S - 16, S - 16), radius=210, outline=(255, 255, 255, 120), width=14)
    return Image.alpha_composite(out, hl)


def finish(img: Image.Image, name: str) -> None:
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).rounded_rectangle((16, 16, S - 16, S - 16), radius=210, fill=255)
    img.putalpha(ImageChops.multiply(img.getchannel("A"), m))
    out = img.resize((256, 256), Image.LANCZOS)
    (ROOT / name).mkdir(exist_ok=True)
    out.save(ROOT / name / "icon.png", optimize=True)
    print("%-12s icon.png %d bytes" % (name, (ROOT / name / "icon.png").stat().st_size))


def shadow(layer: Image.Image, off=(0, 16), blur=18, alpha=90) -> Image.Image:
    a = layer.getchannel("A").point(lambda v: v * alpha // 255)
    sh = Image.new("RGBA", layer.size, (40, 40, 70, 0))
    sh.putalpha(a)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    moved = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    moved.paste(sh, off, sh)
    return moved


def compose(bg: Image.Image, layer: Image.Image, shade=True) -> Image.Image:
    if shade:
        bg = Image.alpha_composite(bg, shadow(layer))
    return Image.alpha_composite(bg, layer)


def poly(d: ImageDraw.ImageDraw, pts, color, width):
    """Thick round-capped polyline: stamps discs every few px (smooth on curves)."""
    r = width / 2
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(x1 - x0, y1 - y0) / 4))
        for k in range(n + 1):
            x, y = x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n
            d.ellipse((x - r, y - r, x + r, y + r), fill=color)


def dotted(d, pts, color, r, gap):
    acc = 0.0
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        seg = math.hypot(x1 - x0, y1 - y0)
        while acc <= seg:
            t = acc / seg if seg else 0
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            d.ellipse((x - r, y - r, x + r, y + r), fill=color)
            acc += gap
        acc -= seg


def mascot(name: str, height: int) -> Image.Image:
    im = Image.open(SRC / (name + ".png")).convert("RGBA")
    im = im.crop(im.getbbox())
    w = round(im.width * height / im.height)
    return im.resize((w, height), Image.LANCZOS)


def star(d, cx, cy, R, r, fill, outline=None, width=0, rot=-math.pi / 2):
    pts = []
    for i in range(10):
        a = rot + i * math.pi / 5
        rr = R if i % 2 == 0 else r
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    d.polygon(pts, fill=fill, outline=outline, width=width)


def heart_pts(cx, cy, s, n=120):
    pts = []
    for i in range(n):
        t = i / n * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((cx + x * s, cy + y * s))
    return pts


# ------------------------------------------------------------------------------ icons
def to_net():
    img = base("#FFE79A", "#FFBE55")
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    pts = [(170 + i * 6.8, 560 - 150 * math.sin(i / 100 * 2 * math.pi)) for i in range(101)]
    poly(d, pts, (210, 190, 160, 255), 150)
    poly(d, pts, (255, 255, 255, 255), 128)
    dotted(d, pts, (150, 160, 180, 255), 11, 46)
    half = pts[:58]
    poly(d, half, (255, 107, 74, 255), 96)
    poly(d, [(x - 12, y - 14) for x, y in half], (255, 170, 150, 255), 26)
    x0, y0 = pts[0]
    d.ellipse((x0 - 62, y0 - 62, x0 + 62, y0 + 62), fill=(36, 163, 90, 255), outline="white", width=14)
    # bee at the crayon tip
    bx, by = half[-1]
    d.ellipse((bx - 70, by - 150, bx + 10, by - 70), fill=(214, 240, 255, 230))
    d.ellipse((bx - 20, by - 160, bx + 60, by - 80), fill=(194, 231, 255, 230))
    d.ellipse((bx - 95, by - 85, bx + 95, by + 45), fill=(255, 210, 63, 255), outline=(90, 60, 40, 255), width=8)
    for sx in (-40, 10):
        d.rectangle((bx + sx, by - 80, bx + sx + 26, by + 40), fill=(58, 58, 58, 255))
    d.ellipse((bx + 50, by - 70, bx + 140, by + 20), fill=(255, 210, 63, 255), outline=(90, 60, 40, 255), width=8)
    d.ellipse((bx + 88, by - 48, bx + 118, by - 18), fill="white")
    d.ellipse((bx + 98, by - 40, bx + 116, by - 22), fill=(40, 40, 50, 255))
    # flower goal
    fx, fy = pts[-1]
    for k in range(6):
        a = k / 6 * 2 * math.pi
        px, py = fx + math.cos(a) * 62, fy + math.sin(a) * 62
        d.ellipse((px - 46, py - 46, px + 46, py + 46), fill=(255, 122, 182, 255))
    d.ellipse((fx - 40, fy - 40, fx + 40, fy + 40), fill=(255, 210, 63, 255))
    finish(compose(img, L), "ToNet")


def to_chu():
    img = base("#CFEAFF", "#7FBFFF")
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    apex, bl, br = (512, 190), (250, 830), (774, 830)
    bar = [(352, 600), (672, 600)]
    for seg in ([apex, bl], [apex, br], bar):
        poly(d, seg, (200, 215, 235, 255), 150)
    for seg in ([apex, bl], [apex, br], bar):
        poly(d, seg, (255, 255, 255, 255), 128)
    for seg in ([apex, br], bar):
        dotted(d, seg, (150, 160, 180, 255), 11, 44)
    poly(d, [apex, bl], (255, 140, 40, 255), 96)
    poly(d, [(apex[0] - 14, apex[1] - 10), (bl[0] - 14, bl[1] - 10)], (255, 200, 140, 255), 26)
    x0, y0 = apex
    d.ellipse((x0 + 20, y0 - 40, x0 + 140, y0 + 80), fill=(36, 163, 90, 255), outline="white", width=14)
    d.polygon([(x0 + 70, y0 + 12), (x0 + 108, y0 + 12), (x0 + 89, y0 + 52)], fill="white")
    finish(compose(img, L), "ToChu")


def to_so():
    img = base("#D9F7CF", "#8FD27F")
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    up = [(512 + 150 * math.cos(math.radians(a)), 330 + 130 * math.sin(math.radians(a))) for a in range(210, 451, 4)]
    lo = [(512 + 170 * math.cos(math.radians(a)), 610 + 150 * math.sin(math.radians(a))) for a in range(-90, 151, 4)]
    path = up + lo
    poly(d, path, (190, 215, 190, 255), 150)
    poly(d, path, (255, 255, 255, 255), 128)
    dotted(d, path, (150, 160, 180, 255), 11, 44)
    poly(d, up, (61, 139, 253, 255), 96)
    poly(d, [(x - 12, y - 12) for x, y in up], (160, 200, 255, 255), 26)
    x0, y0 = up[0]
    d.ellipse((x0 - 60, y0 - 60, x0 + 60, y0 + 60), fill=(36, 163, 90, 255), outline="white", width=14)
    for i, ax in enumerate((210, 512, 814)):
        ay = 880
        d.ellipse((ax - 62, ay - 52, ax + 6, ay + 50), fill=(229, 57, 53, 255))
        d.ellipse((ax - 6, ay - 52, ax + 62, ay + 50), fill=(229, 57, 53, 255))
        d.line([(ax, ay - 50), (ax + 12, ay - 92)], fill=(122, 82, 48, 255), width=14)
        d.ellipse((ax + 14, ay - 96, ax + 64, ay - 70), fill=(95, 178, 54, 255))
    finish(compose(img, L), "ToSo")


def pop_it():
    img = base("#FFD3E6", "#FF8FBE")
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    d.rounded_rectangle((140, 140, 884, 884), radius=150, fill=(255, 255, 255, 255))
    d.rounded_rectangle((176, 176, 848, 848), radius=120, fill=(255, 228, 240, 255))
    cols = [(255, 90, 95), (255, 159, 28), (255, 210, 63), (122, 201, 67), (61, 139, 253), (155, 93, 229)]
    for r in range(4):
        for c in range(4):
            cx, cy = 290 + c * 148, 290 + r * 148
            col = cols[(r + c) % 6] if r < 4 else cols[0]
            col = cols[r + (1 if c > 1 else 0)]
            pressed = (r, c) in ((1, 2), (2, 1), (3, 3))
            R = 62
            dark = tuple(int(v * 0.72) for v in col)
            light = tuple(min(255, int(v * 1.15 + 40)) for v in col)
            d.ellipse((cx - R, cy - R + 8, cx + R, cy + R + 8), fill=dark + (255,))
            d.ellipse((cx - R, cy - R, cx + R, cy + R), fill=(dark if pressed else col) + (255,))
            if pressed:
                d.ellipse((cx - R + 14, cy - R + 18, cx + R - 10, cy + R - 6), fill=col + (255,))
            else:
                d.ellipse((cx - 36, cy - 44, cx + 4, cy - 14), fill=light + (255,))
    finish(compose(img, L), "PopIt")


def bubble(d, L, cx, cy, R, col, motif):
    d.ellipse((cx - R, cy - R, cx + R, cy + R), fill=col + (235,), outline=(255, 255, 255, 255), width=12)
    d.ellipse((cx - R * 0.62, cy - R * 0.72, cx - R * 0.12, cy - R * 0.38), fill=(255, 255, 255, 170))
    if motif == "heart":
        d.polygon(heart_pts(cx, cy + 6, R * 0.034), fill=(255, 255, 255, 255))
    elif motif == "star":
        star(d, cx, cy + 6, R * 0.55, R * 0.25, (255, 255, 255, 255))
    else:
        d.ellipse((cx - R * 0.42, cy - R * 0.36, cx + R * 0.42, cy + R * 0.48), fill=(255, 255, 255, 255))


def bong_bong_mau():
    img = base("#D5F1FF", "#78C6F2")
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    bubble(d, L, 330, 360, 190, (240, 70, 80), "heart")
    bubble(d, L, 700, 450, 170, (40, 120, 230), "star")
    bubble(d, L, 420, 740, 160, (245, 190, 30), "dot")
    for x, y, r in ((780, 790, 40), (840, 220, 30), (180, 620, 26)):
        d.ellipse((x - r, y - r, x + r, y + r), outline=(255, 255, 255, 220), width=8)
    finish(compose(img, L), "BongBongMau")


def to_mau():
    img = base("#FFFFFF", "#FFE8C8")
    page = Image.open(SRC / "coloring-01.png").convert("L").crop((330, 60, 930, 660)).resize((700, 700), Image.LANCZOS)
    page = page.point(lambda v: 0 if v < 170 else 255).convert("RGB")
    for (x, y), col in (((350, 40), (90, 70, 60)), ((350, 330), (255, 214, 190)), ((350, 640), (255, 225, 140)),
                        ((90, 600), (180, 230, 255)), ((620, 120), (180, 230, 255))):
        try:
            ImageDraw.floodfill(page, (x, y), col, thresh=40)
        except Exception:
            pass
    mask = Image.new("L", (700, 700), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 700, 700), radius=60, fill=255)
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    card = Image.new("RGBA", (740, 740), (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle((0, 0, 740, 740), radius=80, fill=(255, 255, 255, 255))
    card.paste(page, (20, 20), mask)
    L.paste(card, (100, 90))
    d = ImageDraw.Draw(L)
    cols = [(255, 90, 95), (255, 159, 28), (122, 201, 67), (61, 139, 253), (155, 93, 229)]
    for i, col in enumerate(cols):
        x, y = 880, 210 + i * 150
        d.ellipse((x - 62, y - 62, x + 62, y + 62), fill=col + (255,), outline=(255, 255, 255, 255), width=12)
    finish(compose(img, L), "ToMau")


def noi_diem():
    img = base("#EDE3FF", "#B79BFF")
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    pts = []
    for i in range(5):
        a = -math.pi / 2 + i * 4 * math.pi / 5
        pts.append((512 + math.cos(a) * 330, 540 + math.sin(a) * 330))
    star(d, 512, 540, 330, 135, (255, 205, 46, 120))
    d.line(pts[:4], fill=(123, 77, 255, 255), width=40, joint="curve")
    for i, (x, y) in enumerate(pts):
        d.ellipse((x - 66, y - 66, x + 66, y + 66), fill=(255, 255, 255, 255), outline=(123, 77, 255, 255), width=14)
        draw_digit(d, str(i + 1), x, y, 70, (80, 50, 160, 255))
    finish(compose(img, L), "NoiDiem")


SEG = {  # tiny 7-segment-like stroke digits for icons (no font files needed)
    "1": [[(0.1, -0.7), (0.3, -1), (0.3, 1)]],
    "2": [[(-0.6, -0.6), (-0.2, -1), (0.4, -1), (0.6, -0.6), (0.5, -0.2), (-0.6, 1), (0.6, 1)]],
    "3": [[(-0.6, -1), (0.5, -1), (0, -0.1), (0.5, 0.1), (0.6, 0.6), (0.2, 1), (-0.6, 0.9)]],
    "4": [[(0.3, -1), (-0.6, 0.4), (0.7, 0.4)], [(0.3, -0.3), (0.3, 1)]],
    "5": [[(0.6, -1), (-0.5, -1), (-0.6, -0.1), (0.2, -0.2), (0.6, 0.3), (0.4, 0.9), (-0.6, 0.9)]],
}


def draw_digit(d, ch, cx, cy, size, col):
    for stroke in SEG[ch]:
        pts = [(cx + x * size * 0.45, cy + y * size * 0.5) for x, y in stroke]
        d.line(pts, fill=col, width=int(size * 0.16), joint="curve")


def fish_shape(d, cx, cy, s, body, tail, eye=True):
    d.polygon([(cx - 150 * s, cy), (cx - 260 * s, cy - 100 * s), (cx - 260 * s, cy + 100 * s)], fill=tail)
    d.ellipse((cx - 190 * s, cy - 120 * s, cx + 190 * s, cy + 120 * s), fill=body)
    if eye:
        d.ellipse((cx + 70 * s, cy - 50 * s, cx + 120 * s, cy), fill=(255, 255, 255, 255))
        d.ellipse((cx + 85 * s, cy - 40 * s, cx + 115 * s, cy - 10 * s), fill=(40, 40, 50, 255))


def ghep_bong():
    img = base("#FFE7CF", "#FFAE66")
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    d.rounded_rectangle((120, 130, 904, 470), radius=70, fill=(255, 255, 255, 150))
    fish_shape(d, 560, 300, 1.0, (70, 60, 90, 255), (70, 60, 90, 255), eye=False)
    fish_shape(d, 470, 700, 1.0, (255, 165, 82, 255), (255, 140, 66, 255))
    d.rectangle((420, 590, 450, 810), fill=(255, 255, 255, 255))
    # arrow up
    d.line([(760, 760), (800, 560)], fill=(255, 255, 255, 255), width=34)
    d.polygon([(800, 500), (850, 600), (750, 590)], fill=(255, 255, 255, 255))
    finish(compose(img, L), "GhepBong")


def xep_hinh():
    img = base("#D6F7EC", "#7FD6B8")
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sc = Image.open(SRC / "scene-03.png").convert("RGB").resize((640, 640), Image.LANCZOS)
    d = ImageDraw.Draw(L)
    d.rounded_rectangle((180, 180, 844, 844), radius=40, fill=(255, 255, 255, 120))
    for i, (ox, oy, rot) in enumerate(((0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, 1))):
        piece = sc.crop((ox * 320, oy * 320, ox * 320 + 320, oy * 320 + 320))
        m = Image.new("L", (320, 320), 0)
        ImageDraw.Draw(m).rounded_rectangle((4, 4, 316, 316), radius=36, fill=255)
        p = Image.new("RGBA", (320, 320), (255, 255, 255, 0))
        p.paste(piece, (0, 0), m)
        border = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
        ImageDraw.Draw(border).rounded_rectangle((4, 4, 316, 316), radius=36, outline=(255, 255, 255, 255), width=12)
        p = Image.alpha_composite(p, border)
        x, y = 192 + ox * 320, 192 + oy * 320
        if rot:
            p = p.rotate(-12, resample=Image.BICUBIC, expand=True)
            x, y = 560, 560
        L.alpha_composite(p, (x, y))
    finish(compose(img, L), "XepHinh")


def dan_go():
    img = base("#FFF4D2", "#FFD36E")
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    cols = [(255, 90, 95), (255, 159, 28), (255, 210, 63), (122, 201, 67), (46, 196, 182), (61, 139, 253), (155, 93, 229), (255, 122, 182)]
    d.rounded_rectangle((110, 330, 914, 380), radius=24, fill=(160, 112, 63, 255))
    d.rounded_rectangle((110, 700, 914, 750), radius=24, fill=(160, 112, 63, 255))
    for i, col in enumerate(cols):
        h = 560 - i * 40
        x = 150 + i * 92
        y = 540 - h / 2
        d.rounded_rectangle((x, y, x + 74, y + h), radius=26, fill=col + (255,), outline=(255, 255, 255, 255), width=8)
        d.ellipse((x + 27, y + 24, x + 47, y + 44), fill=(255, 255, 255, 200))
        d.ellipse((x + 27, y + h - 44, x + 47, y + h - 24), fill=(255, 255, 255, 200))
    d.line([(600, 900), (820, 180)], fill=(160, 112, 63, 255), width=26)
    d.ellipse((780, 130, 880, 230), fill=(255, 90, 95, 255), outline=(255, 255, 255, 255), width=10)
    finish(compose(img, L), "DanGo")


ICONS = {"ToNet": to_net, "ToChu": to_chu, "ToSo": to_so, "PopIt": pop_it, "BongBongMau": bong_bong_mau,
         "ToMau": to_mau, "NoiDiem": noi_diem, "GhepBong": ghep_bong, "XepHinh": xep_hinh, "DanGo": dan_go}


def main(argv):
    for n in argv or list(ICONS):
        ICONS[n]()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
