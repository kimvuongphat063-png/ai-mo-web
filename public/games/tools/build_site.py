"""Builds the website data and download files from site/catalog.json.

Run from the repo root after adding or changing a game (Python 3.8+, standard library only):
    python tools/build_site.py

Writes:
  downloads/games/<slug>.zip   one ZIP per game, holding the game folder (copy it into KidsGames)
  downloads/<pack>.zip         packs listed in catalog.json, holding KidsGames/<game folder>/...
  downloads/SHA256SUMS.txt     checksums of everything in downloads/
  site/catalog.js              data for index.html and play.html
The ZIPs are deterministic: same game files give byte-identical ZIPs.
"""
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "site" / "catalog.json"
DOWNLOADS = ROOT / "downloads"
ZIP_TIME = (2026, 10, 16, 0, 0, 0)
SKIP = {"Thumbs.db", ".DS_Store", "desktop.ini"}


def fail(msg):
    sys.exit("build_site: " + msg)


def slug_of(folder_name):
    s = re.sub(r"[^a-z0-9]+", "-", folder_name.lower()).strip("-")
    if not s:
        fail(f"cannot make a slug from {folder_name!r}")
    return s


def game_files(folder: Path):
    files = [p for p in folder.rglob("*") if p.is_file() and p.name not in SKIP and "__pycache__" not in p.parts]
    return sorted(files, key=lambda p: p.relative_to(folder).as_posix())


def write_zip(target: Path, entries):
    """entries: list of (archive name, source path), written in the given order."""
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_suffix(".tmp")
    with zipfile.ZipFile(tmp, "w") as zf:
        for name, src in entries:
            info = zipfile.ZipInfo(name, ZIP_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            zf.writestr(info, src.read_bytes(), compresslevel=9)
    tmp.replace(target)


def sha256(path: Path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    cat = json.loads(CATALOG.read_text(encoding="utf-8"))
    collections = {c["id"] for c in cat["collections"]}
    games, slugs = [], set()
    for g in cat["games"]:
        folder = ROOT / g["dir"]
        if not (folder / "index.html").is_file():
            fail(f"{g['dir']}: index.html not found")
        if g["collection"] not in collections:
            fail(f"{g['dir']}: unknown collection {g['collection']!r}")
        slug = slug_of(folder.name)
        if slug in slugs:
            fail(f"{g['dir']}: slug {slug!r} used twice; rename the folder")
        slugs.add(slug)
        files = game_files(folder)
        zip_rel = f"downloads/games/{slug}.zip"
        write_zip(ROOT / zip_rel, [(f"{folder.name}/{p.relative_to(folder).as_posix()}", p) for p in files])
        games.append({
            "slug": slug,
            "dir": g["dir"],
            "title": g["title"],
            "blurb": g["blurb"],
            "collection": g["collection"],
            "ages": g.get("ages", ""),
            "voice": bool(g.get("voice")),
            "android8": bool(g.get("android8")),
            "template": bool(g.get("template")),
            "icon": g["dir"] + "/icon.png" if (folder / "icon.png").is_file() else None,
            "zip": zip_rel,
            "zipBytes": (ROOT / zip_rel).stat().st_size,
            "_files": files,
        })

    listed = {(ROOT / g["dir"]).resolve() for g in cat["games"]}
    for parent in ("games", "KidsGames-1file"):
        for d in sorted((ROOT / parent).iterdir()):
            if d.is_dir() and (d / "index.html").is_file() and d.resolve() not in listed:
                print(f"warning: {d.relative_to(ROOT).as_posix()} is not in site/catalog.json, so it is not on the website")

    stale = [p for p in (DOWNLOADS / "games").glob("*.zip") if p.stem not in slugs]
    for p in stale:
        p.unlink()

    packs = []
    for pack in cat["packs"]:
        chosen = [g for g in games if not g["template"] and (pack["filter"] == "all" or g[pack["filter"]])]
        entries = []
        for g in chosen:
            folder = ROOT / g["dir"]
            entries += [(f"KidsGames/{folder.name}/{p.relative_to(folder).as_posix()}", p) for p in g["_files"]]
        write_zip(ROOT / pack["file"], entries)
        packs.append({"file": pack["file"], "name": pack["name"], "count": len(chosen),
                      "bytes": (ROOT / pack["file"]).stat().st_size, "sha256": sha256(ROOT / pack["file"])})

    apk_path = ROOT / cat["apk"]["file"]
    if not apk_path.is_file():
        fail(f"{cat['apk']['file']} not found")
    apk = dict(cat["apk"], bytes=apk_path.stat().st_size, sha256=sha256(apk_path))

    sums = sorted(p for p in DOWNLOADS.rglob("*") if p.is_file() and p.name != "SHA256SUMS.txt")
    with open(DOWNLOADS / "SHA256SUMS.txt", "w", encoding="utf-8", newline="\n") as f:
        f.write("".join(f"{sha256(p)}  {p.relative_to(DOWNLOADS).as_posix()}\n" for p in sums))

    for g in games:
        del g["_files"]
    data = {"apk": apk, "collections": cat["collections"], "packs": packs, "games": games}
    js = "// Generated by tools/build_site.py from site/catalog.json. Do not edit.\nwindow.KGP = " + \
        json.dumps(data, ensure_ascii=False, indent=1) + ";\n"
    with open(ROOT / "site" / "catalog.js", "w", encoding="utf-8", newline="\n") as f:
        f.write(js)
    print(f"{len(games)} games, {len(packs)} packs, APK {apk['version']} -> site/catalog.js, downloads/")


if __name__ == "__main__":
    main()
