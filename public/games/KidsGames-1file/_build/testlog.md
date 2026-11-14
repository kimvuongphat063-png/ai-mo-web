# Test log (raw notes, source for TEST_REPORT.md)

## ToNet (2026-10-11)
- preview_game.py --port 8771 (CSP), Chromium browser pane. Console: no messages.
- Real pointer (CDP mouse) : start ▶, menu tile 1, drag L1 (ngang) -> done overlay, → next; reload; menu tile 2, drag L2 (dọc) -> done. Save after reload: done[0..1]=1.
- Synthetic PointerEvents (touch type) following the path with ±20 px noise: L3..L11 all completed.
- Maze L12: entered branch 1 -> dead end -> auto retreat (mode back to main), entered branch 2 a little and came back, finished main -> done.
- Shortcut straight line on wave (L5) and spiral (L8): NOT completed (correct).
- Idle 4.5 s -> hint hand runs along the remaining road (screenshot 06).
- Pause: visibilitychange hidden mid-drag -> K.time frozen 2 s, AudioContext suspended, muted; visible -> resumes same screen. Host onHostState(active:false, reason parent, requestSave) -> frozen; resume -> continues.
- Sizes: 1280x720, 800x360 (letterbox 640x360, spiral finished), 2400x1080 (canvas 1920x1080, loops finished).
- #debug grid of 12 roads with start/end/arrows checked visually (screenshot 09).

## ToChu (2026-10-11)
- Headless Chrome 155 via CDP (_tools/run_test.mjs), real touch events (Input.dispatchTouchEvent), preview_game.py CSP. 20/20 checks PASS (see _build/tests/ToChu.json).
- Traced A, Ă (breve), O (after a failed shortcut), a, i (dot tapped), b (800x360), g (2400x1080). Off-path scribble did not progress. Replay/next/grid buttons OK.
- Pause via visibility + host state: frozen, muted, AudioContext suspended; resumes on same screen. Reload: save {up,lo,mode} restored.
- #debug grids (UPPER, lower) reviewed: stroke order/arrows/start-end OK. Tile and model letters are drawn from the same stroke data (single-storey a/g).
- Browser favicon.ico 403 from the preview server is ignored (the WebView never asks for it).

## ToNet — headless re-run (2026-10-11)
- _tools/run_test.mjs ToNet: 22/22 PASS. Levels 1-11 traced with real touch drags (±17 px wobble), maze dead end -> auto retreat -> finish, spiral shortcut refused, pause/host, reload, 800x360 + 2400x1080.

## ToSo (2026-10-11)
- _tools/run_test.mjs ToSo: 20/20 PASS. Traced 3,4,0,8 (self-crossing),1 (800x360),2 (2400x1080); counting by tapping (double tap counts once; 0 = empty basket); part 2: wrong card shakes without penalty, counting helper after 5 s idle, 5 answers -> celebration, quizCorrect saved; pause/host; reload.
- #debug digits sheet reviewed (_screens/ToSo_debug.jpg).

## PopIt (2026-10-11)
- _tools/run_test.mjs PopIt: 21/21 PASS. 9 boards (circle 31, heart 24, star 19, square 33, dino 15, ice cream 17, fish 19, Gi face 23, Shi face 25 bubbles).
- Two-finger simultaneous swipes (CDP multi-touch, ids 1 and 2) popped two rows at once; every board cleared -> flip animation -> other side up -> star + celebration; count mode numbers; hint hand after 4.5 s; pause/host; reload restores flips + count mode; 800x360 + 2400x1080.

## BongBongMau (2026-10-11)
- _tools/run_test.mjs BongBongMau: 13/13 PASS. Wrong bubble -> wobble + low note, score unchanged. Red, blue (colors), triangle (shapes), 4 (numbers) completed with real taps on moving bubbles; celebration; hint hand on the lowest matching bubble; pause/host; reload; 800x360 + 2400x1080.
- Fix after screenshots: digits/shapes inside bubbles were too small -> enlarged (digit ~0.8 r, dots under the digit).

## ToMau (2026-10-11)
- _tools/run_test.mjs ToMau: 14/14 PASS. 6 pictures embedded (1-bit PNG 1000 px, 13-23 KB each + 220 px thumbs).
- Pixel checks: background fill red, inner region blue (background unchanged), undo restores, eraser -> white, 37 random fills.
- Flood fill timing (desktop headless Chrome 155): max 9.6 ms per tap on 1000x1000 (after removing mask lookups from the inner loops; was 14.5 ms). Replay on open: ~1.7 ms per saved tap.
- Done ✓ -> gold frame + Gi/Shi clap; next picture; colored thumbnail in the picture list; reload rebuilt the picture from 37 saved taps (pixel identical); 800x360 + 2400x1080 tap mapping verified by pixel color.
- Fix: Chrome warned about repeated getImageData on one canvas -> a fresh offscreen canvas per picture (one readback each).

## NoiDiem (2026-10-11)
- _tools/run_test.mjs NoiDiem: 21/21 PASS. 12 figures, dots: star 5, house 6, fish 8, boat 8, butterfly 10, pine tree 11 (brief said 9: 2-tier tree + trunk needs 11), cat 12, car 12, plane 12, dino 15, rocket 15, heart 20.
- Wrong dot ignored; star by one drag; house by single taps; all others by two drags with the finger lifted in the middle; reveal + animation + celebration; hint hand; pause/host; reload; 800x360 + 2400x1080.
- Bug found by the test and fixed: after lifting the finger, a new drag only worked if it started on the last joined dot -> now a drag can start anywhere and connects when it passes over the glowing next dot.

## GhepBong (2026-10-11)
- _tools/run_test.mjs GhepBong: 15/15 PASS. Wrong shadow -> slides home, nothing filled. Animals 2/3/5 (5 includes cat+dog look-alikes), fruits/vehicles/toys level 4 solved by real drags; celebration; hint (hand + ghost thing); pause/host; reload; 800x360 + 2400x1080.
- 32 hand-drawn canvas pictures in common/art.js (silhouette = same drawing filled with one dark color via source-in).

## XepHinh (2026-10-11)
- _tools/run_test.mjs XepHinh: 14/14 PASS. 6 scenes (720 px WebP q78, 50-75 KB base64 each) + 220 px thumbs; picture decoded lazily on open.
- Wrong drop slides home; 2x2, 3x2, 3x3 solved by real drags landing within ~42 px of the target (snap radius 60 px); pictures 4 and 6 3x3; celebration; hint (hand + yellow outline); pause/host; reload; 800x360 + 2400x1080.

## DanGo (2026-10-11)
- _tools/run_test.mjs DanGo: 17/17 PASS. Free play: 8 bars by single taps, two fingers at once -> 2 notes, glissando slide -> each bar once. Follow the light: wrong bar sounds and the light waits; Twinkle, Frère Jacques, Row Row Row Your Boat, Old MacDonald, Ode to Joy (all public domain, icons only, no lyrics) played to the end; celebration; hint; pause/host; reload; 800x360 + 2400x1080.
