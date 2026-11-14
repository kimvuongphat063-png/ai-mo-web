"""U15 and packer contract tests. Run: python -m unittest discover -s tools/tests -v"""
from __future__ import annotations

import base64
import hashlib
import io
import json
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import pack_game  # noqa: E402

PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
SDK = Path(__file__).resolve().parents[2] / "games-template" / "MauGame" / "player-sdk.js"


def make_game(root: Path, *, manifest: dict | None = None, html: str | None = None, extra: dict | None = None) -> Path:
    root.mkdir(parents=True, exist_ok=True)
    (root / "player-sdk.js").write_bytes(SDK.read_bytes())
    (root / "index.html").write_text(html or '<!doctype html><script src="player-sdk.js"></script><script src="game.js"></script>', encoding="utf-8")
    (root / "game.js").write_text("console.log('hi')\n", encoding="utf-8")
    (root / "icon.png").write_bytes(PNG)
    (root / "assets").mkdir(exist_ok=True)
    (root / "assets" / "pop.ogg").write_bytes(b"OggS-fake")
    (root / "README.md").write_text("dev notes", encoding="utf-8")
    (root / ".DS_Store").write_bytes(b"x")
    m = {"schemaVersion": 1, "id": "family.test-game", "title": "Trò chơi thử", "version": "1.0.0", "files": []}
    if manifest is not None:
        m = manifest
    if m:
        (root / "game.json").write_text(json.dumps(m, ensure_ascii=False), encoding="utf-8")
    for rel, content in (extra or {}).items():
        p = root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
    return root


def run(*args: str) -> tuple[int, str]:
    buf = io.StringIO()
    with redirect_stdout(buf):
        code = pack_game.run(list(args))
    return code, buf.getvalue()


class PackGameTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_pack_is_deterministic_and_inventory_is_real(self) -> None:
        src = make_game(self.base / "src")
        code1, out1 = run("--input", str(src), "--output", str(self.base / "out1"))
        code2, _ = run("--input", str(src), "--output", str(self.base / "out2"))
        self.assertEqual(0, code1, out1)
        self.assertEqual(0, code2)
        m1 = (self.base / "out1" / "game.json").read_bytes()
        self.assertEqual(m1, (self.base / "out2" / "game.json").read_bytes())
        data = json.loads(m1)
        paths = [f["path"] for f in data["files"]]
        self.assertEqual(sorted(paths), paths)
        self.assertNotIn("game.json", paths)
        self.assertNotIn("README.md", paths)
        self.assertNotIn(".DS_Store", paths)
        self.assertEqual({"assets/pop.ogg", "game.js", "icon.png", "index.html", "player-sdk.js"}, set(paths))
        for f in data["files"]:
            b = (src / f["path"]).read_bytes()
            self.assertEqual(len(b), f["size"])
            self.assertEqual(hashlib.sha256(b).hexdigest(), f["sha256"])
        self.assertEqual(1, data["playerApiVersion"])
        self.assertFalse((self.base / "out1" / "README.md").exists())
        # Input untouched.
        self.assertEqual([], json.loads((src / "game.json").read_text(encoding="utf-8"))["files"])

    def test_validate_only_writes_nothing(self) -> None:
        src = make_game(self.base / "src")
        code, _ = run("--input", str(src), "--validate-only")
        self.assertEqual(0, code)
        self.assertEqual({"player-sdk.js", "index.html", "game.js", "icon.png", "assets", "README.md", ".DS_Store", "game.json"},
                         {p.name for p in src.iterdir()})

    def test_id_is_required_and_stable(self) -> None:
        src = make_game(self.base / "src", manifest={})
        code, out = run("--input", str(src), "--validate-only")
        self.assertEqual(1, code)
        self.assertIn("missing game id", out)
        code, _ = run("--input", str(src), "--output", str(self.base / "o"), "--id", "family.from-cli", "--title", "Tên")
        self.assertEqual(0, code)
        self.assertEqual("family.from-cli", json.loads((self.base / "o" / "game.json").read_text(encoding="utf-8"))["id"])
        bad = make_game(self.base / "bad", manifest={"schemaVersion": 1, "id": "builtin.hack", "title": "x"})
        self.assertEqual(1, run("--input", str(bad), "--validate-only")[0])

    def test_remote_and_missing_references_fail(self) -> None:
        src = make_game(self.base / "remote", html='<script src="player-sdk.js"></script><script src="https://cdn.example.com/lib.js"></script>')
        code, out = run("--input", str(src), "--validate-only")
        self.assertEqual(1, code)
        self.assertIn("remote", out)
        src2 = make_game(self.base / "missing", html='<script src="player-sdk.js"></script><img src="assets/nope.png">')
        code, out = run("--input", str(src2), "--validate-only")
        self.assertEqual(1, code)
        self.assertIn("missing file referenced: assets/nope.png", out)
        src3 = make_game(self.base / "escape", html='<script src="player-sdk.js"></script><img src="../../secret.png">')
        code, out = run("--input", str(src3), "--validate-only")
        self.assertEqual(1, code)
        self.assertIn("leaves the game folder", out)

    def test_contract_warnings(self) -> None:
        src = make_game(self.base / "warn", extra={"game.js": "new Audio('a.ogg'); eval('1'); fetch('https://api.example.com/x')"})
        code, out = run("--input", str(src), "--validate-only")
        self.assertEqual(0, code)
        self.assertIn("audio created outside KidsSDK.audio", out)
        self.assertIn("eval()", out)
        self.assertIn("remote URL", out)

    def test_old_webview_warnings(self) -> None:
        src = make_game(self.base / "old", extra={
            "style.css": ".o { position: absolute; inset: 0; }\n.row { display: flex; gap: 8px; }",
            "game.js": "var n = a?.b ?? 1;",
        })
        code, out = run("--input", str(src), "--validate-only")
        self.assertEqual(0, code, out)
        self.assertIn("style.css:1: old WebView: `inset`", out)
        self.assertIn("style.css:2: old WebView: `gap`", out)
        self.assertIn("optional chaining", out)
        newer = make_game(self.base / "newer", extra={"game.js": "var m = Object.fromEntries([['a', 1]]);"})
        code, out = run("--input", str(newer), "--validate-only")
        self.assertEqual(0, code, out)
        self.assertIn("`Object.fromEntries` needs Chromium 73+", out)
        clean = make_game(self.base / "clean", extra={"style.css": ".o { top: 0; margin-top: 4px; grid-row-gap: 2px; }",
                                                      "game.js": "var x = ok ? 0.5 : 1;"})
        code, out = run("--input", str(clean), "--validate-only")
        self.assertEqual(0, code)
        self.assertNotIn("old WebView", out)

    def test_reserved_host_directory_warns(self) -> None:
        src = make_game(self.base / "kgp", extra={"__kgp__/speech-v1.js": "// mine"})
        code, out = run("--input", str(src), "--validate-only")
        self.assertEqual(0, code, out)
        self.assertIn("__kgp__/ is reserved for the player", out)

    def test_missing_entry_fails(self) -> None:
        src = make_game(self.base / "noentry")
        (src / "index.html").unlink()
        self.assertEqual(1, run("--input", str(src), "--validate-only")[0])

    def test_output_overwrite_policy(self) -> None:
        src = make_game(self.base / "src")
        foreign = self.base / "foreign"
        foreign.mkdir()
        (foreign / "keep.txt").write_text("user data", encoding="utf-8")
        code, out = run("--input", str(src), "--output", str(foreign), "--overwrite")
        self.assertEqual(1, code)
        self.assertTrue((foreign / "keep.txt").exists(), "never delete a folder the tool did not create")
        out_dir = self.base / "ready"
        self.assertEqual(0, run("--input", str(src), "--output", str(out_dir))[0])
        self.assertEqual(1, run("--input", str(src), "--output", str(out_dir))[0])
        self.assertEqual(0, run("--input", str(src), "--output", str(out_dir), "--overwrite")[0])
        self.assertEqual(1, run("--input", str(src), "--output", str(src / "inside"))[0])

    def test_symlink_outside_root_is_rejected(self) -> None:
        src = make_game(self.base / "src")
        secret = self.base / "secret.js"
        secret.write_text("secret", encoding="utf-8")
        try:
            os.symlink(secret, src / "link.js")
        except (OSError, NotImplementedError):
            self.skipTest("symlinks not permitted on this host")
        code, out = run("--input", str(src), "--validate-only")
        self.assertEqual(1, code)
        self.assertIn("symlink", out)

    def test_path_policy_mirrors_app(self) -> None:
        bad = ["../x", "a/../b", "/abs", "C:/x", "a\\b", "a//b", "a/./b", " a", "a ", "a\u202eb", "x\x00y"]
        for p in bad:
            self.assertIsNotNone(pack_game.validate_rel(p), p)
        for p in ["index.html", "âm thanh/tiếng+vỗ tay.ogg", "a b/c.png"]:
            self.assertIsNone(pack_game.validate_rel(p), p)
        self.assertEqual(pack_game.collision_key("Icon.PNG"), pack_game.collision_key("icon.png"))
        deep = "/".join(f"d{i}" for i in range(13)) + "/f.png"
        self.assertIsNotNone(pack_game.validate_rel(deep))


if __name__ == "__main__":
    unittest.main()
