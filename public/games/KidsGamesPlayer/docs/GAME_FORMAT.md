# Định dạng game — Kids Games Player v1

Tài liệu này là hợp đồng giữa một thư mục game HTML và player Android. Mã nguồn tham chiếu:
`app/src/main/java/vn/family/kidsgamesplayer/core/` (PathPolicy, MimeTypes, GameManifest),
`tools/pack_game.py` (bản Python của cùng quy tắc).

## 1. Thư mục

```text
KidsGames/                 <- thư mục phụ huynh chọn trong app (SAF)
  TenGame/                 <- mỗi thư mục con trực tiếp là một game
    index.html             <- bắt buộc, ở gốc thư mục game
    icon.png               <- nên có; thiếu/hỏng thì app vẽ ô chữ cái thay thế
    game.json              <- nên có (bắt buộc với game do AI tạo theo template)
    player-sdk.js          <- bản copy SDK (game theo template)
    game.js, style.css, assets/...
```

- App chỉ xét **thư mục con trực tiếp** của root. Không tìm game sâu hơn.
- Thư mục chỉ có `index.html` (+ `icon.png`) vẫn chạy: mức kiểm tra **basic**.
- Game đã qua `tools/pack_game.py` có inventory: mức kiểm tra **verified** (khuyến nghị).

## 2. game.json

```json
{
  "schemaVersion": 1,
  "id": "family.balloon-pop",
  "title": "Chạm bong bóng",
  "version": "1.0.0",
  "entry": "index.html",
  "icon": "icon.png",
  "orientation": "landscape",
  "playerApiVersion": 1,
  "backgroundColor": "#7ACAFE",
  "sortOrder": 10,
  "files": [ { "path": "index.html", "size": 513, "sha256": "<64 hex do packer tính>" } ]
}
```

| Trường | Quy tắc |
| --- | --- |
| `schemaVersion` | `1`. Số khác: game bị từ chối với lý do rõ ràng. |
| `id` | `^[a-z0-9][a-z0-9._-]{2,95}$`, **không đổi khi cập nhật** (giữ save). `builtin.*` dành riêng cho game có sẵn trong APK. |
| `title` | Unicode, tối đa 60 ký tự (dài hơn bị cắt). Không render như HTML. |
| `version` | Nhãn hiển thị cho phụ huynh, không phải bằng chứng nội dung. |
| `entry` | Chỉ `index.html`. |
| `icon` | Đường dẫn tương đối an toàn, mặc định `icon.png`; ảnh tối đa 4096×4096. |
| `orientation` | Chỉ `landscape` (giá trị khác bị bỏ qua). |
| `playerApiVersion` | `1` cho game dùng SDK. Thiếu = game cơ bản. |
| `backgroundColor` | `#RGB`/`#RRGGBB`; sai thì bỏ qua. |
| `sortOrder` | Số nguyên; game có `sortOrder` xếp trước, còn lại theo tên. |
| `files` | Không có hoặc `[]` → basic. Mảng không rỗng → verified: mọi file phải có đúng `size` + `sha256`, thiếu/sai thì **không kích hoạt** (giữ bản cũ, tự thử lại). |

Trường lạ (`permissions`, `openUrl`, …) không cấp quyền gì. Inventory **không** liệt kê chính `game.json`.

## 3. Đường dẫn và loại file

- Tương đối, dùng `/`, không `..`, `.`, `\`, `:`, ký tự điều khiển; tối đa 12 tầng thư mục.
- Tên Unicode (tiếng Việt), khoảng trắng, `+` được hỗ trợ; khuyên dùng ASCII đơn giản.
- Hai file trùng tên khi bỏ phân biệt hoa/thường hoặc chuẩn hóa Unicode → lỗi.
- Loại file được phục vụ: html/htm, js/mjs, css, json, txt, png, jpg/jpeg, webp, gif, svg,
  ogg, mp3, wav, m4a, mp4, webm, woff/woff2, ttf/otf. File khác không được nạp/phục vụ.
- Giới hạn: 2.000 file, 200 MiB mỗi game, 64 MiB mỗi file, `index.html` ≤ 4 MiB, `game.json` ≤ 1 MiB, 200 game.

## 4. Môi trường chạy

- Origin riêng mỗi game: `https://g-<32 hex>.invalid/`. Không có mạng thật: mọi request do app trả lời từ bản nội bộ.
- Header của host cho mọi trang HTML (CSP):
  `default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`
