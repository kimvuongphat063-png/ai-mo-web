# Prompt tạo game mới cho Kids Games Player

Dán nguyên văn đoạn dưới cho một AI coding agent (ví dụ Claude Code) đang mở thư mục dự án
`KidsGamesPlayer/` (hoặc bản giải nén `KidsGamesPlayer-source.zip`). Chỉ cần sửa dòng **Ý tưởng game**.

---

Hãy tạo một game HTML cho trẻ em để chạy trong Kids Games Player, theo `docs/GAME_FORMAT.md` và template `games-template/MauGame/`. Ý tưởng game: **[ĐIỀN Ý TƯỞNG]**. Tự làm toàn bộ code, icon và asset cần thiết, test rồi đóng gói; không yêu cầu tôi sửa code hay tính hash.

1. Tạo thư mục nguồn mới `my-games/<TenGameKhongDau>/` bằng cách copy `games-template/MauGame/`, rồi thay phần gameplay (các chỗ đánh dấu `>>> THAY GAMEPLAY <<<`). Giữ `player-sdk.js` y nguyên và nạp nó trước mọi script khác.
2. `game.json`: đặt `id` MỚI, ổn định, dạng `family.<ten-ngan>` (chữ thường, số, `.`, `_`, `-`); `title` tiếng Việt ngắn (≤ 60 ký tự); `version` bắt đầu `1.0.0`; `playerApiVersion: 1`; `files: []` (packer sẽ điền). Khi sửa một game đã có: **giữ nguyên `id`**, tăng `version`, giữ save tương thích (tăng `saveSchemaVersion` và viết hàm migrate nếu đổi cấu trúc save).
3. Game phải chạy offline bằng chính thư mục của nó: entry `index.html`, có `icon.png` (PNG vuông, ~256–512 px, vẽ thật), tài nguyên local với đường dẫn tương đối. Không CDN, URL ngoài, tracking, quảng cáo, tài khoản, server, Service Worker, Worker, `eval`, iframe, popup, native bridge hay quyền thiết bị. Thư viện (nếu thật cần) phải bundle local, được phép phân phối. Viết cho WebView cũ (Chromium 69 trên Android 8): JS kiểu ES5/ES2017, không `?.`/`??`; CSS không dùng `inset`, `gap` trong flex, `aspect-ratio`, `:is()/:where()/:has()`, `clamp()/min()/max()` (xem `docs/GAME_FORMAT.md` §4).
4. Thiết kế cho trẻ nhỏ: chạm là chính, nút/đối tượng lớn, ít chữ, không cần bàn phím, không có thua căng thẳng; landscape, logical 1280×720 qua `KidsSDK.fitCanvas`/`fitStage`, giữ tỷ lệ, chạy trên phone và tablet. Dùng pointer events, xử lý `pointercancel`, `resize`. Không đặt điều khiển quan trọng sát mép trái (app có dải nút native riêng, nhưng vùng mép vẫn dễ chạm nhầm).
5. Lifecycle: dùng `KidsSDK.loop` (không `setInterval` gameplay); khi `onActiveChange(false)` phải dừng thật, hủy thao tác kéo dở. Mọi âm thanh qua `KidsSDK.audio` (`loadBuffer/playBuffer`, `createAudio/play`, `tone`). Không tự `new Audio()`/`new AudioContext()`. Nếu trình duyệt chặn tự phát, SDK hiện nút “Chạm để chơi”. File âm thanh ngắn phải dài ≥ 0,35 s (đệm im lặng).
6. Lưu checkpoint bằng `KidsSDK.save.write({ saveSchemaVersion: 1, ... })` ở các mốc có ý nghĩa và trong `KidsSDK.onSave`; không ghi mỗi frame, không nhét ảnh/âm thanh vào storage. Có màn bắt đầu, chơi lại và kết thúc/tiến triển rõ ràng.
7. Kiểm thử bằng preview cục bộ có CSP như player: `python tools/preview_game.py my-games/<TenGame> --port <port riêng>` rồi mở URL in ra; thử chơi hết, chạm, đổi kích thước cửa sổ, ẩn/hiện tab (pause), reload (save), tắt mạng, âm thanh và nút “Chạm để chơi”. Không có lỗi trong console. Nếu có Android player/emulator được phép dùng thì test thêm; nếu không, ghi rõ “chưa test trong WebView Android”.
8. Đóng gói: `python tools/pack_game.py --input my-games/<TenGame> --output ready/KidsGames/<TenGame>`; sửa mọi ERROR và các WARNING hợp lý rồi chạy lại cho tới khi `OK`. Không tự viết hash. Chạy thêm `--validate-only` trên thư mục output nếu cần kiểm tra lại.
9. Bàn giao: thư mục `ready/KidsGames/<TenGame>/` (có thể kèm ZIP của thư mục đó), ảnh chụp màn hình nếu đã chụp, và một đoạn hướng dẫn ngắn: “Chép cả thư mục `<TenGame>` vào thư mục KidsGames trên điện thoại; mở app, game tự xuất hiện.” Không build APK mới. Không ghi “đã chạy trên Android” nếu mới thử trên trình duyệt.

---

Ghi chú cho phụ huynh: game mới **không cần APK mới**. Chép cả thư mục game đã đóng gói vào `KidsGames`; nếu chưa thấy, giữ nút Phụ huynh → Làm mới và đọc lỗi.
