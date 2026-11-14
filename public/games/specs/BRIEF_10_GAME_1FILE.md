# Brief: 10 game HTML một file cho Kids Games Player (bé 4–7 tuổi)

## 0. Cách dùng file này

Mở Claude Code **tại thư mục gốc của repo** (thư mục chứa `KidsGamesPlayer/`; ảnh gốc `assets-src-gishi/` không có trong repo), rồi gõ:

> Đọc `BRIEF_10_GAME_1FILE.md` và làm từ đầu đến cuối. Không hỏi lại các quyết định kỹ thuật thông thường; ghi lựa chọn vào báo cáo.

Agent tự làm toàn bộ: code, hình, âm thanh, icon, kiểm thử, báo cáo. Không cần mạng. Không sửa gì bên trong `KidsGamesPlayer/` (chỉ đọc và chạy công cụ trong đó).

---

## 1. Kết quả phải giao

```text
KidsGames-1file/
  README.md            hướng dẫn cho phụ huynh (tiếng Việt, ngắn)
  TEST_REPORT.md       kết quả kiểm thử từng game (trung thực, PASS/FAIL/NOT_RUN)
  ToNet/        index.html  game.json  icon.png
  ToChu/        index.html  game.json  icon.png
  ToSo/         index.html  game.json  icon.png
  PopIt/        index.html  game.json  icon.png
  BongBongMau/  index.html  game.json  icon.png
  ToMau/        index.html  game.json  icon.png
  NoiDiem/      index.html  game.json  icon.png
  GhepBong/     index.html  game.json  icon.png
  XepHinh/      index.html  game.json  icon.png
  DanGo/        index.html  game.json  icon.png
  _src/ _tools/        (tùy chọn) nguồn tách file và script gộp — KHÔNG đưa vào ZIP
KidsGames-1file.zip    chỉ chứa 10 thư mục game (để chép thẳng vào thư mục KidsGames trên điện thoại)
```

- **`index.html` là toàn bộ game**: CSS, JS, SDK, hình (SVG hoặc `data:` base64) đều nằm trong file. Chỉ cần file này là chạy được.
- `game.json` (tối giản, **không có `files`**) để app hiện tên tiếng Việt và giữ điểm khi cập nhật:

  ```json
  {"schemaVersion": 1, "id": "family.to-net", "title": "Tô nét", "version": "1.0.0",
   "playerApiVersion": 1, "backgroundColor": "#FFF4D6", "sortOrder": 110}
  ```
  `id` cố định mãi về sau (đổi `id` = mất điểm đã lưu). Khi sửa game: giữ `id`, tăng `version`.
- `icon.png`: PNG vuông 256×256, vẽ thật (nền bo góc màu chủ đạo + biểu tượng lớn + có thể thêm Gi/Shi nhỏ), không chữ dài.

---

## 2. Đọc trước (bắt buộc)

1. `KidsGamesPlayer/docs/GAME_FORMAT.md` — §4 môi trường chạy (CSP, cái bị chặn, WebView cũ), §5 SDK, §6 lưu tiến trình.
2. `KidsGamesPlayer/games-template/MauGame/` — `index.html`, `game.js`, `style.css`: mẫu dùng SDK đúng cách.
3. `KidsGamesPlayer/games-template/MauGame/player-sdk.js` — **SDK chuẩn**, sẽ nhúng nguyên văn.
4. Tham khảo: `KidsGamesPlayer/sample-games/BongBong/` (canvas + Web Audio), `sample-games/LatThe/` (DOM + lưu checkpoint), `sample-games/GhepMau/` (kéo-thả).

---

## 3. Luật kỹ thuật (bắt buộc — app sẽ chặn hoặc game sẽ hỏng nếu vi phạm)

