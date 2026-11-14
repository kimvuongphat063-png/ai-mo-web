#!/usr/bin/env python3
"""Generate the local assets of the sample games and the template.

Developer tool; outputs are committed so normal builds need neither this script nor the
source art. Inputs:
  * Gi & Shi family art in ../assets-src/gishi (family-owned, see ASSETS_LICENSE.md)
  * shapes, animals and sounds are drawn/synthesized here (original work of this project)
Requires Pillow + numpy, and ffmpeg with libvorbis for .ogg encoding.

    python tools/build_game_assets.py [--src ../assets-src/gishi] [--ffmpeg path]
"""
from __future__ import annotations

import argparse
import io
import math
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SAMPLES = ROOT / "sample-games"
TEMPLATE = ROOT / "games-template" / "MauGame"
SR = 32000


# ----------------------------------------------------------------------------- images
def trim(im: Image.Image, pad: int = 4) -> Image.Image:
    im = im.convert("RGBA")
    box = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if not box:
        return im
    l, t, r, b = box
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def fit_h(im: Image.Image, h: int) -> Image.Image:
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def fit_w(im: Image.Image, w: int) -> Image.Image:
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def webp(im: Image.Image, path: Path, q: int = 84) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=q, method=6)
    print(f"  {path.relative_to(ROOT)}  {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


def png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)
    print(f"  {path.relative_to(ROOT)}  {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


def rounded_mask(size: int, radius: int) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return m


def icon_canvas(size: int, top: tuple, bottom: tuple) -> Image.Image:
    grad = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(grad)
    for y in range(size):
        t = y / (size - 1)
        c = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)) + (255,)
        d.line((0, y, size, y), fill=c)
    return grad


