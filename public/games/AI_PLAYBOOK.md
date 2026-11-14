# AI_PLAYBOOK — cùng con người làm Kids Games Player

Tài liệu này dành cho **AI coding agent** (Claude Code, Codex…) làm việc cùng một phụ huynh trên repo này: build lại app, tạo game mới, sửa lỗi, phát hành bản mới. Người dùng không cần biết lập trình.

**Với con người:** mở agent tại thư mục gốc của repo rồi gõ:

> Đọc `AI_PLAYBOOK.md` từ đầu đến cuối, rồi giúp tôi: **[mục tiêu, ví dụ “làm 10 game mới về động vật” hoặc “build lại APK”]**. Tự quyết các chi tiết kỹ thuật, chỉ hỏi tôi những việc phải làm trên điện thoại hoặc cần tôi quyết định.

**Với AI:** đọc hết file này trước khi làm. Các tài liệu sâu hơn được dẫn tới ở từng mục; đọc chúng khi nhiệm vụ chạm tới phần đó.

---

## 1. Dự án là gì

- **Kids Games Player** (`KidsGamesPlayer/`): app Android native (Kotlin, Views/XML, một Activity) chạy game HTML **offline** trong WebView. Phụ huynh chọn một thư mục `KidsGames` bằng trình chọn thư mục của Android (SAF); mỗi thư mục con là một game. App tự nạp game, chạy mỗi game ở một origin riêng, chặn mọi đường ra ngoài, có PIN phụ huynh và ghim ứng dụng.
- **Game**: trang HTML tự chứa. Repo có ba nhóm:
  - `games/`: 51 game một file (`index.html` + `icon.png`, không `game.json`), làm cho trình duyệt hiện đại, 50 game có giọng đọc tiếng Việt bằng Web Speech API.
  - `KidsGames-1file/`: 10 game một file theo SDK của app, viết cho WebView cũ (Chromium 69).
  - `KidsGamesPlayer/sample-games/` (3 game mẫu) và `games-template/MauGame/` (template).
- **Website** (GitHub Pages, gốc repo): `index.html` giới thiệu dự án, cho chơi thử mọi game trên trình duyệt (`play.html`) và tải APK, từng game, gói game.
- **Trạng thái**: app 1.1.0 (versionCode 2). Đã kiểm thử trên emulator Android 8 (API 26, WebView 69) và Android 17 (API 37, WebView 145), cả bản debug lẫn APK release đã ký. Trên máy thật: gia đình tự thử, xem `KidsGamesPlayer/docs/DEVICE_CHECKLIST.md`.

## 2. Phân vai

| AI làm | Con người làm |
| --- | --- |
| Toàn bộ mã, hình, âm thanh, icon, test, build, ký (khi có khóa), đóng gói, tài liệu, báo cáo | Quyết định sản phẩm (game gì, cho tuổi nào) |
| Tự chọn chi tiết kỹ thuật và ghi lý do vào `KidsGamesPlayer/docs/DECISIONS.md` | Các bước chỉ chủ máy làm được: cài APK, cho phép nguồn cài, chọn thư mục trong picker, tạo PIN thật, bật ghim ứng dụng, tải giọng tiếng Việt, **nghe bằng tai** |
| Thử như người dùng thật trên emulator và trình duyệt headless | Giữ và sao lưu khóa ký `KidsGamesPlayer/.local-signing/` (không có trong repo) |
| Báo cáo trung thực cái đã thử và cái chưa thử được | Đồng ý trước mọi việc khó hoàn tác: xóa dữ liệu, gỡ app, đổi khóa ký, đăng/công bố |

Không hỏi con người chọn framework, tên biến, màu, thư viện. Hỏi khi cần một quyết định sản phẩm hoặc một thao tác trên thiết bị của họ.

## 3. Luật không được phá

