#!/usr/bin/env python3
"""Small adb + uiautomator helper used for the device walkthrough (evidence screenshots).

Developer/QA tool only. Never resets, wipes or provisions a device; it only installs,
launches, taps visible UI, pushes test folders and captures screenshots.

    python tools/device_helper.py shot NAME            # evidence/screens/NAME.png
    python tools/device_helper.py tap-text "Thử game mẫu"
    python tools/device_helper.py tap X Y
    python tools/device_helper.py hold X Y MS
    python tools/device_helper.py dump                 # list visible texts with centers
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ADB = os.environ.get("ADB") or str(Path(os.environ.get("LOCALAPPDATA", "")) / "Android/Sdk/platform-tools/adb.exe")
SERIAL = os.environ.get("ANDROID_SERIAL", "emulator-5554")
EVIDENCE = ROOT / "evidence" / "screens"


def adb(*args: str, binary: bool = False, check: bool = True):
    r = subprocess.run([ADB, "-s", SERIAL, *args], capture_output=True, check=check)
    return r.stdout if binary else r.stdout.decode("utf-8", "replace")


def shot(name: str) -> Path:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    data = adb("exec-out", "screencap", "-p", binary=True)
    p = EVIDENCE / f"{name}.png"
    p.write_bytes(data)
    return p


def nodes() -> list[dict]:
    adb("shell", "rm", "-f", "/sdcard/kgp-ui.xml", check=False)
    adb("shell", "uiautomator", "dump", "/sdcard/kgp-ui.xml", check=False)
    xml = adb("shell", "cat", "/sdcard/kgp-ui.xml")
    start = xml.find("<?xml")
    if start < 0:
        return []
    root = ET.fromstring(xml[start:])
    out = []
    for n in root.iter("node"):
        b = re.findall(r"\d+", n.get("bounds", ""))
        if len(b) != 4:
            continue
        x1, y1, x2, y2 = map(int, b)
        out.append({
            "text": n.get("text", ""), "desc": n.get("content-desc", ""), "id": n.get("resource-id", ""),
            "cx": (x1 + x2) // 2, "cy": (y1 + y2) // 2, "bounds": (x1, y1, x2, y2),
            "clickable": n.get("clickable") == "true", "enabled": n.get("enabled") == "true",
        })
    return out


def find(text: str) -> dict | None:
    all_nodes = nodes()
    for n in all_nodes:
        if text in (n["text"], n["desc"]):
            return n
    for n in all_nodes:
        if text and (text in n["text"] or text in n["desc"]):
            return n
    return None


def tap(x: int, y: int) -> None:
    adb("shell", "input", "tap", str(x), str(y))


def hold(x: int, y: int, ms: int) -> None:
    adb("shell", "input", "swipe", str(x), str(y), str(x), str(y), str(ms))


def tap_text(text: str, timeout: float = 10) -> bool:
    end = time.time() + timeout
    while time.time() < end:
        n = find(text)
        if n:
            tap(n["cx"], n["cy"])
            return True
        time.sleep(0.7)
    return False


def main(argv: list[str]) -> int:
    cmd = argv[0]
    if cmd == "shot":
        print(shot(argv[1]))
    elif cmd == "tap":
        tap(int(argv[1]), int(argv[2]))
    elif cmd == "hold":
        hold(int(argv[1]), int(argv[2]), int(argv[3]))
    elif cmd == "tap-text":
        ok = tap_text(argv[1])
        print("tapped" if ok else "NOT FOUND")
        return 0 if ok else 1
    elif cmd == "dump":
        for n in nodes():
            if n["text"] or n["desc"]:
                print(f'{n["cx"]:5d},{n["cy"]:5d}  {n["text"]!r} {n["desc"]!r} {n["id"]}')
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