### 3.1 Một file, offline
- Không URL ngoài, CDN, Google Fonts, analytics, quảng cáo, liên kết ra ngoài, form. App **không có mạng**.
- Không `fetch()`/`XMLHttpRequest` — kể cả `fetch('data:...')` (CSP `connect-src 'self'` chặn `data:`). Dữ liệu (màn chơi, nét chữ, đường đi) để thẳng trong JS.
- Hình: SVG viết tay trong code, hoặc `data:image/webp;base64,...` / `data:image/png;base64,...` cho ảnh Gi & Shi. Font: chỉ font hệ thống (`font-family: system-ui, Roboto, "Segoe UI", sans-serif`), không nhúng font; chữ tiếng Việt phải hiển thị đúng dấu.

### 3.2 SDK nhúng inline
- Thẻ `<script>` **đầu tiên** trong `<head>`: dán **nguyên văn** nội dung `player-sdk.js`, bọc bằng dòng chú thích `/* KIDS-SDK v1 BEGIN */` … `/* KIDS-SDK v1 END */` (để sau này thay SDK bằng script). Không sửa SDK.
- Trong app, SDK khởi đầu **inactive + muted** cho tới khi app gửi trạng thái. Game không được phát tiếng, chạy đồng hồ hay hoạt ảnh gameplay khi `KidsSDK.isActive()` là `false`.
  - `KidsSDK.onActiveChange(function (active, reason) {...})`: dừng/tiếp tục, hủy thao tác kéo dở, lưu.
  - `KidsSDK.loop(update, render)`: vòng lặp chuẩn (`update(dt)` không chạy khi inactive, `dt ≤ 0,05 s`).
  - `KidsSDK.fitCanvas(canvas, 1280, 720)` (canvas) hoặc `KidsSDK.fitStage(el, 1280, 720)` (DOM): khung logic 1280×720, giữ tỷ lệ. Với canvas dùng `view.toLogical(clientX, clientY)` để đổi tọa độ chạm.
- Mở trong trình duyệt thường (preview), SDK ở chế độ `standalone` và active ngay — dùng để kiểm thử.

### 3.3 Âm thanh (không file âm thanh)
- Tổng hợp bằng Web Audio: `KidsSDK.audio.tone(freq, giây, {type, volume, slideTo})` hoặc tự dựng node nối vào `KidsSDK.audio.output()`. Lấy context bằng `KidsSDK.audio.context()`; không tự `new AudioContext()` / `new Audio()`.
- Tạo/đánh thức âm thanh trong lần chạm đầu tiên (gọi `KidsSDK.audio.context()` trong handler `pointerdown`). Nếu WebView chặn tự phát, SDK tự hiện nút “Chạm để chơi”.
- Âm lượng vừa phải (volume ≤ 0,25), không tiếng to đột ngột, không nhạc nền liên tục quá 1 phút (cho phép tắt bằng nút loa của app).
- Không dùng `speechSynthesis` (giọng đọc không có sẵn/không ổn định khi offline) — mọi chỉ dẫn phải hiểu được bằng hình.

### 3.4 Lưu tiến trình
- Chỉ qua `KidsSDK.save.write({ saveSchemaVersion: 1, ... })` / `KidsSDK.save.read(1)`. Object nhỏ (≤ vài chục KB). Ghi ở mốc có ý nghĩa (xong màn, xong hình) và trong `KidsSDK.onSave`, không ghi mỗi khung hình. Không lưu ảnh/canvas dạng dataURL.

### 3.5 Tương thích WebView cũ (Chromium 69 — Android 8 chưa cập nhật)
- JS: được ES2017 (`let/const`, arrow, class không có field, template string, async/await). **Không**: `?.`, `??`, class fields (`x = 1;` trong class), `replaceAll`, `.at()`, `Promise.allSettled/any`, `globalThis`, `structuredClone`, `Object.fromEntries`, top-level `await`, ES modules.
- Canvas: **không `ctx.roundRect`** (Chrome 99) — tự viết hàm bo góc bằng `arcTo`. `Path2D`, `ellipse`, gradient, `globalCompositeOperation`, `getImageData` dùng được.
- CSS: **không** `inset`, `gap` trong flex (dùng margin), `aspect-ratio`, `:is()/:where()/:has()`, `clamp()/min()/max()`, `dvh/svh`, `backdrop-filter`. Dùng `top/right/bottom/left`, px, `%`, `vw/vh`.
- Sự kiện: pointer events (`pointerdown/move/up/cancel`), `touch-action: none` trên vùng chơi, `preventDefault`. Không dựa vào hover, chuột phải, bàn phím, nhấn giữ, chạm đúp.