def finish_icon(im: Image.Image) -> Image.Image:
    size = im.width
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(im, (0, 0), rounded_mask(size, size // 5))
    return out


def balloon(d: ImageDraw.ImageDraw, cx: float, cy: float, r: float, color: tuple) -> None:
    d.line((cx, cy + r * 1.15, cx - r * 0.2, cy + r * 2.4), fill=(90, 90, 90, 255), width=max(2, int(r / 12)))
    d.ellipse((cx - r * 0.85, cy - r, cx + r * 0.85, cy + r * 1.15), fill=color, outline=(60, 40, 40, 255), width=max(2, int(r / 14)))
    d.polygon([(cx - r * 0.15, cy + r * 1.12), (cx + r * 0.15, cy + r * 1.12), (cx, cy + r * 1.3)], fill=color)
    d.ellipse((cx - r * 0.45, cy - r * 0.6, cx - r * 0.15, cy - r * 0.15), fill=(255, 255, 255, 150))


# ----------------------------------------------------------------------------- SVG art
SHAPE_COLORS = {
    "circle": "#E8534A",
    "square": "#3D8BD9",
    "triangle": "#3BAE5A",
    "star": "#F2B630",
    "heart": "#E5679E",
    "moon": "#8E6BD1",
}


def shape_path(shape: str) -> str:
    if shape == "circle":
        return '<circle cx="100" cy="100" r="78"/>'
    if shape == "square":
        return '<rect x="26" y="26" width="148" height="148" rx="22"/>'
    if shape == "triangle":
        return '<path d="M100 20 L182 172 L18 172 Z" stroke-linejoin="round"/>'
    if shape == "star":
        pts = []
        for i in range(10):
            a = -math.pi / 2 + i * math.pi / 5
            rr = 84 if i % 2 == 0 else 38
            pts.append(f"{100 + rr * math.cos(a):.1f},{104 + rr * math.sin(a):.1f}")
        return f'<polygon points="{" ".join(pts)}" stroke-linejoin="round"/>'
    if shape == "heart":
        return '<path d="M100 176 C40 132 14 98 22 66 C30 32 74 24 100 58 C126 24 170 32 178 66 C186 98 160 132 100 176 Z"/>'
    if shape == "moon":
        return '<path d="M128 22 A80 80 0 1 0 172 150 A64 64 0 1 1 128 22 Z"/>'
    raise ValueError(shape)


def shape_svg(shape: str, fill: str, stroke: str, dashed: bool) -> str:
    dash = ' stroke-dasharray="14 10"' if dashed else ""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">'
        f'<g fill="{fill}" stroke="{stroke}" stroke-width="9"{dash}>{shape_path(shape)}</g></svg>\n'
    )


OUT = 'stroke="#3B2A20" stroke-width="5" stroke-linejoin="round"'

ANIMALS = {
    "cat": f'''<g {OUT}>
<path d="M44 78 L52 22 L86 58 Z" fill="#F6A04D"/><path d="M156 78 L148 22 L114 58 Z" fill="#F6A04D"/>
<ellipse cx="100" cy="112" rx="66" ry="60" fill="#F6A04D"/></g>
<path d="M56 64 L58 40 L74 56 Z M144 64 L142 40 L126 56 Z" fill="#F9C9B6"/>
<path d="M78 70 L84 92 M100 64 L100 86 M122 70 L116 92" stroke="#D97A2B" stroke-width="7" stroke-linecap="round"/>
<ellipse cx="76" cy="112" rx="9" ry="12" fill="#3B2A20"/><ellipse cx="124" cy="112" rx="9" ry="12" fill="#3B2A20"/>
<circle cx="79" cy="107" r="3" fill="#fff"/><circle cx="127" cy="107" r="3" fill="#fff"/>
<path d="M92 130 L108 130 L100 140 Z" fill="#E86C8A"/>
<path d="M100 140 Q90 152 80 146 M100 140 Q110 152 120 146" fill="none" stroke="#3B2A20" stroke-width="4" stroke-linecap="round"/>
<path d="M60 134 L24 128 M60 142 L26 148 M140 134 L176 128 M140 142 L174 148" stroke="#3B2A20" stroke-width="3" stroke-linecap="round"/>''',
    "dog": f'''<g {OUT}>
<ellipse cx="100" cy="108" rx="62" ry="64" fill="#EAC28F"/>
<ellipse cx="44" cy="96" rx="22" ry="46" fill="#9C6B3F" transform="rotate(18 44 96)"/>
<ellipse cx="156" cy="96" rx="22" ry="46" fill="#9C6B3F" transform="rotate(-18 156 96)"/>
<ellipse cx="100" cy="140" rx="36" ry="26" fill="#F7E2C2"/></g>
<ellipse cx="128" cy="86" rx="20" ry="16" fill="#9C6B3F" opacity="0.6"/>
<circle cx="78" cy="98" r="9" fill="#3B2A20"/><circle cx="122" cy="98" r="9" fill="#3B2A20"/>
<circle cx="81" cy="95" r="3" fill="#fff"/><circle cx="125" cy="95" r="3" fill="#fff"/>
<ellipse cx="100" cy="126" rx="13" ry="9" fill="#3B2A20"/>
<path d="M100 135 L100 146 M86 148 Q100 158 114 148" fill="none" stroke="#3B2A20" stroke-width="4" stroke-linecap="round"/>
<path d="M94 150 Q100 170 106 150 Z" fill="#E8708A" stroke="#3B2A20" stroke-width="3"/>''',
    "duck": f'''<g {OUT}>
<ellipse cx="104" cy="150" rx="70" ry="38" fill="#FFD54A"/>
<circle cx="92" cy="84" r="50" fill="#FFD54A"/>
<path d="M132 92 Q176 84 182 100 Q168 116 130 108 Z" fill="#F59B2B"/>
<path d="M120 146 Q150 128 166 150 Q146 166 120 158 Z" fill="#F7C531"/></g>
<circle cx="100" cy="74" r="9" fill="#3B2A20"/><circle cx="103" cy="71" r="3" fill="#fff"/>
<ellipse cx="72" cy="96" rx="11" ry="7" fill="#F7A29A" opacity="0.8"/>
<path d="M78 36 Q86 20 96 34 Q100 20 108 36" fill="none" stroke="#3B2A20" stroke-width="4" stroke-linecap="round"/>''',
    "pig": f'''<g {OUT}>
<path d="M46 70 L44 26 L82 52 Z" fill="#F7A8B8"/><path d="M154 70 L156 26 L118 52 Z" fill="#F7A8B8"/>
<circle cx="100" cy="108" r="66" fill="#F7A8B8"/>
<ellipse cx="100" cy="128" rx="30" ry="22" fill="#F48AA2"/></g>
<ellipse cx="90" cy="128" rx="6" ry="9" fill="#9E4B5E"/><ellipse cx="110" cy="128" rx="6" ry="9" fill="#9E4B5E"/>
<circle cx="74" cy="94" r="9" fill="#3B2A20"/><circle cx="126" cy="94" r="9" fill="#3B2A20"/>
<circle cx="77" cy="91" r="3" fill="#fff"/><circle cx="129" cy="91" r="3" fill="#fff"/>
<path d="M84 156 Q100 166 116 156" fill="none" stroke="#3B2A20" stroke-width="4" stroke-linecap="round"/>''',
    "cow": f'''<g {OUT}>
<path d="M54 50 Q40 20 60 18 Q62 34 70 46 Z" fill="#F2E6C9"/><path d="M146 50 Q160 20 140 18 Q138 34 130 46 Z" fill="#F2E6C9"/>
<ellipse cx="34" cy="72" rx="24" ry="12" fill="#FFFFFF" transform="rotate(-20 34 72)"/>
<ellipse cx="166" cy="72" rx="24" ry="12" fill="#FFFFFF" transform="rotate(20 166 72)"/>
<ellipse cx="100" cy="100" rx="58" ry="62" fill="#FFFFFF"/>
<ellipse cx="100" cy="146" rx="46" ry="30" fill="#F6B8C4"/></g>
<path d="M60 70 Q72 54 92 62 Q88 82 70 86 Q58 82 60 70 Z" fill="#3B2A20"/>
<path d="M132 104 Q150 96 154 114 Q144 128 132 120 Z" fill="#3B2A20"/>
<ellipse cx="86" cy="146" rx="7" ry="9" fill="#9E4B5E"/><ellipse cx="114" cy="146" rx="7" ry="9" fill="#9E4B5E"/>
<circle cx="80" cy="102" r="9" fill="#3B2A20"/><circle cx="120" cy="102" r="9" fill="#3B2A20"/>
<circle cx="83" cy="99" r="3" fill="#fff"/><circle cx="123" cy="99" r="3" fill="#fff"/>''',
    "frog": f'''<g {OUT}>
<ellipse cx="100" cy="122" rx="78" ry="54" fill="#7BC86C"/>
<circle cx="64" cy="68" r="28" fill="#7BC86C"/><circle cx="136" cy="68" r="28" fill="#7BC86C"/></g>
<circle cx="64" cy="66" r="17" fill="#fff" stroke="#3B2A20" stroke-width="4"/>
<circle cx="136" cy="66" r="17" fill="#fff" stroke="#3B2A20" stroke-width="4"/>
<circle cx="68" cy="68" r="8" fill="#3B2A20"/><circle cx="132" cy="68" r="8" fill="#3B2A20"/>
<path d="M58 130 Q100 168 142 130" fill="none" stroke="#3B2A20" stroke-width="6" stroke-linecap="round"/>
<ellipse cx="46" cy="124" rx="12" ry="8" fill="#F29C9C" opacity="0.8"/><ellipse cx="154" cy="124" rx="12" ry="8" fill="#F29C9C" opacity="0.8"/>
<circle cx="90" cy="108" r="3" fill="#3B6E33"/><circle cx="110" cy="108" r="3" fill="#3B6E33"/>''',
    "fish": f'''<g {OUT}>
<path d="M150 100 L192 62 L188 138 Z" fill="#3E8ED0"/>
<ellipse cx="94" cy="100" rx="70" ry="50" fill="#5DADE2"/>
<path d="M84 56 Q104 30 126 58 Z" fill="#3E8ED0"/></g>
<path d="M112 70 Q124 100 112 130" fill="none" stroke="#3E8ED0" stroke-width="6" stroke-linecap="round"/>
<circle cx="60" cy="90" r="12" fill="#fff" stroke="#3B2A20" stroke-width="4"/><circle cx="58" cy="91" r="6" fill="#3B2A20"/>
<path d="M36 112 Q46 120 56 112" fill="none" stroke="#3B2A20" stroke-width="4" stroke-linecap="round"/>
<circle cx="24" cy="54" r="8" fill="#BFE6FA" stroke="#3E8ED0" stroke-width="3"/><circle cx="36" cy="30" r="5" fill="#BFE6FA" stroke="#3E8ED0" stroke-width="3"/>''',
    "bunny": f'''<g {OUT}>
<ellipse cx="74" cy="48" rx="18" ry="46" fill="#F4F1EE"/><ellipse cx="126" cy="48" rx="18" ry="46" fill="#F4F1EE"/>
<circle cx="100" cy="124" r="60" fill="#F4F1EE"/></g>
<ellipse cx="74" cy="50" rx="8" ry="32" fill="#F7B6C6"/><ellipse cx="126" cy="50" rx="8" ry="32" fill="#F7B6C6"/>
<circle cx="78" cy="116" r="9" fill="#3B2A20"/><circle cx="122" cy="116" r="9" fill="#3B2A20"/>
<circle cx="81" cy="113" r="3" fill="#fff"/><circle cx="125" cy="113" r="3" fill="#fff"/>
<path d="M92 134 L108 134 L100 144 Z" fill="#E86C8A"/>
<rect x="93" y="146" width="14" height="14" rx="3" fill="#fff" stroke="#3B2A20" stroke-width="3"/>
<ellipse cx="62" cy="140" rx="11" ry="7" fill="#F7B6C6" opacity="0.8"/><ellipse cx="138" cy="140" rx="11" ry="7" fill="#F7B6C6" opacity="0.8"/>''',
}


def animal_svg(name: str) -> str:
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">{ANIMALS[name]}</svg>\n'


# ----------------------------------------------------------------------------- sounds
def env(n: int, attack: float = 0.005, release: float = 0.2) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    r = np.exp(-t / max(release, 1e-4))
    return a * r


def tone(freq: float, dur: float, kind: str = "sine", vol: float = 0.5, release: float = 0.25) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    if kind == "sine":
        w = np.sin(2 * np.pi * freq * t)
    elif kind == "bell":
        w = np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t * 10)
    elif kind == "tri":
        w = 2 / np.pi * np.arcsin(np.sin(2 * np.pi * freq * t))
    else:
        raise ValueError(kind)
    return vol * w * env(n, 0.004, release)