1. **Không mạng**: APK release không có quyền `INTERNET`, không thư viện mạng, không analytics, không quảng cáo, không tài khoản.
2. **Không cầu nối JS có quyền**: không `addJavascriptInterface`. Native → trang chỉ có biểu thức cố định `KidsPlayerGame.onHostState(<JSON>)` và kênh giọng đọc. Trang → native chỉ có **một** đường: kênh giọng đọc qua `WebMessagePort` (`hello` / `speak` / `cancel`, có giới hạn, chỉ tài liệu hiện tại của phiên hiện tại). Không mở rộng kênh này cho việc khác nếu con người chưa quyết.
3. **Router không bao giờ trả `null`** cho URL ngoài, scheme lạ hay file thiếu (ngoại lệ duy nhất có test: ảnh/âm thanh `data:` không phải main frame). `/__kgp__/` là đường dẫn dành riêng của host.
4. **Khóa ký**: không tạo khóa mới khi đã có, không đổi khóa, không đưa `.local-signing/`, `*.p12`, `*.jks`, `keystore.properties`, `local.properties`, mật khẩu vào git, ZIP, log, báo cáo hay chat. Khóa khác = không cài đè được = gia đình mất dữ liệu.
5. **Danh tính game là vĩnh viễn**: game có `game.json` giữ nguyên `id`; game không có `game.json` được nhận theo **tên thư mục**. Đổi id hoặc tên thư mục = bé mất điểm đã lưu. Sửa game thì tăng `version`, giữ id và tên thư mục.
6. **Game cho trẻ**: mọi màn, chế độ, thế giới **mở sẵn từ lần đầu** (phần thưởng sưu tập vẫn được kiếm); không mạng sống, không thua, không đồng hồ ép; chơi được trọn vẹn khi **không có giọng đọc**.
7. **Thư mục game của gia đình chỉ đọc**, trừ khi con người yêu cầu sửa. Muốn thử thì chép bản sao.
8. **Trung thực**: chỉ viết “đã kiểm thử” khi đã chạy thật và có log/ảnh. Dùng nhãn PASS / FAIL / NOT_RUN / BLOCKED. “PASS (emulator)” không phải “PASS trên máy thật”.
9. Không bao giờ in PIN, mật khẩu, khóa. Trên máy thật của gia đình: không `pm clear`, không gỡ app, không đổi cài đặt hệ thống.
10. **Repo công khai không chứa thông tin máy**: không đường dẫn nằm trong thư mục cá nhân (có tên tài khoản), tên máy, tên tài khoản, email, cấu hình máy (hệ điều hành, RAM). Viết `%LOCALAPPDATA%`, `<JDK 21>`, “thư mục gốc của repo”. Báo cáo JUnit ghi tên máy trong `hostname=`: đổi thành `localhost` trước khi commit. Trước mỗi commit, tìm các chuỗi này trong thay đổi (kể cả trong ZIP/APK) và hỏi con người nếu thấy.

## 4. Bản đồ repo

