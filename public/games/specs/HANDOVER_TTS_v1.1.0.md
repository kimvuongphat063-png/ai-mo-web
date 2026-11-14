# Handover — Kids Games Player 1.1.0: giọng đọc tiếng Việt cho game HTML (Web Speech API)

Ngày chốt: 16/10/2026. Người dùng **đã đồng ý** hướng “player tự cung cấp giọng đọc” (mục 1.3). Phiên mới làm từ đầu đến cuối: code, kiểm thử, build, ký, đóng gói, báo cáo. Không hỏi lại các quyết định kỹ thuật thông thường; quyết định nào lệch khỏi tài liệu này thì ghi vào `docs/DECISIONS.md` và báo cáo.

## 0. Cách bắt đầu

Mở Claude Code tại thư mục gốc của repo rồi gõ:

> Đọc `HANDOVER_TTS_v1.1.0.md` và làm từ đầu đến cuối.

---

## 1. Bối cảnh và quyết định đã chốt

### 1.1 Vấn đề
- Thư mục game của người dùng: `games/` (51 thư mục game, mỗi thư mục `index.html` + `icon.png`, không `game.json`, không dùng KidsSDK; kèm 4 file `Bo game *.md`). **Chỉ đọc**; cần thử thì chép bản sao.
- 50/51 game có lời đọc tiếng Việt bằng Web Speech API (`speechSynthesis`). Riêng `Cun San So 7` không có.
- Mở bằng **Chrome** trên điện thoại: nghe được. Mở bằng **Kids Games Player**: không nghe được, game vẫn chơi bình thường nhưng im lặng.

### 1.2 Phân tích đã làm (phiên trước)
- Chrome Android nối `speechSynthesis` với bộ đọc (TTS) của Android → máy của người dùng **đã có giọng tiếng Việt**.
- Android WebView không có phần đọc của Web Speech API (không giọng, không đọc). **Phải đo lại ở bước 4.1** trên cả hai emulator trước khi code.
- Code giọng đọc trong game: 3 họ code, cùng một cách dùng chuẩn:
  - Họ A (10 game, ví dụ `Ai Song O Dau`), họ B (20 game, ví dụ `Bac Si Thu Nhi`) — khối `const speech = (() => {...})()` giống hệt nhau trong mỗi họ.
  - Họ C (20 game, ví dụ `May Ke Chuyen`, `Ban Keo Mau`) — viết khác nhưng cùng API.
  - Tất cả: `window.speechSynthesis`; `getVoices()` lọc giọng `lang` bắt đầu bằng `vi` (hoặc tên chứa “vietnam/tiếng việt”); nghe `voiceschanged` + gọi lại sau ~600–700 ms và ~2500 ms; `new SpeechSynthesisUtterance(text)` với `voice`, `lang`, `rate` (~0,9), `pitch` (~1,05–1,08), `volume = 1`; `onend` **và** `onerror` đều được xử lý (đã kiểm cả 50 file); `onstart` ở 21 file; `speechSynthesis.cancel()`; kiểm `synth.speaking || synth.pending` rồi `cancel()` và gọi `speak` sau 60–90 ms.
  - **Mỗi game có đồng hồ dự phòng**: nếu chưa có `onend` sau khoảng `1800 + số_ký_tự × 110–120 / rate` ms thì coi như đọc xong và chuyển câu (câu sau sẽ `cancel()` câu trước). ⇒ Độ trễ từ `speak()` tới lúc bắt đầu phát phải nhỏ (mục tiêu < 500 ms), nếu không lời đọc bị cắt.
  - Không có giọng `vi` ⇒ game tự chạy “im lặng có canh giờ”. Đây là đường lui khi máy không có giọng Việt.

