# Kids Games Player — Hướng dẫn cho bố mẹ

App Android chạy các trò chơi HTML **có sẵn trong máy**, không cần mạng, không quảng cáo, không tài khoản.
Bé chạm icon để chơi; mọi cài đặt nằm sau nút **Phụ huynh** (giữ 2 giây + PIN 6 số).

## Cài đặt lần đầu (khoảng 5 phút)

1. **Cài APK** `KidsGamesPlayer-v1.1.0.apk` từ file bạn nhận được. Nếu Android hỏi, cho phép cài từ nguồn đó (đây là lựa chọn của chủ máy).
2. **Mở app → Tạo PIN** phụ huynh 6 số (nhập 2 lần). PIN quá dễ đoán như 123456, 000000 sẽ bị từ chối.
3. **Tạo thư mục `KidsGames`** trong bộ nhớ máy (bằng app Files/Tệp), ví dụ `Bộ nhớ trong/KidsGames`. Không chọn gốc bộ nhớ hay thư mục Download — Android không cho.
4. Trong app bấm **Chọn thư mục** → mở `KidsGames` → **Dùng thư mục này** → **Cho phép**. App chỉ xin quyền **đọc**.
5. **Bật Ghim ứng dụng** trong Cài đặt của máy: tìm “Ghim ứng dụng” / “App pinning” / “Pin app” (thường trong Bảo mật). Bật cả “Yêu cầu mã khóa/hình mở khóa trước khi bỏ ghim” nếu máy có. **Thử bỏ ghim một lần** để chắc chắn máy hỏi mã khóa.
6. **Thêm game**: giải nén `KidsGames-samples.zip`, chép **cả thư mục từng game** (ví dụ `BongBong/`) vào `KidsGames` trên điện thoại. Không chỉ chép riêng `index.html`.
7. Quay lại app: game mới tự xuất hiện (trong khoảng 10–20 giây khi đang ở menu). Nếu chưa thấy: giữ **Phụ huynh** → nhập PIN → **Làm mới** và đọc phần “Thư mục chưa nạp được”.
8. **Bắt đầu phiên cho bé**: Phụ huynh → **Bắt đầu phiên cho bé** → xác nhận hộp thoại ghim của Android. App hiện “Android đang ghim ứng dụng.” khi Android thật sự đã ghim.

Muốn thử ngay mà chưa chọn thư mục? Bấm **Thử game mẫu**: app có sẵn 3 game mẫu.

## Giọng đọc tiếng Việt (từ bản 1.1.0)

Nhiều game đọc lời bằng tiếng Việt (giống khi mở bằng Chrome). App dùng **bộ đọc văn bản có sẵn của Android** và chỉ dùng giọng **offline**, nên vẫn không cần mạng khi chơi.

1. Kiểm tra: Phụ huynh → mục **Giọng đọc**. Thấy “Giọng tiếng Việt: có — …” là xong; bấm **Nghe thử** để nghe một câu.
2. Nếu báo “Chưa có giọng tiếng Việt offline”: bấm **Mở cài đặt giọng đọc** → chọn bộ đọc **Speech Services by Google** (Dịch vụ lời nói của Google) → biểu tượng ⚙ → **Cài đặt dữ liệu giọng nói** → **Tiếng Việt** → tải về (cần mạng một lần). Máy chưa có bộ đọc này thì cài “Speech Services by Google” từ cửa hàng ứng dụng.
3. Quay lại app (nhập lại PIN): mục Giọng đọc cập nhật sau vài giây.

Lời đọc **tắt theo nút loa** trong game và dừng ngay khi về menu, ra nền, tắt màn hình, mở khu phụ huynh hoặc hộp “Chơi lại”. Muốn game không đọc lời: tắt **Đọc lời trong game**. Máy không có giọng Việt thì game vẫn chơi được, chỉ là im lặng.

## Khi bé chơi

- Dải nút bên trái: 🏠 về menu · 🔊 bật/tắt tiếng của app (không đổi âm lượng máy) · ↻ chơi lại (có hỏi lại) · 🔒 phụ huynh (giữ 2 giây).
- Nút Back của Android đưa bé về menu, không thoát app.
- Khi app ra nền (khóa màn hình, cuộc gọi…), game dừng và tắt tiếng; quay lại sẽ có nút **Chơi tiếp** (game mở lại từ điểm đã lưu).

## Khu vực phụ huynh