```text
README.md                 tổng quan cho người đọc
AI_PLAYBOOK.md            file này
index.html, play.html     website GitHub Pages: trang giới thiệu + trang mở game (xem mục 7.6)
lam-cung-ai.html          trang hướng dẫn cho người: triết lý, cách dựng, áp dụng cho dự án khác, prompt mẫu
site/                     catalog.json (danh mục game, sửa tay), catalog.js (sinh ra), app.js, play.js, style.css, img/
downloads/                APK, games/<slug>.zip (từng game), KidsGames-*.zip (gói), SHA256SUMS.txt; sinh bằng tools/build_site.py (trừ APK)
tools/build_site.py       dựng site/catalog.js và mọi ZIP trong downloads/ từ site/catalog.json
.nojekyll                 để GitHub Pages phục vụ cả thư mục bắt đầu bằng “_”
specs/                    tài liệu đã giao cho AI (viết khi chúng nằm ở thư mục gốc; đường dẫn bên trong tính từ gốc repo)
  KidsGames_Player_Claude_Code_Bible.md   đặc tả gốc của app (bản 1.0.0)
  BRIEF_10_GAME_1FILE.md                  brief làm 10 game trong KidsGames-1file/
  HANDOVER_TTS_v1.1.0.md                  handover làm bản 1.1.0 (giọng đọc)
games/                    51 game một file + "Bo game 2.md" … "Bo game 5.md" (prompt từng lô 10 game)
KidsGames-1file/          10 game theo SDK; _src/ (nguồn tách file), _tools/ (build, check, test CDP, đóng gói;
                          chạy `npm install` trong _tools/ một lần để có acorn), _build/ và _screens/ (kết quả kiểm thử)
KidsGamesPlayer/          app Android
  CLAUDE.md               lệnh build/test và luật của dự án (đọc trước khi sửa app)
  BUILD_STATUS.md         trạng thái theo milestone
  BUILD_REPORT.md         kết quả kiểm thử từng bản (1.1.0 ở trên, 1.0.0 ở dưới)
  README_VI.md            hướng dẫn cho phụ huynh
  docs/                   ARCHITECTURE, DECISIONS (22 mục), GAME_FORMAT, GAME_AUTHORING_PROMPT,
                          DEVICE_CHECKLIST, SIGNING, TOOLCHAIN_LOCK
  app/src/main/java/vn/family/kidsgamesplayer/
    player/               RequestRouter, GameResponder, HtmlInjector, HostAssets, GameClients,
                          GameWebView, PlayerController, HostState/AudioPolicy, OriginCleaner
    player/speech/        SpeechProtocol, SpeechBroker, VoiceCatalog, SpeechEngine,
                          AndroidTtsEngine, SpeechChannel, SpeechHub, SpeechStats
    importer/ catalog/ source/ core/ parent/ ui/
  app/src/main/assets/    builtin/ (3 game mẫu trong APK), host/speech-v1.js (shim giọng đọc, ES5)
  app/src/test/           unit test JVM
  app/src/androidTest/    test thiết bị (WebViewHarness, FakeSpeechEngine, SpeechBridgeTest…)
  test-fixtures/webview/  trang HTML dùng cho test thiết bị
  games-template/MauGame/ template game theo SDK; player-sdk.js chuẩn nằm ở đây
  sample-games/           3 game mẫu (nguồn)
  tools/                  pack_game.py, preview_game.py, sync_games.py, package_delivery.py,
                          device_helper.py, junit_summary.py, qa/webview_probe.mjs, qa/speech_shim_test.mjs
  scripts/                bootstrap, build, install, package_delivery, create_signing_key (.ps1 và .sh)
  evidence/               bằng chứng kiểm thử (JUnit XML, log, ảnh)
```

Ảnh gốc Gi & Shi (`assets-src*/`) có thể không có trong repo công khai: đó là ảnh của gia đình (`KidsGamesPlayer/ASSETS_LICENSE.md`).

## 5. Kiến trúc trong một phút

```text
Thư mục KidsGames (SAF) ─> ScanCoordinator ─> GameImporter ─> RevisionStore (bản nội bộ bất biến)
                                                   └─> CatalogRepository (catalog.json, AtomicFile)
Menu (RecyclerView) ─> PlayerController ─> KidsWebView ─> GameWebViewClient
      https://g-<token>.invalid/...  ─> RequestRouter ─> GameResponder (CSP, Range/HEAD, chèn shim vào HTML)
Trang game: /__kgp__/speech-v1.js ⇄ WebMessagePort ⇄ SpeechChannel ─> SpeechBroker ─> AndroidTtsEngine (TextToSpeech)
Phụ huynh: PinManager (PBKDF2), PinningController (ghim ứng dụng), ParentScreen
```

Bất biến cần giữ (chi tiết: `KidsGamesPlayer/docs/ARCHITECTURE.md`):
- Bé chỉ chạy **bản nạp hoàn chỉnh**; bản mới lỗi thì giữ bản cũ. Revision không bao giờ bị sửa.
- Mỗi game một origin `https://g-<token>.invalid` (token không đổi khi cập nhật game) ⇒ `localStorage` riêng và bền.
- Luật âm thanh duy nhất: `audible = foreground ∧ PLAYING ∧ cổng phụ huynh đóng ∧ không có hộp xác nhận ∧ bật tiếng`. `PlayerController.applyPolicy()` là điểm duy nhất áp dụng nó, cho cả WebView lẫn giọng đọc.
- `onStop` luôn hủy WebView; quay lại thì nạp lại game từ checkpoint của game.
- Mọi callback của WebView mang `generation`; callback của phiên cũ bị bỏ qua.

## 6. Chuẩn bị môi trường

