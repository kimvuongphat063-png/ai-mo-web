# TEST_REPORT — 10 game HTML một file

Ngày: 11/10/2026. Bản kiểm thử: các `index.html` có SHA-256 trong `_build/final_hashes.txt` — đúng nội dung trong `KidsGames-1file.zip` (2.144.942 byte, SHA-256 `f54ac1511525471c53b178e83d7589fd99b463423eec46c016770cc5f56208a6`).

## 1. Môi trường và cách kiểm thử

| Hạng mục | Chi tiết |
| --- | --- |
| Máy | Windows, Python 3.14.3 + Pillow 12.2.0, Node 24.19.0 |
| Lint | `_tools/check.py`: `KidsGamesPlayer/tools/pack_game.py --validate-only`, chuỗi cấm ngoài khối SDK, API/CSS mới hơn Chromium 69, phân tích cú pháp ES2017 bằng acorn (`_tools/es2017check.js`), kích thước, `game.json`, `icon.png`. Kết quả từng game: `_build/lint/<Game>.txt` |
| Xem thử có CSP | `KidsGamesPlayer/tools/preview_game.py` (CSP giống app) cho mọi lần chạy |
| Desktop | `_tools/run_test.mjs <Game>`: Chrome 155 headless điều khiển qua DevTools Protocol; **chạm thật** (`Input.dispatchTouchEvent`, kể cả 2 ngón cùng lúc), kéo có rung tay ±15–20 px; 3 cỡ 1280×720, 800×360, 2400×1080; tạm dừng; tải lại. Kết quả: `_build/tests/<Game>.json`, ảnh `_screens/<Game>_*.jpg` |
| Android 8 / WebView 69 (A) | Emulator `kgp_api26` (Android 8.0, WebView = Chrome 69.0.3497.100) + **app Kids Games Player bản release đã cài**: chép 10 thư mục vào `/sdcard/KidsGames`, app tự nhận (tên tiếng Việt + icon), mở từng game và chơi bằng `adb shell input tap/swipe` (chạm thật của hệ thống). Ảnh: `_screens/android/api26_*.jpg` |
| Android 8 / WebView 69 (B) | Cùng emulator, ứng dụng **WebView Shell** (dùng đúng WebView 69 của máy) + DevTools: chạy lại các bài test tự động ở (Desktop) trên engine Chromium 69. Kết quả: `_build/tests/<Game>.api26.json`, ảnh `_screens/android/<Game>_api26_*.jpg` |
| Thủ công | Khung trình duyệt của Claude (ToNet, ToChu) để xem trực quan, kéo chuột thật màn 1–2 của ToNet |
| Công cụ phụ | `_tools/webview_shell.sh` (mở WebView Shell + nối DevTools), `_tools/adb_play.sh` (đổi tọa độ game → màn hình emulator để chạm/vuốt), `_tools/summary.py` (bảng kết quả). acorn lấy từ bộ nhớ đệm npm ngoại tuyến, chỉ dùng để kiểm thử, không nằm trong ZIP |

Ghi chú công cụ: trên WebView 69, DevTools không nhận `Input.dispatchTouchEvent` và giả lập kích thước màn hình bị lỗi, nên (B) dùng sự kiện chuột (→ cùng pointer events) và kích thước tự nhiên của emulator (684×315 CSS px, như điện thoại nhỏ nằm ngang); thao tác **2 ngón cùng lúc** chỉ kiểm được trên desktop. Chrome desktop tự xin `/favicon.ico` (máy chủ xem thử trả 403): đã loại khỏi “lỗi console” vì WebView của app không xin tệp này.

## 2. Bảng kết quả

PASS = đạt, FAIL = không đạt, NOT_RUN = chưa chạy (có lý do).

