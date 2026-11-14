# Kiến trúc — Kids Games Player v1 (bản 1.1.0)

Một module Android (`app/`), Kotlin, Views/XML, một Activity, không DI framework (constructor
injection trong `AppGraph`). Logic thuần tách khỏi adapter Android để unit test trên JVM.

```text
SAF tree (KidsGames/) ─┐                         ┌─ MenuScreen (RecyclerView, icon lớn)
APK assets (builtin/) ─┼─> ScanCoordinator ─> GameImporter ─> RevisionStore ─┤
                       │   (1 import tại 1 thời điểm)  (staging → rename)    └─ PlayerController
                       └─> CatalogRepository (Mutex + AtomicFile catalog.json)     │
                                                                                   ▼
        ParentScreen / PinPad / PinningController          KidsWebView + GameWebViewClient
        (native, sau PIN)                                   ─> RequestRouter ─> GameResponder
```

## Gói mã nguồn (`app/src/main/java/vn/family/kidsgamesplayer/`)

| Gói | Vai trò |
| --- | --- |
| `core/` | `PathPolicy` (một chính sách đường dẫn cho importer/router), `MimeTypes`, `ManifestParser`, `ImportLimits`, `Hashing`/`Ids`, `Diagnostics` (ring buffer 300 sự kiện), `AtomicBytesFile` |
| `catalog/` | Model `Catalog`/`GameRecord`/`SourceIssue`, `CatalogCodec` (JSON, cách ly record hỏng), `CatalogStore` (AtomicFile + bản `catalog.prev.json`), `CatalogRepository` (Mutex), `CatalogOps` (ẩn/xóa tiến trình), `SettingsStore` |
| `source/` | `SourceNode/SourceRoot`; `SafSourceRoot` (DocumentsContract), `AssetSourceRoot` (demo trong APK), `FileSourceRoot` (test), `SourceGrantManager` (quyền đọc persistable) |
| `importer/` | `GameImporter` (đọc manifest giới hạn 1 MiB → kế hoạch file → copy+SHA-256+đếm byte thật vào staging → kiểm tra lại nguồn → icon → `revisionHash` → `meta.json` → rename), `ScanCoordinator` (SHALLOW/FULL/DEEP, backoff, trùng ID, mất nguồn, GC, khôi phục khi khởi động, dựng lại catalog), `RevisionStore` (layout, lease, identity.json), `StaticReferences` |
| `player/` | `GameSession` (bất biến), `RequestRouter` (thuần), `ByteRange`, `GameResponder` (header/CSP/Range/HEAD; dùng `WebViewAssetLoader` cho GET thường; chèn shim giọng đọc vào HTML), `HtmlInjector`, `HostAssets` (`/__kgp__/`), `GameWebView` (factory + cấu hình + khóa Service Worker), `GameClients` (WebViewClient/ChromeClient/RenderProcessClient), `HostState`/`AudioPolicy`, `PlayerController` (vòng đời), `OriginCleaner` |
| `player/speech/` | Giọng đọc 1.1.0 (mục dưới): `SpeechProtocol` (định dạng tin + kiểm tra), `SpeechBroker` (hàng đợi/giới hạn/chính sách của một trang, thuần), `VoiceCatalog` (giọng offline, tiếng Việt trước), `SpeechEngine` + `AndroidTtsEngine` (`TextToSpeech`), `SpeechChannel` (WebMessagePort), `SpeechHub` (engine dùng chung + kênh hiện tại), `SpeechStats` |
| `parent/` | `PinManager` (PBKDF2-HMAC-SHA256 120k, salt, throttle bền), `ParentAuth` (chỉ trong RAM), `PinningController` (trạng thái từ `ActivityManager.lockTaskModeState`) |
| `ui/` | `MenuScreen`, `ParentScreen`, `SetupScreen`/`RecoveryScreen`, `PinPad`, `HoldButton`, `ConfirmOverlay`, `IconLoader`, `DiagnosticsReport`, `ErrorTexts` |

## Lưu trữ nội bộ (`filesDir`)

| Đường dẫn | Nội dung |
| --- | --- |
| `catalog/catalog.json` (+ `catalog.prev.json`) | Catalog schema 1 |
| `games/<internalGameId>/identity.json` | ID, logicalKey, origin token (để dựng lại catalog) |
| `games/<internalGameId>/<revisionHash>/meta.json` + `root/` + `game.json` | Revision bất biến |
| `staging/<importId>/` | Import chưa commit (dọn khi khởi động) |
| `settings/settings.json`, `settings/parent_pin.json` | Thiết lập; PIN đã băm (không plaintext) |
| `diagnostics/events.log` | Log ngắn, giới hạn, không chứa PIN/nội dung game |

## Bất biến quan trọng