| Công cụ | Phiên bản đã dùng | Ghi chú |
| --- | --- | --- |
| JDK | Temurin 21 (bytecode 17) | AGP 9.4 cần JDK ≥ 17 |
| Android SDK | `platforms;android-37.0`, build-tools 36.0.0, platform-tools, emulator | |
| Gradle / AGP / Kotlin | wrapper 9.6.0 / 9.4.0 / 2.2.10 | khóa phiên bản trong `gradle/libs.versions.toml`, không dùng `+` |
| System images | `system-images;android-26;google_apis;x86_64`, `system-images;android-37.0;google_apis;x86_64` | AVD `kgp_api26` (pixel_2, WebView 69), `kgp_api37` (medium_phone) |
| Python | 3.x, thư viện chuẩn | Pillow/numpy/ffmpeg chỉ cho script tạo asset |
| Node | ≥ 22 (có `WebSocket` sẵn) | test shim, nói chuyện với Chrome/WebView qua DevTools (CDP) |
| Chrome | bản desktop | test game bằng headless Chrome |

Kiểm tra nhanh: `KidsGamesPlayer/scripts/bootstrap.ps1` (hoặc `.sh`).

Emulator (headless, WHPX/HVF/KVM):

```text
emulator -avd kgp_api37 -no-window -no-snapshot-save -no-boot-anim -gpu swiftshader_indirect -camera-back none -port 5554
emulator -avd kgp_api26 -no-window -no-snapshot-save -no-boot-anim -gpu swiftshader_indirect -camera-back none -port 5556
```

Chờ `adb shell getprop sys.boot_completed` = 1. Máy ít RAM: chỉ chạy **một** emulator mỗi lúc. Hộp “System UI isn't responding” → chọn Wait; lớp “Viewing full screen” → “Got it”.

Riêng Windows / sandbox của agent:
- Gradle có thể cần `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=<thư mục ngoài TEMP>`.
- Python cài từ Microsoft Store không thấy `%LOCALAPPDATA%\Android`: chép `platform-tools` và `build-tools/36.0.0` ra một thư mục khác rồi gọi từ đó.
- Git Bash: đặt `MSYS_NO_PATHCONV=1` khi gọi `adb` với đường dẫn `/sdcard/...`.
- `adb shell` treo sau khi tắt và bật emulator: `adb kill-server` rồi `adb start-server`.

## 7. Quy trình

### 7.1 Build và test app

```powershell
cd KidsGamesPlayer
.\scripts\build.ps1              # sync check, test Python, debug + unit + lint, release đã ký + lint
.\scripts\build.ps1 -Connected   # thêm test thiết bị trên emulator đang chạy
node tools\qa\speech_shim_test.mjs
```

- Trước khi chạy test thiết bị: `adb shell am force-stop vn.family.kidsgamesplayer`, về màn hình chính, và **gỡ bản debug nếu đã cài tay** (`vn.family.kidsgamesplayer.debug`).
- **Luôn đọc số test trong XML** (`python tools/junit_summary.py "app/build/outputs/androidTest-results/connected/debug/*.xml"`): AGP 9.4 báo BUILD SUCCESSFUL dù APK test không cài được.
- Chạy test thiết bị trên **cả API 26 và API 37**. Mốc hiện tại: unit 88, thiết bị 23 mỗi API, Python 10 + 1 bỏ qua (symlink trên Windows), shim 9.

### 7.2 Thử như người dùng trên emulator

- Bản debug (package `vn.family.kidsgamesplayer.debug`) có DevTools của WebView: `adb forward tcp:9333 localabstract:webview_devtools_remote_<pid>` rồi `node tools/qa/webview_probe.mjs 9333 "<biểu thức JS>"`. Bản release không có DevTools.
- Thao tác UI: `python tools/device_helper.py dump | tap-text "<chữ>" | tap X Y | hold X Y MS | shot <tên>` (biến `ANDROID_SERIAL`, `ADB`).
- Cần khu phụ huynh trên emulator: tạo **PIN thử nghiệm ngẫu nhiên**, chỉ lưu ở thư mục tạm của phiên, không in ra; gõ bằng script đọc file. Chỉ `pm clear` trên emulator.
- Chọn thư mục: API 37 “Chọn thư mục” → `KidsGames` → USE THIS FOLDER → ALLOW. API 26: picker → menu ⋮ → “Show internal storage” → bộ nhớ máy → `KidsGames` → SELECT.
- Chép game thử: `adb push "<thư mục game>" /sdcard/KidsGames/` (tên có dấu cách: để trong ngoặc kép). Game hiện trong menu sau khoảng 20 giây.
- Kiểm âm thanh không cần tai: `adb shell dumpsys audio`, tìm `AudioPlaybackConfiguration` có `state:started`. Tiếng game phát dưới uid của app, tiếng đọc phát dưới **uid của engine TTS** (ví dụ `com.google.android.tts`). Lấy mẫu dày bằng một vòng lặp shell chạy ngay trên thiết bị (đẩy script vào `/data/local/tmp`).
- Log của app bị logcat “chatty” cắt khi app ghi nhiều: chạy riêng test đo bằng `adb shell am instrument -w -e class <Test> vn.family.kidsgamesplayer.debug.test/androidx.test.runner.AndroidJUnitRunner` rồi đọc logcat ngay.
- WebView 69 không có lệnh chụp màn hình qua CDP: dùng `adb exec-out screencap -p`.

