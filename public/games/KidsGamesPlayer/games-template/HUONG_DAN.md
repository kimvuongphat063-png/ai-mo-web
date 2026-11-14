# Template game: `MauGame` — “Bim bim cho Shi”

Một game nhỏ **chạy được ngay** (chạm miếng bim bim để đút cho Shi, 10 miếng là xong vòng),
dùng đủ hợp đồng của player: SDK, pause/resume, âm thanh qua registry, lưu checkpoint, canvas
1280×720 giữ tỷ lệ, màn bắt đầu/chơi lại.

```text
MauGame/
  index.html      nạp player-sdk.js TRƯỚC, rồi game.js
  player-sdk.js   SDK chuẩn (không sửa trong game; sửa bản gốc ở đây rồi chạy tools/sync_games.py)
  game.js         gameplay — thay các khối đánh dấu ">>> THAY GAMEPLAY <<<"
  style.css       toàn màn hình, không chọn chữ, không menu nhấn giữ
  game.json       đổi "id", "title", "version" cho game mới
  icon.png        icon vuông
  assets/         ảnh .webp và âm thanh .ogg (≥ 0,35 s)
```

Thử: `python tools/preview_game.py games-template/MauGame` → mở URL in ra.
Đóng gói: `python tools/pack_game.py --input <thư mục game> --output ready/KidsGames/<TenGame>`.
Prompt đầy đủ cho AI: `docs/GAME_AUTHORING_PROMPT.md`.