### 1.3 Quyết định
- **Player tự cung cấp giọng đọc**: app cài một `speechSynthesis` chuẩn (polyfill) vào mọi trang HTML của game; phía native đọc bằng `android.speech.tts.TextToSpeech` (cùng engine Chrome dùng). **Không sửa game nào.**
- Đây là **ngoại lệ có chủ đích** với nguyên tắc của bible “game không ra lệnh được cho app”: chỉ mở đúng một kênh hẹp “đọc chữ / dừng đọc”, có giới hạn, chỉ cho phiên game hiện tại, tuân theo luật âm thanh của app. Ghi thành mục 22 trong `docs/DECISIONS.md`.
- Phương án bị loại: tạo sẵn file âm thanh cho từng câu và sửa 50 game.
- Phiên bản: `versionCode 2`, `versionName "1.1.0"`, **cùng khóa ký** → cài đè lên 1.0.0, giữ dữ liệu.

---

## 2. Đọc trước

1. `KidsGamesPlayer/CLAUDE.md` — lệnh build/test, quy tắc không được phá.
2. `KidsGamesPlayer/BUILD_STATUS.md`, `BUILD_REPORT.md` — trạng thái 1.0.0, các lỗi đã sửa, môi trường.
3. `KidsGamesPlayer/docs/DECISIONS.md` (21 mục), `docs/ARCHITECTURE.md`, `docs/GAME_FORMAT.md`, `docs/SIGNING.md`, `docs/DEVICE_CHECKLIST.md`.
4. Bible: `KidsGames_Player_Claude_Code_Bible.md` (thư mục `specs/`) — phần âm thanh/lifecycle (§10), phụ huynh (§12), an ninh WebView.
5. Code liên quan (`app/src/main/java/vn/family/kidsgamesplayer/`):

| File | Vai trò liên quan |
| --- | --- |
| `player/RequestRouter.kt` | `decide()` — quyết định phục vụ/chặn mọi request của game |
| `player/GameResponder.kt` | `respond()` phục vụ file từ snapshot (Full/Partial/416, `HeadStream`, CSP cho HTML), `hostHtml()`, `SessionPathHandler` |
| `player/GameClients.kt` | `GameWebViewClient` (`shouldInterceptRequest`, `onPageStarted/Finished` ~dòng 81–85), `GameChromeClient` |
| `player/GameWebView.kt` | tạo WebView (`mediaPlaybackRequiresUserGesture = false` dòng 39), `setMuted()` |
| `player/PlayerController.kt` | `open()` ~99, `goHome()` ~172, `onActivityStopped()/suspendSession()` ~262–272, `openParentGate()` ~276, **`applyPolicy()` ~351 (điểm duy nhất quyết định có tiếng hay không: `audible()` / `active()`)**, `deliverInitialState()` ~383, `onPageFinished()` ~408 |
| `player/HostState.kt` | `AudioPolicy.shouldBeAudible` |
| `KidsGamesApp.kt` | `AppGraph` (chỗ khởi tạo dịch vụ dùng chung) |
| `ui/ParentScreen.kt`, `ui/DiagnosticsReport.kt` | khu phụ huynh, chẩn đoán |
| `catalog/SettingsStore.kt` | cài đặt (soundEnabled…) |
| `AndroidManifest.xml` | không quyền nào; thêm `<queries>` (mục 4.6) |

6. Test có sẵn: `app/src/androidTest/.../WebViewHarness.kt`, `WebViewPolicyTest.kt`, `MainFlowTest.kt`, `PinPadTest.kt`, `StorageDeviceTest.kt`; fixture ở `test-fixtures/webview/`.

---

## 3. Yêu cầu phải đạt