### 7.3 Phát hành bản mới của app

1. Tăng `versionCode` và `versionName` trong `KidsGamesPlayer/app/build.gradle.kts`.
2. `scripts\build.ps1 -Connected` trên cả hai API; sửa đến khi xanh.
3. Kiểm APK release: `apksigner verify --verbose --print-certs` (v2 + v3, chứng chỉ SHA-256 `c0e5bcc7…2530` giống bản trước), `aapt2 dump badging` (không có quyền mới; chỉ có `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` nội bộ).
4. **Thử cài đè** bản cũ đang có dữ liệu bằng `adb install -r` trên emulator: `firstInstallTime` giữ nguyên, PIN vẫn đòi, danh sách game như cũ, một checkpoint tạo trước khi cập nhật vẫn còn.
5. `scripts\package_delivery.ps1` (hoặc `python tools/package_delivery.py --apksigner <đường dẫn>`) → `dist/`. Chép bộ cũ sang `dist/previous/<bản cũ>/` trước, vì script xóa các file ở cấp đầu của `dist/`.
6. `sha256sum -c SHA256SUMS.txt` trong `dist/`. Build sạch từ `dist/KidsGamesPlayer-source.zip` trong một thư mục trống (không `local.properties`, không `.local-signing/`; đặt `ANDROID_HOME`): `gradlew :app:assembleDebug :app:testDebugUnitTest :app:assembleRelease`.
7. Cập nhật `BUILD_REPORT.md` (thêm phần bản mới, giữ lịch sử), `BUILD_STATUS.md`, `DECISIONS.md`, tài liệu liên quan; nếu sửa báo cáo sau khi đóng gói thì đóng gói lại.
8. Đưa lên website: chép APK mới vào `downloads/` (xóa APK cũ ở đó), sửa `apk.file` và `apk.version` trong `site/catalog.json`, chạy `python tools/build_site.py`, sửa số phiên bản trong `index.html` và `README.md`, rồi commit. Có thể đăng thêm ở mục Releases của GitHub.

### 7.4 Tạo game mới

Hỏi con người: ý tưởng, độ tuổi, có cần chạy trên Android 8 chưa cập nhật WebView không. Rồi chọn một trong hai cách.

**A. Game theo SDK** (khuyên dùng cho game mới của app). Làm đúng `KidsGamesPlayer/docs/GAME_AUTHORING_PROMPT.md`: copy `games-template/MauGame/`, giữ `player-sdk.js` nguyên văn và nạp nó trước mọi script, `game.json` có `id` mới dạng `family.<ten>`, âm thanh qua `KidsSDK.audio`, lưu bằng `KidsSDK.save`, vòng lặp bằng `KidsSDK.loop`. Thử bằng `python tools/preview_game.py <thư mục> --port <cổng>` (có CSP như app), đóng gói bằng `python tools/pack_game.py --input <nguồn> --output ready/KidsGames/<TenGame>` đến khi `OK`. Mẫu “một file” đầy đủ: `KidsGames-1file/` và `specs/BRIEF_10_GAME_1FILE.md`.