### 3.6 Bị chặn trong app (đừng dùng)
`alert/confirm/prompt`, `window.open`, popup, iframe, `eval`, `new Function`, Worker, Service Worker, camera/micro/vị trí, tải file, chọn file, điều hướng sang trang khác. `localStorage` trực tiếp thì được nhưng hãy dùng `KidsSDK.save`.

### 3.7 Kích thước
- `index.html` ≤ 1,5 MB (cứng: ≤ 2 MB). Ảnh nhúng: WebP q75–80, chỉ độ phân giải cần thiết. Khởi động < 2 s trên máy yếu: không giải mã ảnh to không cần thiết lúc đầu.

---

## 4. Thiết kế cho bé 4–7 tuổi (bắt buộc)

- **Không cần biết đọc**: chỉ dẫn bằng hình, mũi tên, bàn tay gợi ý chuyển động, hoạt ảnh. Chữ tiếng Việt (nếu có) ngắn, có dấu đúng, cỡ lớn.
- **Mục tiêu chạm to**: ≥ 110 px logic (trên 1280×720). Khoảng cách giữa các nút ≥ 24 px.
- **Không thua, không phạt, không đồng hồ đếm ngược**. Sai → phản hồi nhẹ (lắc nhẹ, tiếng trầm ngắn), cho thử lại ngay. Đúng → phản hồi tức thì, rõ, vui (sao, lấp lánh, Gi/Shi cổ vũ, nốt nhạc).
- **Gợi ý tự động**: bé không chạm gì 4–5 giây → bàn tay/ánh sáng chỉ việc cần làm.
- **Vòng chơi ngắn** (1–3 phút/màn), có chấm tiến trình, màn hình chọn màn dạng lưới ô lớn có sao ở ô đã xong. Không khóa màn bắt buộc (bé được chọn tự do), chỉ gợi ý thứ tự.
- **Màn bắt đầu**: tên game + nút Chơi tròn lớn (▶). **Màn kết thúc**: chúc mừng + nút chơi lại (↻) + nút sang màn sau (→). Không có nút “thoát” (app đã có nút nhà).
- Màu dịu, tương phản đủ; không chỉ phân biệt bằng màu (thêm hình/hoa văn). Không nhấp nháy > 3 lần/giây.
- Không nhân vật/ thương hiệu có bản quyền (Elsa, Peppa, Pokémon…). Nhân vật chính là **Gi & Shi** (mục 5).
- Không đặt nút quan trọng sát mép màn hình (≤ 40 px).

---

## 5. Nhân vật Gi & Shi và tài nguyên có sẵn

- Ảnh nhân vật đã xử lý (nền trong, nhỏ, dùng thẳng): `KidsGamesPlayer/app/src/main/res/drawable-nodpi/`
  `mascot_gi_wave.webp`, `mascot_gi_think.webp`, `mascot_shi_wave.webp`, `mascot_shi_puzzled.webp`, `mascot_shi_sparkle.webp`, `mascot_both_wave.webp`, `mascot_both_highfive.webp` (20–55 KB mỗi ảnh).