1. 50 game trong thư mục người dùng **có lời đọc trong player** khi máy có giọng tiếng Việt, không sửa game.
2. Không có giọng Việt / TTS lỗi ⇒ hành vi như hiện tại (game im lặng có canh giờ), không crash, không treo.
3. Giọng đọc tuân theo luật âm thanh của app: không phát khi tắt tiếng (nút loa, cài đặt), ra nền, tắt màn hình, mở cổng phụ huynh, hộp xác nhận chơi lại, phiên tạm dừng/đóng. Chuyển sang không-được-phát ⇒ dừng đọc ngay.
4. Nhịp game giữ đúng: `onstart/onend/onerror` báo về game; khi không được phát (tắt tiếng) thì báo `end` sau thời lượng ước tính để chuỗi câu không chạy vụt qua.
5. **Không mạng**: app vẫn không có quyền `INTERNET`; chỉ dùng giọng **offline** (`Voice.isNetworkConnectionRequired == false`), không bật tổng hợp qua mạng.
6. **An ninh**: không `addJavascriptInterface`; kênh chỉ nhận lệnh đọc/dừng; giới hạn độ dài, hàng đợi, tần suất; chỉ phiên/trang hiện tại; mọi thứ khác bị bỏ qua và ghi chẩn đoán.
7. Chạy được trên WebView cũ (Android 8, Chromium 69) và mới (Android 17, WebView 145).
8. Không làm hỏng game dùng KidsSDK (game mẫu, `KidsGames-1file`) và mọi test cũ (13 instrumentation, 57 unit, Python).
9. Khu phụ huynh hiển thị trạng thái giọng đọc và cho mở cài đặt giọng đọc của máy.

---

## 4. Thiết kế đề xuất

### 4.1 Đo nguyên nhân trước (bắt buộc, ghi vào báo cáo)
Trên emulator API 37 (bản debug, có DevTools — `tools/qa/webview_probe.mjs`) và API 26 (WebView Shell hoặc bản debug), trong một trang game:
`typeof speechSynthesis`, `typeof SpeechSynthesisUtterance`, `speechSynthesis.getVoices().length` (sau 3 s), gọi `speak()` một câu ngắn và ghi sự kiện nhận được. Kiểm thêm emulator có engine TTS không: `adb shell settings get secure tts_default_synth`, `adb shell pm list packages | grep -i tts`.

### 4.2 Cài polyfill vào trang (một đường duy nhất cho mọi WebView)
- Router chèn `<script src="/__kgp__/speech-v1.js"></script>` vào **mọi response `text/html`** của phiên (GET đầy đủ, không Range), phục vụ file shim từ asset của app (`app/src/main/assets/host/speech-v1.js`) tại đường dẫn ảo `/__kgp__/speech-v1.js` của chính origin game ⇒ hợp lệ với CSP `script-src 'self'`, không cần `unsafe-inline`, không phụ thuộc thẻ CSP riêng của game.
- Chèn ở mức byte (không đổi encoding): sau thẻ `<head …>` đầu tiên; không có thì sau `<html …>`; không có thì sau `<!doctype …>`; không có thì đầu file (sau BOM nếu có). **Không bao giờ chèn trước doctype** (sẽ rơi vào quirks mode). So khớp không phân biệt hoa thường.
- Body HTML sau khi chèn trả bằng `ByteArrayInputStream` (WebView tự tính độ dài từ `available()`); `HEAD` trả `HeadStream(độ dài mới)`. Request HTML có `Range`: phục vụ không chèn (hoặc 200 đầy đủ có chèn) — chọn một, ghi DECISIONS, có test.
- Đường dẫn ảo `/__kgp__/…` dành riêng cho host (game có file trùng tên thì bị che — ghi vào GAME_FORMAT).
- Cân nhắc đã loại: `WebViewCompat.addDocumentStartJavaScript` + `addWebMessageListener` — gọn hơn nhưng không có trên WebView 69; không giữ hai đường song song cho bản này.

