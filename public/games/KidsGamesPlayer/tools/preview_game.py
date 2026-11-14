#!/usr/bin/env python3
"""Serve ONE game folder on http://127.0.0.1 for desktop browser testing.

    python tools/preview_game.py ./sample-games/BongBong            # CSP like the player
    python tools/preview_game.py ./my-game --port 8765 --no-csp --open

* Binds 127.0.0.1 only (never the LAN). Port 0 (default) lets the OS pick a free port.
* Same MIME table and path rules as the Android player; only GET/HEAD; single byte ranges.
* Applies the player's Content-Security-Policy by default to catch CDN/eval/worker use early.
* Browser storage is per http://127.0.0.1:<port>: use a different port (or clear storage)
  per game. Saves seen here prove nothing about origin isolation inside the app.
Standard library only.
"""
from __future__ import annotations

import argparse
import http.server
import os
import sys
import unicodedata
import webbrowser
from pathlib import Path
from urllib.parse import unquote, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pack_game import MIME, ext_of, validate_rel  # noqa: E402

CSP = ("default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; "
       "object-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; base-uri 'none'; "
       "form-action 'none'; frame-ancestors 'none'")
TEXT = {"html", "htm", "js", "mjs", "css", "json", "txt"}


def parse_range(header: str | None, size: int):
    """Single byte range like the player: None = full body, "unsatisfiable", or (start, end)."""
    if not header or "," in header or not header.strip().lower().startswith("bytes="):
        return None
    a, _, b = header.split("=", 1)[1].strip().partition("-")
    if not (a.isdigit() or a == "") or not (b.isdigit() or b == "") or (a == "" and b == ""):
        return None
    if a == "":
        n = int(b)
        return "unsatisfiable" if n == 0 or size == 0 else (max(0, size - n), size - 1)
    start = int(a)
    if b and int(b) < start:
        return None
    if start >= size:
        return "unsatisfiable"
    return start, min(int(b), size - 1) if b else size - 1


def make_handler(root: Path, csp: bool):
    root = root.resolve()

    class Handler(http.server.BaseHTTPRequestHandler):
        server_version = "KidsGamesPreview/1"

        def log_message(self, fmt, *args):  # concise console log
            sys.stderr.write("%s %s\n" % (self.command, fmt % args))

        def _resolve(self) -> tuple[Path | None, str | None, int]:
            raw = urlsplit(self.path).path
            if raw in ("", "/"):
                raw = "/index.html"
            low = raw.lower()
            if "%2f" in low or "%5c" in low or "%00" in low:
                return None, None, 400
            try:
                rel = unicodedata.normalize("NFC", unquote(raw[1:], errors="strict"))
            except UnicodeDecodeError:
                return None, None, 400
            if validate_rel(rel) or rel == "game.json" or any(p.startswith(".") for p in rel.split("/")):
                return None, None, 400 if validate_rel(rel) else 404
            ext = ext_of(rel)
            if ext not in MIME:
                return None, None, 403
            target = (root / rel).resolve()
            if root not in target.parents or not target.is_file():
                return None, None, 404
            return target, ext, 200

        def _headers(self, status: int, ext: str | None, length: int, extra: dict | None = None) -> None:
            self.send_response(status)
            if ext:
                ctype = MIME[ext] + ("; charset=utf-8" if ext in TEXT else "")
                self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(length))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Accept-Ranges", "bytes")
            if csp and ext in ("html", "htm"):
                self.send_header("Content-Security-Policy", CSP)
            for k, v in (extra or {}).items():
                self.send_header(k, v)
            self.end_headers()

        def _serve(self, head: bool) -> None:
            path, ext, status = self._resolve()
            if path is None:
                self._headers(status, None, 0)
                return
            size = path.stat().st_size
            start, end = 0, size - 1
            code = 200
            extra = {}
            rng = parse_range(self.headers.get("Range"), size)
            if rng == "unsatisfiable":
                self._headers(416, ext, 0, {"Content-Range": f"bytes */{size}"})
                return
            if rng is not None:
                start, end = rng
                code = 206
                extra["Content-Range"] = f"bytes {start}-{end}/{size}"
            length = end - start + 1 if size else 0
            self._headers(code, ext, length, extra)
            if head or length == 0:
                return
            with open(path, "rb") as f:
                f.seek(start)
                left = length
                while left > 0:
                    chunk = f.read(min(65536, left))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    left -= len(chunk)

        def do_GET(self):
            self._serve(head=False)

        def do_HEAD(self):
            self._serve(head=True)

        def _refuse(self):
            self._headers(405, None, 0)

        do_POST = do_PUT = do_DELETE = do_PATCH = do_OPTIONS = _refuse

    return Handler


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Serve one game folder on 127.0.0.1")
    ap.add_argument("folder")
    ap.add_argument("--port", type=int, default=0)
    ap.add_argument("--no-csp", action="store_true", help="do not send the player CSP header")
    ap.add_argument("--open", action="store_true", help="open the default browser")
    args = ap.parse_args(argv)
    root = Path(args.folder)
    if not (root / "index.html").is_file():
        print(f"ERROR: {root} has no index.html", file=sys.stderr)
        return 2
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), make_handler(root, not args.no_csp))
    url = f"http://127.0.0.1:{httpd.server_address[1]}/index.html"
    print(f"Serving {root.resolve()} at {url}  (Ctrl+C to stop)", flush=True)
    if args.open:
        webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