def mix(total: float, parts: list[tuple[float, np.ndarray]]) -> np.ndarray:
    out = np.zeros(int(SR * total))
    for start, sig in parts:
        i = int(SR * start)
        j = min(len(out), i + len(sig))
        out[i:j] += sig[: j - i]
    return out


def note(n: str) -> float:
    names = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}
    return 440.0 * 2 ** ((names[n[0]] + 12 * (int(n[1]) - 4)) / 12)


def sfx_pop() -> np.ndarray:
    n = int(SR * 0.18)
    rng = np.random.default_rng(7)
    noise = rng.standard_normal(n) * env(n, 0.001, 0.03)
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (520 - 1600 * t) * t) * env(n, 0.001, 0.05)
    return 0.55 * noise + 0.5 * thump


def sfx_chime() -> np.ndarray:
    return mix(0.9, [(0, tone(note("E5"), 0.6, "bell", 0.35, 0.3)), (0.12, tone(note("B5"), 0.7, "bell", 0.3, 0.35))])


def sfx_snap() -> np.ndarray:
    return mix(0.5, [(0, tone(note("G5"), 0.25, "bell", 0.35, 0.12)), (0.07, tone(note("C6"), 0.4, "bell", 0.3, 0.2))])


def sfx_soft_no() -> np.ndarray:
    return mix(0.45, [(0, tone(note("E4"), 0.2, "tri", 0.3, 0.1)), (0.14, tone(note("C4"), 0.3, "tri", 0.3, 0.15))])