### 4.3 Kênh native ↔ trang
- Dùng **WebMessageChannel** của framework (API 23+, có trên mọi máy minSdk 26): `webView.createWebMessageChannel()` → giữ `ports[0]`, gửi `ports[1]` bằng `webView.postWebMessage(WebMessage("kgp-speech-v1", arrayOf(ports[1])), Uri.parse(session.origin))` trong `onPageFinished` của đúng generation (cùng chỗ `deliverInitialState`). Mỗi lần trang tải = kênh mới; đóng kênh cũ khi trang mới tải, `teardownWebView`, `goHome`, `closeForParent`, `suspendSession`.
- Shim nhận cổng qua `window.addEventListener('message', …)` khi `e.data === 'kgp-speech-v1' && e.ports[0]`, chỉ nhận cổng đầu tiên; trước khi có cổng thì xếp lệnh vào hàng chờ (tối đa vài lệnh).
- Native chỉ xử lý tin trên cổng của **phiên + trang hiện tại**; tin từ cổng cũ bỏ qua. Mọi gọi `WebMessagePort` và trả sự kiện chạy trên main thread.

### 4.4 Giao thức (chuỗi JSON, ≤ 4 KB mỗi tin)
- Trang → app: `{"op":"hello","v":1}`, `{"op":"speak","id":n,"text":"…","lang":"vi-VN","voice":"<voiceURI>","rate":0.9,"pitch":1.05,"volume":1}`, `{"op":"cancel"}`.
- App → trang: `{"t":"voices","voices":[{"voiceURI","name","lang","localService":true,"default":bool}]}`, `{"t":"start","id":n}`, `{"t":"end","id":n}`, `{"t":"error","id":n,"error":"interrupted|canceled|not-allowed|language-unavailable|synthesis-failed|text-too-long"}`.

### 4.5 Shim `speech-v1.js` (viết cho Chromium 69: không `?.`, `??`, class fields)
- Thay `window.speechSynthesis` và `window.SpeechSynthesisUtterance` bằng bản của host (`Object.defineProperty(..., {configurable: true})`), kể cả khi WebView có sẵn đối tượng gốc.
- `SpeechSynthesisUtterance`: thuộc tính `text, lang, voice, volume, rate, pitch`, `onstart/onend/onerror/onpause/onresume/onboundary/onmark`, `addEventListener/removeEventListener/dispatchEvent`. Sự kiện là object có `type, utterance, charIndex, elapsedTime, name` (+ `error` cho lỗi).
- `speechSynthesis`: `speak, cancel, pause, resume, getVoices`, `speaking, pending, paused`, `onvoiceschanged` + `addEventListener('voiceschanged')`.
  - `speak()` cập nhật `pending` **ngay lập tức**; `speaking` bật khi có `start`; cập nhật khi `end/error`.
  - `cancel()` xóa hàng đợi và đặt `speaking/pending = false` **đồng bộ**, gửi `cancel` xuống app; sự kiện `error` (`interrupted` cho câu đang đọc, `canceled` cho câu chờ) bắn **bất đồng bộ** (`setTimeout 0`) như trình duyệt.
  - `pause/resume`: Android TTS không có tạm dừng — `pause()` = dừng câu hiện tại và đặt `paused`; ghi giới hạn trong GAME_FORMAT.
  - `getVoices()` trả danh sách app gửi (ban đầu `[]`), bắn `voiceschanged` khi nhận/đổi danh sách.
- Không bao giờ có cổng ⇒ `getVoices()` mãi `[]` ⇒ game chạy im lặng như cũ.