- Ảnh gốc (PNG lớn, cần thu nhỏ trước khi nhúng): `assets-src-gishi/`
  - Tư thế: `gi-cheer, gi-clap, gi-point-left/right, gi-think, gi-wave, shi-cheer, shi-clap, shi-munch, shi-puzzled, shi-sparkle, shi-wave…` (1024×1536, nền trong).
  - **Tranh nét để tô màu**: `coloring-01..06.png` (1254×1254, nét đen nền trắng: Gi vẫy tay, Shi ôm gói bim bim, hai bạn nắm tay, Shi với cún, Gi cầm bóng bay, hai bạn che ô).
  - **Tranh màu**: `scene-01..06.png` (1254×1254: dã ngoại ăn bim bim, xây lâu đài cát, thả diều, nông trại bò–heo, đọc sách, ô tô đồ chơi).
  - Phụ kiện/đạo cụ: `acc-*.png`, `prop-*.png`; nền `bg-sky.png`, `bg-hub.png`.
- Thu nhỏ bằng Python + Pillow (có sẵn): ví dụ nhân vật cao ≤ 360 px, WebP q80; tranh xếp hình ≤ 720 px; tranh tô màu xem game 6. Viết script nhỏ trong `KidsGames-1file/_tools/` để xuất chuỗi `data:` base64.
- Mỗi game dùng 1–4 ảnh Gi/Shi (cổ vũ, chỉ hướng, ăn mừng). Không vẽ lại khuôn mặt nhân vật bằng code.

---

## 6. Mười game

Thứ tự ưu tiên: tô nét (1–3) → pop (4–5) → còn lại. Làm xong, kiểm thử xong game nào rồi mới sang game sau.

### 6.1 `ToNet` — “Tô nét” · `family.to-net` · nền `#FFF4D6` · sortOrder 110
- **Học**: kiểm soát nét trước khi viết chữ.
- **Chơi**: kéo ngón tay theo đường chấm từ điểm xuất phát (chấm xanh có mũi tên) tới đích. Mỗi đường là một chuyện nhỏ: dẫn ong tới hoa, ô tô về nhà, cá về rong, máy bay tới mây, sâu tới quả táo…; vật đi theo tiến độ của ngón tay.
- **Màn (12)**: ngang → dọc → chéo → zigzag → sóng → cung → vòng tròn → xoắn ốc → vòng lặp nối nhau → hình vuông → tam giác → mê cung đơn giản (2–3 ngã rẽ; đi vào ngõ cụt thì vật tự lùi về, không phạt).
- **Phản hồi**: nét màu sáp đi theo tay; tới đích: sao + tiếng “ting” + Gi/Shi vỗ tay.
- **Lưu**: các màn đã xong.

### 6.2 `ToChu` — “Tô chữ cái” · `family.to-chu` · nền `#E7F4FF` · sortOrder 120
- **Học**: hình dạng và thứ tự nét 29 chữ cái tiếng Việt, kiểu **chữ in** (như sách mẫu giáo), không phải chữ viết tay nối nét.
- **Bảng chữ**: `A Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y` — lưới 29 ô lớn, ô đã tô có sao. Có công tắc **IN HOA / thường** (hai thẻ “A” và “a”); làm chữ in hoa trước, chữ thường làm sau nếu còn thời gian (ghi rõ trong báo cáo).
- **Tô**: từng nét theo thứ tự, có số nét + mũi tên hướng; dấu phụ (˘ của Ă, ^ của Â/Ê/Ô, móc của Ơ/Ư, gạch của Đ) là nét riêng, tô sau phần chính. Kỹ thuật ở mục 7.
- **Xong chữ**: chữ nảy lên, lấp lánh, Gi/Shi cổ vũ. Hình minh họa kèm từ (vd. “B – bóng”, “C – cá”, “G – gà”, “M – mèo”) là **tùy chọn**: chỉ thêm khi từ đúng chính tả, quen với bé và hình SVG rõ ràng; không chắc thì bỏ.
- **Lưu**: các chữ đã tô (theo kiểu hoa/thường).

