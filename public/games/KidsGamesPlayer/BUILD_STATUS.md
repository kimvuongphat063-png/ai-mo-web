# BUILD_STATUS — Kids Games Player

Cập nhật theo milestone (bible §18). File này ghi trạng thái thực tế để có thể tiếp tục sau khi ngắt phiên.
Kết quả chi tiết và bằng chứng: `BUILD_REPORT.md`, `evidence/`.

## 1.1.0 — giọng đọc tiếng Việt (16/10/2026)

Nhiệm vụ: `../HANDOVER_TTS_v1.1.0.md` (player tự cung cấp `speechSynthesis` qua `TextToSpeech` offline, không sửa game). Quyết định: `docs/DECISIONS.md` §22.

| Bước | Trạng thái | Ghi chú |
| --- | --- | --- |
| Đo nguyên nhân (4.1) | DONE | WebView 69 và 145 đều không có `speechSynthesis`; cả hai emulator có Google TTS (`evidence/tts/measure-webview-1.0.0.txt`) |
| Shim + chèn HTML + `/__kgp__/` | DONE | `assets/host/speech-v1.js`, `HtmlInjector`, `HostAssets`, router |
| Kênh + engine + chính sách | DONE | `player/speech/`, `PlayerController` (`applyPolicy` → `SpeechHub.policyChanged`) |
| Khu phụ huynh + manifest `<queries>` | DONE | mục “Giọng đọc”, công tắc “Đọc lời trong game” |
| Test | DONE | unit 88/88, Python 10+1 skip, Node shim 9/9, instrumentation 23/23 trên API 37 và API 26 |
| Game thật trên emulator | DONE (emulator) | API 37: 3 họ game đọc qua Google TTS; tắt tiếng/Home/tắt màn hình/cổng phụ huynh/hộp chơi lại đều dừng đọc. API 26: đường đọc thật đạt, nhưng game A/B không chạy trên WebView 69 (lỗi có từ trước của game) |
| Release + cài đè + dist | DONE | APK `da8098f1…`, cùng khóa; cài đè 1.0.0 → 1.1.0 giữ dữ liệu trên cả hai emulator |
| Máy thật | BLOCKED | Cần chủ máy: `docs/DEVICE_CHECKLIST.md` mục 19–26 |

Lỗi tìm và sửa trong 1.1.0: WebView 69 hỏng chuỗi Latin-1 qua `WebMessagePort` ⇒ tin nhắn ASCII; Google TTS liệt kê giọng “đại diện” cho ngôn ngữ chưa cài ⇒ lọc; câu đầu chậm ⇒ làm ấm giọng Việt (đạt trên API 26, chưa đạt mục tiêu < 500 ms trên emulator API 37).

## 1.0.0

## Môi trường đã phát hiện (11/10/2026)

- Windows, WHPX dùng được cho emulator.
- JDK: Temurin 21.0.12.1 (AGP 9.4 yêu cầu tối thiểu JDK 17).
- Android SDK: `%LOCALAPPDATA%\Android\Sdk`; đã cài thêm `platforms;android-37.0`, system image API 37.0 và API 26 (google_apis x86_64). Build-tools 36.0.0 có sẵn.
- Gradle wrapper 9.6.0 (checksum từ services.gradle.org), AGP 9.4.0, AndroidX WebKit 1.17.1.
- Sandbox của agent chặn AF_UNIX trong TEMP: các lệnh Gradle được chạy với `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=...` (chỉ là điều kiện môi trường của agent, không cần trên máy thường).
- Python MSIX không thấy `%LOCALAPPDATA%\Android`: agent chép `platform-tools` và `build-tools/36.0.0` ra một thư mục riêng để chạy `adb`/`apksigner` từ Python/Git Bash.

## Milestone

| Milestone | Trạng thái | Ghi chú |
| --- | --- | --- |
| A — Môi trường, project, gate HTTPS cục bộ | DONE | Gate đạt trên WebView 145 (API 37) và WebView 69 (API 26): HTML/CSS/JS/.mjs/fetch/localStorage qua `https://g-<token>.invalid`, không có quyền INTERNET. |
| B — Thư mục → game | DONE | SAF picker thật, quyền bền sau reboot, scan/import/cập nhật/ẩn/xóa tiến trình trên emulator; unit test importer/scan/catalog. |
| C — Player đúng lifecycle | DONE | Router/CSP/Range/HEAD/mute/renderer có test thiết bị; E2E chơi, nền, tắt màn hình, kill process, máy bay. |
| D — Điều khiển trẻ/phụ huynh | DONE (emulator) | PIN, cổng phụ huynh, Back, ghim ứng dụng (từ chối/đồng ý/kết thúc). Cử chỉ bỏ ghim có mã khóa: cần máy thật (BLOCKED). |
| E — Workflow tạo game | DONE | SDK, template “Bim bim cho Shi”, 3 game mẫu, `pack_game.py`, `preview_game.py`, prompt cho AI. |
| F — Bàn giao | DONE | `dist/`: APK đã ký + verify, ZIP nguồn (đã build lại sạch từ ZIP), ZIP game mẫu, prompt, BUILD_REPORT, SHA256SUMS. |

## Lỗi phát hiện ở vòng kiểm thử bản release (đã sửa)

- **Nút “Hủy” trên bàn phím PIN không đóng bàn phím** (`ui/PinPad.kt`): tham số `cancel` của `show()` che hàm thành viên `cancel()`, nên nút chỉ gọi callback → game chạy lại có tiếng phía sau bàn phím vẫn hiện. Phím Back không bị (đi qua `pinPad.cancel()`). Sửa: gọi `this.cancel()`, đổi tên tham số; thêm `PinPadTest` (instrumentation). Đã kiểm lại trên APK release cuối (API 37): bàn phím đóng, game tiếp tục.
- **Bố cục game mẫu hỏng trên WebView 69 (Android 8 chưa cập nhật WebView)**: `inset: 0` và `gap` trong flex không được hỗ trợ → lớp phủ “Ghép màu”/“Lật thẻ” co về góc trái, chấm tiến trình dính nhau; lớp “Chạm để chơi” của SDK cũng dùng `inset`. Sửa CSS + SDK, đồng bộ lại game trong APK/ZIP mẫu, `pack_game.py` cảnh báo các tính năng CSS/JS mới (`docs/DECISIONS.md` mục 21). Đã kiểm lại trên API 26 và API 37 với APK cuối.
- Trước đó: `MainFlowTest` treo trên API 26 do `ActivityScenario.onActivity` chờ idle khi game chiếm luồng UI + lớp “Viewing full screen” của hệ thống → test dùng `runOnMainSync`; menu bỏ qua chạm lặp trong 350 ms (trước là 800 ms, nuốt chạm hợp lệ).

## Còn lại (không làm được trong môi trường agent)

1. Cài trên máy thật của bé và chạy `docs/DEVICE_CHECKLIST.md` (D04 bỏ ghim có mã khóa, D07 tablet/gập/cỡ chữ, D08 điều hướng 3 nút, D09 cuộc gọi/nhạc app khác, D10 đúng máy).
2. I17 (thiếu/tắt WebView): `pm disable-user com.google.android.webview` trên emulator API 37 không làm provider ngừng hoạt động → chưa mô phỏng được.
3. Sao lưu `.local-signing/` ra 2 nơi an toàn (chủ dự án).