**B. Lô 10 game một file** (như `games/`). Copy một file `games/Bo game N.md`, thay mục “mười game của bộ này” và danh sách game đã có để không trùng tên. Giữ nguyên tiêu chuẩn mục 4–6 của file đó: một `index.html` tự chứa, icon 256×256 cùng phong cách, tiếng Việt có dấu, không phạt, mở khóa hết, âm thanh tổng hợp bằng WebAudio, Pointer Events, responsive 360×640 → 1920×1080, lưu bằng `localStorage` bọc `try/catch`, không lỗi console. Cách làm đã chứng minh hiệu quả: viết một kit dùng chung rồi inline vào từng file bằng script build; làm một game mẫu hoàn chỉnh trước; có thể chia mỗi game cho một subagent nhưng phải tự thử lại từng game.

Luật chung cho cả hai cách khi game chạy trong app:
- Mọi request ra ngoài bị chặn. Google Fonts cũng bị CSP chặn: luôn có font hệ thống dự phòng.
- **WebView cũ (Android 8, Chromium 69)**: JS ≤ ES2018, không `?.`, `??`, class fields, `Object.fromEntries`, `replaceAll`; CSS không `inset` (dùng `top/right/bottom/left`), không `gap` trong flex, `aspect-ratio`, `:is()/:where()/:has()`, `clamp()/min()/max()`, `dvh`. 51 game trong `games/` **không** theo luật này: trên WebView 69, 16 game không khởi động và cả 51 dùng `inset`.
- **Giọng đọc** (Web Speech API, app 1.1.0+): lấy giọng bằng `speechSynthesis.getVoices()` lọc `lang` bắt đầu bằng `vi`; danh sách ban đầu rỗng nên nghe `voiceschanged` và thử lại sau ~0,7 s và ~2,5 s; xử lý cả `onend` và `onerror`; mỗi câu có đồng hồ dự phòng ≥ 2,5 s + 150 ms/ký tự; nếu đang đọc thì `cancel()` rồi `speak()` sau 60–90 ms; câu ≤ 1000 ký tự. Không có giọng thì game vẫn phải chơi được trọn vẹn.
- Không đặt file vào `__kgp__/` (bị che). Âm thanh dạng file phải dài ≥ 0,35 s (Ogg rất ngắn không phát qua `<audio>`).

Kiểm thử game (bắt buộc trước khi nói xong):
- Headless Chrome qua CDP bằng Node, ở 3 kích thước 390×844 (chạm), 844×390 (chạm), 1280×800 (chuột): chụp mọi màn, **chơi trọn một vòng bằng chạm/kéo thật** (cố tình sai một lần), xoay màn hình giữa chừng, tải lại để kiểm tra lưu, thử offline, bắt `Runtime.exceptionThrown`. Mẫu công cụ: `KidsGames-1file/_tools/` (`run_test.mjs`, `cdp.mjs`, `es2017check.js`).
- Trong app trên emulator (mục 7.2) nếu có; nếu cần chạy trên Android 8 thì thử trên `kgp_api26`. WebView Shell (`org.chromium.webview_shell`, đã có trên AVD `kgp_api26` của dự án) cho DevTools Chromium 69; nạp trang qua `adb reverse tcp:PORT tcp:PORT`.
- Báo cáo: bảng game, đã thử gì, chưa thử được gì (ví dụ chưa nghe bằng tai, chưa thử máy thật).

Giao game: thư mục game (tên thư mục không dấu, ví dụ `Ai Song O Dau`), hướng dẫn một dòng “chép cả thư mục vào `KidsGames`”. Game mới không cần APK mới. Muốn game có trên website: làm theo mục 7.6.

### 7.5 Sửa app hoặc thêm tính năng

1. Đọc `KidsGamesPlayer/CLAUDE.md`, `docs/DECISIONS.md`, phần liên quan của `docs/ARCHITECTURE.md` và bible.
2. Thay đổi lớn: viết trước một **handover** (mẫu: `specs/HANDOVER_TTS_v1.1.0.md`) gồm bối cảnh, quyết định đã chốt (có sự đồng ý của con người), yêu cầu phải đạt, thiết kế đề xuất, kiểm thử bắt buộc, việc bàn giao, tiêu chí hoàn thành. Đo nguyên nhân trên thiết bị **trước** khi viết mã.
3. Viết test trước hoặc cùng mã: logic thuần → unit JVM; WebView → `WebViewHarness` + fixture trong `test-fixtures/webview/`; luồng app → test kiểu `MainFlowTest` hoặc `SpeechPlayerFlowTest`.
4. Mọi lệch so với handover/bible ghi thành một mục mới trong `DECISIONS.md` và nêu trong báo cáo.
5. Phát hành theo mục 7.3.