### 6.3 `ToSo` — “Tô số và đếm” · `family.to-so` · nền `#EAF8E6` · sortOrder 130
- **Học**: viết số 0–9 và hiểu lượng.
- **Phần 1 – tô số**: tô số n (cùng kỹ thuật mục 7). Xong → xuất hiện n đồ vật (táo, sao, cá, bánh…); bé chạm từng cái để đếm: mỗi lần chạm vật nảy lên, số 1…n hiện to, nốt nhạc cao dần. Đếm đủ → sao.
- **Phần 2 – chọn số đúng** (gợi ý mở sau khi xong 0–5, nhưng không khóa): hiện k vật (1–10), chọn 1 trong 3 thẻ số lớn. Sai → thẻ lắc nhẹ, chọn lại.
- **Lưu**: số đã tô, số câu phần 2 đã làm đúng.

### 6.4 `PopIt` — “Pop-it” · `family.pop-it` · nền `#FDE8F0` · sortOrder 140
- **Chơi**: bảng pop-it silicon (canvas). Chạm hoặc **vuốt qua** bóng → bóng lõm xuống + tiếng “pụp”. Hỗ trợ **nhiều ngón cùng lúc**. Bấm hết → bảng lật (hoạt ảnh lật), mọi bóng nổi lên lại ở mặt kia, được 1 sao.
- **Bảng (≥ 8)**: tròn, tim, sao, vuông, khủng long, kem ốc quế, cá, mặt Gi/Shi đơn giản (khung tròn, hai tai/bím tóc). Bóng xếp theo hàng màu cầu vồng.
- **Vẽ**: bóng có gradient + vệt sáng (nổi 3D); khi lõm thì đảo gradient + bóng đổ bên trong. Khung silicon có viền dày bo tròn.
- **Âm**: tiếng pop tổng hợp (nhiễu ngắn ~30 ms + sine trượt 300→120 Hz ~60 ms), cao độ ngẫu nhiên ±10%.
- **Tùy chọn**: chế độ đếm (mỗi lần pop hiện số nhỏ bay lên).
- **Lưu**: số lần lật mỗi bảng.

### 6.5 `BongBongMau` — “Bắt bóng đúng màu” · `family.bong-bong-mau` · nền `#DDF3FF` · sortOrder 150
- **Học**: nhận biết màu → hình → số.
- **Chơi**: bong bóng xà phòng bay chậm lên (≤ 6 bóng cùng lúc, đường kính ≥ 110 px). Góc trên có **ô mục tiêu** lớn. Chạm bóng đúng → vỡ lấp lánh, thanh 10 nấc tiến 1; chạm bóng sai → bóng nảy nhẹ, tiếng trầm ngắn, không trừ. Đủ 10 → đổi mục tiêu, Gi/Shi ăn mừng.
- **Cấp**: 1 – màu (mỗi màu kèm hoa văn riêng: đỏ–tim, xanh dương–sao, vàng–tròn, xanh lá–lá…); 2 – hình (tròn/vuông/tam giác/sao vẽ trong bóng); 3 – số 1–5 trong bóng.
- **Lưu**: cấp và mục tiêu đã hoàn thành.

### 6.6 `ToMau` — “Tô màu Gi & Shi” · `family.to-mau` · nền `#FFFFFF` · sortOrder 160
- **Tranh**: 6 tranh `assets-src-gishi/coloring-01..06.png`. Chuẩn bị: thu về cạnh dài ~1000 px, ngưỡng hóa thành nét đen thuần, làm dày nét 1 px để bịt khe hở, lưu PNG bảng màu 1–2 bit (mục tiêu 40–120 KB/tranh) → base64. Nếu tổng file quá 1,5 MB thì chỉ nhúng 4 tranh và ghi lại.
- **Chơi**: chọn tranh (lưới ảnh nhỏ) → bảng màu 12 ô tròn lớn + nút tẩy + nút hoàn tác (↶). Chế độ chính **đổ màu**: chạm một vùng → tô kín vùng đó (flood fill dạng scanline trên `Uint32Array`, biên là lớp nét đen, không tràn ra ngoài). Chế độ phụ **bút sáp** (vẽ tự do nét dày, không đè lên lớp nét) là tùy chọn.
- **Xong**: nút “xong” (✓) → khung ảnh, Gi/Shi vỗ tay.
- **Lưu**: không lưu ảnh; lưu **danh sách thao tác** `[x, y, màu]` cho từng tranh rồi phát lại khi mở (nhỏ, bền).
- **Hiệu năng**: một lần đổ màu < 150 ms trên máy yếu; nếu chậm, giảm độ phân giải tranh.