| Game | Preview (CSP) | Console sạch | Chơi trọn | 3 cỡ màn hình | Tạm dừng | Lưu / khôi phục | Lint | Kích thước | Android 8 · WebView 69 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ToNet | PASS | PASS | PASS (21/21) | PASS | PASS | PASS | PASS | 259 KB | PASS — app: màn 1–3; WebView: 20/20 (console: chỉ cảnh báo autoplay của WebView Shell) |
| ToChu | PASS | PASS | PASS (19/19) | PASS | PASS | PASS | PASS | 247 KB | PASS — app: chữ A; WebView: 18/18 (console: chỉ cảnh báo autoplay của WebView Shell) |
| ToSo | PASS | PASS | PASS (20/20) | PASS | PASS | PASS | PASS | 269 KB | PASS — app: số 1 + đếm; WebView: 19/19 (console: chỉ cảnh báo autoplay của WebView Shell) |
| PopIt | PASS | PASS | PASS (21/21) | PASS | PASS | PASS | PASS | 183 KB | PASS — app: bảng tròn → lật; WebView: 18/18, 1 NOT_RUN (console: chỉ cảnh báo autoplay của WebView Shell) |
| BongBongMau | PASS | PASS | PASS (13/13) | PASS | PASS | PASS | PASS | 222 KB | PASS — app: bắt bóng; WebView: 11/11 (console: chỉ cảnh báo autoplay của WebView Shell) |
| ToMau | PASS | PASS | PASS (14/14) | PASS | PASS | PASS | PASS | 350 KB | PASS — app: 4 lần tô; WebView: 12/12 (console: chỉ cảnh báo autoplay của WebView Shell) |
| NoiDiem | PASS | PASS | PASS (21/21) | PASS | PASS | PASS | PASS | 212 KB | PASS — app: ngôi sao; WebView: 20/20 (console: chỉ cảnh báo autoplay của WebView Shell) |
| GhepBong | PASS | PASS | PASS (15/15) | PASS | PASS | PASS | PASS | 220 KB | PASS — app: cấp 1; WebView: 13/13 (console: chỉ cảnh báo autoplay của WebView Shell) |
| XepHinh | PASS | PASS | PASS (14/14) | PASS | PASS | PASS | PASS | 599 KB | PASS — app: 2×2; WebView: 12/12 (console: chỉ cảnh báo autoplay của WebView Shell) |
| DanGo | PASS | PASS | PASS (18/18) | PASS | PASS | PASS | PASS | 223 KB | PASS — app: 8 phím + lướt; WebView: 15/15, 1 NOT_RUN (console: chỉ cảnh báo autoplay của WebView Shell) |

Ghi chú bảng:
- “Chơi trọn” = số kiểm tra đạt / tổng số kiểm tra của bài test desktop (mỗi game 13–21 kiểm tra: mở màn, chơi hết màn bằng chạm/kéo, màn chúc mừng, ↻ / → / lưới màn, thao tác sai không bị phạt, gợi ý…). Chi tiết: `_build/tests/<Game>.json` và `.desktop.log`.
- Cột Android: “app” = chơi trong **app Kids Games Player release** trên emulator Android 8 bằng `adb input` (ảnh `_screens/android/api26_*.jpg`); “WebView” = số kiểm tra chức năng đạt khi chạy lại cùng bài test trên WebView 69 (`_build/tests/<Game>.api26.json`, có ghi SHA-256 của `index.html` đã thử). NOT_RUN = kiểm tra 2 ngón cùng lúc (không bơm được qua DevTools của WebView 69; đã đạt trên desktop).
- Console trên WebView 69 chỉ có một loại thông báo của chính Chrome 69: *“The Web Audio autoplay policy will be re-enabled in Chrome 70…”* — do WebView Shell để mặc định “cần cử chỉ người dùng cho media”, còn app Kids Games Player tắt yêu cầu này (`GameWebView.kt:39: mediaPlaybackRequiresUserGesture = false`). Thử lại bằng chạm hệ thống thật (`adb input tap`) vẫn thấy thông báo này trong WebView Shell (`_build/audio_probe.txt`); không có lỗi JavaScript nào.
- Tốc độ đổ màu ToMau (tranh 1000×1000): desktop tối đa 10,8 ms/lần; emulator Android 8 (x86, vẽ phần mềm, máy chủ đang tải) tối đa 46 ms/lần — dưới ngân sách 150 ms. Phát lại tranh đã lưu: 3,9 ms (desktop) / 6,7 ms (emulator) mỗi lần chạm.
- Lint, desktop và WebView trong bảng là của bản cuối (SHA-256 trong `_build/final_hashes.txt`, trùng nội dung `KidsGames-1file.zip`). Phần “app” (chơi trong app release) làm trên bản trước hai lần sửa cuối (xử lý vị trí nhấc tay; âm lượng + đánh thức âm thanh ở `pointerup`); sau đó bản cuối đã được chép vào app và ToNet được chơi lại trong app (màn 3 — đúng chỗ từng lỗi — nay qua).

