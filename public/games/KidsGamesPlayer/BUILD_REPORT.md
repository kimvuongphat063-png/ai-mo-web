# BUILD_REPORT — Kids Games Player v1.1.0 (giọng đọc tiếng Việt cho game HTML)

Ngày: 16/10/2026. Trạng thái: **đã build, đã ký bằng đúng khóa của 1.0.0, đã kiểm thử trên emulator API 37 và API 26 (bản debug và APK release bàn giao), đã thử cài đè 1.0.0 → 1.1.0; chưa nghiệm thu trên máy thật của bé.**
Nhãn: PASS / FAIL / NOT_RUN / BLOCKED; “PASS (emulator)” = chạy thật trên emulator, không phải máy thật. Báo cáo 1.0.0 giữ nguyên ở cuối file (phần “Lịch sử”).

## 1. Artifact

| File | Byte | SHA-256 |
| --- | ---: | --- |
| `dist/KidsGamesPlayer-v1.1.0.apk` | 1.960.321 | `da8098f17936c2d77de46e67f648e17b4538c45d3c87377a8cb0e8797c81b6a6` |
| `dist/KidsGamesPlayer-source.zip` | — | xem `dist/SHA256SUMS.txt` |
| `dist/KidsGames-samples.zip` | — | xem `dist/SHA256SUMS.txt` (game mẫu không đổi so với 1.0.0) |
| `dist/GAME_AUTHORING_PROMPT.md`, `dist/BUILD_REPORT.md` | — | xem `dist/SHA256SUMS.txt` |

`dist/apksigner-verify.txt`: verify trên đúng APK bàn giao. Bộ bàn giao 1.0.0 được giữ nguyên ở `dist/previous/1.0.0/` (APK 1.0.0 sha256 `531d22db…5006`).

## 2. Thay đổi so với 1.0.0

- **Player tự cung cấp Web Speech API** (handover `HANDOVER_TTS_v1.1.0.md`, quyết định đã duyệt; chi tiết và mọi điểm lệch: `docs/DECISIONS.md` §22, kiến trúc: `docs/ARCHITECTURE.md` mục “Giọng đọc”). Không sửa game nào.
  - `assets/host/speech-v1.js` (shim ES5 cho Chromium 69) được chèn làm script đầu tiên của mọi trang HTML (`HtmlInjector`), phục vụ tại `/__kgp__/speech-v1.js` trên origin của game (`HostAssets`, router).
  - Kênh `WebMessagePort` (framework, API 23+) là cầu nối duy nhất trang → app; `SpeechBroker` kiểm tin, giới hạn, hàng đợi, luật âm thanh; `AndroidTtsEngine` dùng `TextToSpeech` với giọng **offline**; `SpeechHub` giữ engine dùng chung và kênh của trang hiện tại.
  - `PlayerController`: kênh mở khi trang tải xong và phiên `PLAYING`, đóng khi có tài liệu mới, về menu, tạm dừng, đóng phiên; `applyPolicy()` báo mọi thay đổi luật âm thanh.
- **Khu phụ huynh — mục “Giọng đọc”**: trạng thái (“Giọng tiếng Việt: có — …” / chưa có), số giọng offline, **Nghe thử**, **Mở cài đặt giọng đọc** (`com.android.settings.TTS_SETTINGS`, dự phòng `INSTALL_TTS_DATA`; khóa khi đang ghim), công tắc **Đọc lời trong game** (mặc định bật). Phần chẩn đoán có dòng giọng đọc.
- Manifest: thêm `<queries>` cho `android.intent.action.TTS_SERVICE`; **không thêm quyền**.
- `versionCode` 2, `versionName` 1.1.0, cùng khóa ký.
- `tools/pack_game.py`: cảnh báo file trong `__kgp__/` (dành riêng) và `Object.fromEntries` (cần Chromium 73+). `tools/qa/speech_shim_test.mjs`: test hành vi shim bằng Node.
- Tài liệu: `docs/DECISIONS.md` §22, `docs/ARCHITECTURE.md`, `docs/GAME_FORMAT.md` §4–5, `docs/DEVICE_CHECKLIST.md` (mục 19–26), `README_VI.md` (cài giọng tiếng Việt), `CLAUDE.md`.

## 3. Đo nguyên nhân (handover 4.1) — trên bản 1.0.0, trước khi sửa

| Thiết bị | WebView | `typeof speechSynthesis` / `SpeechSynthesisUtterance` | Engine TTS trên máy |
| --- | --- | --- | --- |
| Emulator API 37 | com.google.android.webview 145.0.7632.218 | `undefined` / `undefined` | `com.google.android.tts` (mặc định; `tts_default_synth` = null) |
| Emulator API 26 | com.android.chrome 69.0.3497.100 | `undefined` / `undefined` | `com.google.android.tts` 3.12.9 |

Nguồn: `evidence/tts/measure-webview-1.0.0.txt` (đo trong trang game mẫu bằng `tools/qa/webview_probe.mjs`). Kết luận: WebView không có Web Speech API; game rơi vào nhánh “không có `speechSynthesis`” và chạy im lặng.

Engine thật với bản 1.1.0 (`AndroidTtsEngineDeviceTest`, `evidence/tts/real-engine-*.txt`):

| Thiết bị | Giọng Việt lúc đầu | Danh sách app đưa cho game |
| --- | --- | --- |
| API 26, Google TTS 3.12.9 | `vi-vn-x-gft-local` đã có | 8 giọng: `vi-vn-x-gft-local` + 7 giọng `en-us-…-local` (lọc từ 43; bỏ giọng mạng và giọng đại diện `xx-XX-language`) |
| API 37, Google TTS mới | 5 giọng `vi-vn-…` đều mang cờ `notInstalled` ⇒ app không đưa ra (game im lặng có canh giờ) | sau khi tải gói giọng Việt (~8,8 MB) trong Cài đặt TTS của emulator: 13 giọng, gồm 5 giọng Việt `-local` |