### 6.7 `NoiDiem` — “Nối các điểm” · `family.noi-diem` · nền `#F3ECFF` · sortOrder 170
- **Học**: thứ tự số, phối hợp tay–mắt.
- **Chơi**: các chấm đánh số to; kéo tay từ 1 → 2 → 3… (hoặc chạm lần lượt). Chấm kế tiếp phát sáng nhẹ. Nối xong → hình hiện màu đầy đủ (SVG) và chuyển động (cá bơi, bướm vỗ cánh, tên lửa bay…).
- **Hình (≥ 12)**: sao (5 chấm), nhà (6), cá (8), thuyền (8), cây thông (9), bướm (10), mèo (12), ô tô (12), máy bay (12), khủng long (15), tên lửa (15), trái tim lớn (20). Bắt đầu bằng hình ít chấm.
- **Lưu**: hình đã hoàn thành.

### 6.8 `GhepBong` — “Tìm bóng” · `family.ghep-bong` · nền `#FFF0E0` · sortOrder 180
- **Học**: quan sát hình dạng.
- **Chơi**: hàng dưới là đồ vật có màu, hàng trên là các bóng đen (silhouette). Kéo vật vào đúng bóng → hút vào, bóng hóa màu, tiếng “tách”. Sai → vật trượt về chỗ cũ.
- **Chủ đề**: con vật, trái cây, phương tiện, đồ chơi — hình SVG viết tay; bóng = cùng path tô màu tối.
- **Cấp**: 2 → 3 → 4 → 5 vật; cấp cao có bóng gần giống nhau (mèo/chó, cam/táo).
- **Lưu**: chủ đề và cấp đã xong.

### 6.9 `XepHinh` — “Xếp hình Gi & Shi” · `family.xep-hinh` · nền `#E6F7F1` · sortOrder 190
- **Tranh**: `assets-src-gishi/scene-01..06.png`, thu về ~720 px, WebP q78 (≈ 50–90 KB/tranh).
- **Chơi**: chọn tranh → các mảnh xáo trộn ở hai bên; khung giữa có ảnh mờ gợi ý (độ mờ 25%). Kéo mảnh về đúng ô → hút vào trong bán kính ~60 px. Xong → ảnh đầy đủ + hoa giấy + Gi/Shi.
- **Cấp**: 2×2 (4 mảnh) → 3×2 (6) → 3×3 (9). Mảnh chữ nhật bo góc; mảnh răng cưa chỉ làm khi chắc chắn mượt trên máy yếu.
- **Lưu**: tranh + cấp đã xong.

### 6.10 `DanGo` — “Đàn gõ cầu vồng” · `family.dan-go` · nền `#FFF8E7` · sortOrder 200
- **Chơi tự do**: 8 phím xylophone cầu vồng (Đô Rê Mi Pha Son La Si Đô) to, xếp xòe. Chạm phím → nốt nhạc (tổng hợp kiểu xylophone: sine + họa âm tắt nhanh), phím rung, nốt nhạc bay lên, Gi/Shi nhún theo. Hỗ trợ nhiều ngón.
- **Chơi theo đèn**: phím sáng lần lượt theo giai điệu; bé chạm phím đang sáng để đi tiếp; chạm phím khác vẫn kêu, đèn chờ (không phạt). Chỉ dùng **giai điệu dân gian đã thuộc phạm vi công cộng** (vd. “Twinkle Twinkle Little Star”, “Frère Jacques”), không hiện lời bài hát.
- **Lưu**: bài đã chơi xong.