## 3. Ghi chú từng game

**ToNet — Tô nét.** 12 màn (ngang, dọc, chéo, zigzag, sóng, cung, vòng tròn, xoắn ốc, vòng lặp, vuông, tam giác, mê cung 3 ngõ cụt). Đã kéo trọn 12 màn (desktop + WebView 69); kéo chuột thật trong khung trình duyệt màn 1–2; trong app trên Android 8 vuốt `adb` màn 1–3. Mê cung: vào ngõ cụt → thỏ tự lùi về ngã rẽ (Shi “ngơ ngác”), không phạt; đi tắt thẳng qua xoắn ốc/sóng không được tính. `#debug` có đủ 12 đường.

**ToChu — Tô chữ cái.** 29 chữ IN HOA + 29 chữ thường, dấu phụ là nét riêng. Đã tô bằng ngón: A, Ă (có ˘), O (sau một lần “đi tắt” không được tính), a, i (nét + chạm dấu chấm), b, g; vẽ nguệch ngoạc ngoài đường không tiến; công tắc A/a lưu lại. Trong app Android 8: tô A bằng 3 lần vuốt → chúc mừng. `#debug` (chạm để đổi hoa/thường) đã soát từng chữ: hình và thứ tự nét đúng.

**ToSo — Tô số và đếm.** Tô 0–9 (8 tô một nét qua chỗ giao nhau) → đếm đồ vật (chạm lại vật đã đếm không đếm thêm; số 0 = rổ trống) → phần 2 (5 câu/lượt, thẻ sai rung nhẹ, sau 5 s các vật tự đánh số và thẻ đúng sáng lên). Số câu đúng được lưu. Trong app Android 8: tô số 1 (2 lần vuốt) → đếm 1 vật.

**PopIt.** 9 bảng (15–33 bóng). Hai ngón vuốt hai hàng cùng lúc (desktop); bấm hết → bảng lật → mặt kia nổi lại + 1 sao; chế độ đếm 123. Trong app Android 8: vuốt hết bảng tròn → lật + chúc mừng.

**BongBongMau — Bắt bóng đúng màu.** 15 mục tiêu (6 màu có hoa văn, 4 hình, số 1–5). Chạm bóng sai: rung + nốt trầm, không trừ. Đã hoàn thành đỏ, xanh dương, tam giác, số 4 và hai mục tiêu ở hai cỡ màn hình bằng chạm vào bóng đang bay.

**ToMau — Tô màu Gi & Shi.** 6 tranh, 12 màu, tẩy, hoàn tác. Kiểm tra bằng màu điểm ảnh: đổ màu không tràn qua nét, hoàn tác, tẩy, dựng lại tranh từ thao tác đã lưu sau khi tải lại (giống từng điểm ảnh). Thời gian một lần đổ màu: xem bảng §2.

**NoiDiem — Nối các điểm.** 12 hình 5→20 chấm; chạm chấm sai không có gì xảy ra; nối bằng kéo một mạch, bằng chạm từng chấm, và kéo hai lần (nhấc tay giữa chừng). Hình hiện màu + chuyển động (sao xoay, cá bơi, bướm vỗ cánh, tên lửa bay…).

**GhepBong — Tìm bóng.** 4 chủ đề × 4 cấp (2–5 vật), cấp 4–5 luôn có cặp bóng gần giống (mèo/chó, táo/cam, ô tô/xe buýt, bóng/bóng bay). Kéo sai → vật trượt về chỗ cũ. Trong app Android 8: giải cấp 1.

**XepHinh — Xếp hình Gi & Shi.** 6 tranh × 2×2 / 3×2 / 3×3; ảnh mờ 25% trong khung; mảnh hút vào trong 60 px; thả sai → về chỗ. Trong app Android 8: giải 2×2 bằng vuốt `adb`.

**DanGo — Đàn gõ cầu vồng.** 8 phím, chạm/2 ngón/vuốt lướt (mỗi phím kêu một lần); chơi theo đèn 5 bài, phím khác vẫn kêu và đèn chờ. Trong app Android 8: gõ 8 phím + vuốt lướt, nốt nhạc bay lên.

## 4. Lựa chọn kỹ thuật