### 4.6 Phía native (gói mới `player/speech/`)
- `SpeechEngine` (interface: khởi tạo, danh sách giọng, `speak(id, text, params)`, `stop()`, `shutdown()`) + `AndroidTtsEngine` (dùng `TextToSpeech`) + `FakeSpeechEngine` cho test (cho phép thay qua `AppGraph`/test hook chỉ ở debug).
- **Khởi tạo sớm** (khi app vào menu, không đợi lần `speak` đầu) và dùng chung cho cả app; `shutdown()` khi app bị hủy. Đo độ trễ `speak → onStart` (mục tiêu < 500 ms) và ghi báo cáo.
- Giọng: chỉ giọng **offline**; ưu tiên `vi`; tối đa 64 giọng; `lang` = `voice.locale.toLanguageTag()`; đánh dấu `default` cho giọng Việt tốt nhất. Câu yêu cầu `voice` không có trong danh sách ⇒ chọn giọng offline tốt nhất theo `lang`; không có ⇒ `error: language-unavailable`.
- Tham số: `rate` kẹp 0,25–3 (`setSpeechRate`), `pitch` kẹp 0,5–2 (`setPitch`), `volume` 0–1 (`KEY_PARAM_VOLUME`), `QUEUE_ADD`, `utteranceId = "g<generation>-p<page>-<id>"`, `setAudioAttributes(USAGE_MEDIA, CONTENT_TYPE_SPEECH)`. `UtteranceProgressListener` (luồng binder) → đưa về main thread → gửi `start/end/error` qua cổng.
- Giới hạn: văn bản ≤ 1000 ký tự sau khi bỏ ký tự điều khiển (dài hơn ⇒ cắt + ghi chẩn đoán), ≤ 20 câu chờ, ≤ 10 lệnh `speak`/giây, tin ≤ 4 KB, `op` lạ ⇒ bỏ qua.
- **Gắn với `applyPolicy()`**: chỉ đọc khi `audible()`. Không được phát ⇒ không gọi engine, trả `start` rồi `end` sau thời lượng ước tính (~60 ms/ký tự + 300 ms, tối đa 8 s) để giữ nhịp. Chuyển từ có tiếng sang không ⇒ `engine.stop()` + `error: interrupted` cho câu đang đọc. Đóng/tạm dừng phiên ⇒ dừng + đóng kênh.
- `AndroidManifest.xml`: thêm `<queries><intent><action android:name="android.intent.action.TTS_SERVICE" /></intent></queries>` (Android 11+ cần để thấy engine TTS). **Không thêm quyền.**
- Chẩn đoán: engine, số giọng offline, giọng Việt (tên), số câu đã đọc/bị chặn, lỗi engine.

### 4.7 Khu phụ huynh
- Mục mới “Giọng đọc”: trạng thái (“Giọng tiếng Việt: có — <tên>” / “chưa có giọng tiếng Việt offline”), nút **Nghe thử** (đọc một câu ngắn, tuân theo cài đặt âm thanh), nút **Mở cài đặt giọng đọc** (`Intent("com.android.settings.TTS_SETTINGS")`, bắt `ActivityNotFoundException`; khi đang ghim ứng dụng thì nhắc “kết thúc phiên trước”).
- Tùy chọn (nếu gọn): công tắc “Đọc lời trong game” (mặc định bật).

### 4.8 Không đổi
- `player-sdk.js` (KidsSDK) giữ nguyên; game SDK không bị ảnh hưởng ngoài việc trang có thêm shim.
- CSP, router, chặn mạng, PIN, ghim ứng dụng giữ nguyên.

---

## 5. Kiểm thử bắt buộc

### 5.1 Unit (JVM)
Bộ chèn HTML (có/không `<head>`, chữ hoa, doctype, BOM, không có `<html>`, file rỗng); kiểm tra/cắt tin nhắn (độ dài, JSON hỏng, `op` lạ, kẹp rate/pitch/volume); hàng đợi + tần suất; chính sách (không được phát ⇒ không gọi engine, có `end` ước tính); lọc giọng (loại giọng cần mạng, ưu tiên `vi`).

### 5.2 Instrumentation (API 37 **và** API 26, dùng `FakeSpeechEngine`)
Fixture mới `test-fixtures/webview/speech/` mô phỏng đúng mẫu của game (lọc `getVoices()` theo `vi`, `voiceschanged`, `speak` với `onend/onerror`, `speaking||pending → cancel → speak sau 90 ms`, đọc chuỗi nhiều câu). Kiểm:
- shim có trước script của trang; `document.compatMode === 'CSS1Compat'` (không quirks); HTML không có `<head>` vẫn có shim;
- giọng `vi-VN` của fake hiện ra; engine nhận đúng văn bản/thứ tự/rate/pitch; trang nhận `start/end`;
- `cancel` ⇒ engine `stop`, trang nhận `error: interrupted`;
- tắt tiếng / inactive ⇒ engine không nhận gì, trang vẫn nhận `end`;
- văn bản quá dài bị cắt; tin từ trang/phiên cũ bị bỏ qua;
- 13 test cũ vẫn đạt.