### Dự phòng (nếu một game trên quá khó làm tốt)
- “Cào tranh”: lau lớp sương/bụi bằng ngón tay để lộ tranh `scene-0x`.
- “Cho Shi ăn theo số”: kéo đúng n miếng bim bim vào miệng Shi.
Ghi rõ trong báo cáo nếu thay game.

---

## 7. Kỹ thuật tô nét (dùng chung cho ToNet, ToChu, ToSo)

- **Dữ liệu**: mỗi hình = danh sách **nét**; mỗi nét = đường gấp khúc trong hệ tọa độ hộp chuẩn (vd. chữ 100×140). Đường cong viết bằng cung/Bezier rồi **rải lại điểm đều ~2 đơn vị**. Dấu phụ là nét riêng.
- **Vẽ hướng dẫn**: đường dày màu xám nhạt bo tròn (rộng ~16–18% chiều cao chữ) + đường chấm ở giữa; chấm bắt đầu màu xanh có số thứ tự nét và mũi tên hướng; nét đang làm nổi bật, nét chưa tới mờ hơn.
- **Theo dõi**: chỉ theo **một** ngón (pointerId đầu tiên). Với nét hiện tại, tìm điểm gần nhất trong cửa sổ `[tiến độ − 5, tiến độ + 20]` (tránh nhảy cóc ở chữ O, số 8). Nếu khoảng cách ≤ dung sai → tiến độ = max(tiến độ, chỉ số đó). Phần đã đi tô màu sáp sáng.
  - Dung sai mặc định ≈ 12% chiều cao chữ trên màn hình (tối thiểu 30 px logic) — rộng rãi cho bé 4 tuổi.
  - Nét xong khi tiến độ ≥ 95% → nét “hít” thẳng hàng, tiếng “ting”, chấm bắt đầu của nét sau nhảy nhẹ.
- **Nhấc tay giữa chừng**: giữ tiến độ; đặt lại tay gần điểm đang dừng (≤ 1,5× dung sai) để đi tiếp.
- **Đi lệch**: không vẽ nét đậm ngoài đường (chỉ vệt mờ biến mất), không âm thanh lỗi. Đứng yên 4 s → bàn tay gợi ý chạy dọc nét.
- **Thứ tự nét**: theo cách dạy chữ in ở mẫu giáo/lớp 1 Việt Nam (từ trên xuống, từ trái sang phải; chữ có thân tròn bắt đầu từ phía trên bên phải đi ngược chiều kim đồng hồ). Tự kiểm bằng chế độ xem nhanh (mục dưới).
- **Chế độ kiểm tra**: mở `index.html#debug` (chỉ để kiểm thử) → hiển thị lưới **tất cả** chữ/số/đường với số nét, mũi tên, điểm đầu–cuối. Chụp màn hình chế độ này, tự xem từng ký tự, sửa ký tự sai hình hoặc sai thứ tự. Ghi vào báo cáo.

---

## 8. Quy trình làm và kiểm thử

