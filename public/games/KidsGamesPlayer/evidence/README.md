# Bằng chứng kiểm thử

Tất cả ảnh chụp từ emulator do agent tạo (không phải máy thật của bé). Ảnh đã nén WebP 1200 px.

## 1.1.0 — giọng đọc (16/10/2026)

- `tests/unit-v1.1.0/` — JUnit XML + `summary.txt` (88 test JVM), `python-tools.txt`, `speech-shim-node.txt`.
- `tests/api37-v1.1.0/`, `tests/api26-v1.1.0/` — instrumentation 23/23 trên mã cuối.
- `tts/measure-webview-1.0.0.txt` — đo nguyên nhân (handover 4.1) trên bản 1.0.0.
- `tts/real-engine-*.txt` — `AndroidTtsEngineDeviceTest` với Google TTS thật: giọng thô (feature, `isLanguageAvailable`), danh sách app đưa cho game, độ trễ; `latency-notes.txt` tổng hợp.
- `tts/api37-*.txt`, `final37-mkc.txt` — game thật trên API 37 (APK release và bản debug): trình phát của uid Google TTS (10182) theo thời gian khi đọc, khi tắt tiếng, hộp chơi lại, Home, tắt màn hình, cổng phụ huynh.
- `tts/api26-*.txt`, `audio26-speaking.txt` — API 26: câu tiếng Việt trong trang game thật (DevTools), tắt tiếng/Home/tắt màn hình/cổng phụ huynh.
- `release/v1.1.0-*.txt` — `apksigner verify`, `aapt2 dump badging` (quyền), cây manifest (có `<queries>` TTS_SERVICE); `release/upgrade-api26.txt`, `upgrade-api37.txt` — cài đè 1.0.0 → 1.1.0 (R1) rồi R1 → bản bàn giao.
- `screens/` 1.1.0: `api26-menu-1.1.0`, `api26-parent-speech` (mục Giọng đọc), `api26-aisong-start`/`api26-maykechuyen-1` (game trên WebView 69: không chạy/vỡ bố cục — lỗi có sẵn của game), `api37-aisong-*`, `api37-bacsi-*`, `api37-mkc-*` (kể truyện, chữ được tô theo lời), `api37-cun-*`, `api37-vi-voice-installed` (gói giọng Việt trong Google TTS), `api37-parent-speech`, `upg26-*`, `upg37-*` (trước/sau cài đè, checkpoint “Lật thẻ”), `final37-latthe-checkpoint`.

## 1.0.0

## `tests/`
- `api37/` — JUnit XML + `summary.txt` của `connectedDebugAndroidTest` trên `kgp_api37` (Android 17, API 37, WebView 145.0.7632.218).
- `api26/` — tương tự trên `kgp_api26` (Android 8.0, API 26, WebView 69.0.3497.100). `summary-it12-release-app-in-foreground.txt`: lần chạy có 2 FAIL khi bản release của app đang mở trên cùng emulator (xem BUILD_REPORT §6.1); `summary.txt` là lần chạy lại với app release đã dừng.
- `unit/` — JUnit XML của `testDebugUnitTest` (JVM) và kết quả `tools/tests` (Python).

## `release/`
- `apksigner-verify.txt` — `apksigner verify --verbose --print-certs` trên APK bàn giao.
- `aapt-badging.txt`, `manifest-tree.txt` — package, min/target SDK, quyền, component (`aapt2 dump`).

## `screens/` (API 37, bản debug trừ khi ghi khác)

