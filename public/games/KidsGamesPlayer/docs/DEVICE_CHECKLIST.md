# Checklist trên máy thật của bé (chủ máy tự làm)

Các bước dưới đây cần quyền/xác nhận của chủ máy hoặc chỉ kiểm chứng được trên đúng thiết bị; agent đã thử phần tương đương trên emulator (xem `BUILD_REPORT.md`) nhưng **không thay thế** cho máy thật.

| # | Việc | Kết quả mong đợi | Đạt? |
| --- | --- | --- | --- |
| 1 | Cài `KidsGamesPlayer-v1.1.0.apk` (cho phép nguồn cài nếu Android hỏi). Máy đã có 1.0.0: cài đè, **không gỡ** | App mở; bản cài đè giữ PIN, thư mục, game, điểm | ☐ |
| 2 | Tạo PIN 6 số; thử PIN sai 5 lần | Bị khóa 30 giây, PIN đúng vẫn vào được sau đó | ☐ |
| 3 | Tạo `KidsGames` trong bộ nhớ máy, chọn trong app, “Cho phép” | “Có quyền đọc thư mục.” | ☐ |
| 4 | Tắt hẳn app (vuốt khỏi Recents) và khởi động lại máy, mở lại app | Không hỏi lại quyền; game vẫn còn | ☐ |
| 5 | Chép thư mục game mẫu vào `KidsGames` qua USB/app Files | Game xuất hiện trong menu ≤ 20 s | ☐ |
| 6 | Chơi cả 3 game: có tiếng, chạm/kéo chính xác, không bị cắt hình | Game chơi được trọn vòng | ☐ |
| 7 | Bấm loa (tắt tiếng), mở game, khóa màn hình, nhận cuộc gọi, mở app nhạc khác | Không còn tiếng game khi không ở trong game | ☐ |
| 7b | Trong game giữ nút khóa 2 giây → bàn phím PIN → bấm “Hủy” | Bàn phím đóng, game chơi tiếp; khi bàn phím mở game im lặng | ☐ |
| 8 | Bật “Ghim ứng dụng” + “Yêu cầu mã khóa khi bỏ ghim” trong Cài đặt (đường dẫn tùy hãng) | — | ☐ |
| 9 | Phụ huynh → Bắt đầu phiên cho bé → xác nhận | “Android đang ghim ứng dụng.” | ☐ |
| 10 | Khi đang ghim: thử Home, Recents, vuốt các cạnh, thanh thông báo, trợ lý giọng nói, cửa sổ nổi của hãng | Không rời được app; ghi lại ngoại lệ của hãng | ☐ |
| 11 | Thử cử chỉ bỏ ghim của máy | Máy đòi mã khóa màn hình trước khi ra ngoài | ☐ |
| 12 | Giữ Phụ huynh → PIN → Kết thúc phiên | Hết ghim; nếu vẫn ghim, dùng cử chỉ bỏ ghim | ☐ |
| 13 | Xoay máy 180°, bật “Xoay ngược màn hình 180°” | Hướng ngang giữ đúng lựa chọn | ☐ |
| 14 | Cỡ chữ hệ thống lớn nhất, chế độ điều hướng cử chỉ và 3 nút | Nút Phụ huynh và nút trong game vẫn bấm được | ☐ |
| 15 | Tablet/máy gập (nếu có): gập/mở, chia đôi màn hình | Không crash, không mất tiến trình | ☐ |
| 16 | Chế độ máy bay | Mọi game đã chép vẫn chơi đủ hình/tiếng | ☐ |
| 17 | Cập nhật một game (chép đè bản mới cùng ID) trong lúc bé đang chơi | Phiên hiện tại không đổi; lần mở sau dùng bản mới, điểm còn | ☐ |
| 18 | Cài đè APK mới cùng khóa (khi có bản cập nhật) | Không mất game/tiến trình | ☐ |
| 19 | **Giọng tiếng Việt (1.1.0)**: Phụ huynh → **Mở cài đặt giọng đọc** (hoặc Cài đặt máy → tìm “văn bản thành giọng nói” / “Text-to-speech”) → bộ đọc ưu tiên: **Speech Services by Google** (Dịch vụ lời nói của Google) → ⚙ → **Cài đặt dữ liệu giọng nói** (Install voice data) → **Tiếng Việt** → tải về. Cần mạng một lần để tải; app vẫn không dùng mạng. Nếu máy chưa có bộ đọc của Google: cài “Speech Services by Google” từ cửa hàng ứng dụng | Tiếng Việt hiện “đã cài” | ☐ |
| 20 | Phụ huynh → mục **Giọng đọc** | “Giọng tiếng Việt: có — Tiếng Việt (Việt Nam) · …”; bấm **Nghe thử** nghe “Xin chào! Bé cùng chơi nhé.” | ☐ |
| 21 | Chơi “Ai Sống Ở Đâu”, “Bác Sĩ Thú Nhí”, “Máy Kể Chuyện” (và vài game khác trong thư mục `games/` của repo) | Nghe lời đọc tiếng Việt như khi mở bằng Chrome; chữ được tô theo lời đọc ở “Máy Kể Chuyện” (nếu engine hỗ trợ) | ☐ |
| 22 | Đang đọc thì bấm loa (tắt tiếng), rồi bật lại | Lời đọc dừng ngay; game vẫn chạy tiếp; bật lại thì câu sau có tiếng | ☐ |
| 23 | Đang đọc thì: nút Home, tắt màn hình, giữ nút khóa (bàn phím PIN), nút ↻ (hộp chơi lại), cuộc gọi đến | Không còn tiếng đọc trong suốt lúc đó | ☐ |
| 24 | Tắt “Đọc lời trong game” trong khu phụ huynh, mở game | Game chơi bình thường, không đọc | ☐ |
| 25 | Chế độ máy bay + giọng Việt đã cài | Vẫn đọc được (giọng offline) | ☐ |
| 26 | Máy chưa có giọng Việt (hoặc tắt bộ đọc) | Game vẫn chơi được, im lặng như bản 1.0.0, không treo | ☐ |

Mẹo tìm cài đặt ghim: mở Cài đặt, gõ “ghim” hoặc “pin”. Mỗi hãng đặt ở chỗ khác nhau (Bảo mật / Cài đặt bảo mật khác / Sinh trắc học và bảo mật).