1. **Mọi game vẽ trên một `<canvas>` 1280×720** (`KidsSDK.fitCanvas`, giữ tỷ lệ, có dải viền khi màn hình dài hơn 16:9). Bộ khung chung `_src/common/kit.js`: màn hình, nút tròn lớn (vùng chạm ≥ 116 px), màn chúc mừng (↻ / → / lưới màn), hạt sao/hoa giấy, Gi & Shi nhảy ra cổ vũ, bàn tay gợi ý, âm thanh tổng hợp.
2. **Gộp một file** bằng `_tools/build.py`: thẻ `<script>` đầu tiên trong `<head>` là SDK nguyên văn giữa `/* KIDS-SDK v1 BEGIN */ … /* KIDS-SDK v1 END */` (lint so khớp từng byte với `games-template/MauGame/player-sdk.js`), rồi CSS, ảnh `data:`, mã game. `game.json` tối giản (không `files`), `id` dạng `family.*`, `sortOrder` 110–200.
3. **Ảnh** (`_tools/assets.py`): 10 tư thế Gi/Shi cắt nền, cao 340 px, WebP q80 (13–16 KB mỗi ảnh); 6 tranh tô màu 1000 px ngưỡng hóa + làm dày nét 1 px, PNG 1-bit (13–23 KB base64, nhỏ hơn mục tiêu 40–120 KB nên **nhúng đủ 6 tranh**) + ảnh nhỏ 220 px; 6 tranh xếp hình 720 px WebP q78 (37–56 KB) + ảnh nhỏ. Ảnh lớn chỉ giải mã khi mở tranh đó. File lớn nhất: XepHinh 599 KB.
4. **Chữ/số để tô** là dữ liệu nét (`_src/common/glyphs.js`, lệnh M/L/Q/C/E/D, lấy mẫu lại mỗi 2 đơn vị); ô chữ và thẻ chữ mẫu cũng vẽ từ chính dữ liệu nét (không dùng font) để hình mẫu luôn giống nét bé tô. Chữ thường dùng **“ɑ” và “g” một tầng** như vở tập tô/viết của Việt Nam. Thứ tự nét: trên xuống, trái sang phải, chữ thân tròn bắt đầu phía trên bên phải ngược chiều kim đồng hồ; dấu phụ (˘ ^, móc ơ/ư, gạch đ) là nét riêng tô sau. Kiểm bằng `index.html#debug` (ảnh `_screens/ToNet_debug.jpg`, `ToChu_debug*.jpg`, `ToSo_debug.jpg`).
5. **Engine tô nét** (`_src/common/trace.js`) theo mục 7: một ngón, cửa sổ `[tiến độ − 5, tiến độ + 20]`, dung sai 12% chiều cao chữ (ToChu/ToSo 46–48 px, ToNet 54 px), đường hướng dẫn ~17%, xong nét khi ≥ 95%, nhấc tay giữ tiến độ, đặt lại trong 1,5× dung sai, đi lệch chỉ có vệt mờ biến mất, gợi ý sau 4,5 s. **Bổ sung sau khi thử trên Android:** vị trí lúc nhấc tay cũng được xử lý, và nét đã đi ≥ 85% mà nhấc tay gần điểm cuối (≤ 1,5× dung sai) cũng tính là xong.
6. **Âm thanh** chỉ qua `KidsSDK.audio.context()/output()`; đỉnh âm lượng mỗi hiệu ứng ≤ 0,25; không nhạc nền; không `speechSynthesis`; AudioContext được tạo/đánh thức trong `pointerdown` (như brief) và đánh thức lại ở `pointerup` (với cảm ứng, trình duyệt chỉ coi `pointerup`/`touchend` là cử chỉ được phép bật âm thanh).
7. **Tạm dừng**: mọi chuyển động chạy theo `KidsSDK.loop` (đồng hồ game dừng khi inactive), thao tác kéo dở bị hủy, lưu khi `onSave`; vẽ lại khi đổi kích thước dù đang dừng.
8. **Lưu**: `KidsSDK.save` với `saveSchemaVersion: 1`, ghi ở mốc (xong màn/chữ/bảng/bài, mỗi lần tô màu) và `onSave`. ToMau lưu danh sách chạm `[x, y, màu]` (≤ 400/tranh) và phát lại khi mở tranh.
9. **Không thua, không đếm ngược**; sai → rung nhẹ + nốt trầm ngắn; gợi ý tự động sau 4,5–5 s; chọn màn tự do, ô gợi ý (viền vàng nhấp nháy chậm < 1 lần/giây) và sao ở ô đã xong.
10. Chữ hiển thị ngắn, có dấu: “Giỏi quá!”, “Tuyệt vời!”, “Hoan hô!”, “Đẹp quá!”, tên game; tên nốt Đô Rê Mi Pha Son La Si Đô.