| Ảnh | Nội dung |
| --- | --- |
| `e2e-01-first-run` | Lần mở đầu: màn “Chào bố mẹ!” (kèm lớp hướng dẫn toàn màn hình của hệ thống) |
| `e2e-02-setup` | Màn thiết lập: tạo PIN, chọn thư mục, hướng dẫn ghim |
| `e2e-03-pin-create`, `e2e-04-pin-weak`, `e2e-05-pin-created` | Keypad PIN native; PIN dễ đoán bị từ chối; đã có PIN |
| `e2e-07-picker`, `e2e-08-allow` | Trình chọn thư mục hệ thống (SAF) và hộp thoại cấp quyền |
| `e2e-09-after-pick` | Sau khi chọn: về menu, 3 game trong thư mục đã được nạp (trước khi sửa header/ẩn demo trùng) |
| `e2e-10-menu` | Menu sau khi sửa: header gọn, không trùng game |
| `e2e-11-game-start`, `e2e-12-game-play` | “Chạm bong bóng” chạy trong WebView, dải nút native bên trái |
| `e2e-13a-latthe`, `e2e-13b-latthe-flip` | “Lật thẻ con vật” (ảnh 13b còn lỗi viền chữ, đã sửa sau) |
| `e2e-14-resume` | Ra nền rồi quay lại: màn native “Chơi tiếp nhé?” |
| `e2e-15-resumed-board` | Bàn thẻ sau khi chơi tiếp (mặt sau Gi & Shi) |
| `e2e-16-parent-gate-in-game`, `e2e-17-after-cancel` | Giữ nút khóa trong game → keypad PIN; Hủy → về game |
| `e2e-18-parent` | Khu vực phụ huynh: quyền thư mục, lần quét, danh sách game |
| `e2e-19-new-games` | Chép thêm 2 game khi menu đang mở → tự xuất hiện (I03) |
| `e2e-20-template-play` | Template “Bim bim cho Shi” chơi trong app |
| `e2e-21-session-section`, `e2e-22-session` | Chẩn đoán; phần Bảo vệ phiên (chưa ghim) |
| `e2e-23-pin-dialog` | Hộp thoại ghim của Android; app ghi “Hãy xác nhận…”, OS = NONE |
| `e2e-24-pin-denied`, `e2e-27-denied` | Trước/sau bản sửa thăm dò trạng thái: từ chối → “Android chưa ghim ứng dụng…” |
| `e2e-28-pinned-menu`, `e2e-29-pinned-after-home` | Đồng ý ghim → OS = PINNED, app về menu bé; phím Home không rời app |
| `e2e-30-parent-pinned` | Vào phụ huynh bằng PIN khi đang ghim: “Android đang ghim ứng dụng.” |
| `e2e-34-session-ended` | Kết thúc phiên → OS = NONE |
| `e2e-35-playing-during-update`, `e2e-36-updated-game` | Cập nhật game trong lúc chơi; lần mở sau dùng bản 1.0.1 (I05) |
| `rel-01..04` | **Bản release đã ký**: lần đầu, “Thử game mẫu”, menu, chơi “Ghép màu” |

### Bản release đã ký trên API 26 (`rel26-*`)

| Ảnh | Nội dung |
| --- | --- |
| `rel26-01-menu`, `rel26-02-game`, `rel26-03-play` | Cài APK release sạch trên Android 8.0, menu demo, mở và chơi (B05) |
| `rel26-04-resume` | Ra nền rồi quay lại: “Chơi tiếp nhé?” (nhánh không có MUTE_AUDIO → phiên bị tạm dừng hẳn) |
| `rel26-05-pin-dialog`, `rel26-06-pinned-after-home` | APK cuối, cài sạch: “Bắt đầu phiên” → hộp thoại ghim của Android 8 → “GOT IT” → PINNED; Home không rời app (B05) |
| `rel26-07-ghepmau-start-fixed` | “Ghép màu” trên WebView 69 sau khi bỏ `inset`/flex `gap`: lớp phủ ở giữa, chấm tiến trình cách đều |
| `rel26-08-drag-placed` | Kéo hình tròn đỏ vào ô tròn → khớp, viền xanh (I21 kéo-thả) |
| `rel26-09-latthe-start`, `rel26-10-latthe-flip` | “Lật thẻ” trên WebView 69: màn bắt đầu, lật thẻ 3D |
| `rel26-11-gate-cancelled` | Cổng phụ huynh trong game → “Hủy”: bàn phím đóng; nhánh không MUTE_AUDIO → “Chơi tiếp nhé?” |
| `rel26-12-resume-checkpoint` | Chơi tiếp → game nạp lại, cặp đã lật còn nguyên |
| `rel26-13-after-pick-menu`, `rel26-14-parent-folder` | Picker SAF Android 8 (“Show internal storage” → `KidsGames` → SELECT): “Có quyền đọc thư mục.”, demo bị ẩn vì thư mục có bản tương ứng |
| `api26-stuck`, `api26-hang2` | Ảnh chẩn đoán lúc `MainFlowTest` treo trên API 26: lớp “Viewing full screen” của hệ thống che game (đã sửa test, xem BUILD_STATUS) |

