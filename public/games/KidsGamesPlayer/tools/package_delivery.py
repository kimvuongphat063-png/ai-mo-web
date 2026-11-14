#!/usr/bin/env python3
"""Assemble dist/ from an already built, signed release APK (bible §16.5–16.6).

    python tools/package_delivery.py [--apk app/build/outputs/apk/release/app-release.apk]

Creates:
  dist/KidsGamesPlayer-v<version>.apk   (copied byte-for-byte, signature verified first)
  dist/KidsGamesPlayer-source.zip       (source + wrapper + scripts + docs + tests; no secrets/caches)
  dist/KidsGames-samples.zip            (KidsGames/ root with the three packed sample games)
  dist/GAME_AUTHORING_PROMPT.md, dist/BUILD_REPORT.md
  dist/SHA256SUMS.txt                   (hashes of the public artifacts)
Fails (exit 1) if the APK is unsigned/invalid or a secret would end up in a ZIP.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

EXCLUDE_DIRS = {".git", ".gradle", ".idea", ".kotlin", "build", "dist", "logs", ".local-signing", "__pycache__",
                "captures", "node_modules"}
EXCLUDE_FILES = {"local.properties", ".DS_Store", "Thumbs.db"}
SECRET_PATTERNS = re.compile(r"(\.jks|\.keystore|\.p12|\.pem|\.key|keystore\.properties)$", re.I)
# Evidence screenshots are kept in the source bundle (they are part of the report), raw temp files are not.
EXCLUDE_PREFIXES = ("evidence/tmp/", "app/build/")


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def find_build_tool(name: str) -> str:
    sdk = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")
    if not sdk:
        lp = ROOT / "local.properties"
        if lp.exists():
            m = re.search(r"sdk\.dir=(.*)", lp.read_text(encoding="utf-8"))
            if m:
                sdk = m.group(1).strip().replace("\\:", ":").replace("\\\\", "\\")
    if not sdk:
        sdk = str(Path(os.environ.get("LOCALAPPDATA", "")) / "Android" / "Sdk")
    bt = Path(sdk) / "build-tools"
    versions = sorted((p for p in bt.iterdir() if p.is_dir()), reverse=True) if bt.is_dir() else []
    for v in versions:
        for cand in (v / f"{name}.bat", v / name, v / f"{name}.exe"):
            if cand.exists():
                return str(cand)
    raise SystemExit(f"{name} not found under {bt}; set ANDROID_HOME")


def version_name() -> str:
    text = (ROOT / "app" / "build.gradle.kts").read_text(encoding="utf-8")
    return re.search(r'versionName\s*=\s*"([^"]+)"', text).group(1)


def zip_dir(zf: zipfile.ZipFile, base: Path, arc_prefix: str, *, skip=lambda rel: False) -> None:
    for dirpath, dirnames, filenames in os.walk(base):
        rel_dir = Path(dirpath).relative_to(base).as_posix()
        dirnames[:] = sorted(d for d in dirnames if d not in EXCLUDE_DIRS)
        for fn in sorted(filenames):
            rel = f"{rel_dir}/{fn}" if rel_dir != "." else fn
            if fn in EXCLUDE_FILES or skip(rel):
                continue
            if SECRET_PATTERNS.search(fn):
                raise SystemExit(f"refusing to package a secret-looking file: {rel}")
            info = zipfile.ZipInfo(f"{arc_prefix}{rel}", date_time=(2026, 10, 11, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            if fn in ("gradlew",) or fn.endswith(".sh"):
                info.external_attr = 0o755 << 16
            zf.writestr(info, (Path(dirpath) / fn).read_bytes())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apk", default=str(ROOT / "app/build/outputs/apk/release/app-release.apk"))
    ap.add_argument("--apksigner", help="path to apksigner(.bat); default: newest SDK build-tools")
    args = ap.parse_args()
    apk = Path(args.apk)
    if not apk.is_file():
        print(f"ERROR: release APK not found: {apk} (run scripts/build first)")
        return 1
    apksigner = args.apksigner or find_build_tool("apksigner")
    r = subprocess.run([apksigner, "verify", "--verbose", "--print-certs", str(apk)], capture_output=True, text=True, shell=apksigner.endswith(".bat"))
    if r.returncode != 0 or "Verified using v2 scheme (APK Signature Scheme v2): true" not in r.stdout:
        print(r.stdout + r.stderr)
        print("ERROR: APK signature verification failed; refusing to deliver an unsigned/invalid APK")
        return 1
    if "CN=Android Debug" in r.stdout:
        print("ERROR: APK is signed with the debug key")
        return 1

    DIST.mkdir(exist_ok=True)
    for p in DIST.iterdir():
        if p.is_file():
            p.unlink()
    ver = version_name()
    out_apk = DIST / f"KidsGamesPlayer-v{ver}.apk"
    shutil.copyfile(apk, out_apk)
    (DIST / "apksigner-verify.txt").write_text(r.stdout, encoding="utf-8")

    with zipfile.ZipFile(DIST / "KidsGamesPlayer-source.zip", "w") as zf:
        zip_dir(zf, ROOT, "KidsGamesPlayer/", skip=lambda rel: rel.startswith(EXCLUDE_PREFIXES) or "/build/" in rel)

    ready = ROOT / "build" / "ready" / "KidsGames"
    if not ready.is_dir():
        print("ERROR: build/ready/KidsGames missing (run tools/sync_games.py)")
        return 1
    with zipfile.ZipFile(DIST / "KidsGames-samples.zip", "w") as zf:
        zip_dir(zf, ready, "KidsGames/", skip=lambda rel: rel.endswith(".kgp-pack-output"))

    shutil.copyfile(ROOT / "docs" / "GAME_AUTHORING_PROMPT.md", DIST / "GAME_AUTHORING_PROMPT.md")
    if (ROOT / "BUILD_REPORT.md").exists():
        shutil.copyfile(ROOT / "BUILD_REPORT.md", DIST / "BUILD_REPORT.md")

    # Double-check: no secrets inside the ZIPs.
    for z in ("KidsGamesPlayer-source.zip", "KidsGames-samples.zip"):
        with zipfile.ZipFile(DIST / z) as zf:
            bad = [n for n in zf.namelist() if SECRET_PATTERNS.search(n) or "/.local-signing/" in n or n.endswith("local.properties")]
            if bad:
                print(f"ERROR: secret-like entries in {z}: {bad[:5]}")
                return 1

    public = [out_apk, DIST / "KidsGamesPlayer-source.zip", DIST / "KidsGames-samples.zip",
              DIST / "GAME_AUTHORING_PROMPT.md"] + ([DIST / "BUILD_REPORT.md"] if (DIST / "BUILD_REPORT.md").exists() else [])
    lines = [f"{sha256(p)}  {p.name}" for p in public]
    # LF endings even on Windows, so `sha256sum -c SHA256SUMS.txt` works everywhere.
    (DIST / "SHA256SUMS.txt").write_bytes(("\n".join(lines) + "\n").encode("utf-8"))
    for p in public:
        print(f"{p.name}  {p.stat().st_size} bytes  {sha256(p)}")
    print("OK: dist/ assembled")
    return 0


if __name__ == "__main__":
    sys.exit(main())