## 5. Khác với brief / phần chưa làm

- **ToChu**: làm cả **IN HOA và chữ thường** (29 + 29). Hình minh họa kèm từ (tùy chọn) có cho 15 chữ chắc chắn đúng: B–bóng, C–cá, D–dưa hấu, H–hoa, K–kem, L–lá, M–mèo, N–nhà, O–ong, Ô–ô, R–rùa, S–sao, T–táo, V–voi, X–xe.
- **NoiDiem**: cây thông có **11 chấm** (brief gợi ý 9: cây hai tầng có thân cần 11 chấm để không méo). Các hình khác đúng số chấm gợi ý.
- **ToMau**: chế độ phụ “bút sáp” (vẽ tự do) **chưa làm** (brief ghi tùy chọn). Nút ↻ ở màn chúc mừng quay lại tô tiếp tranh đó (không xóa tranh của bé).
- **XepHinh**: mảnh hình chữ nhật bo góc (không làm mảnh răng cưa).
- **DanGo**: 5 giai điệu dân gian/cổ điển thuộc phạm vi công cộng — Twinkle Twinkle Little Star, Frère Jacques (câu cuối “Đô–Son–Đô” chơi Son cao vì đàn chỉ có Đô–Đô’), Row Row Row Your Boat, Old MacDonald (bỏ nốt lấy đà), Ode to Joy. Trong game chỉ có biểu tượng, không có tên bài hay lời.
- **PopIt**: 9 bảng (thêm 1 so với yêu cầu ≥ 8: mặt Gi và mặt Shi riêng); bóng đường kính 74 px (nhỏ hơn mức 110 px vì là pop-it; bé vuốt qua nên không cần chính xác).
- Không thay game nào bằng game dự phòng.

## 6. Lỗi đã tìm thấy và đã sửa trong lúc kiểm thử

| # | Phát hiện bởi | Lỗi | Sửa |
| --- | --- | --- | --- |
| 1 | `pack_game.py` | Chú thích trong mã có chữ `?.`, `??`, `roundRect` → bị báo “old WebView” | Viết lại chú thích (mã thật không dùng các cú pháp này) |
| 2 | acorn ES2017 | Biến tên `let` trong hình “khối ABC” (từ khóa dành riêng ở strict mode) | Đổi tên biến |
| 3 | Ảnh chụp | Ô chữ/thẻ chữ mẫu dùng font hệ thống: “a” hai tầng khác nét tô “ɑ” | Vẽ chữ mẫu từ chính dữ liệu nét |
| 4 | Ảnh chụp | Hai Gi/Shi chồng nhau khi cổ vũ / dưới màn chúc mừng (ToChu, ToSo, PopIt, NoiDiem) | Ẩn hình đứng sẵn hoặc cho nhân vật cổ vũ ra phía bên kia |
| 5 | Test PopIt | Bảng sao/khủng long/kem chỉ 9–11 bóng; viền sáng bên trong vẽ ra vạch thừa ở hình ghép | Tự chọn lưới bóng tốt nhất (12 độ lệch), viền bằng “tô đè lên nét dày”; nay 15–33 bóng/bảng |
| 6 | Ảnh chụp | BongBongMau: số và hình trong bóng quá nhỏ | Phóng to (số ≈ 0,8 bán kính bóng, chấm đếm bên dưới) |
| 7 | Console Chrome | ToMau: cảnh báo đọc `getImageData` nhiều lần trên cùng canvas | Mỗi tranh một canvas mới; vòng lặp đổ màu bỏ tra mặt nạ: 14,5 → 9,6 ms/lần |
| 8 | Test NoiDiem | Nhấc tay rồi kéo tiếp chỉ ăn khi đặt lại đúng chấm vừa nối | Chạm ở đâu cũng bắt đầu kéo; đi qua chấm đang sáng là nối |
| 9 | **Android 8 (adb swipe)** | Vị trí cuối của ngón tay chỉ có ở `pointerup`; ToNet dừng ở 94% nên không qua màn | Mọi game kéo/tô xử lý thêm vị trí lúc nhấc tay; nét ≥ 85% mà nhấc tay gần điểm cuối thì tính xong |
| 10 | Rà soát âm lượng | Vài hiệu ứng cộng nhiều giọng có đỉnh > 0,25 | Giảm để đỉnh mỗi hiệu ứng ≤ 0,25 |
| 11 | Console WebView 69 | Thông báo autoplay của Chrome 69 khi tạo AudioContext trong `pointerdown` (cảm ứng không phải cử chỉ kích hoạt) | Giữ `pointerdown` theo brief, thêm đánh thức ở `pointerup`; trong app không áp dụng vì app tắt yêu cầu cử chỉ cho media |
| 12 | Test ToMau trên WebView | Bộ test “làm sạch” lưu trữ ngay trên trang game, nhưng game tự lưu lại khi rời trang (`pagehide` → `onSave`) | Lỗi của bộ test (game đúng): xóa lưu trữ trên một trang không chạy game rồi mới mở game |