def sfx_flip() -> np.ndarray:
    n = int(SR * 0.12)
    rng = np.random.default_rng(3)
    noise = rng.standard_normal(n)
    # crude band-pass by differencing + smoothing
    noise = np.convolve(np.diff(noise, prepend=0), np.ones(6) / 6, mode="same")
    return 0.6 * noise * env(n, 0.002, 0.035)


def sfx_match() -> np.ndarray:
    seq = ["C5", "E5", "G5"]
    return mix(0.8, [(i * 0.09, tone(note(s), 0.5, "bell", 0.28, 0.25)) for i, s in enumerate(seq)])


def sfx_win() -> np.ndarray:
    seq = ["C5", "E5", "G5", "C6", "G5", "C6"]
    parts = [(i * 0.13, tone(note(s), 0.7, "bell", 0.28, 0.35)) for i, s in enumerate(seq)]
    parts.append((0.0, tone(note("C4"), 1.4, "tri", 0.18, 0.8)))
    return mix(1.8, parts)


def sfx_crunch() -> np.ndarray:
    rng = np.random.default_rng(11)
    out = np.zeros(int(SR * 0.42))
    for k in range(4):
        n = int(SR * 0.06)
        burst = rng.standard_normal(n) * env(n, 0.001, 0.02) * (0.6 - k * 0.1)
        i = int(SR * (0.02 + k * 0.09))
        out[i:i + n] += burst
    return out


