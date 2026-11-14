#!/usr/bin/env python3
"""Validate a Kids Games Player game folder and export a verified package.

    python tools/pack_game.py --input ./my-game --output ./ready/KidsGames/MyGame
    python tools/pack_game.py --input ./my-game --validate-only

What it does (bible §17.3):
  * validates entry, game.json, id, paths, quotas, symlinks and obvious remote dependencies;
  * never runs game code and never runs package hooks;
  * copies only runtime files into a NEW output folder (input is never modified);
  * computes real size + SHA-256 for every runtime file, writes game.json LAST,
    then reads the output back and verifies it;
  * exit code 0 only when the package is valid (warnings do not fail, errors do).

Only the Python 3 standard library is used.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import stat
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

MIB = 1024 * 1024
LIMITS = {
    "max_files": 2000,
    "max_depth": 12,
    "max_total": 200 * MIB,
    "max_file": 64 * MIB,
    "max_entry": 4 * MIB,
    "max_manifest": 1 * MIB,
}
ENTRY = "index.html"
OUTSIDE = "<outside-of-game>"
MANIFEST = "game.json"
OUTPUT_MARKER = ".kgp-pack-output"
TEMPLATE_ID = "family.template-bimbim"
SDK_NAME = "player-sdk.js"
ID_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{2,95}$")
COLOR_RE = re.compile(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")

# Mirrors app core/MimeTypes.kt.
MIME = {
    "html": "text/html", "htm": "text/html", "js": "text/javascript", "mjs": "text/javascript",
    "css": "text/css", "json": "application/json", "txt": "text/plain", "png": "image/png",
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp", "gif": "image/gif",
    "svg": "image/svg+xml", "ogg": "audio/ogg", "mp3": "audio/mpeg", "wav": "audio/wav",
    "m4a": "audio/mp4", "mp4": "video/mp4", "webm": "video/webm", "woff": "font/woff",
    "woff2": "font/woff2", "ttf": "font/ttf", "otf": "font/otf",
}
DEV_SUFFIXES = (".md", ".map", ".psd", ".xcf", ".ai", ".kra", ".blend", ".py", ".ts", ".tsx", ".zip")
DEV_NAMES = {"thumbs.db", "desktop.ini", "__macosx", "node_modules"}

REMOTE_ATTR = re.compile(r"""(?i)\b(?:src|href|poster|data)\s*=\s*["']\s*((?:https?:)?//[^"']+)""")
LOCAL_ATTR = re.compile(r"""(?i)\b(?:src|href|poster)\s*=\s*(["'])(.*?)\1""")
CSS_URL = re.compile(r"""url\(\s*(["']?)([^"')]+)\1\s*\)""")
CSS_IMPORT = re.compile(r"""@import\s+(?:url\()?\s*["']([^"']+)["']""")
JS_IMPORT = re.compile(r"""(?:\bimport\s*(?:[^'"]*?\bfrom\s*)?|\bimport\s*\()\s*["']([^"']+)["']""")
JS_REMOTE = re.compile(r"""["'`](?:https?:)?//[A-Za-z0-9.-]+\.[A-Za-z]{2,}[^"'`]*["'`]""")
JS_RISKY = [
    (re.compile(r"\beval\s*\("), "eval() is blocked by the player CSP"),
    (re.compile(r"\bnew\s+Function\s*\("), "new Function() is blocked by the player CSP"),
    (re.compile(r"serviceWorker\s*\.\s*register"), "Service Worker is not supported"),
    (re.compile(r"\bnew\s+(?:Shared)?Worker\s*\("), "Web Workers are not supported"),
    (re.compile(r"\bwindow\s*\.\s*open\s*\("), "window.open is always refused by the player"),
    (re.compile(r"\bnavigator\s*\.\s*(?:mediaDevices|geolocation|bluetooth|usb)\b"), "device permissions are always denied"),
]
AUDIO_OUTSIDE_SDK = re.compile(r"\bnew\s+(?:Audio|AudioContext|webkitAudioContext)\s*\(")
# Android 8 devices that never updated WebView run Chromium 69 (checked on the API 26 emulator).
OLD_WEBVIEW_CSS = [
    (re.compile(r"(?<![-\w])inset\s*:"), "`inset` needs Chromium 87+ (Android 8 WebView is 69); use top/right/bottom/left"),
    (re.compile(r"(?<![-\w])gap\s*:"), "`gap` in a flex container needs Chromium 84+ (grid is fine); use margins in flex"),
    (re.compile(r"(?<![-\w])aspect-ratio\s*:"), "`aspect-ratio` needs Chromium 88+"),
    (re.compile(r":(?:is|where|has)\("), ":is()/:where()/:has() need Chromium 88+"),
]
OLD_WEBVIEW_JS = [
    (re.compile(r"\?\.(?![0-9])"), "optional chaining `?.` needs Chromium 80+ (Android 8 WebView is 69)"),
    (re.compile(r"\?\?"), "`??` needs Chromium 80+ (Android 8 WebView is 69)"),
    # Seen in the family's own games: the page stops at its first call on Chromium 69.
    (re.compile(r"\bObject\.fromEntries\b"), "`Object.fromEntries` needs Chromium 73+ (Android 8 WebView is 69)"),
]


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def error(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)


# ------------------------------------------------------------------------------ paths
def validate_rel(path: str, max_depth: int = LIMITS["max_depth"]) -> str | None:
    """Returns the reason a relative path is rejected, or None. Mirrors core/PathPolicy.kt."""
    if not path:
        return "empty"
    if len(path) > 1024:
        return "too long"
    for ch in path:
        cp = ord(ch)
        if cp < 0x20 or cp == 0x7F or 0x80 <= cp <= 0x9F:
            return "control character"
        if unicodedata.category(ch) in ("Cf", "Cs"):
            return "format/surrogate character"
        if ch in "\\:":
            return "backslash or colon"
    if path.startswith("/"):
        return "absolute path"
    norm = unicodedata.normalize("NFC", path)
    segs = norm.split("/")
    if len(segs) - 1 > max_depth:
        return "too deep"
    for s in segs:
        if s == "":
            return "empty segment"
        if s in (".", ".."):
            return "dot segment"
        if len(s) > 255:
            return "segment too long"
        if s.strip() != s:
            return "leading/trailing whitespace"
    return None


def collision_key(path: str) -> str:
    return unicodedata.normalize("NFC", path).lower()


def ext_of(path: str) -> str:
    name = path.rsplit("/", 1)[-1]
    dot = name.rfind(".")
    return "" if dot <= 0 or dot == len(name) - 1 else name[dot + 1:].lower()


def is_dev_file(rel: str) -> bool:
    parts = rel.split("/")
    for p in parts:
        if p.startswith(".") or p.lower() in DEV_NAMES:
            return True
    name = parts[-1].lower()
    return name.startswith("readme") or name.endswith(DEV_SUFFIXES)


def sha256_file(p: Path) -> tuple[int, str]:
    h = hashlib.sha256()
    size = 0
    with open(p, "rb") as f:
        while True:
            b = f.read(1024 * 1024)
            if not b:
                break
            size += len(b)
            h.update(b)
    return size, h.hexdigest()


# ------------------------------------------------------------------------------ collect
def collect(root: Path, rep: Report) -> dict[str, Path]:
    files: dict[str, Path] = {}
    seen: dict[str, str] = {}
    root_real = os.path.realpath(root)
    skipped_dev, skipped_type = [], []
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        d = Path(dirpath)
        for dn in list(dirnames):
            full = d / dn
            if full.is_symlink():
                rep.error(f"symlink directory not allowed: {full.relative_to(root).as_posix()}")
                dirnames.remove(dn)
        for fn in filenames:
            full = d / fn
            rel = unicodedata.normalize("NFC", full.relative_to(root).as_posix())
            if full.is_symlink():
                target = os.path.realpath(full)
                inside = os.path.commonpath([root_real, target]) == root_real
                rep.error(f"symlink not allowed{'' if inside else ' (points outside the game)'}: {rel}")
                continue
            if not stat.S_ISREG(full.lstat().st_mode):
                rep.error(f"not a regular file: {rel}")
                continue
            if rel == MANIFEST:
                continue
            if is_dev_file(rel):
                skipped_dev.append(rel)
                continue
            if ext_of(rel) not in MIME:
                skipped_type.append(rel)
                continue
            reason = validate_rel(rel)
            if reason:
                rep.error(f"bad path ({reason}): {rel}")
                continue
            key = collision_key(rel)
            if key in seen:
                rep.error(f"paths collide (case/Unicode): {seen[key]} ~ {rel}")
                continue
            seen[key] = rel
            files[rel] = full
    if skipped_dev:
        rep.notes.append("not packed (development files): " + ", ".join(sorted(skipped_dev)[:12]))
    if skipped_type:
        rep.warn("not packed (type not supported by the player): " + ", ".join(sorted(skipped_type)[:12]))
    reserved = sorted(r for r in files if r.startswith("__kgp__/"))
    if reserved:
        rep.warn("__kgp__/ is reserved for the player (1.1.0+); these files are never served: " + ", ".join(reserved[:12]))
    return files


# ------------------------------------------------------------------------------ manifest
def load_manifest(root: Path, rep: Report) -> dict | None:
    p = root / MANIFEST
    if not p.exists():
        return None
    if p.stat().st_size > LIMITS["max_manifest"]:
        rep.error("game.json is larger than 1 MiB")
        return {}
    try:
        data = json.loads(p.read_text(encoding="utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        rep.error(f"game.json is not valid JSON: {e}")
        return {}
    if not isinstance(data, dict):
        rep.error("game.json must be an object")
        return {}
    return data


def build_manifest(src: dict | None, args, rep: Report) -> dict:
    m = dict(src or {})
    if args.id:
        m["id"] = args.id
    if args.title:
        m["title"] = args.title
    if args.version:
        m["version"] = args.version
    schema = m.get("schemaVersion", 1)
    if schema != 1:
        rep.error(f"schemaVersion {schema!r} is not supported (only 1)")
    gid = m.get("id")
    if gid is None:
        rep.error("missing game id: add \"id\" to game.json or pass --id (ids must stay stable across updates)")
    elif not isinstance(gid, str) or not ID_RE.match(gid):
        rep.error(f"invalid id {gid!r}: use lowercase a-z 0-9 . _ - (3-96 chars)")
    elif gid.startswith("builtin.") and not args.allow_builtin_id:
        rep.error("ids starting with 'builtin.' are reserved for games inside the APK")
    elif gid == TEMPLATE_ID and not args.allow_template_id:
        rep.warn(f"id {TEMPLATE_ID} belongs to the template; give a new game its own id")
    title = m.get("title")
    if not isinstance(title, str) or not title.strip():
        rep.error("missing title (Vietnamese title shown under the icon)")
    elif len(title.strip()) > 60:
        rep.warn("title longer than 60 characters will be cut by the player")
    if "entry" in m and m["entry"] != ENTRY:
        rep.error("entry must be index.html")
    if m.get("orientation", "landscape") != "landscape":
        rep.warn("orientation is ignored: v1 is landscape only")
    api = m.get("playerApiVersion")
    if api is not None and api != 1:
        rep.error("playerApiVersion must be 1")
    color = m.get("backgroundColor")
    if color is not None and (not isinstance(color, str) or not COLOR_RE.match(color)):
        rep.warn("backgroundColor ignored (use #RRGGBB)")
        m.pop("backgroundColor", None)
    so = m.get("sortOrder")
    if so is not None and (not isinstance(so, int) or isinstance(so, bool) or abs(so) > 1_000_000):
        rep.warn("sortOrder ignored (integer expected)")
        m.pop("sortOrder", None)
    icon = m.get("icon", "icon.png")
    if not isinstance(icon, str) or validate_rel(icon):
        rep.error("icon must be a safe relative path")
    for k in ("permissions", "openUrl", "nativeCommand", "install", "scripts"):
        if k in m:
            rep.warn(f"field '{k}' grants nothing and is ignored by the player")
    out = {
        "schemaVersion": 1,
        "id": m.get("id"),
        "title": (title or "").strip(),
        "version": str(m.get("version", "1.0.0")),
        "entry": ENTRY,
        "icon": icon if isinstance(icon, str) else "icon.png",
        "orientation": "landscape",
        "playerApiVersion": 1 if api in (None, 1) and args.sdk_present else api,
    }
    if out["playerApiVersion"] is None:
        out.pop("playerApiVersion")
    if "backgroundColor" in m:
        out["backgroundColor"] = m["backgroundColor"].upper()
    if "sortOrder" in m:
        out["sortOrder"] = m["sortOrder"]
    return out


# ------------------------------------------------------------------------------ static checks
def resolve_ref(base_dir: str, ref: str) -> str | None:
    ref = ref.strip().split("#", 1)[0].split("?", 1)[0]
    if not ref or ref.startswith(("/", "data:", "blob:", "javascript:", "mailto:", "tel:")) or "${" in ref or ref.startswith("{"):
        return None
    if ":" in ref:
        return None
    parts = base_dir.split("/") if base_dir else []
    for seg in ref.split("/"):
        if seg in ("", "."):
            continue
        if seg == "..":
            if not parts:
                return OUTSIDE
            parts.pop()
        else:
            parts.append(seg)
    from urllib.parse import unquote
    if not parts:
        return None
    try:
        return unicodedata.normalize("NFC", unquote("/".join(parts), errors="strict"))
    except UnicodeDecodeError:
        return OUTSIDE


def static_checks(files: dict[str, Path], manifest: dict, rep: Report, reference_sdk: Path | None) -> None:
    present = set(files)
    for rel, path in sorted(files.items()):
        ext = ext_of(rel)
        if ext not in ("html", "htm", "css", "js", "mjs"):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            rep.error(f"{rel}: text file is not UTF-8")
            continue
        base = rel.rsplit("/", 1)[0] if "/" in rel else ""
        refs: list[str] = []
        if ext in ("html", "htm"):
            for m in REMOTE_ATTR.finditer(text):
                rep.error(f"{rel}: remote resource {m.group(1)[:80]} (games must be offline; bundle it locally)")
            refs += [m.group(2) for m in LOCAL_ATTR.finditer(text)]
            refs += [m.group(2) for m in CSS_URL.finditer(text)]
            for m in re.finditer(r"(?is)<script\b[^>]*>(.*?)</script>", text):
                scan_js(rel, m.group(1), rep, inline=True)
        if ext == "css":
            refs += [m.group(2) for m in CSS_URL.finditer(text)]
            refs += [m.group(1) for m in CSS_IMPORT.finditer(text)]
        if ext in ("css", "html", "htm"):
            scan_old_webview(rel, text, OLD_WEBVIEW_CSS, rep)
        if ext in ("js", "mjs"):
            refs += [m.group(1) for m in JS_IMPORT.finditer(text) if m.group(1).startswith((".", "/")) or "//" in m.group(1)]
            scan_js(rel, text, rep, inline=False)
        for ref in refs:
            r = ref.strip()
            if re.match(r"(?i)^(https?:)?//", r):
                rep.error(f"{rel}: remote dependency {r[:80]}")
                continue
            target = resolve_ref(base, r)
            if target is None:
                continue
            if target == OUTSIDE:
                rep.error(f"{rel}: reference leaves the game folder: {r[:80]}")
            elif target not in present:
                rep.error(f"{rel}: missing file referenced: {target}")
    index = files.get(ENTRY)
    if index is not None:
        html = index.read_text(encoding="utf-8", errors="replace")
        scripts = re.findall(r"""(?is)<script\b([^>]*)>""", html)
        srcs = [re.search(r"""src\s*=\s*["']([^"']+)""", s) for s in scripts]
        first_src = next((m.group(1) for m in srcs if m), None)
        uses_sdk = any(m and m.group(1).endswith(SDK_NAME) for m in srcs)
        if manifest.get("playerApiVersion") == 1:
            if not uses_sdk:
                rep.error("playerApiVersion is 1 but index.html does not load player-sdk.js")
            elif first_src is None or not first_src.endswith(SDK_NAME) or (scripts and not re.search(r"src\s*=", scripts[0])):
                rep.warn("player-sdk.js should be the first script, before any gameplay/audio code")
        if SDK_NAME in files and reference_sdk and reference_sdk.is_file():
            if sha256_file(files[SDK_NAME])[1] != sha256_file(reference_sdk)[1]:
                rep.warn("player-sdk.js differs from the reference copy in games-template/MauGame")
    if "icon.png" not in files and manifest.get("icon", "icon.png") not in files:
        rep.warn("icon missing: the player will show a letter placeholder")


def scan_js(rel: str, text: str, rep: Report, inline: bool) -> None:
    where = f"{rel}{' (inline script)' if inline else ''}"
    for m in JS_REMOTE.finditer(text):
        rep.warn(f"{where}: looks like a remote URL {m.group(0)[:70]} (the player blocks network; check it is unused)")
    for rx, msg in JS_RISKY:
        if rx.search(text):
            rep.warn(f"{where}: {msg}")
    if not rel.endswith(SDK_NAME) and AUDIO_OUTSIDE_SDK.search(text):
        rep.warn(f"{where}: audio created outside KidsSDK.audio (pause/mute may not reach it)")
    scan_old_webview(where, text, OLD_WEBVIEW_JS, rep)


def scan_old_webview(where: str, text: str, rules, rep: Report) -> None:
    for rx, msg in rules:
        m = rx.search(text)
        if m:
            line = text.count("\n", 0, m.start()) + 1
            rep.warn(f"{where}:{line}: old WebView: {msg}")


# ------------------------------------------------------------------------------ quota
def check_quota(files: dict[str, Path], rep: Report) -> dict[str, tuple[int, str]]:
    if len(files) > LIMITS["max_files"]:
        rep.error(f"too many files: {len(files)} > {LIMITS['max_files']}")
    sums: dict[str, tuple[int, str]] = {}
    total = 0
    for rel in sorted(files):
        size, digest = sha256_file(files[rel])
        sums[rel] = (size, digest)
        total += size
        limit = LIMITS["max_entry"] if rel == ENTRY else LIMITS["max_file"]
        if size > limit:
            rep.error(f"{rel}: {size} bytes exceeds the {limit // MIB} MiB limit")
    if total > LIMITS["max_total"]:
        rep.error(f"package is {total} bytes, above the {LIMITS['max_total'] // MIB} MiB limit")
    if ENTRY not in files:
        rep.error("index.html is missing at the root of the game folder")
    return sums


# ------------------------------------------------------------------------------ main
def manifest_text(manifest: dict, inventory: list[dict]) -> str:
    data = dict(manifest)
    data["files"] = inventory
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n"


def prepare_output(out: Path, inp: Path, overwrite: bool, rep: Report) -> bool:
    out_r = out.resolve()
    inp_r = inp.resolve()
    if out_r == inp_r or inp_r in out_r.parents or out_r in inp_r.parents:
        rep.error("output must be a separate folder, not inside or around the input")
        return False
    if out.exists():
        if not overwrite:
            rep.error(f"output exists: {out} (use --overwrite to replace a previous pack output)")
            return False
        if not (out / OUTPUT_MARKER).is_file():
            rep.error(f"refusing to delete {out}: it was not created by pack_game.py")
            return False
        shutil.rmtree(out)
    return True


def verify_output(out: Path, inventory: list[dict], rep: Report) -> None:
    listed = {e["path"] for e in inventory}
    for e in inventory:
        p = out / e["path"]
        if not p.is_file():
            rep.error(f"verify: missing in output {e['path']}")
            continue
        size, digest = sha256_file(p)
        if size != e["size"] or digest != e["sha256"]:
            rep.error(f"verify: content differs in output {e['path']}")
    for p in out.rglob("*"):
        if p.is_file():
            rel = unicodedata.normalize("NFC", p.relative_to(out).as_posix())
            if rel not in listed and rel not in (MANIFEST, OUTPUT_MARKER):
                rep.error(f"verify: unexpected file in output {rel}")
    try:
        json.loads((out / MANIFEST).read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001 - report any read-back failure
        rep.error(f"verify: game.json unreadable: {e}")


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Validate and pack a Kids Games Player game folder.")
    ap.add_argument("--input", required=True, help="game source folder (contains index.html)")
    ap.add_argument("--output", help="new folder to create, e.g. ready/KidsGames/MyGame")
    ap.add_argument("--validate-only", action="store_true", help="check only; write nothing")
    ap.add_argument("--overwrite", action="store_true", help="replace a previous output of this tool")
    ap.add_argument("--id", help="stable game id (required when the input has no game.json id)")
    ap.add_argument("--title", help="override title")
    ap.add_argument("--version", dest="version", help="override version label")
    ap.add_argument("--allow-builtin-id", action="store_true", help=argparse.SUPPRESS)
    ap.add_argument("--allow-template-id", action="store_true", help=argparse.SUPPRESS)
    ap.add_argument("--reference-sdk", default=str(Path(__file__).resolve().parent.parent / "games-template" / "MauGame" / SDK_NAME),
                    help=argparse.SUPPRESS)
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args(argv)

    inp = Path(args.input)
    rep = Report()
    if not inp.is_dir():
        print(f"ERROR: input folder not found: {inp}", file=sys.stderr)
        return 2
    if not args.validate_only and not args.output:
        print("ERROR: --output is required unless --validate-only", file=sys.stderr)
        return 2

    files = collect(inp, rep)
    args.sdk_present = SDK_NAME in files
    manifest = build_manifest(load_manifest(inp, rep), args, rep)
    sums = check_quota(files, rep)
    static_checks(files, manifest, rep, Path(args.reference_sdk) if args.reference_sdk else None)
    inventory = [{"path": p, "size": sums[p][0], "sha256": sums[p][1]} for p in sorted(sums)]

    if not rep.errors and not args.validate_only:
        out = Path(args.output)
        if prepare_output(out, inp, args.overwrite, rep):
            out.mkdir(parents=True)
            (out / OUTPUT_MARKER).write_text("created by tools/pack_game.py\n", encoding="utf-8")
            for e in inventory:
                dst = out / e["path"]
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(files[e["path"]], dst)
            # game.json is written last so a half-copied folder never looks complete.
            (out / MANIFEST).write_text(manifest_text(manifest, inventory), encoding="utf-8", newline="\n")
            verify_output(out, inventory, rep)
            # The hidden marker stays so a later --overwrite can safely replace this folder.
            # The player never copies or serves it (it is not in the inventory).

    total = sum(e["size"] for e in inventory)
    if not args.quiet:
        print(f"Game: {manifest.get('title')!s} [{manifest.get('id')}] version {manifest.get('version')}")
        print(f"Runtime files: {len(inventory)} ({total} bytes)")
        for n in rep.notes:
            print(f"note: {n}")
        for w in rep.warnings:
            print(f"WARNING: {w}")
        for e in rep.errors:
            print(f"ERROR: {e}")
    if rep.errors:
        print(f"FAILED: {len(rep.errors)} error(s)" + ("" if args.validate_only else "; nothing usable was written"))
        if not args.validate_only and args.output and Path(args.output).exists() and (Path(args.output) / OUTPUT_MARKER).exists():
            shutil.rmtree(args.output)
        return 1
    print("OK: valid package" + ("" if args.validate_only else f" written to {args.output}"))
    return 0


if __name__ == "__main__":
    sys.exit(run(sys.argv[1:]))