### 5.3 Trên emulator với game thật (bản sao)
Chép `Ai Song O Dau` (họ A), `Bac Si Thu Nhi` (họ B), `May Ke Chuyen` (họ C), `Cun San So 7` (không lời) vào `/sdcard/KidsGames/` của emulator (tên có dấu cách — đặt trong ngoặc kép), chơi qua app:
- Nếu emulator có engine TTS và cài được giọng Việt offline: nghe/ghi nhận được lời đọc; kiểm `dumpsys audio` — **âm thanh TTS phát dưới uid của app engine TTS, không phải uid của player** — tắt tiếng/Home/tắt màn hình ⇒ uid đó không còn player `started`.
- Nếu không có engine/giọng: dùng bản debug + chẩn đoán để chứng minh lệnh đọc đi đúng đường; ghi phần nghe thật là **NOT_RUN** và đưa vào checklist cho người dùng.

### 5.4 Hồi quy bản release
Cài 1.1.0 đè 1.0.0 trên emulator (giữ PIN, thư mục, game ẩn, checkpoint); game mẫu và một game `KidsGames-1file` vẫn chạy; `apksigner verify` (v2+v3, cùng chứng chỉ SHA-256 `c0e5bcc7…2530`); không quyền mới ngoài quyền nội bộ của AndroidX.

---

## 6. Bàn giao

- `app/build.gradle.kts`: `versionCode = 2`, `versionName = "1.1.0"`.
- Tài liệu cập nhật: `docs/DECISIONS.md` (mục 22: ngoại lệ kênh giọng đọc, chỉ giọng offline, đường dẫn ảo `/__kgp__/`), `docs/ARCHITECTURE.md` (mục giọng đọc), `docs/GAME_FORMAT.md` §4 (player hỗ trợ Web Speech API; khuyến nghị cho game: chờ `voiceschanged`, xử lý `onerror`, đồng hồ dự phòng ≥ 2,5 s + 150 ms/ký tự; `pause` không hỗ trợ; `/__kgp__/` dành riêng), `docs/DEVICE_CHECKLIST.md` (cài giọng tiếng Việt offline, nghe thử, kiểm tắt tiếng/ra nền), `README_VI.md` (cách cài giọng Việt trên máy), `CLAUDE.md` (quy tắc: cầu nối duy nhất là kênh giọng đọc qua WebMessagePort), `BUILD_STATUS.md`, `BUILD_REPORT.md` (thêm phần 1.1.0, giữ lịch sử 1.0.0, PASS/FAIL/NOT_RUN trung thực).
- Build + test + đóng gói: theo `CLAUDE.md` (`scripts/build.*`, `tools/package_delivery.py --apksigner …`) ⇒ `dist/KidsGamesPlayer-v1.1.0.apk`, ZIP nguồn, ZIP game mẫu, `SHA256SUMS.txt` (LF), BUILD_REPORT; kiểm build sạch từ ZIP nguồn (B01); `sha256sum -c` đạt.
- Trả lời cuối cho người dùng (tiếng Việt): thay đổi gì, cách cập nhật (cài đè APK), cách kiểm/cài giọng tiếng Việt trên điện thoại, những gì đã thử trên emulator và những gì NOT_RUN cần thử trên máy thật.

---

## 7. Môi trường trên máy này (đã có sẵn)

