#!/usr/bin/env python3
"""Prints a compact PASS/FAIL list from JUnit XML result files (used by scripts and reports)."""
import glob
import io
import sys
import xml.etree.ElementTree as ET

def main(patterns):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    total = failed = 0
    for pattern in patterns:
        for f in sorted(glob.glob(pattern, recursive=True)):
            root = ET.parse(f).getroot()
            for tc in root.iter('testcase'):
                total += 1
                bad = tc.find('failure')
                if bad is None:
                    bad = tc.find('error')
                skipped = tc.find('skipped') is not None
                status = 'FAIL' if bad is not None else ('SKIP' if skipped else 'PASS')
                if bad is not None:
                    failed += 1
                print(f"{status} {tc.get('classname', '').split('.')[-1]}.{tc.get('name')} ({tc.get('time')}s)")
                if bad is not None:
                    text = (bad.get('message') or '') + '\n' + (bad.text or '')
                    print('    ' + text.strip()[:1200].replace('\n', '\n    '))
    print(f"TOTAL {total} FAILED {failed}")
    return 1 if failed else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