def music_loop() -> np.ndarray:
    # Gentle 8-bar pentatonic loop, 104 BPM, soft triangle melody over sine bass.
    beat = 60 / 104
    melody = ["E5", "G5", "A5", "G5", "E5", "D5", "C5", "D5", "E5", "G5", "C6", "A5", "G5", "E5", "D5", "C5",
              "D5", "E5", "G5", "E5", "D5", "C5", "D5", "E5", "G5", "A5", "G5", "E5", "D5", "E5", "C5", "C5"]
    bass = ["C3", "A2", "F2", "G2", "C3", "A2", "F2", "G2"]
    total = len(melody) * beat
    parts = []
    for i, s in enumerate(melody):
        parts.append((i * beat, tone(note(s), beat * 0.95, "tri", 0.12, beat * 0.6)))
    for i, s in enumerate(bass):
        parts.append((i * beat * 4, tone(note(s), beat * 3.9, "sine", 0.12, beat * 2.5)))
    sig = mix(total, parts)
    fade = int(SR * 0.02)
    sig[:fade] *= np.linspace(0, 1, fade)
    sig[-fade:] *= np.linspace(1, 0, fade)
    return sig


MIN_SECONDS = 0.35  # Chromium's <audio> pipeline rejects very short Ogg files (seen at 0.12 s).


def write_ogg(sig: np.ndarray, path: Path, ffmpeg: str, quality: int = 3) -> None:
    sig = sig / max(1e-6, np.max(np.abs(sig))) * 0.85
    if len(sig) < int(SR * MIN_SECONDS):
        sig = np.concatenate([sig, np.zeros(int(SR * MIN_SECONDS) - len(sig))])
    pcm = (sig * 32767).astype("<i2").tobytes()
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        wav = Path(td) / "x.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm)
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "libvorbis", "-q:a", str(quality),
                        "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", str(path)], check=True)
    print(f"  {path.relative_to(ROOT)}  {path.stat().st_size // 1024} KB")


# ----------------------------------------------------------------------------- per game
def build_bongbong(src: Path, ffmpeg: str) -> None:
    g = SAMPLES / "BongBong"
    print("BongBong")
    sky = Image.open(src / "bg-sky.png").convert("RGB")
    webp(fit_w(sky, 1280), g / "assets" / "sky.webp", 80)
    for name, out in [("gi-point-right.png", "gi.webp"), ("gi-cheer.png", "gi-cheer.webp"),
                      ("shi-wave.png", "shi.webp"), ("shi-cheer.png", "shi-cheer.webp")]:
        webp(fit_h(trim(Image.open(src / name)), 400), g / "assets" / out)
    write_ogg(sfx_pop(), g / "assets" / "pop.ogg", ffmpeg)
    write_ogg(sfx_chime(), g / "assets" / "chime.ogg", ffmpeg)
    write_ogg(music_loop(), g / "assets" / "music.ogg", ffmpeg, 2)
    size = 256
    im = icon_canvas(size, (126, 202, 254), (205, 236, 255))
    d = ImageDraw.Draw(im)
    balloon(d, 70, 70, 38, (232, 83, 74, 255))
    balloon(d, 132, 52, 40, (242, 182, 48, 255))
    balloon(d, 192, 84, 36, (61, 139, 217, 255))
    cheer = fit_h(trim(Image.open(src / "shi-cheer.png")), 130)
    im.alpha_composite(cheer, (size - cheer.width - 8, size - cheer.height - 2))
    png(finish_icon(im), g / "icon.png")