### 7.6 Website (GitHub Pages)

Website là file tĩnh ở gốc repo, không cần server hay bước build trên GitHub: Settings → Pages → Deploy from a branch → `main` / `(root)`. Không có tài nguyên ngoài, analytics hay cookie; chỉ các game trong `games/` tự tải Google Fonts.

- **Thêm hoặc sửa game trên web**: thêm/sửa một mục trong `site/catalog.json` (`dir`, `title`, `collection`, `blurb`, tùy chọn `ages`, `voice`, `android8`, `template`), rồi chạy `python tools/build_site.py`. Tool báo lỗi nếu thiếu `index.html` hay trùng slug, cảnh báo nếu một thư mục trong `games/` hoặc `KidsGames-1file/` chưa có trong catalog. Slug = tên thư mục viết thường, nối bằng `-`; đừng đổi tên thư mục (mất tiến trình đã lưu, cả trong app lẫn trên web).
- **`play.html?g=<slug>`** mở game toàn màn hình: tải `index.html` của game vào iframe cùng origin (`srcdoc`, có `<base>` trỏ về thư mục game) và chèn trước mọi script một đoạn đổi `Storage.getItem/setItem/removeItem/key/clear/length` sang tiền tố `kgp-web/<slug>/`. Lý do: mọi trang của một site GitHub Pages chung origin, và mọi game theo SDK đều lưu ở khóa `kgp.save.v1` nên sẽ đè tiến trình của nhau. Trình duyệt cũ hoặc mở bằng `file://` thì mở thẳng game.
- **Tải về**: ZIP dựng tất định (cùng nội dung → cùng byte). ZIP từng game chứa thư mục game; gói chứa `KidsGames/<thư mục game>/…`. Liên kết tới GitHub (README, AI_PLAYBOOK, specs) được `site/app.js` suy ra từ địa chỉ `<user>.github.io/<repo>/`; tên miền riêng thì điền `<meta name="kgp-repo">` trong `index.html`.
- **Kiểm thử website**: `python -m http.server 8000` ở gốc repo, mở `http://localhost:8000/`; thử ở 390×844 và 1280×800, sáng và tối; mở vài game qua `play.html`, kiểm tra console không lỗi và khóa lưu nằm dưới `kgp-web/<slug>/`.