Giữ nút **Phụ huynh** 2 giây → nhập PIN. Ở đây có:
- **Thư mục game**: chọn lại thư mục, **Làm mới** (quét sâu), trạng thái quyền đọc.
- **Game đang có**: phiên bản, mức kiểm tra (đầy đủ/cơ bản), **Ẩn/Hiện**, **Xóa tiến trình** (chỉ game đó bắt đầu lại; nội dung game và thư mục nguồn không bị đụng tới).
- **Âm thanh và hướng màn hình**: bật/tắt tiếng mặc định, xoay ngược 180°.
- **Giọng đọc**: có giọng tiếng Việt chưa, Nghe thử, Mở cài đặt giọng đọc, bật/tắt đọc lời trong game.
- **Bảo vệ phiên**: bắt đầu/kết thúc phiên ghim, đổi PIN.
- **Chẩn đoán**: phiên bản app, WebView, trạng thái ghim, lỗi gần đây (có nút sao chép).

Phiên phụ huynh tự hết sau 3 phút không thao tác hoặc khi app ra nền. Đang ghim thì không mở được trình chọn thư mục/Cài đặt — hãy **Kết thúc phiên** trước.

## Ba điều cần nhớ

1. **Game mới không cần APK mới** — chỉ chép thư mục game đã đóng gói vào `KidsGames`.
2. **Cập nhật game giữ nguyên ID** thì giữ được điểm/màn chơi đã lưu. Bản cập nhật chỉ được dùng khi chép xong đầy đủ; nếu đang chép dở, bé vẫn chơi bản cũ.
3. **Gỡ app hoặc “Xóa dữ liệu” app có thể mất tiến trình** và danh sách game đã nạp (thư mục `KidsGames` không bị app xóa). **Xóa thư mục nguồn không tự xóa bản game đã nạp** — dùng nút **Ẩn**.

## Giới hạn cần biết

- Ghim ứng dụng hạn chế chuyển sang app khác, nhưng **không** chặn được nút nguồn, khởi động lại cưỡng bức, cuộc gọi khẩn cấp hay mọi giao diện riêng của từng hãng.
- PIN của app bảo vệ **cài đặt của app**; mã khóa màn hình bảo vệ **việc bỏ ghim của Android**. Hai mã độc lập.
- Game cần mạng/CDN/máy chủ sẽ không chạy (app không có quyền Internet).
- Toàn màn hình: Android vẫn có thể hiện thanh hệ thống tạm thời khi vuốt từ mép.

## Quên PIN?

Không có PIN “chủ”. Dùng quyền chủ máy: **Cài đặt → Ứng dụng → Kids Games Player → Bộ nhớ → Xóa dữ liệu** (hoặc gỡ và cài lại). Việc này **mất tiến trình chơi và danh sách game đã nạp**; thư mục `KidsGames` vẫn còn nên chỉ cần chọn lại thư mục.

## Cập nhật app

Chỉ cài bản APK mới được **ký bằng cùng khóa** (xem `docs/SIGNING.md`). Cài đè giữ nguyên dữ liệu: từ 1.0.0 lên 1.1.0 chỉ cần mở file `KidsGamesPlayer-v1.1.0.apk` và chọn **Cập nhật** (không gỡ app cũ); PIN, thư mục, game đã nạp, game ẩn và điểm đã lưu vẫn còn. APK ký bằng khóa khác sẽ không cài đè được — đừng gỡ app chỉ để cài bản lạ.

## Tạo game mới bằng AI

Dùng prompt trong `GAME_AUTHORING_PROMPT.md` với Claude Code (hoặc agent tương tự) trên máy tính có mã nguồn này. Agent tự tạo, thử trên trình duyệt (`tools/preview_game.py`) và đóng gói (`tools/pack_game.py`); bạn chỉ chép thư mục kết quả vào `KidsGames`.

## Dành cho người bảo trì

- Build: `scripts\build.ps1` (Windows) hoặc `scripts/build.sh`; cài lên một máy cụ thể: `scripts\install.ps1 -Serial <serial>`; đóng gói bàn giao: `scripts\package_delivery.ps1`.
- Tài liệu: `docs/ARCHITECTURE.md`, `docs/GAME_FORMAT.md`, `docs/DECISIONS.md`, `docs/TOOLCHAIN_LOCK.md`, `docs/SIGNING.md`, `docs/DEVICE_CHECKLIST.md`.
- Kết quả build/kiểm thử thực tế: `BUILD_REPORT.md`.