1. Viết công cụ nhỏ trong `KidsGames-1file/_tools/` (Python + Pillow): thu nhỏ/nhúng ảnh base64; (khuyên dùng) gộp nguồn tách file trong `_src/<Game>/` + SDK thành một `index.html`; tạo `icon.png`.
2. Mỗi game:
   1. Viết game, gộp ra `KidsGames-1file/<Game>/index.html`, tạo `game.json`, `icon.png`.
   2. **Xem thử có CSP giống app**:
      `python KidsGamesPlayer/tools/preview_game.py KidsGames-1file/<Game> --port 8771` rồi mở URL in ra. Nếu phiên có công cụ trình duyệt: mở ở cỡ 1280×720, 800×360 và 2400×1080; chơi hết ít nhất 2 màn bằng thao tác chạm/kéo thật (pointer), xem console **không có lỗi**, chụp ảnh màn hình lưu vào `KidsGames-1file/_screens/` (không đưa vào ZIP).
   3. Kiểm tra tạm dừng: ẩn/hiện tab (visibilitychange) → game dừng, tiếng tắt, quay lại chơi tiếp đúng chỗ. Tải lại trang → tiến trình đã lưu còn.
   4. **Lint**: `python KidsGamesPlayer/tools/pack_game.py --input KidsGames-1file/<Game> --validate-only`
      - Lỗi duy nhất được chấp nhận: `playerApiVersion is 1 but index.html does not load player-sdk.js` (vì SDK nhúng inline — app không yêu cầu file riêng).
      - Không được còn cảnh báo `old WebView`. Cảnh báo “remote URL” chỉ chấp nhận cho `http://www.w3.org/2000/svg` (namespace SVG).
   5. **Tìm chuỗi cấm** trong `index.html` (ngoài khối SDK): `https://`, `alert(`, `confirm(`, `prompt(`, `eval(`, `new Function`, `fetch(`, `XMLHttpRequest`, `?.`, `??`, `inset:`, `roundRect`, `speechSynthesis`, `new Audio(`, `new AudioContext`.
   6. Kích thước file ≤ 1,5 MB.
3. Nếu máy có Android emulator và app Kids Games Player (vd. AVD `kgp_api26` WebView 69, `kgp_api37`) và được phép dùng: chép game vào thư mục `KidsGames` của emulator, chọn thư mục trong app, chơi thử. Nếu không: ghi **NOT_RUN** — không viết “đã chạy trên Android”.
4. Đóng gói `KidsGames-1file.zip` chỉ gồm 10 thư mục game (không `_src`, `_tools`, `_screens`, báo cáo).

---

## 9. Tiêu chí nghiệm thu (mỗi game)

- [ ] Chỉ cần `index.html` là chạy; không yêu cầu mạng; mở bằng preview không lỗi console.
- [ ] Màn bắt đầu → chơi → hoàn thành màn → màn sau / chơi lại: chạy trọn không kẹt.
- [ ] Chạm/kéo chính xác ở cả 3 kích thước màn hình; không có thao tác cần độ chính xác quá cao với bé 4 tuổi.
- [ ] Không phát tiếng/không chạy gameplay khi SDK inactive; ẩn tab thì dừng, hiện lại thì tiếp.
- [ ] Lưu và khôi phục tiến trình qua `KidsSDK.save`.
- [ ] Lint đạt như mục 8; không chuỗi cấm; ≤ 1,5 MB.
- [ ] Gi & Shi xuất hiện hợp lý; hình đẹp, không vỡ, không bị cắt ở mép.
- [ ] `game.json` đúng mẫu, `id` không trùng game khác (đã có: `family.balloon-pop`, `family.color-match`, `family.animal-memory`, `family.template-bimbim`).

---

## 10. Báo cáo cuối

- `KidsGames-1file/README.md` (cho phụ huynh): danh sách 10 game, mỗi game 1 dòng mô tả + lứa tuổi gợi ý; cách cài: “Chép cả thư mục game (vd. `ToChu`) vào thư mục `KidsGames` trên điện thoại; mở app, game tự xuất hiện trong ~20 giây hoặc giữ nút Phụ huynh → Làm mới.”
- `KidsGames-1file/TEST_REPORT.md`: bảng game × (preview, console sạch, chơi trọn, 3 cỡ màn hình, tạm dừng, lưu/khôi phục, lint, kích thước, Android) với PASS/FAIL/NOT_RUN + ghi chú; danh sách lựa chọn kỹ thuật, game thay thế (nếu có), phần chưa làm (vd. chữ thường), lỗi còn biết.
- Trả lời cuối phiên: đường dẫn ZIP, bảng kết quả rút gọn, những gì cần phụ huynh tự thử trên máy thật.