## 7. Lỗi / giới hạn còn biết

- **Chưa chạy trên điện thoại thật.** Android chỉ thử trên emulator (raster phần mềm). Tốc độ, cảm giác chạm và âm thanh trên máy thật có thể khác.
- **Âm thanh chưa được nghe thử**: emulator chạy `-no-audio`, Chrome headless tắt tiếng. Đã kiểm: AudioContext chạy khi active, bị `suspend` và `muted` khi tạm dừng/ẩn; không có lỗi JavaScript khi phát. Độ to/độ hay cần nghe trên máy thật.
- **Chạm nhiều ngón** (PopIt, DanGo) chỉ kiểm được trên Chrome desktop (2 điểm chạm qua DevTools); trên WebView 69 các bài test dùng một con trỏ.
- Trên WebView Shell không giả lập được 3 kích thước; WebView chạy ở kích thước tự nhiên 684×315 CSS px. Ba kích thước 1280×720 / 800×360 / 2400×1080 kiểm trên Chrome desktop; trong app (1720×1080 sau thanh bên) đã xem bằng ảnh chụp.
- Trong app, vùng game 1720×1080 không đúng 16:9 nên có dải viền mỏng trên/dưới cùng màu nền game (đúng thiết kế `fitCanvas`).
- ToNet: con vật/xe đi theo hướng đường nên khi đi thẳng đứng sẽ quay nghiêng 90°.
- BongBongMau cấp số dùng chữ số của font hệ thống (số 4 kiểu đóng) — khác số 4 “mở” trong ToSo.
- Các nhân vật phụ (ong, cá, mèo, xe…) là hình vẽ bằng mã, đơn giản; Gi & Shi luôn là ảnh gốc.
- Lưu ý chung của app (từ `KidsGamesPlayer/BUILD_REPORT.md`): trên Android 8 emulator đôi khi lần vẽ đầu thiếu một mảng; không thấy trong các lần thử ở đây.

## 8. Phụ huynh nên tự thử trên máy thật

1. Chép thư mục vào `KidsGames`, mở app: đủ 10 game, tên tiếng Việt và icon đúng.
2. **Tô nét / Tô chữ / Tô số** bằng ngón tay của bé: có quá khó hoặc quá dễ không (dung sai rộng ~1/8 chiều cao chữ). Thử nhấc tay giữa nét rồi tô tiếp.
3. **Âm lượng**: tiếng “pụp”, “ting”, nốt đàn có vừa tai không; nút loa của app tắt được hết.
4. **Pop-it, Đàn gõ** với 2–3 ngón cùng lúc.
5. **Tô màu**: chạm tô vùng lớn (nền) có tức thì không trên máy của bé (máy tính: ~10 ms/lần).
6. Thoát giữa chừng bằng nút nhà / Home của máy rồi vào lại: game dừng, không phát tiếng khi ở nền, chơi tiếp được; tiến trình (sao, chữ đã tô, tranh đã tô) còn sau khi tắt mở app.
7. Máy Android 8 cũ (nếu có): mở thử Xếp hình (ảnh lớn nhất) và Tô màu.