- Gradle: `JAVA_HOME=<JDK 21>`, `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=<thư mục ngoài TEMP>` (sandbox của agent), `./gradlew.bat --no-daemon …`. Máy ít RAM: Gradle khởi động chậm khi emulator chạy; chỉ chạy **một** emulator mỗi lúc.
- adb/apksigner/aapt2 dùng bản chép ở một thư mục riêng (`platform-tools/adb.exe`, `build-tools-36.0.0/`), vì Python MSIX không thấy `%LOCALAPPDATA%\Android`. `apksigner.bat` cần `JAVA_HOME` + `PATH` chứa `jdk21/bin`. Git Bash: `export MSYS_NO_PATHCONV=1`.
- Emulator (WHPX, headless):
  `"$LOCALAPPDATA/Android/Sdk/emulator/emulator.exe" -avd kgp_api37 -no-window -no-snapshot-save -no-boot-anim -gpu swiftshader_indirect -camera-back none -port 5554`
  (API 26: `-avd kgp_api26 … -port 5556`; WebView = `com.android.chrome 69`). Chờ `getprop sys.boot_completed` = 1. Ngay sau khi boot có thể gặp hộp “System UI isn't responding” → chọn Wait.
- Cả hai emulator đã cài bản release 1.0.0 và đã cấp thư mục `/sdcard/KidsGames`. **PIN thử nghiệm cũ không còn dùng được** — đừng tìm lại. Cần vào khu phụ huynh thì `adb shell pm clear vn.family.kidsgamesplayer`, tạo PIN thử nghiệm mới (sinh ngẫu nhiên, chỉ lưu trong scratchpad của phiên, không in ra) và chọn lại thư mục:
  - API 37: “Chọn thư mục” → picker → `USE THIS FOLDER` → `ALLOW`.
  - API 26: picker → More options → “Show internal storage” → mở bộ nhớ máy → `KidsGames` → `SELECT`.
- Lớp “Viewing full screen / Got it” của hệ thống có thể che màn hình sau khi cài/boot: bấm “Got it”.
- Công cụ: `tools/device_helper.py dump | tap-text "<chữ>"` (dùng `ANDROID_SERIAL`), `tools/qa/webview_probe.mjs` (CDP, chỉ bản debug), `tools/junit_summary.py`. Ghi chú thêm về WebView Shell/API 26: xem `AI_PLAYBOOK.md`.
- `connectedDebugAndroidTest` gỡ app debug sau khi chạy. **Trước khi chạy test thiết bị: `am force-stop vn.family.kidsgamesplayer` và về màn hình chính** — lần trước bản release đang mở đã làm 2 test fail giả trên API 26.

## 8. Ràng buộc giữ nguyên

- Không thêm quyền `INTERNET`/storage rộng, không `addJavascriptInterface`, không PIN mặc định, không deep link debug trong release.
- Không đưa `.local-signing/`, `*.p12`, `keystore.properties`, `local.properties`, mật khẩu vào ZIP, log, báo cáo hay chat; không đổi/xoay khóa ký.
- Không sửa thư mục `games/` (chỉ đọc) và `KidsGames-1file/` (dự án khác).
- Chỉ ghi “đã kiểm thử” khi đã chạy thật; ghi rõ NOT_RUN/BLOCKED.
- Không gửi email/tài khoản của người dùng tới dịch vụ ngoài.

## 9. Tiêu chí hoàn thành

- [ ] Đo nguyên nhân (4.1) có số liệu trên API 26 và API 37.
- [ ] Shim + kênh + engine + chính sách + khu phụ huynh xong; unit + instrumentation mới đạt trên cả hai API; 13 test cũ đạt.
- [ ] Ba game đại diện chạy trong player trên emulator, lời đọc đi đúng đường (nghe thật: PASS hoặc NOT_RUN có lý do).
- [ ] Tắt tiếng/ra nền/cổng phụ huynh/tắt màn hình ⇒ không còn tiếng đọc.
- [ ] APK 1.1.0 đã ký, verify đạt, cài đè giữ dữ liệu; `dist/` đầy đủ, checksum đạt; build sạch từ ZIP đạt.
- [ ] Tài liệu và BUILD_REPORT cập nhật; trả lời cuối có checklist thử trên điện thoại thật.