### Bản release đã ký trên API 37 (`rel37-*`)

| Ảnh | Nội dung |
| --- | --- |
| `rel37-state` | Màn bắt đầu “Lật thẻ con vật” (bản 1.0.1 cũ trong thư mục emulator, còn viền chữ kiểu cũ) |
| `rel37-01-setup-done` | Thiết lập: đã có PIN |
| `rel37-02-picker-cancel` | Mở picker rồi hủy → “Không đổi thư mục.”, vẫn chỉ có demo (I22) |
| `rel37-03-after-pick` | Chọn `KidsGames` + Cho phép → 5 game |
| `rel37-04-after-reboot-parent` | Sau khi khởi động lại emulator: “Có quyền đọc thư mục.”, quét `unchanged=8` (I02) |
| `rel37-05-hidden`, `rel37-06-menu-hidden` | Ẩn “Bim bim cho Shi” trong khu phụ huynh → biến khỏi menu (I15) |
| `rel37-07-checkpoint` | Lật đúng một cặp → checkpoint |
| `rel37-08-after-kill-restored` | Ra nền + `am force-stop` → mở lại: cặp đã lật còn nguyên (I16) |
| `rel37-09-fast-kill-restored` | Lật cặp thứ hai rồi `force-stop` sau ~1 s → vẫn còn (I16) |
| `rel37-10-after-reinstall-menu`, `rel37-11-after-reinstall-board` | `adb install -r` cùng APK: game ẩn vẫn ẩn, checkpoint còn (B06) |
| `rel37-12-longpress-title` | Nhấn giữ 1,5 s trên chữ/ảnh: không chọn chữ, không thanh Copy/Share (I21) |
| `rel37-13-airplane-bongbong`, `rel37-14-airplane-ghepmau` | Chế độ máy bay, mở lại app: canvas/Web Audio và `fetch(levels.json)` chạy đủ (I14) |
| `rel37-15-before-reset`, `rel37-17-reset-confirm`, `rel37-18-after-reset-board` | Xóa tiến trình “Lật thẻ” → bàn mới, không còn cặp đã lật (I15) |
| `rel37-16-flip-on` | Bật “Xoay ngược màn hình 180°” → `ROTATION_270`; giữ sau khi mở lại app; tắt → `ROTATION_90` (D06) |
| `rel37-19-gate-open`, `rel37-20-gate-cancelled` | Sau khi sửa `PinPad`: giữ nút khóa → bàn phím; “Hủy” → bàn phím đóng, game chạy tiếp |
| `rel37-21-final-ghepmau`, `rel37-22-final-latthe` | APK cuối (cập nhật đè, dữ liệu còn) + bộ game mẫu mới chép đè vào thư mục: hiển thị đúng trên WebView 145 |

Bản release dùng cho từng nhóm ảnh: xem `BUILD_REPORT.md` §6.4.

`release/audio-probe-api37.txt`: trạng thái player âm thanh của uid app theo `dumpsys audio` qua các bước tắt tiếng, cổng phụ huynh, Home, tắt màn hình (I09/I10).