- Được: script inline, file JS/CSS riêng, `<script type="module">` + `.mjs`, `fetch()` file JSON/ảnh/âm thanh cục bộ, `data:`/`blob:` cho ảnh/âm thanh, `localStorage`, Canvas 2D, Web Audio, `<audio>`.
- Bị chặn: CDN/URL ngoài, `eval`/`new Function`, iframe, Worker/Service Worker, popup/`window.open`, điều hướng ra ngoài, tải file, chọn file, quyền camera/micro/vị trí, alert/confirm/prompt (bị hủy).
- **Giọng đọc (Web Speech API, từ player 1.1.0)**: `speechSynthesis`, `SpeechSynthesisUtterance` dùng được như trên Chrome; player đọc bằng giọng **offline** có sẵn trong máy (thường là “Dịch vụ lời nói của Google”), không cần mạng. Player chèn `<script src="/__kgp__/speech-v1.js"></script>` làm script đầu tiên của mọi trang HTML (ngay sau `<head>`), nên trang nhận thêm đúng một dòng đó; `fetch()` trang HTML kèm `Range` nhận byte gốc. Khuyến nghị cho game:
  - Chọn giọng bằng `getVoices()` lọc `lang` bắt đầu bằng `vi`; danh sách lúc đầu rỗng — **chờ sự kiện `voiceschanged`** (thêm lần thử lại sau ~0,7 s và ~2,5 s).
  - Luôn xử lý cả `onend` **và** `onerror` (mỗi câu chỉ nhận một trong hai); câu bị dừng nhận `error` = `interrupted` (đang đọc) hoặc `canceled` (đang chờ).
  - Có **đồng hồ dự phòng** cho mỗi câu, ít nhất 2,5 s + 150 ms/ký tự, để chuỗi câu không kẹt nếu không có sự kiện kết thúc.
  - Không có giọng Việt (hoặc chạy ngoài app/trình duyệt không có giọng): game phải chơi được im lặng.
  - Khi app tắt tiếng, ra nền, mở khu phụ huynh hoặc hộp “chơi lại”, player **không đọc** nhưng vẫn báo `start`/`end` sau thời lượng ước tính (~300 ms + 60 ms/ký tự, tối đa 8 s) để nhịp game giữ đúng.
  - Giới hạn: ≤ 1000 ký tự mỗi câu (dài hơn bị cắt), ≤ 20 câu chờ, ≤ 10 lệnh `speak()`/giây (quá thì `error: not-allowed`). `pause()` không tạm dừng được: câu đang đọc bị dừng (`interrupted`), các câu sau chờ tới `resume()`. Có sự kiện `boundary` (từ) khi engine hỗ trợ; không có `mark`.
- **`/__kgp__/` là thư mục dành riêng cho player**: file của game ở đường dẫn này không được phục vụ.
- Byte range: một range (`bytes=a-b`, `a-`, `-n`) → 206. Lưu ý: WebView biến range không thỏa thành lỗi mạng trước khi tới JS.
- Âm thanh rất ngắn (< ~0,2 s) dạng Ogg có thể không phát qua `<audio>` trên Chromium; đệm im lặng tới ≥ 0,35 s.
- **Tương thích WebView cũ**: Android 8 chưa cập nhật WebView chỉ có Chromium 69 (đã kiểm trên emulator API 26). Dùng JS ES5/ES2017 (không `?.`, `??`, `replaceAll`, class fields, `Object.fromEntries`) và CSS không cần Chrome mới: thay `inset: 0` bằng `top/right/bottom/left: 0`, thay `gap` trong flex bằng `margin`, tránh `aspect-ratio`, `:is()/:where()/:has()`, `clamp()/min()/max()`, `dvh`. (`gap` trong grid thì được.)

## 5. SDK (`player-sdk.js`, apiVersion 1)

Nạp **trước** mọi script gameplay/âm thanh. Trong app, SDK khởi đầu **inactive + muted** cho tới host state đầu tiên.

```js
KidsSDK.isActive() / KidsSDK.isMuted()
KidsSDK.onActiveChange((active, reason) => { /* dừng/tiếp tục, hủy kéo-thả */ })
KidsSDK.onSave(reason => KidsSDK.save.write({ saveSchemaVersion: 1, ... }))
KidsSDK.loop(update, render)          // update(dt) không chạy khi inactive; dt ≤ 0,05 s
KidsSDK.fitCanvas(canvas, 1280, 720)  // giữ tỷ lệ, giới hạn DPR; .toLogical(x, y)
KidsSDK.fitStage(element, 1280, 720)  // cho game DOM
KidsSDK.audio.loadBuffer(url) / playBuffer(buf, {rate, volume}) / output() / tone(f, s)
KidsSDK.audio.createAudio(url, {loop}) / play(el)   // <audio> qua registry
KidsSDK.save.read(version, migrate) / write(obj) / clear()
```

Host gửi `window.KidsPlayerGame.onHostState({apiVersion:1, seq, active, muted, reason, requestSave})`,
`reason ∈ start|resume|parent|background|home|restart|sound_changed`. Game không ra lệnh được cho app; ngoại lệ duy nhất là “đọc chữ / dừng đọc” qua Web Speech API ở §4 (kênh hẹp, có giới hạn, theo luật âm thanh của app).

## 6. Lưu tiến trình

- Một object JSON nhỏ (≤ 1 MiB) trong `localStorage` qua `KidsSDK.save`, có `saveSchemaVersion`.
- Ghi ở checkpoint (hết màn, mỗi vài điểm, khi `onSave`), không ghi mỗi khung hình.
- Giữ nguyên `id` khi cập nhật → origin và save được giữ. Đổi `saveSchemaVersion` thì viết `migrate`.
- “Xóa tiến trình” trong khu vực phụ huynh đổi origin của riêng game đó.

## 7. Cập nhật một game

Sửa nguồn → chạy lại `pack_game.py` (cùng `id`, tăng `version`) → chép đè cả thư mục vào `KidsGames`.
App chỉ kích hoạt bản mới khi mọi hash khớp; phiên đang chơi giữ bản cũ tới lần mở sau.