def build_ghepmau(src: Path, ffmpeg: str) -> None:
    g = SAMPLES / "GhepMau"
    print("GhepMau")
    hub = Image.open(src / "bg-hub.png").convert("RGB")
    webp(fit_w(hub, 1280), g / "assets" / "room.webp", 80)
    for name, out in [("gi-clap.png", "gi-clap.webp"), ("shi-clap.png", "shi-clap.webp"),
                      ("gi-think.png", "gi-think.webp"), ("shi-cheer.png", "shi-cheer.webp")]:
        webp(fit_h(trim(Image.open(src / name)), 380), g / "assets" / out)
    for shape, color in SHAPE_COLORS.items():
        (g / "assets" / "shapes").mkdir(parents=True, exist_ok=True)
        (g / "assets" / "shapes" / f"{shape}.svg").write_text(shape_svg(shape, color, "#3B2A20", False), encoding="utf-8")
        (g / "assets" / "shapes" / f"{shape}-slot.svg").write_text(shape_svg(shape, "#FFFFFF", "#5A4A40", True), encoding="utf-8")
    write_ogg(sfx_snap(), g / "assets" / "snap.ogg", ffmpeg)
    write_ogg(sfx_soft_no(), g / "assets" / "try-again.ogg", ffmpeg)
    write_ogg(sfx_win(), g / "assets" / "win.ogg", ffmpeg)
    size = 256
    im = icon_canvas(size, (255, 239, 210), (255, 220, 190))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((26, 120, 120, 214), 22, fill=(61, 139, 217, 255), outline=(59, 42, 32, 255), width=6)
    d.ellipse((120, 30, 222, 132), fill=(232, 83, 74, 255), outline=(59, 42, 32, 255), width=6)
    d.polygon([(70, 30), (118, 112), (22, 112)], fill=(59, 174, 90, 255), outline=(59, 42, 32, 255))
    clap = fit_h(trim(Image.open(src / "gi-clap.png")), 140)
    im.alpha_composite(clap, (size - clap.width - 6, size - clap.height))
    png(finish_icon(im), g / "icon.png")


def build_latthe(src: Path, ffmpeg: str) -> None:
    g = SAMPLES / "LatThe"
    print("LatThe")
    for name in ANIMALS:
        (g / "assets" / "animals").mkdir(parents=True, exist_ok=True)
        (g / "assets" / "animals" / f"{name}.svg").write_text(animal_svg(name), encoding="utf-8")
    icon = Image.open(src / "icon.png").convert("RGBA")
    c = int(icon.width * 0.1)
    back = icon.crop((c, c, icon.width - c, icon.height - c)).resize((300, 300), Image.LANCZOS)
    webp(back, g / "assets" / "card-back.webp", 82)
    webp(fit_h(trim(Image.open(src / "st-both-highfive.png")), 420), g / "assets" / "highfive.webp")
    webp(fit_h(trim(Image.open(src / "gi-cheer.png")), 360), g / "assets" / "gi-cheer.webp")
    webp(fit_h(trim(Image.open(src / "shi-sparkle.png")), 360), g / "assets" / "shi-sparkle.webp")
    write_ogg(sfx_flip(), g / "assets" / "flip.ogg", ffmpeg)
    write_ogg(sfx_match(), g / "assets" / "match.ogg", ffmpeg)
    write_ogg(sfx_win(), g / "assets" / "win.ogg", ffmpeg)
    size = 256
    im = icon_canvas(size, (215, 236, 230), (190, 225, 215))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((22, 40, 128, 210), 18, fill=(34, 124, 120, 255), outline=(59, 42, 32, 255), width=6)
    d.ellipse((50, 100, 100, 150), fill=(245, 184, 75, 255))
    card = Image.new("RGBA", (106, 170), (255, 255, 255, 255))
    cat = Image.open(io.BytesIO(svg_cat_png())).convert("RGBA").resize((96, 96), Image.LANCZOS)
    card.alpha_composite(cat, (5, 37))
    cardr = Image.new("RGBA", card.size, (0, 0, 0, 0))
    cardr.paste(card, (0, 0), rounded_corners_mask(card.size, 18))
    tilted = cardr.rotate(-8, resample=Image.BICUBIC, expand=True)
    im.alpha_composite(tilted, (112, 34))
    ImageDraw.Draw(im).rounded_rectangle((116, 40, 226, 212), 18, outline=(59, 42, 32, 0), width=1)
    png(finish_icon(im), g / "icon.png")