## 8. Bài học và bẫy đã gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
| --- | --- | --- |
| Game nói được trong Chrome nhưng im lặng trong app | WebView không có `speechSynthesis` (đo: `undefined` trên WebView 69 và 145) | Shim `host/speech-v1.js` chèn làm script đầu tiên của mọi trang HTML, kênh `WebMessagePort` tới `TextToSpeech`. Không dùng `addDocumentStartJavaScript`/`addWebMessageListener` vì WebView 69 không có |
| Chữ “chó”, “Câu” tới app thành ký tự lạ (U+FFF3, U+FFE2) | WebView 69 đọc sai chuỗi chỉ gồm ký tự Latin-1 trên `WebMessagePort` | Tin nhắn hai chiều là JSON chỉ có ASCII (`\uXXXX`); giới hạn tin 8192 ký tự |
| Game chọn phải giọng không đọc được hoặc cần mạng | Google TTS liệt kê giọng `xx-XX-language` cho mọi ngôn ngữ; `isLanguageAvailable` trả “có” cả khi chỉ có giọng mạng; giọng chưa tải mang feature `notInstalled` | `VoiceCatalog`: bỏ giọng mạng và `notInstalled`, bỏ giọng `-language` khi có giọng cụ thể cùng locale |
| Câu đầu đọc trễ 0,5–2,7 s | Engine nạp mô hình hoặc mở đường phát ở câu đầu | Khởi tạo engine khi vào menu, chọn giọng Việt và `synthesizeToFile` một từ (không phát ra loa). Đạt trên API 26 (3 ms); emulator API 37 vẫn 0,6–1,1 s cho câu đầu. Không làm ấm bằng câu nói âm lượng 0 (đã thử, không hiệu quả) |
| Bố cục vỡ, lớp phủ co về góc trái trên Android 8 | `inset`, `gap` trong flex chưa có ở Chromium 69 | Dùng `top/right/bottom/left`, `margin`; `pack_game.py` cảnh báo |
| Game không khởi động trên Android 8 | `Object.fromEntries`, `?.`, `??`, class fields | Viết ES2017/ES2018; kiểm bằng acorn `ecmaVersion: 2018` |
| Range request trả sai byte | WebView tự áp dụng Range: lấy `available()` làm tổng độ dài, tự `skip()` | Trả 206 với stream “cả file, dừng sau byte cuối”, HEAD dùng stream rỗng báo `available()`, không tự đặt `Content-Length` |
| Âm thanh Ogg rất ngắn không phát | Pipeline `<audio>` của Chromium | Đệm im lặng để file dài ≥ 0,35 s |
| `window.open` thay thế trang hiện tại | `setSupportMultipleWindows(false)` | Đặt `true` và `onCreateWindow` luôn trả `false` |
| Ghim ứng dụng trên Android 17 không báo kết quả | Hộp xác nhận không lấy focus | Thăm dò `lockTaskModeState` mỗi giây trong 30 s |
| Nút “Hủy” bàn phím PIN không đóng bàn phím | Tham số `cancel` che hàm thành viên `cancel()` | Gọi `this.cancel()`, đổi tên tham số, thêm test |
| Unit test lưu file fail trên Windows | `AtomicFile` dựa vào rename đè, Windows không cho | Interface `AtomicBytesFile`; JVM test dùng biến thể NIO `ATOMIC_MOVE` |
| `MainFlowTest` treo trên API 26 | `ActivityScenario.onActivity` chờ idle khi game chiếm luồng UI | Dùng `runOnMainSync` |
| Test thiết bị “xanh” nhưng không chạy test nào | AGP 9.4 nuốt lỗi `INSTALL_FAILED_ALREADY_EXISTS` | Gỡ bản debug cài tay; đếm test trong XML |
| Không thấy log đo của app | logcat “chatty” xóa bớt dòng của app ghi nhiều | Chạy riêng test đo bằng `am instrument`, đọc logcat ngay |
| Bấm loa trên Android 8 thì game đóng | WebView 69 không có `MUTE_AUDIO`: game không theo SDK không thể bảo đảm im lặng | Hành vi có chủ đích (bible §10.3); game SDK tự tắt tiếng |
| Tắt màn hình, tiếng còn ~2 s | Android gửi `onPause` muộn sau phím nguồn | Chấp nhận: giọng đọc và tiếng game dừng cùng lúc ở `onPause` |

## 9. “Xong” nghĩa là gì

- Mã, test, tài liệu cùng được cập nhật; test chạy thật trên các mục tiêu liên quan (JVM, API 26, API 37, trình duyệt).
- Báo cáo ngắn, tiếng Việt, gồm: thay đổi gì; cách cài/cập nhật; bảng đã thử (PASS/FAIL/NOT_RUN/BLOCKED, nêu emulator hay máy thật); những gì **chưa** thử được và con người cần tự thử; điểm lệch so với yêu cầu và lý do.
- Bằng chứng nằm trong `KidsGamesPlayer/evidence/` (JUnit XML, log, ảnh WebP 1200 px), không chứa bí mật.

## 10. Prompt mẫu cho con người

- **Build lại và kiểm thử app:** “Đọc `AI_PLAYBOOK.md`. Build lại app từ mã nguồn, chạy toàn bộ test trên emulator API 26 và 37, rồi báo cáo kết quả trung thực.”
- **Làm game theo SDK:** “Đọc `AI_PLAYBOOK.md` mục 7.4A. Làm một game: **[ý tưởng]** cho bé **[tuổi]**, phải chạy được trên Android 8.”
- **Làm một lô game một file:** “Đọc `AI_PLAYBOOK.md` mục 7.4B và `games/Bo game 3.md`. Làm 10 game mới về **[chủ đề]**, không trùng 51 game đã có.”
- **Sửa lỗi hoặc thêm tính năng app:** “Đọc `AI_PLAYBOOK.md` mục 7.5. Tôi gặp **[mô tả]**. Hãy đo nguyên nhân trên emulator, đề xuất cách sửa cho tôi duyệt, rồi làm, kiểm thử và phát hành bản mới cài đè được.”
