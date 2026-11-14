# Kids Games Player — ghi chú bảo trì cho Claude Code

Đặc tả gốc: `specs/KidsGames_Player_Claude_Code_Bible.md` (ở gốc repo). Tài liệu này không cấp quyền mới.

## Lệnh

```powershell
.\scripts\bootstrap.ps1                 # kiểm tra JDK/SDK/Python
.\scripts\build.ps1                     # debug + unit test + lint, release đã ký + lint, test Python
.\scripts\build.ps1 -Connected          # thêm instrumentation test trên thiết bị đang cắm
.\scripts\package_delivery.ps1          # dist/: APK đã verify, ZIP nguồn, ZIP game mẫu, SHA256SUMS
python tools\sync_games.py              # sau khi sửa sample-games/ hoặc player-sdk.js
python -m unittest discover -s tools\tests
node tools\qa\speech_shim_test.mjs      # hành vi Web Speech của shim (nhanh, không cần thiết bị)
```

Test thiết bị: trước `-Connected` hãy `adb shell am force-stop vn.family.kidsgamesplayer` và về màn hình chính (bản release đang mở làm test fail giả); `connectedDebugAndroidTest` gỡ app debug sau khi chạy. Nếu đã cài tay bản debug (`adb install`), gỡ nó trước: AGP 9.4 cài không có `-r`, gặp `INSTALL_FAILED_ALREADY_EXISTS` mà task vẫn báo **BUILD SUCCESSFUL** với 0 test — luôn đọc số test trong `app/build/outputs/androidTest-results/connected/debug/*.xml` (`python tools/junit_summary.py …`).

Trong sandbox của agent trên Windows, Gradle cần `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=<thư mục không thuộc TEMP>`; Python MSIX không thấy `%LOCALAPPDATA%\Android` (chép `platform-tools`/`build-tools` ra ngoài nếu cần). Git Bash: đặt `MSYS_NO_PATHCONV=1` khi gọi `adb` với đường dẫn `/sdcard/...`.

## Quy tắc không được phá

- Không thêm quyền `INTERNET`, quyền storage rộng, `addJavascriptInterface`, đường “demo đặc quyền”, PIN mặc định hay deep link debug trong release.
- Cầu nối trang → app **duy nhất** là kênh giọng đọc qua `WebMessagePort` (`player/speech/`, `docs/DECISIONS.md` §22): chỉ `hello`/`speak`/`cancel`, có giới hạn, chỉ tài liệu hiện tại của phiên hiện tại, theo `PlayerController.applyPolicy()`, chỉ giọng offline. Không mở rộng kênh này cho việc khác; lệnh mới nào cho game cũng cần chủ dự án quyết định riêng.
- Shim `app/src/main/assets/host/speech-v1.js` viết cho Chromium 69 (ES5, không `?.`/`??`/class fields); sửa xong chạy `node tools/qa/speech_shim_test.mjs` và `SpeechBridgeTest` trên cả API 26 và API 37. `/__kgp__/` là đường dẫn dành riêng của host.
- Router không bao giờ trả `null` cho URL ngoài/scheme lạ/file thiếu (trừ nhánh `data:` media có test).
- `player-sdk.js` chuẩn nằm ở `games-template/MauGame/`; sửa ở đó rồi chạy `tools/sync_games.py` (unit test kiểm tra các bản copy giống nhau).
- Không đổi `id` của game mẫu; không đổi khóa ký (`docs/SIGNING.md`); không đưa `.local-signing/` vào bất kỳ ZIP nào.
- Mọi kết luận “đã kiểm thử” phải có log/evidence; cập nhật `BUILD_STATUS.md` và `BUILD_REPORT.md`.
