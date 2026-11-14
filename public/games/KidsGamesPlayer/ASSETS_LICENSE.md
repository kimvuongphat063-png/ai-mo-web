# Nguồn gốc tài nguyên (assets)

| Tài nguyên | Nguồn | Điều kiện dùng |
| --- | --- | --- |
| Hình Gi & Shi (nhân vật, sticker, nền trời/phòng, bim bim, logo “Gi & Shi's Playground”, ảnh `icon.png` gốc) dùng trong app (`app/src/main/res/drawable-nodpi/*.webp`, icon launcher) và trong game mẫu/template | Bộ ảnh của gia đình do chủ dự án cung cấp trong `assets-src/gishi/` (xem `assets-src/gishi/GENERATION-LOG.md`) | Dùng nội bộ cho app gia đình này. Không phát hành công khai nếu chưa có đồng ý của chủ dự án. |
| Hình khối (`sample-games/GhepMau/assets/shapes/*.svg`), hình con vật (`sample-games/LatThe/assets/animals/*.svg`), icon game được ghép bằng script | Vẽ mới cho dự án này bằng `tools/build_game_assets.py` | Thuộc dự án. |
| Âm thanh `.ogg` (pop, chime, snap, try-again, win, flip, match, crunch, nhạc nền) | Tổng hợp bằng code (`tools/build_game_assets.py`, numpy) rồi mã hóa Vorbis bằng ffmpeg | Thuộc dự án; không dùng mẫu âm thanh bên ngoài. |
| Icon vector trong app (home, loa, chơi lại, khóa, phụ huynh, play, đóng, xóa) | Đường path theo Material Icons | Apache License 2.0 — xem `THIRD_PARTY_NOTICES.md`. |

Không dùng hình/nhạc tải ngẫu nhiên từ Internet.