def rounded_corners_mask(size: tuple, r: int) -> Image.Image:
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), r, fill=255)
    return m


def svg_cat_png() -> bytes:
    """Rasterizes a simplified cat face with Pillow (no SVG renderer dependency)."""
    s = 400
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    o = (59, 42, 32, 255)
    d.polygon([(88, 156), (104, 44), (172, 116)], fill=(246, 160, 77, 255), outline=o)
    d.polygon([(312, 156), (296, 44), (228, 116)], fill=(246, 160, 77, 255), outline=o)
    d.ellipse((68, 104, 332, 344), fill=(246, 160, 77, 255), outline=o, width=10)
    d.ellipse((134, 200, 170, 248), fill=o)
    d.ellipse((230, 200, 266, 248), fill=o)
    d.polygon([(184, 262), (216, 262), (200, 282)], fill=(232, 108, 138, 255))
    return _to_png(im)


def _to_png(im: Image.Image) -> bytes:
    b = io.BytesIO()
    im.save(b, "PNG")
    return b.getvalue()


def build_template(src: Path, ffmpeg: str) -> None:
    g = TEMPLATE
    print("MauGame (template)")
    for name, out in [("shi-open-mouth.png", "shi-open.webp"), ("shi-munch.png", "shi-munch.webp"),
                      ("shi-cheer.png", "shi-cheer.webp")]:
        webp(fit_h(trim(Image.open(src / name)), 440), g / "assets" / out)
    for i in (1, 2, 3):
        webp(fit_h(trim(Image.open(src / f"prop-puff-{i}.png")), 140), g / "assets" / f"puff-{i}.webp")
    webp(fit_h(trim(Image.open(src / "prop-bimbim-bag.png")), 300), g / "assets" / "bag.webp")
    write_ogg(sfx_crunch(), g / "assets" / "crunch.ogg", ffmpeg)
    write_ogg(sfx_chime(), g / "assets" / "chime.ogg", ffmpeg)
    size = 256
    im = icon_canvas(size, (255, 236, 200), (255, 214, 150))
    bag = fit_h(trim(Image.open(src / "prop-bimbim-bag.png")), 200)
    im.alpha_composite(bag, (14, size - bag.height - 20))
    shi = fit_h(trim(Image.open(src / "shi-open-mouth.png")), 200)
    im.alpha_composite(shi, (size - shi.width + 6, size - shi.height + 4))
    png(finish_icon(im), g / "icon.png")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(ROOT.parent / "assets-src" / "gishi"))
    ap.add_argument("--ffmpeg", default=shutil.which("ffmpeg") or "ffmpeg")
    args = ap.parse_args()
    src = Path(args.src)
    if not src.is_dir():
        print(f"source art folder not found: {src}", file=sys.stderr)
        return 2
    build_bongbong(src, args.ffmpeg)
    build_ghepmau(src, args.ffmpeg)
    build_latthe(src, args.ffmpeg)
    build_template(src, args.ffmpeg)
    return 0


if __name__ == "__main__":
    sys.exit(main())