## 4. APK

| Mục | Giá trị |
| --- | --- |
| Package / versionCode / versionName | `vn.family.kidsgamesplayer` / 2 / 1.1.0 |
| min / target / compile SDK | 26 / 37 / 37 |
| Chữ ký | v2 + v3, 1 signer, `CN=Kids Games Player, OU=Family, O=Family, C=VN`, SHA-256 chứng chỉ `c0e5bcc74c463e7ce5556a95514fd34014c25cf2854cde2c487ad82597282530` (giống 1.0.0) |
| Quyền | chỉ `vn.family.kidsgamesplayer.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (nội bộ AndroidX, như 1.0.0). **Không** `INTERNET` |
| Mới trong manifest | `<queries><intent><action android:name="android.intent.action.TTS_SERVICE"/></intent></queries>` |
| Exported | chỉ `MainActivity` (như 1.0.0) |

Nguồn: `evidence/release/v1.1.0-apksigner-verify.txt`, `v1.1.0-aapt-badging.txt`, `v1.1.0-manifest-tree.txt`.

## 5. Kết quả kiểm thử

### 5.1 Tự động (trên mã cuối)

| Bộ test | Kết quả | Evidence |
| --- | --- | --- |
| Unit JVM | PASS 88/88 (57 cũ + 31 mới: `HtmlInjectorTest` 8, `SpeechBrokerTest` 9, `SpeechProtocolTest` 6, `VoiceCatalogTest` 5, `SettingsStoreTest` 2, router 1) | `evidence/tests/unit-v1.1.0/` |
| Python (`tools/tests`) | PASS 10, SKIP 1 (symlink, như 1.0.0); có 2 test mới trong `test_pack_game` | `evidence/tests/unit-v1.1.0/python-tools.txt` |
| Shim bằng Node (`tools/qa/speech_shim_test.mjs`) | PASS 9/9 | `evidence/tests/unit-v1.1.0/speech-shim-node.txt` |
| Lint debug + release | PASS (0 lỗi; 13 cảnh báo, đúng bộ cảnh báo của 1.0.0; 2 cảnh báo do mã mới đã sửa) | `app/build/reports/lint-results-*.html` |
| Instrumentation API 37 | PASS 23/23 (13 cũ + 10 mới: `SpeechBridgeTest` 8, `SpeechPlayerFlowTest` 1, `AndroidTtsEngineDeviceTest` 1) | `evidence/tests/api37-v1.1.0/` |
| Instrumentation API 26 | PASS 23/23 | `evidence/tests/api26-v1.1.0/` |

Lỗi tìm thấy nhờ test và đã sửa trước bản cuối: **WebView 69 làm hỏng chuỗi chỉ gồm ký tự Latin-1 khi đi qua `WebMessagePort`** (“Hai con chó” tới app thành “Hai con ch” + U+FFF3) ⇒ mọi tin nhắn giờ là JSON ASCII (DECISIONS §22). Hai test `SpeechBridgeTest` fail trên API 26 trước khi sửa, đạt sau khi sửa.

### 5.2 Yêu cầu (handover §3)

| # | Yêu cầu | Trạng thái | Cách kiểm |
| --- | --- | --- | --- |
| 1 | Game có lời đọc trong player khi máy có giọng Việt, không sửa game | PASS (emulator API 37, 3 game đại diện, APK release) / NOT_RUN với 47 game còn lại từng cái một | Họ A “Ai Sống Ở Đâu”, họ B “Bác Sĩ Thú Nhí”, họ C “Máy Kể Chuyện”: trình phát `AudioTrack` của uid Google TTS (10182) `started` khi game đọc (`evidence/tts/api37-*.txt`); “Máy Kể Chuyện” tô chữ theo lời đọc (sự kiện `boundary`, ảnh `evidence/screens/api37-mkc-2.webp`). 47 game còn lại dùng cùng cách gọi (đã rà mã: `getVoices` lọc `vi`, `voiceschanged`, `onend` + `onerror`, `cancel` rồi `speak`), được mô phỏng bởi fixture `test-fixtures/webview/speech/` |
| 2 | Không có giọng Việt / TTS lỗi ⇒ im lặng có canh giờ, không treo | PASS | `SpeechBridgeTest.withoutTheAppTheGameStaysSilentAndTimed`, `withoutAVietnameseVoiceTheGameStaysSilent`; API 37 trước khi tải giọng: danh sách không có giọng Việt (`real-engine-api37-cold.txt`) |
| 3 | Theo luật âm thanh: tắt tiếng, ra nền, tắt màn hình, cổng phụ huynh, hộp chơi lại, phiên tạm dừng/đóng | PASS (emulator) | API 37: nút loa ⇒ tắt trong ~0,2 s (`api37-mute-timing.txt`, đối chứng không bấm vẫn đọc); hộp “Chơi lại” ⇒ ≤ 0,5 s (`api37-lifecycle-1.txt`); Home ⇒ ~0,4 s (`api37-home-debug.txt`); cổng phụ huynh ⇒ tắt khi giữ đủ 2 s, “Hủy” rồi đọc lại được (`api37-gate-release.txt`); tắt màn hình ⇒ tắt ~2 s sau phím nguồn, đúng lúc Android gọi `onPause` (`api37-lifecycle-debug.txt`). API 26 (không MUTE_AUDIO): Home, tắt màn hình, cổng phụ huynh ⇒ tắt trong ≤ 1 s; nút loa với game không theo SDK đóng phiên như 1.0.0 (`api26-lifecycle.txt`, `api26-mute.txt`). `SpeechPlayerFlowTest` (loa, hộp chơi lại, Home) trên cả hai API |
| 4 | Nhịp game: `start/end/error`; không được phát thì `end` sau thời lượng ước tính | PASS | `SpeechBridgeTest.notAudibleMeansNoEngineButTheSentenceChainKeepsItsPace`, `SpeechBrokerTest` |
| 5 | Không mạng: không `INTERNET`, chỉ giọng offline | PASS | `aapt2 dump`; `VoiceCatalogTest` (bỏ giọng mạng, `notInstalled`, giọng đại diện); danh sách thật trên hai emulator. Gói giọng Việt trên emulator API 37 do Google TTS tải trong Cài đặt của máy (việc của phụ huynh), không phải app |
| 6 | An ninh: không `addJavascriptInterface`, chỉ đọc/dừng, giới hạn, chỉ trang hiện tại | PASS | Không có `addJavascriptInterface` trong mã; `SpeechProtocolTest`, `SpeechBrokerTest` (giới hạn, `op` lạ, JSON hỏng), `SpeechBridgeTest.messagesOfAnOlderPageAreIgnored`; shim chỉ nhận cổng từ app (`source` null) |
| 7 | WebView 69 và WebView 145 | PASS | Instrumentation 23/23 trên cả hai; engine thật đọc tiếng Việt trên cả hai |
| 8 | Không hỏng game KidsSDK, test cũ | PASS | 13 test thiết bị cũ, 57 unit cũ, Python; game mẫu chạy với shim (`MainFlowTest` 30 vòng, “Lật thẻ” giữ checkpoint) |
| 9 | Khu phụ huynh: trạng thái + mở cài đặt giọng đọc | PASS (emulator API 26 và API 37, bản debug) | `evidence/screens/api26-parent-speech.webp`; “Nghe thử” ⇒ trình phát Google TTS `started`; nút mở đúng trang “Text-to-speech output” của Android |

### 5.3 Game thật trên emulator (bản sao trong `/sdcard/KidsGames`; thư mục game của người dùng không bị sửa)

| Game | API 37 (WebView 145), APK release | API 26 (WebView 69) |
| --- | --- | --- |
| Ai Sống Ở Đâu (họ A) | Chạy; đọc tên con vật và gợi ý qua Google TTS | Không chạy: `Object.fromEntries is not a function` (game cần Chromium 73+; có từ trước, không liên quan giọng đọc). Shim có, trang thấy `vi-vn-x-gft-local` |
| Bác Sĩ Thú Nhí (họ B) | Chạy; chạm bong bóng thoại ⇒ đọc | Không chạy: `Object.fromEntries` |
| Máy Kể Chuyện (họ C) | Chạy; kể truyện ~10 s, tô chữ theo lời | JS chạy nhưng bố cục vỡ (`inset`, có từ trước); câu tiếng Việt gọi trong trang qua DevTools ⇒ Google TTS phát (`audio26-speaking.txt`, `start` sau 274 ms) |
| Cún Săn Số 7 (không lời) | Chạy bình thường | — |

Nghe bằng tai: **NOT_RUN** (emulator không có loa; bằng chứng là trình phát âm thanh của engine TTS trong `dumpsys audio`).

### 5.4 Độ trễ `speak → onStart` (mục tiêu < 500 ms)

| Thiết bị | Câu đầu | Câu sau |
| --- | --- | --- |
| API 26, Google TTS 3.12.9 | 3 ms khi đã làm ấm giọng ở menu (không làm ấm: 523–656 ms) — **đạt** | 2–5 ms |
| API 37, Google TTS mới | 0,6–1,1 s sau khi engine rảnh; 1,8–2,7 s ngay sau khi mở app nguội (emulator phần mềm) — **chưa đạt trên emulator** | 4–520 ms |

Câu đầu chậm hơn mục tiêu trên emulator API 37 nhưng vẫn ngắn hơn đồng hồ dự phòng của game (≥ 1,8 s + 110–120 ms/ký tự) nên không bị cắt trong các lần thử. Cần đo lại trên máy thật (checklist). Chi tiết: `evidence/tts/latency-notes.txt`.

### 5.5 Cài đè và các bản release đã kiểm

| Bản | SHA-256 APK | Kiểm |
| --- | --- | --- |
| R1 | `e7e6145e…870e` | Cài đè lên 1.0.0 trên **API 26**: `firstInstallTime` giữ nguyên, versionCode 2, 17 game như cũ, PIN vẫn đòi (`evidence/release/upgrade-api26.txt`). Trên **API 37**: menu như cũ, PIN còn, checkpoint “Lật thẻ” (cặp heo ghép trước khi cập nhật) còn nguyên (`upgrade-api37.txt`, ảnh `upg37-*`); chơi 4 game thật (§5.3) |
| **R2 = bàn giao** | `da8098f1…b6a6` | Khác R1 chỉ ở `AndroidTtsEngine` (câu thật không phải chờ sau lượt làm ấm). Cài đè R1 trên cả hai emulator: `firstInstallTime` giữ nguyên, game/PIN/checkpoint còn, “Máy Kể Chuyện” vẫn đọc (`final37-mkc.txt`). Instrumentation 23/23 trên cả hai API với cùng mã |

## 6. Điểm lệch so với handover (đã ghi `docs/DECISIONS.md` §22)

1. Giới hạn mỗi tin 8192 ký tự thay vì 4 KB, vì tin nhắn được viết ASCII (`\u` + hex) để tránh lỗi Latin-1 của WebView 69.
2. Thêm sự kiện `boundary` (từ `onRangeStart`) và các mã lỗi chuẩn `synthesis-unavailable`, `audio-hardware`, `network`, `voice-unavailable`, `invalid-argument`.
3. Bỏ giọng “đại diện” `xx-XX-language` của Google khi có giọng cụ thể (offline hoặc mạng) cùng locale.
4. Làm ấm giọng Việt bằng `synthesizeToFile` (không phát ra loa).
5. Request HTML có `Range` nhận byte gốc, không chèn shim.
6. `pause()` = dừng câu đang đọc và giữ hàng đợi tới `resume()`.

## 7. Known issues / giới hạn

1. Chỉ kiểm trên emulator; nghe bằng tai, máy thật, cuộc gọi/nhạc app khác khi đang đọc (audio focus): **NOT_RUN**.
2. Câu đầu tiên trên emulator API 37 bắt đầu sau 0,6–2,7 s (§5.4).
3. Google TTS trên máy có thể chưa có dữ liệu giọng Việt (emulator API 37 ban đầu chưa có): phụ huynh cần tải một lần (README_VI, DEVICE_CHECKLIST mục 19). Khi chưa có, game im lặng như 1.0.0.
4. **Ngoài phạm vi, phát hiện khi thử:** trên WebView 69 (Android 8 chưa cập nhật WebView) khoảng 20/50 game không khởi động vì dùng `Object.fromEntries`/`??`/`?.`, và một số game vỡ bố cục vì `inset`. Không sửa game (theo handover). Máy thật thường có WebView mới; nếu máy của bé là Android 8, hãy cập nhật “Android System WebView”/Chrome. `pack_game.py` nay cảnh báo `Object.fromEntries`.
5. Lint: 13 cảnh báo như 1.0.0.
6. `connectedDebugAndroidTest` của AGP 9.4 báo BUILD SUCCESSFUL dù không cài được APK test (gặp khi bản debug đã được cài tay): luôn đọc số test trong XML (ghi trong `CLAUDE.md`).
7. Khi tắt màn hình, lời đọc dừng lúc Android gửi `onPause` (~2 s sau phím nguồn trên emulator API 37), cùng thời điểm game bị tắt tiếng như ở 1.0.0.

## 8. Build sạch từ ZIP nguồn (B01) và checksum

- **B01: PASS.** Giải nén `dist/KidsGamesPlayer-source.zip` (lần đóng gói thứ nhất, sha256 `d901896b…f7fc`) vào thư mục trống, không có `local.properties` và `.local-signing/`; `ANDROID_HOME` trỏ tới SDK; `gradlew --no-daemon :app:assembleDebug :app:testDebugUnitTest :app:assembleRelease` → BUILD SUCCESSFUL (3 phút 14 giây), unit 88/88, release ra `app-release-unsigned.apk` (ký cần khóa riêng, `docs/SIGNING.md`). ZIP bàn giao cuối chỉ khác ZIP đó ở chính file báo cáo này (mục 8).
- **B07: PASS.** ZIP nguồn có wrapper (+jar), mã, test JVM/thiết bị/Python/Node, fixture mới `test-fixtures/webview/speech*`, shim, tài liệu, evidence; không có `build/`, `.gradle/`, `logs/`, `dist/`, `local.properties`, `.local-signing/`, `*.p12/*.jks/keystore.properties`; script tạo khóa chỉ dùng biến.
- **Checksum:** `sha256sum -c SHA256SUMS.txt` trong `dist/` → tất cả OK; `SHA256SUMS.txt` dùng xuống dòng LF.

## 9. Việc chủ máy cần làm trên điện thoại thật

1. Cài đè `KidsGamesPlayer-v1.1.0.apk` lên bản 1.0.0 (không gỡ).
2. Phụ huynh → **Giọng đọc**: nếu chưa có giọng Việt, **Mở cài đặt giọng đọc** → Google → **Cài đặt dữ liệu giọng nói** → Tiếng Việt.
3. **Nghe thử**, rồi chơi vài game và làm `docs/DEVICE_CHECKLIST.md` mục 19–26 (tắt tiếng, Home, tắt màn hình, cổng phụ huynh, chế độ máy bay, không có giọng Việt).
4. Sao lưu `.local-signing/` (vẫn chưa làm, như 1.0.0).

---

# Lịch sử — báo cáo bản 1.0.0 (11/10/2026, giữ nguyên)

## BUILD_REPORT — Kids Games Player v1.0.0

Ngày: 11/10/2026. Trạng thái: **đã build, đã ký, đã kiểm thử trên emulator API 37 và API 26 (cả bản debug lẫn đúng APK release bàn giao); chưa nghiệm thu trên máy thật của bé.**
Trạng thái kiểm thử dùng đúng các nhãn PASS / FAIL / NOT_RUN / BLOCKED; “PASS (emulator)” nghĩa là chạy thật trên emulator, không phải máy thật.

### 1. Artifact

| File | Byte | SHA-256 |
| --- | ---: | --- |
| `dist/KidsGamesPlayer-v1.0.0.apk` | 1.931.014 | `531d22dbf8db634b82099b0d9dbaf6728d4e048ee184395a82d534cd143b5006` |
| `dist/KidsGamesPlayer-source.zip` | — | xem `dist/SHA256SUMS.txt` |
| `dist/KidsGames-samples.zip` | 587.801 | `ce8b35ef78987c11bd46a1e9fed4a97fb9907bd876b8cba7a2cf14d7bae57558` |
| `dist/GAME_AUTHORING_PROMPT.md` | 4.557 | `01818801775466d8cf3c96ad0529f0a2079dfbc59b5031b4c587b53643a1b50e` |

`dist/SHA256SUMS.txt` chứa các hash trên (và hash của chính BUILD_REPORT.md trong dist). Bản BUILD_REPORT nằm *bên trong* ZIP nguồn không thể ghi hash của chính ZIP đó, nên dòng ZIP nguồn ở đó ghi “xem SHA256SUMS.txt”; bản trong `dist/` có đủ. `dist/apksigner-verify.txt` là kết quả verify trên đúng APK bàn giao.

### 2. Source

Không có git repository (thư mục làm việc không phải repo). Mã nguồn bàn giao = `dist/KidsGamesPlayer-source.zip` (hash ở trên); đã kiểm tra không chứa `.local-signing/`, `local.properties`, `*.p12/*.jks/keystore.properties`, `build/`, `.gradle/`.

### 3. Môi trường build/test

| Thành phần | Giá trị |
| --- | --- |
| OS | Windows, WHPX (tăng tốc emulator) |
| JDK | Temurin 21.0.12.1 (target bytecode 17) |
| Android SDK | platforms;android-37.0 r02, build-tools 36.0.0, platform-tools 37.0.1, emulator 37.2.12 |
| Gradle / AGP / Kotlin | 9.6.0 (wrapper, checksum) / 9.4.0 / 2.2.10 (tích hợp AGP) |
| AndroidX WebKit | 1.17.1 |
| Python | 3.14.3 (công cụ chỉ dùng thư viện chuẩn; Pillow/numpy/ffmpeg chỉ cho script tạo asset) |

### 4. APK

| Mục | Giá trị |
| --- | --- |
| Package | `vn.family.kidsgamesplayer` |
| versionCode / versionName | 1 / 1.0.0 |
| minSdk / targetSdk / compileSdk | 26 / 37 / 37 |
| Chữ ký | APK Signature Scheme v2 + v3 (v1 không cần vì minSdk ≥ 24), 1 signer |
| Chứng chỉ | `CN=Kids Games Player, OU=Family, O=Family, C=VN`, SHA-256 `c0e5bcc74c463e7ce5556a95514fd34014c25cf2854cde2c487ad82597282530` |
| Quyền | chỉ `vn.family.kidsgamesplayer.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (quyền signature nội bộ do AndroidX core tự thêm). **Không** `INTERNET`, không quyền storage. |
| Component exported | chỉ `MainActivity` (launcher). `InitializationProvider` exported=false. `ProfileInstallReceiver` đã gỡ. |
| Khác | `debuggable` không bật, `allowBackup=false` + data extraction rules loại trừ toàn bộ, `usesCleartextTraffic=false`, `appCategory=game`, landscape, R8 bật, WebView remote debugging chỉ bật ở debug |

### 5. Thiết bị kiểm thử

| Thiết bị | Android / API | WebView provider | Ghi chú |
| --- | --- | --- | --- |
| Emulator `kgp_api37` (medium_phone 2400×1080) | 17 / 37 | com.google.android.webview 145.0.7632.218 | MUTE_AUDIO, renderer client, terminate, DELETE_BROWSING_DATA: có |
| Emulator `kgp_api26` (pixel_2 1920×1080) | 8.0 / 26 | com.android.chrome 69.0.3497.100 | Không MUTE_AUDIO, không renderer client (nhánh dự phòng) |
| Máy thật của bé | — | — | **BLOCKED**: agent không có thiết bị thật |

### 6. Kết quả kiểm thử

#### 6.1 Tự động

| Bộ test | Lệnh | Kết quả | Evidence |
| --- | --- | --- | --- |
| Unit JVM (57 test) | `gradlew :app:testDebugUnitTest` | PASS 57/57 | `evidence/tests/unit/` |
| Packer Python (10 test) | `python -m unittest discover -s tools/tests` | PASS 9, SKIP 1 (symlink: Windows không cho tạo symlink khi không có quyền) | `logs/` (không vào ZIP) |
| Lint debug + release | `gradlew :app:lintDebug :app:lintRelease` | PASS (0 lỗi; 13 cảnh báo, xem §8 mục 5) | `app/build/reports/lint-results-*.html` |
| Instrumentation API 37 (13 test) | `gradlew :app:connectedDebugAndroidTest` | PASS 13/13 trên mã cuối (gồm `PinPadTest` mới) | `evidence/tests/api37/` |
| Instrumentation API 26 (13 test) | như trên, `ANDROID_SERIAL=emulator-5556` | PASS 13/13 trên mã cuối. Một lần chạy trước đó: 2 FAIL (`sdkStartsInactive…`, `escapeAttempts…`) khi bản **release** cùng app đang mở ở khu phụ huynh và được hệ thống đưa lên giữa các test (trang test bị ẩn, chạm không tới); dừng bản release rồi chạy lại: 13/13 | `evidence/tests/api26/` |

#### 6.2 Ma trận bible §19

| ID | Trạng thái | Cách kiểm |
| --- | --- | --- |
| U01 | PASS | `ManifestParserTest` |
| U02 | PASS | `PathPolicyTest`, `RouterAndRangeTest`; trên thiết bị: fetch `..%2f`, `%2e%2e` không trả 200 |
| U03 | PASS | `PathPolicyTest`, `ImporterTest.unicodeNames…`; thiết bị: fetch `tải về+plus.json` |
| U04 | PASS | `ImporterTest.quotasUseRealBytes` (provider khai size giả) |
| U05 | PASS | `ImporterTest.incompleteVerifiedPackageIsNotCommitted`, `ScanCoordinatorTest.partialUpdateKeepsOldRevision` |
| U06 | PASS | `ImporterTest.contentChangeWithSameSizeIsDetected` (cùng size, cùng mtime) |
| U07 | PASS | `ScanCoordinatorTest.duplicateManifestIdsAreReportedNotMerged` |
| U08 | PASS | `ScanCoordinatorTest.concurrentScansDoNotRace` |
| U09 | PASS | `leftoverStagingIsCleaned`, `startupFallsBackToPreviousRevision`, `CatalogStoreTest`, `StorageDeviceTest` (AtomicFile thật) |
| U10 | PASS | unit `updateKeepsIdentityAndOrigin` + emulator: cập nhật 1.0.0→1.0.1 giữ `internalGameId`/token |
| U11 | PASS | `resetProgressRotatesOnlyThatToken` |
| U12 | PASS | `lostSourceKeepsSnapshots` |
| U13 | PASS | `PinManagerTest`; emulator: PIN sai → “PIN chưa đúng”; PBKDF2 120k ≈ 0,9 s (API 37) |
| U14 | PASS | `RouterAndRangeTest` + WebView thật: 206/HEAD/suffix; range không thỏa → lỗi mạng (WebView), xem DECISIONS §5 |
| U15 | PASS | `test_pack_game` (deterministic, không self-hash, không lẫn file ngoài) |
| I01 | PASS (emulator) | `MainFlowTest` + ảnh `e2e-01/02`, `rel-01/02` |
| I02 | PASS (emulator API 37, release) | Chọn `KidsGames` → khởi động lại emulator → mở app: không hỏi lại, “Có quyền đọc thư mục.”, 5 game, quét `unchanged=8` (`rel37-04`) |
| I03 | PASS (emulator) | Chép `MauGame` (verified) + `VeTuDo` (basic) khi menu mở → xuất hiện sau ~16 s, `e2e-19` |
| I04 | PASS (unit) / NOT_RUN (thiết bị) | `partialUpdateKeepsOldRevision`; chưa mô phỏng copy dở trên emulator |
| I05 | PASS (emulator) | `e2e-35/36`, catalog: active mới, previous cũ |
| I06 | PASS (API 37, API 26) | `localOriginServesModulesFetchRangeAndStorage` |
| I07 | PASS (API 37, API 26) | `originsIsolateStorageAndSurviveRevisionChange` |
| I08 | PASS (API 37, API 26) | `MainFlowTest` 30 vòng + chạm dồn |
| I09 | PASS (emulator API 37, release) | Web Audio (“Chạm bong bóng”) và HTML `<audio>` (“Lật thẻ”): player của app `started` sau chạm thật; sau khi phiên nạp lại, lớp “Chạm để chơi” của SDK mở khóa tiếng (`release/audio-probe-api37.txt`). Nghe bằng tai: NOT_RUN (emulator không có loa) |
| I10 | PASS (emulator API 37, release) | Tắt tiếng, mở cổng phụ huynh, Home, tắt màn hình → app không còn player âm thanh; quay lại → “Chơi tiếp nhé?”, không phát trước khi chạm (`release/audio-probe-api37.txt`). API 26 (không MUTE_AUDIO): phiên bị tạm dừng hẳn, `rel26-04` |
| I11 | PASS (API 37, API 26) | `hungRendererKeepsNativeUiResponsive`, `rendererCrashIsReported` |
| I12 | PASS (API 37, API 26) | `escapeAttemptsAreBlocked` |
| I13 | PASS | CSP `connect-src` + router 403 (unit), service worker không đăng ký được |
| I14 | PASS (emulator API 37, release) | Bật chế độ máy bay, `force-stop` rồi mở lại: game canvas/Web Audio và game `fetch(levels.json)` chạy đủ hình (`rel37-13/14`) |
| I15 | PASS (emulator API 37, release) | “Ẩn” → game biến khỏi menu (`rel37-05/06`); “Xóa tiến trình” có xác nhận → bàn chơi mới (`rel37-15/17/18`); unit `resetProgressRotatesOnlyThatToken` |
| I16 | PASS (emulator API 37, release) | Ra nền + `am force-stop`, và `force-stop` ~1 s sau khi lưu → mở lại về menu, vào game: checkpoint còn (`rel37-08/09`); trạng thái RAM không được hứa giữ |
| I17 | NOT_RUN | Đã thử `pm disable-user com.google.android.webview` trên emulator API 37: Android vẫn dùng provider (game vẫn mở) nên không mô phỏng được. Mã: `try/catch` khi tạo WebView → màn lỗi native, menu vẫn dùng được |
| I18 | PASS (API 26) | `muteFeatureGateIsSafe` (feature=false, không crash) |
| I19 | PASS (API 37, API 26) | ảnh `data:` và `blob:` tải được; `data:text/html` bị chặn |
| I20 | PASS (API 37, API 26) | `sdkStartsInactiveAndMutedUntilHostState` |
| I21 | PASS (emulator, release) / web fullscreen: NOT_RUN | API 37: nhấn giữ 1,5 s trên chữ, ảnh thẻ, canvas → không chọn chữ, không thanh Copy/Share/Search (`rel37-12`); API 26: kéo hình vào ô đúng → khớp (`rel26-08`). Game mẫu không dùng Fullscreen API nên chưa thử |
| I22 | PASS (emulator API 37, release) | Mở picker rồi hủy → “Không đổi thư mục.”, nguồn không đổi, về menu bé (không mở lại khu phụ huynh) (`rel37-02`); chọn lại → cấp quyền, nạp game (`rel37-03`) |
| D01 | PASS (emulator API 37) | từ chối → “Android chưa ghim…”, OS NONE, không lặp hộp thoại (`e2e-27`) |
| D02 | PASS (emulator API 37) | OS PINNED, app về menu; Home không rời app (`e2e-28/29`) |
| D03 | PASS (emulator) | Back trong game → menu; Back ở menu không thoát (`MainFlowTest`) |
| D04 | BLOCKED | Cần mã khóa màn hình + thử cử chỉ bỏ ghim trên máy thật |
| D05 | PASS (emulator API 37) | PIN sai không bỏ ghim; PIN đúng → Kết thúc phiên → OS NONE |
| D06 | PASS (emulator API 37, release) | Bật “Xoay ngược 180°” → `ROTATION_270`, giữ trong game và sau khi mở lại app; tắt → `ROTATION_90` (`rel37-16`). Xoay máy thật: NOT_RUN |
| D07 | NOT_RUN | Không có emulator tablet/foldable; chưa thử cỡ chữ lớn |
| D08 | PARTIAL | Emulator dùng điều hướng cử chỉ; 3 nút: NOT_RUN |
| D09 | NOT_RUN | Cuộc gọi/nhạc app khác/nút nguồn chưa thử (ra nền bằng Home: PASS) |
| D10 | BLOCKED | Cần đúng máy của bé |
| B01 | PASS | Giải nén đúng `KidsGamesPlayer-source.zip` bàn giao vào thư mục trống (không `local.properties`, không `.local-signing/`), `gradlew :app:assembleDebug :app:testDebugUnitTest :app:assembleRelease` → BUILD SUCCESSFUL, unit 57/57, release ra bản *unsigned* (ký cần khóa riêng, `docs/SIGNING.md`) |
| B02 | PASS | §6.1 |
| B03 | PASS | §4 (`evidence/release/`) |
| B04 | PASS | `apksigner verify` + SHA-256 §1 |
| B05 | PASS (emulator API 26 + API 37, APK cuối) | API 26: cài sạch → tạo PIN → picker SAF của Android 8 → 3 game thư mục `verified`, demo trùng bị ẩn (`rel26-13/14`); “Bắt đầu phiên” → hộp thoại ghim của hệ thống → PINNED, Home không rời app, “Kết thúc phiên” → NONE (`rel26-05/06`); chơi “Ghép màu” (kéo-thả), “Lật thẻ”. API 37: cập nhật đè lên bản release trước, dữ liệu còn, demo nạp lại bản mới |
| B06 | PASS (emulator API 37) | `adb install -r` cùng APK, rồi cập nhật từ bản release trước lên bản release cuối (cùng khóa/package): không gỡ cài đặt; PIN, thư mục, game ẩn, checkpoint còn (`rel37-10/11`) |
| B07 | PASS | Kiểm bằng script trên ZIP bàn giao: có wrapper (+jar), docs, test JVM/thiết bị/Python, fixture, game mẫu, template, công cụ, evidence; không `build/`, `.gradle/`, `logs/`, `local.properties`, `.local-signing/`, `*.p12/*.jks`; nội dung không chứa mật khẩu (chỉ đọc biến/thuộc tính) |
| B08 | PASS | tài liệu này |

#### 6.3 Luồng bàn giao (bible §25) đã đi trên emulator API 37

Cài/mở app → tạo PIN (PIN yếu bị từ chối) → chọn `KidsGames` qua picker hệ thống, cấp quyền → 3 game trong thư mục được nạp → chơi trong WebView → về menu (nút nhà, Back) → ra nền và quay lại (“Chơi tiếp”) → mở cổng phụ huynh trong game, hủy → chép thêm game khi menu mở (tự xuất hiện) → cập nhật game khi đang chơi (phiên giữ bản cũ, lần sau dùng bản mới, giữ ID/origin) → bắt đầu phiên (từ chối, rồi đồng ý ghim) → PIN sai/đúng → kết thúc phiên (bản debug).

Trên **bản release đã ký** (API 37, các bản R1–R3 ở §6.4): thiết lập lại từ đầu sau khi xóa dữ liệu app → PIN → picker (hủy, rồi chọn) → reboot emulator → ẩn/hiện game → xóa tiến trình → kill process → máy bay → nhấn giữ → xoay 180° → `install -r`/cập nhật bản release → chuỗi âm thanh (tắt tiếng, cổng phụ huynh + “Hủy”, Home, tắt màn hình). Trên API 26: xem B05.

#### 6.4 Các bản release đã kiểm

Mã ứng dụng giữa ba bản chỉ khác ở hai bản sửa trên; cùng khóa ký, cùng `versionCode` 1.

| Bản | SHA-256 APK | Khác bản trước | Kiểm trên bản này |
| --- | --- | --- | --- |
| R1 | (không giữ) | — | `rel-*`, `rel26-01..04`, `rel37-01..18`: B05 (API 26/37), I02, I14, I15, I16, I21 nhấn giữ, I22, D06, B06 (`install -r`) |
| R2 | `aea6cc2a…` | sửa `PinPad` (nút “Hủy”) | cập nhật R1→R2 giữ dữ liệu; I09/I10 (`release/audio-probe-api37.txt`); `rel37-19/20` |
| **R3 = bàn giao** | xem §1 | game mẫu/SDK tương thích WebView 69 (chỉ asset trong APK) | API 26: cài sạch, PIN, SAF, ghim/kết thúc phiên, kéo-thả, lật thẻ, cổng phụ huynh + “Hủy”, chơi tiếp từ checkpoint (`rel26-05..14`); API 37: cập nhật R2→R3 giữ dữ liệu, demo + game thư mục nạp lại, hiển thị đúng, cổng phụ huynh + “Hủy” (`rel37-21/22`); instrumentation 13/13 trên cả hai API (bản debug cùng mã) |

### 7. Thay đổi so với bible

Chi tiết trong `docs/DECISIONS.md` (21 mục), tóm tắt: JDK 21 chạy build (target 17); AGP 9.4.0 thay vì 9.4.1; coroutines 1.10.2; Range/HEAD theo cách WebView tự xử lý stream; popup/CSP nhận định theo hành vi thực đo được; ghim ứng dụng có thăm dò trạng thái OS (hộp thoại Android 17 không lấy focus); AtomicFile được trừu tượng hóa cho unit test trên Windows; ẩn game demo trùng với bản trong thư mục; âm thanh ≥ 0,35 s; viền chữ bằng text-shadow; PIN yếu bị từ chối; game mẫu/SDK viết cho WebView 69 (không `inset`, không flex `gap`) và packer cảnh báo tính năng mới.

### 8. Known issues / giới hạn

1. **Chỉ mới kiểm thử trên emulator** (Android 17/WebView 145 và Android 8.0/WebView 69). Hành vi riêng của hãng (ghim ứng dụng, cử chỉ, WebView cũ hơn, chip âm thanh) chưa kiểm; xem §9 và `docs/DEVICE_CHECKLIST.md`.
2. Khi app ra nền (Home, tắt màn hình, cuộc gọi…), phiên game dừng hẳn; quay lại thấy “Chơi tiếp nhé?” và game được nạp lại từ checkpoint mà game tự lưu (trạng thái chỉ có trong RAM không được giữ — đúng bible). Sau khi nạp lại, WebView có thể cần một lần chạm “Chạm để chơi” để bật tiếng (chính sách autoplay).
3. Lần đầu app vào chế độ toàn màn hình, Android hiện lớp “Viewing full screen / Got it” che một phần màn hình đến khi bấm “Got it”; phụ huynh nên bấm một lần lúc thiết lập.
4. Range không thỏa: WebView biến phản hồi 416 thành lỗi mạng (JS không thấy mã 416) — `docs/DECISIONS.md` §5. Range hợp lệ/HEAD/206 hoạt động.
5. Lint: 0 lỗi, 13 cảnh báo — Gradle/AGP/coroutines có bản mới hơn (cố ý giữ bản đã kiểm), `MissingOnRenderProcessGone` ×3 (báo nhầm: cả `GameWebViewClient` và client của `OriginCleaner` đều cài `onRenderProcessGone`), `Overdraw` ×3, `NestedWeights` ×2, `MergeRootFrame` ×1 (hiệu năng bố cục, không ảnh hưởng chức năng).
6. Test Python về symlink bị SKIP trên Windows (tài khoản không có quyền tạo symlink).
7. PIN dùng PBKDF2 120.000 vòng: xác minh ≈ 0,9 s trên emulator; máy yếu có thể 2–3 s (có vòng chờ, phím bị khóa trong lúc tính).
8. “Lần quét gần nhất: …” dùng chuỗi thời gian tương đối của hệ thống, nên theo ngôn ngữ máy (emulator tiếng Anh hiện “seconds ago”).
9. `tools/preview_game.py` chạy ở `http://127.0.0.1:<port>`, không trùng origin trong app; CSP giống app nhưng dữ liệu lưu của bản xem trước tách riêng.
10. Đã gỡ `ProfileInstallReceiver` (không baseline profile) để chỉ còn `MainActivity` exported; lần mở đầu có thể chậm hơn chút.
11. Icon “Lật thẻ con vật” vẽ đơn giản bằng code (không dùng ảnh Gi & Shi).
12. Lỗi tìm thấy và đã sửa ở vòng kiểm thử bản release: (a) nút “Hủy” của bàn phím PIN không đóng bàn phím; (b) bố cục game mẫu hỏng trên WebView 69 (`inset`, flex `gap`). Chi tiết `BUILD_STATUS.md`; APK bàn giao là bản đã sửa và đã kiểm lại (§6.4).
13. Trên emulator API 26 (WebView 69, vẽ bằng phần mềm) đôi khi một ô/viền thẻ vẽ thiếu một mảng ở lần vẽ đầu và tự đúng khi vẽ lại (`rel26-07/12`); chưa thấy trên API 37. Nhiều khả năng do raster phần mềm của emulator; cần xem trên máy thật Android 8 nếu có.
14. Chưa chạy: I17 (tắt WebView — không mô phỏng được), web fullscreen trong I21, D07, D08 (3 nút), D09; BLOCKED: D04, D10 (cần máy thật).

### 9. Bước còn cần chủ máy / thiết bị

| Bước | Vì sao agent chưa làm |
| --- | --- |
| Cài APK lên máy của bé, cho phép nguồn cài | Cần quyền/thao tác của chủ máy trên thiết bị thật |
| Tạo PIN thật, chọn thư mục `KidsGames` thật, “Cho phép” | Quyết định và xác nhận của phụ huynh trên máy thật |
| Bật “Ghim ứng dụng” + yêu cầu mã khóa khi bỏ ghim; thử cử chỉ bỏ ghim (D04) | Cài đặt hệ thống của chủ máy; phụ thuộc hãng |
| Chạy `docs/DEVICE_CHECKLIST.md` (tablet/gập, cỡ chữ, 3 nút, cuộc gọi, nhạc khác, máy bay) | Không có thiết bị thật/cấu hình tương ứng |
| Sao lưu `.local-signing/` ra 2 nơi an toàn | Agent không có nơi lưu trữ an toàn do chủ máy chỉ định |

### 10. Khóa ký

- Vị trí: `KidsGamesPlayer/.local-signing/` (`kidsgamesplayer-release.p12` + `keystore.properties`), ACL chỉ người dùng Windows hiện tại, không nằm trong ZIP nào.
- Sao lưu: **chưa thực hiện** (việc của chủ dự án, xem `docs/SIGNING.md`). Không ghi mật khẩu ở đây.
