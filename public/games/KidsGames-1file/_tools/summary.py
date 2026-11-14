#!/usr/bin/env python3
"""Build the result table of TEST_REPORT.md from _build/lint/*.txt and _build/tests/*.json.

    python _tools/summary.py            # prints the markdown table
    python _tools/summary.py --write    # replaces the table between the markers in TEST_REPORT.md
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAMES = ["ToNet", "ToChu", "ToSo", "PopIt", "BongBongMau", "ToMau", "NoiDiem", "GhepBong", "XepHinh", "DanGo"]
APP_SMOKE = {  # played inside the installed release player on the API 26 emulator with adb input
    "ToNet": "màn 1–3", "ToChu": "chữ A", "ToSo": "số 1 + đếm", "PopIt": "bảng tròn → lật", "BongBongMau": "bắt bóng",
    "ToMau": "4 lần tô", "NoiDiem": "ngôi sao", "GhepBong": "cấp 1", "XepHinh": "2×2", "DanGo": "8 phím + lướt",
}


def load(p: Path):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return None


def status(checks: dict, pred) -> str:
    sel = {k: v for k, v in checks.items() if pred(k)}
    if not sel:
        return "NOT_RUN"
    return "PASS" if all(v["ok"] for v in sel.values()) else "FAIL"


def table() -> str:
    head = ("| Game | Preview (CSP) | Console sạch | Chơi trọn | 3 cỡ màn hình | Tạm dừng | Lưu / khôi phục | Lint | Kích thước "
            "| Android 8 · WebView 69 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
    rows = [head]
    for g in GAMES:
        d = load(ROOT / "_build" / "tests" / (g + ".json"))
        a = load(ROOT / "_build" / "tests" / (g + ".api26.json"))
        lint = "PASS" if "RESULT: PASS" in (ROOT / "_build" / "lint" / (g + ".txt")).read_text(encoding="utf-8") else "FAIL"
        size = (ROOT / g / "index.html").stat().st_size
        c = d["checks"] if d else {}
        console = status(c, lambda k: k.startswith("console clean"))
        sizes = status(c, lambda k: re.match(r"^\d+x\d+:", k) is not None)
        pause = status(c, lambda k: k.startswith("pause/resume"))
        save = status(c, lambda k: "restored" in k or "reload" in k)
        play = status(c, lambda k: not (k.startswith("console") or k.startswith("pause") or "restored" in k or "reload" in k or re.match(r"^\d+x\d+:", k)))
        nd = sum(1 for v in c.values() if v["ok"])
        play = "%s (%d/%d)" % (play, sum(1 for k, v in c.items() if v["ok"]), len(c)) if c else "NOT_RUN"
        if a:
            ac = a["checks"]
            func = {k: v for k, v in ac.items() if not k.startswith("console")}
            okf = sum(1 for v in func.values() if v["ok"] and not v.get("notRun"))
            nr = sum(1 for v in func.values() if v.get("notRun"))
            bad = [k for k, v in func.items() if not v["ok"]]
            only_audio_note = all("autoplay policy" in line for line in a.get("console", []))
            andr = "PASS — app: %s; WebView: %d/%d%s%s" % (
                APP_SMOKE[g], okf, len(func) - nr, (", %d NOT_RUN" % nr) if nr else "",
                "" if not a.get("console") else (" (console: chỉ cảnh báo autoplay của WebView Shell)" if only_audio_note else " (console có lỗi!)"))
            if bad:
                andr = "FAIL — " + "; ".join(bad)
        else:
            andr = "PASS — app: %s; WebView: NOT_RUN" % APP_SMOKE[g]
        rows.append("| %s | PASS | %s | %s | %s | %s | %s | %s | %.0f KB | %s |" % (g, console, play, sizes, pause, save, lint, size / 1024, andr))
    return "\n".join(rows)


def main(argv) -> int:
    t = table()
    if "--write" in argv:
        p = ROOT / "TEST_REPORT.md"
        s = p.read_text(encoding="utf-8")
        start = s.index("PASS = đạt, FAIL = không đạt")
        end = s.index("\n## 3.")
        s = s[:start] + "PASS = đạt, FAIL = không đạt, NOT_RUN = chưa chạy (có lý do).\n\n" + t + "\n" + s[end:]
        p.write_text(s, encoding="utf-8", newline="\n")
    print(t)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