1. Bé chỉ chạy **revision hoàn chỉnh** đã commit; con trỏ `activeRevision` đổi sau khi thư mục revision tồn tại. Revision không bao giờ bị sửa.
2. Một `logicalKey` (`manifest:<id>` hoặc `folder:<tên>`) ↔ một `internalGameId` ↔ một `storageOriginToken`. Cập nhật không đổi ID/token; chỉ “Xóa tiến trình” đổi token.
3. Mỗi game một origin `https://g-<token>.invalid`; router chỉ phục vụ file trong allowlist của **phiên hiện tại** (immutable `GameSession`), không bao giờ trả `null` cho URL ngoài/scheme lạ/file thiếu. Ngoại lệ duy nhất: resource `data:` ảnh/âm thanh/video/font không phải main frame, ≤ 8 MiB.
4. Không có `addJavascriptInterface`. Native → trang chỉ qua một biểu thức cố định `KidsPlayerGame.onHostState(<JSON>)` và kênh giọng đọc. Trang → native chỉ có **một** đường: kênh giọng đọc qua `WebMessagePort` (đọc chữ / dừng đọc, có giới hạn, chỉ tài liệu hiện tại của phiên hiện tại).
5. Âm thanh: `audible = foreground ∧ đang ở game ∧ PLAYING ∧ cổng phụ huynh đóng ∧ bật tiếng`. Mute native (feature-gated `MUTE_AUDIO`) trước khi báo pause. Thiếu `MUTE_AUDIO`: hủy WebView khi rời gameplay/onPause; game không theo SDK bị chặn khởi chạy khi đang tắt tiếng.
6. `onStop` luôn hủy WebView; quay lại → màn “Chơi tiếp” (nạp checkpoint). Mọi callback mang `generation`; callback cũ bị bỏ qua.
7. Trạng thái xác thực phụ huynh chỉ trong RAM, hết khi `onPause` hoặc 3 phút không thao tác. Kết quả picker thư mục chỉ áp dụng một lần cho yêu cầu đã xác thực (`pendingPickToken`).
8. Trạng thái ghim luôn đọc từ OS; không lưu Boolean làm bằng chứng.

## Giọng đọc (1.1.0, `docs/DECISIONS.md` §22)

Android WebView không có phần đọc của Web Speech API (`speechSynthesis` không tồn tại trên WebView 69 và 145), nên player tự cung cấp nó; game không phải sửa.

```text
 trang game (origin g-<token>.invalid)                     app (main thread)
 ┌──────────────────────────────────┐                      ┌───────────────────────────────────────────┐
 │ <head><script src=/__kgp__/      │  GET (router, CSP    │ GameResponder: HTML + thẻ shim (HtmlInjector)│
 │   speech-v1.js>  ← chèn đầu tiên │  'self') ───────────>│ HostAssets: assets/host/speech-v1.js        │
 │ window.speechSynthesis (shim)    │                      │                                             │
 │   speak/cancel/getVoices/...     │  WebMessagePort      │ SpeechChannel (1 kênh / tài liệu)           │
 │                                  │ <─── "kgp-speech-v1" │   └ SpeechBroker: kiểm tin, ≤20 câu chờ,    │
 │   hello / speak / cancel  ──────────────────────────────>│      ≤10 speak/s, ≤1000 ký tự, 1 câu/lúc    │
 │   <── voices/start/end/error/    │                      │      audible()? engine : start+end canh giờ │
 │       boundary                   │                      │ SpeechHub ── AndroidTtsEngine (TextToSpeech,│
 └──────────────────────────────────┘                      │   chỉ giọng offline) ── tiến trình engine TTS│
                                                           └───────────────────────────────────────────┘
```

- `PlayerController`: `onPageStarted` (tài liệu mới) đóng kênh cũ; khi tài liệu tải xong và phiên `PLAYING` (sau host state đầu tiên) thì mở kênh `g<generation>-p<page>`; `applyPolicy()` báo `SpeechHub.policyChanged()`; `goHome`/`teardownWebView` (cũng là `closeForParent`, `suspendSession`, lỗi renderer) đóng kênh ⇒ engine dừng ngay.
- Quy tắc phát = `audible()` của player ∧ công tắc “Đọc lời trong game”. Không được phát: engine không nhận gì, trang vẫn nhận `start`/`end` theo thời lượng ước tính.
- Không có kênh (trang ngoài app, lỗi WebView) hoặc không có giọng: `getVoices()` = `[]`, game tự chạy im lặng như 1.0.0.
- Khu phụ huynh: mục “Giọng đọc” (trạng thái engine/giọng Việt, Nghe thử, Mở cài đặt giọng đọc, công tắc); chẩn đoán có số câu đã đọc/im lặng/từ chối, lỗi engine, độ trễ `speak → onStart`.

## Vòng đời quét

| Sự kiện | Loại quét |
| --- | --- |
| Khởi động (sau khi đọc catalog) / quay lại foreground (cooldown 60 s) | FULL: hash lại game basic, so manifest game verified |
| Vào menu, mỗi 10 s khi menu đang hiển thị (không chồng job) | SHALLOW: thư mục mới, manifest đổi |
| Phụ huynh bấm Làm mới, vừa chọn thư mục | DEEP: như FULL và bỏ qua backoff |
| Đang chơi / app ở nền | Không polling |

Import lỗi có thể thử lại: backoff 10 s → 30 s → 90 s → 5 phút. Game basic thiếu tham chiếu tĩnh: chờ tối đa 3 lần rồi nhập kèm cảnh báo.
