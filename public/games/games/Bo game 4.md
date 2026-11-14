# Bộ game 4 — 10 game HTML mới cho bé 5–7 tuổi

> Hãy đọc toàn bộ file này rồi bắt đầu làm ngay, không cần hỏi lại. Nếu có chỗ chưa rõ, hãy tự quyết định hợp lý nhất cho trẻ 5–7 tuổi và ghi vào báo cáo cuối.

## 1. Yêu cầu gốc

"Tôi muốn bạn làm cho tôi mười game khác nhau dành cho bé từ 5 - 7 tuổi, mỗi game chạy trên 1 html.. Làm cho đẹp và dễ dùng, tập trung vào game cho bé, có thể chơi đi chơi lại nhiều lần, design cute, gameplay smooth, đa dạng.. Làm thật tốt vào, dùng nhiều token và lặp lại cho đến khi bạn tự hào về nó. Thấy gì làm nó hay hơn thì cứ thêm, bạn tự quyết. Nhắm tới những thứ hay nhất cùng loại mà bạn từng thấy, nhưng tốt hơn. Trước khi nói xong, tự thử như một người dùng thật, rồi cho tôi biết bạn đã kiểm gì và chưa kiểm được gì."

Mỗi game ở trong 1 subfolder, subfolder mang tên game, file html tên `index.html`, và một file ảnh icon `icon.png` của game đó. Bạn không cần tham khảo làm theo style game nào trước đây, lần này bạn tự quyết — nhưng **phải làm đúng 10 game trong mục 3** và tuân thủ các tiêu chuẩn ở mục 4–6.

## 2. Bối cảnh — những game ĐÃ CÓ hoặc đang được làm ở nơi khác (KHÔNG làm trùng, không đặt tên trùng, không sửa/xóa thư mục của chúng)

Thư mục làm việc có thể đã chứa 10 game đầu tiên (chỉ tạo thêm 10 thư mục của bộ này; nếu muốn, có thể mở `Lat The Tri Nho/index.html` để xem quy ước giao diện chung, nhưng không sao chép nội dung):
- `Lat The Tri Nho` — Lật Thẻ Trí Nhớ — lật thẻ tìm cặp giống nhau, 2 bé chơi, sưu tập sticker
- `Quai Vat An Banh` — Quái Vật Ăn Bánh — đếm 1–10, phép cộng/trừ bằng cách cho quái vật ăn
- `Bong Bong Bay` — Bong Bóng Bay — bắn bóng bay có chữ cái / số / màu / hình đúng yêu cầu
- `Be Tap Danh Van` — Bé Tập Đánh Vần — ghép các chữ cái thành từ theo hình
- `To Mau Ky Dieu` — Tô Màu Kỳ Diệu — sách tô màu (đổ màu vùng, bút sáp, hình dán, đũa thần)
- `Me Cung Tho Con` — Mê Cung Thỏ Con — kéo nhân vật đi qua mê cung sinh ngẫu nhiên
- `Dan Cau Vong` — Đàn Cầu Vồng — đàn mộc cầm 8 phím, học bài hát, thu âm
- `Ghep Hinh Vui` — Ghép Hình Vui — ghép hình jigsaw 4–20 mảnh
- `Doan Tau Quy Luat` — Đoàn Tàu Quy Luật — tìm quy luật dãy (AB, ABC, dãy số) trên các toa tàu
- `Tiem Kem Cua Be` — Tiệm Kem Của Bé — làm kem đúng đơn khách, mua vị/đồ trang trí bằng xu

30 game khác đang được các phiên làm việc khác xây dựng song song — tuyệt đối không làm những ý tưởng này:
- Bé Tập Viết (`Be Tap Viet`, Bộ game 2)
- Đồng Hồ Vui (`Dong Ho Vui`, Bộ game 2)
- Rô-bốt Lập Trình (`Ro Bot Lap Trinh`, Bộ game 2)
- Bác Sĩ Thú Nhí (`Bac Si Thu Nhi`, Bộ game 2)
- Nối Số Vẽ Tranh (`Noi So Ve Tranh`, Bộ game 2)
- Tìm Bóng Cho Bạn (`Tim Bong Cho Ban`, Bộ game 2)
- Xếp Tháp Cao (`Xep Thap Cao`, Bộ game 2)
- Ban Nhạc Thú Con (`Ban Nhac Thu Con`, Bộ game 2)
- Cái Gì Biến Mất (`Cai Gi Bien Mat`, Bộ game 2)
- Dán Hình Tạo Cảnh (`Dan Hinh Tao Canh`, Bộ game 2)
- Dấu Thanh Kỳ Diệu (`Dau Thanh Ky Dieu`, Bộ game 3)
- Cá Sấu So Sánh (`Ca Sau So Sanh`, Bộ game 3)
- Nối Ống Nước (`Noi Ong Nuoc`, Bộ game 3)
- Thú Cưng Của Bé (`Thu Cung Cua Be`, Bộ game 3)
- Tìm Điểm Khác Nhau (`Tim Diem Khac Nhau`, Bộ game 3)
- Qua Đường An Toàn (`Qua Duong An Toan`, Bộ game 3)
- Chém Trái Cây (`Chem Trai Cay`, Bộ game 3)
- Bướm Đối Xứng (`Buom Doi Xung`, Bộ game 3)
- Cảm Xúc Của Bé (`Cam Xuc Cua Be`, Bộ game 3)
- Khủng Long Chạy Nhảy (`Khung Long Chay Nhay`, Bộ game 3)
- Vỗ Tay Đếm Tiếng (`Vo Tay Dem Tieng`, Bộ game 5)
- Cân Thăng Bằng (`Can Thang Bang`, Bộ game 5)
- Sudoku Hình (`Sudoku Hinh`, Bộ game 5)
- Mặc Gì Hôm Nay (`Mac Gi Hom Nay`, Bộ game 5)
- Đoán Xem Là Gì (`Doan Xem La Gi`, Bộ game 5)
- Ai Sống Ở Đâu (`Ai Song O Dau`, Bộ game 5)
- Sút Bóng Ghi Bàn (`Sut Bong Ghi Ban`, Bộ game 5)
- Xây Nhà Gạch Màu (`Xay Nha Gach Mau`, Bộ game 5)
- Sắp Xếp Câu Chuyện (`Sap Xep Cau Chuyen`, Bộ game 5)
- Khảo Cổ Khủng Long (`Khao Co Khung Long`, Bộ game 5)

## 3. Mười game của bộ này (làm đúng tên và tên thư mục dưới đây)

1. **Ghép Câu Vui** → thư mục `Ghep Cau Vui`
2. **Chia Đều Bánh** → thư mục `Chia Deu Banh`
3. **Xếp Hình Tangram** → thư mục `Xep Hinh Tangram`
4. **Vườn Hoa Của Bé** → thư mục `Vuon Hoa Cua Be`
5. **Cái Nào Khác Loại** → thư mục `Cai Nao Khac Loai`
6. **Phòng Thí Nghiệm Màu** → thư mục `Phong Thi Nghiem Mau`
7. **Bắn Kẹo Màu** → thư mục `Ban Keo Mau`
8. **Máy Kể Chuyện** → thư mục `May Ke Chuyen`
9. **Tìm Hình Chung** → thư mục `Tim Hinh Chung`
10. **Rắn Và Thang** → thư mục `Ran Va Thang`

Mô tả chi tiết (đây là định hướng tối thiểu — hãy làm hay hơn nếu bạn thấy cách tốt hơn):

### 1. Ghép Câu Vui  —  thư mục `Ghep Cau Vui`
Xếp từ thành câu: hình minh họa + 2–5 thẻ từ xáo trộn (chạm thẻ để nghe đọc) → kéo vào dòng câu; đúng → cả câu được đọc, hình động (con mèo ăn cá thật). Cấp 1 (5 tuổi): thẻ có hình + chữ ("Con mèo" 🐱 / "ăn" / "cá" 🐟); cấp 2: thẻ chỉ có chữ; cấp 3: câu 5 từ, có dấu chấm. Mọi cấp mở sẵn.
- Chế độ "Câu ngộ nghĩnh": chọn AI + LÀM GÌ + Ở ĐÂU từ các thẻ hình → câu được đọc và diễn hoạt hình (kể cả vô lý: "Con voi tắm trong bát") — để bé cười và nghe cấu trúc câu.
- Bộ ≥ 60 câu mẫu đúng ngữ pháp, có dấu; sao theo số lỗi.

### 2. Chia Đều Bánh  —  thư mục `Chia Deu Banh`
Chia bánh/kẹo cho 2–4 bạn thú trong buổi picnic: kéo hoặc chạm để chia lần lượt (mỗi chạm đưa 1 cái cho bạn tiếp theo); xong thì đếm lại mỗi bạn và trả lời "mỗi bạn được mấy?". Cấp cao có phần dư ("còn thừa 1 cái cho bé") và hiển thị phép chia bằng hình (6 ÷ 2 = 3) cho 7 tuổi.
- Thú vui khi đều, phụng phịu hài hước khi chưa đều (không phạt); có "cân công bằng" minh họa.
- Sưu tập các loại bánh; mọi cấp mở sẵn.

### 3. Xếp Hình Tangram  —  thư mục `Xep Hinh Tangram`
Tangram 7 mảnh màu: kéo, xoay (nút xoay hoặc xoay bằng 2 ngón), lật; ≥ 24 mẫu bóng (mèo, thỏ, thuyền, nhà, người chạy, cá, chim…); snap khi gần đúng vị trí và góc; mảnh vào đúng chỗ sáng lên.
- Cấp (mở sẵn): hiện viền từng mảnh trong bóng → chỉ bóng đen → tự do sáng tạo (lưu tác phẩm).
- Hoàn thành: hình "sống" (mắt chớp, cá bơi); không phạt; gợi ý đặt 1 mảnh.

### 4. Vườn Hoa Của Bé  —  thư mục `Vuon Hoa Cua Be`
Làm vườn: luống đất 6–9 ô, chọn hạt (hướng dương, tulip, cà chua, dâu, hoa hồng…), gieo, tưới (nghiêng bình, nước chảy), kéo mây ra để có nắng, nhổ cỏ, bắt sâu (chạm); cây lớn qua 4 giai đoạn theo lượt chăm (không bắt chờ thời gian thực). Thu hoạch vào giỏ; bướm, ong, chim đến thăm khi vườn đẹp.
- Sổ cây (sưu tập loài đã trồng), trang trí vườn (hàng rào, bù nhìn, ao, ghế) mua bằng hoa thu hoạch.
- Lưu vườn; nhịp chơi thư giãn; có 4 mùa đổi màu.

### 5. Cái Nào Khác Loại  —  thư mục `Cai Nao Khac Loai`
4 hình, chọn cái khác loại; cấp (mở sẵn): khác màu (3 đỏ 1 xanh) → khác loại (3 thú 1 xe) → thuộc tính tinh tế (3 bay được 1 không; 3 to 1 nhỏ; 3 sống dưới nước) → khác chữ cái đầu (7 tuổi).
- Sau khi chọn: giải thích bằng hình + giọng ("Đây là xe, còn lại là con vật"); chọn khác thì giải thích nhẹ rồi cho chọn lại.
- Câu hỏi sinh từ danh mục có thuộc tính (≥ 150 vật phẩm) nên không lặp; cú thông thái mascot; sao theo vòng 10 câu.

### 6. Phòng Thí Nghiệm Màu  —  thư mục `Phong Thi Nghiem Mau`
Pha màu: ống nghiệm đỏ, vàng, xanh dương (+ trắng, đen) đổ vào cốc; màu trộn theo mô hình sắc tố (đỏ + vàng = cam, xanh dương + vàng = xanh lá, đỏ + xanh dương = tím, thêm trắng = nhạt) — không trộn RGB thuần vì sẽ ra màu xỉn.
- Chế độ: Thử thách (pha đúng màu mục tiêu, có vòng so màu, dung sai rộng) · Tự do (pha màu rồi tô lên tranh / nhuộm áo cho thú) · Bánh xe màu (học màu cơ bản → thứ cấp). Mọi thử thách mở sẵn.
- Sủi bọt, bong bóng, mèo khoa học đeo kính; sưu tập màu đã pha được.

### 7. Bắn Kẹo Màu  —  thư mục `Ban Keo Mau`
Bubble shooter với viên kẹo tròn to: kéo để ngắm (đường ngắm chấm, có nảy tường), thả để bắn; ghép ≥ 3 cùng màu thì nổ; cụm rời rơi xuống; trần hạ chậm sau mỗi vài lượt nhưng không "thua": kẹo chạm đáy chỉ kết thúc màn với sao theo số kẹo nổ.
- Thú nhỏ bị kẹt trong kẹo: nổ quanh nó để giải cứu (thưởng). 3–4 màu (dễ) → 6 màu; ≈ 20 màn thiết kế tay (mở sẵn) + chế độ vô tận.
- Lưới lục giác, va chạm chính xác, nảy mượt; màu phân biệt được kể cả với bé mù màu (thêm hình nhỏ trên kẹo).

### 8. Máy Kể Chuyện  —  thư mục `May Ke Chuyen`
Máy kể chuyện: bé chọn nhân vật chính, nơi chốn, bạn đồng hành, đồ vật kỳ diệu, vấn đề (hoặc quay ngẫu nhiên) → ghép thành câu chuyện 5–6 cảnh có hoạt hình (nhân vật đi, nhảy, vật phát sáng), mỗi cảnh một câu được đọc + chữ to; bé chạm để sang cảnh; cuối truyện có 2 lựa chọn kết thúc.
- Bộ mẫu câu ≥ 40, ghép tổ hợp đúng ngữ pháp tiếng Việt, giọng kể ấm (rate chậm); nhạc nền nhẹ đổi theo cảnh.
- Sách truyện lưu các truyện bé thích với thumbnail; nút "kể lại".

### 9. Tìm Hình Chung  —  thư mục `Tim Hinh Chung`
Trò Dobble: 2 thẻ tròn, mỗi thẻ 4–8 hình, luôn có đúng 1 hình chung (sinh bằng mặt phẳng xạ ảnh bậc 3/5/7 → thẻ 4/6/8 hình); chạm hình chung trên thẻ dưới; thẻ mới trượt vào; vòng 10 thẻ; sao theo số lần sai (không hiện đồng hồ gây áp lực, chỉ "tốc độ" như huy hiệu phụ).
- Hình xoay và to nhỏ khác nhau như Dobble thật; bộ hình emoji + SVG rõ ràng.
- Chế độ 2 bé: màn chia đôi, thẻ chung ở giữa, ai chạm đúng trước được điểm; mọi cấp mở sẵn.

### 10. Rắn Và Thang  —  thư mục `Ran Va Thang`
Bàn cờ 1–30 (lưới 5×6) cho bé nhỏ, 1–50 cho bé lớn; xúc xắc chạm để lắc (hoạt hình 3D giả); quân cờ thú đi từng ô có đọc số; thang để leo lên (hoạt hình trèo), rắn hiền như cầu trượt để tuột xuống (vui chứ không buồn); 1 bé vs máy (thú) hoặc 2 bé thay lượt.
- Ô đặc biệt tùy chọn: ô sao (đi thêm), ô "đố nhỏ" (đếm/màu) tùy chọn bật tắt.
- Không ai thua: về đích đều có pháo hoa; ai về trước được vương miện. Nhiều quân cờ và bàn cờ chủ đề (rừng, vũ trụ).

## 4. Tiêu chuẩn bắt buộc cho MỌI game

- **Một file duy nhất** `index.html`, chạy offline, không cần server, không file ngoài. Chỉ cho phép một link Google Fonts (ví dụ `Baloo 2`) **có font dự phòng** của hệ thống; mọi hình ảnh là SVG inline / CSS / canvas / emoji (mascot, nhân vật chính và key art phải là SVG tự vẽ, cute, có hoạt hình idle: chớp mắt, thở, mắt dõi theo ngón tay…).
- **Icon** `icon.png` 256×256: nền trong suốt bên ngoài một ô vuông bo góc (bán kính ≈ 54px), bên trong nền gradient nhẹ + viền trắng mờ mỏng, một chủ thể lớn ở giữa là nhân vật/vật thể đặc trưng của game, phong cách phẳng dễ thương, bóng đổ mềm. (Có thể vẽ SVG rồi chụp bằng Chrome headless với nền trong suốt.) Nếu thư mục có icon của các game cũ, hãy làm cùng phong cách để cả bộ đồng nhất.
- **Tiếng Việt có dấu**, câu ngắn, thân thiện ("Chơi", "Chơi lại", "Màn tiếp", "Giỏi quá!"). Bé 5 tuổi chưa biết đọc: mọi hướng dẫn phải có hình/biểu tượng/hoạt hình minh họa, và được đọc bằng giọng tiếng Việt (Web Speech API, chỉ dùng khi thiết bị có giọng `vi`; chọn giọng tốt nhất; không nói chồng chéo). **Game phải chơi được hoàn toàn khi không có giọng đọc.**
- **Không phạt**: không mạng sống, không game over, không đồng hồ ép thời gian; sai → âm nhẹ + rung/lắc + lời động viên, cho thử lại ngay.
- **MỞ KHÓA TOÀN BỘ ngay từ đầu**: mọi màn chơi, cấp độ, chế độ, thế giới, bức tranh… đều chọn được ngay lần đầu mở game, không cần đạt điều kiện. Phần thưởng sưu tập (sticker, mũ, đồ trang trí) thì vẫn kiếm qua chơi — nhưng không được chặn nội dung chơi.
- **Âm thanh**: hiệu ứng và nhạc nền tổng hợp bằng WebAudio (không file âm thanh), mở khóa AudioContext ở cử chỉ đầu tiên, tạm dừng khi ẩn tab; nút bật/tắt nhạc và âm thanh ở thanh trên cùng; trạng thái lưu lại.
- **Điều khiển**: Pointer Events (chạm + chuột), an toàn đa chạm, không phụ thuộc hover; `touch-action: none` ở vùng chơi, không cuộn/zoom trang khi chơi; vùng chạm chính ≥ 56px trên điện thoại; kéo-thả dùng `setPointerCapture`.
- **Responsive**: 360×640 → 1920×1080, gồm điện thoại dọc (390×844), điện thoại ngang (844×390), tablet (768×1024, 1024×768). Không gì tràn/che/đè lên thanh nút; tính lại bố cục khi `resize`.
- **Mượt**: animate bằng transform/opacity, một vòng rAF dừng khi rảnh, canvas scale theo devicePixelRatio, không thrash layout; giữ ~60 fps trên điện thoại.
- **Lưu tiến độ** bằng localStorage (bọc try/catch, hoạt động khi bị chặn); sao mỗi màn, sưu tập, cài đặt.
- **Cấu trúc màn hình**: tiêu đề (mascot + tên game kiểu chữ to viền đậm + nút "Chơi" to nhấp nháy + nút phụ) → chọn chế độ/màn → chơi → kết quả (3 sao, pháo giấy, lời khen bằng giọng, "Chơi lại" / "Màn tiếp"). Nút quay lại ở góc trái; nút nhạc / âm thanh / toàn màn hình ở góc phải.
- **Juice**: mọi tương tác có âm + chuyển động (squash/stretch, bounce, particle, chữ khen bay lên); nội dung ngẫu nhiên hóa để chơi lại không chán.
- Không console error / exception trong mọi luồng chơi.

## 5. Quy trình gợi ý (đã chứng minh hiệu quả với bộ đầu)

1. Viết trước một **kit dùng chung** (CSS nút/thanh/overlay + JS: âm thanh tổng hợp, nhạc nền loop nhỏ, giọng đọc, pháo giấy/particle, overlay kết quả, helper kéo-thả, lưu trữ) rồi khi build **inline** kit vào từng `index.html` bằng một script build nhỏ (node), để mỗi file vẫn độc lập.
2. Làm **một game mẫu hoàn chỉnh** trước, kiểm thử kỹ, lấy đó làm chuẩn chất lượng.
3. Có thể dùng **subagent chạy song song** cho các game còn lại (mỗi subagent một game, brief đầy đủ + đường dẫn kit + game mẫu), nhưng **bạn phải tự kiểm thử lại từng game** sau khi nhận bàn giao, sửa lỗi, rồi mới báo cáo.
4. Ít nhất 3 lượt đánh bóng mỗi game: nhìn ảnh chụp như một giám đốc nghệ thuật và như một bé 5 tuổi — có dễ thương, rõ ràng, có biết phải làm gì tiếp không?

## 6. Kiểm thử bắt buộc trước khi báo "xong"

Tự thử như một người dùng thật, bằng công cụ tự động (không chỉ đọc code):
- Máy Windows có Node (`node`) và Python; Chrome ở `C:\Program Files\Google\Chrome\Application\chrome.exe`. Cách không cần cài gì: chạy `chrome --headless=new --remote-debugging-port=0 --user-data-dir=<thư mục tạm> --allow-file-access-from-files`, đọc cổng trong `DevToolsActivePort`, nối WebSocket CDP bằng Node (có sẵn `WebSocket` từ Node 22): `Page.navigate`, `Emulation.setDeviceMetricsOverride` + `Emulation.setTouchEmulationEnabled` (giả lập điện thoại), `Input.dispatchTouchEvent` / `Input.dispatchMouseEvent` (chạm, kéo thật), `Runtime.evaluate` (đọc trạng thái DOM), `Page.captureScreenshot`, `Network.emulateNetworkConditions {offline:true}` (thử offline), và lắng nghe `Runtime.exceptionThrown` / `Runtime.consoleAPICalled` để bắt lỗi. (Nếu Playwright/Puppeteer có sẵn thì dùng cũng được.)
- Với **mỗi** game, ở **3 kích thước** 390×844 (touch), 844×390 (touch), 1280×800 (chuột): chụp màn hình mọi màn (tiêu đề, chọn màn, chơi đầu/giữa, trạng thái trả lời sai, kết quả, sưu tập), **chơi trọn ít nhất một vòng bằng thao tác chạm/kéo thật** (cố ý sai một lần), xoay màn hình giữa chừng, bấm quay lại khi đang có hoạt hình, tải lại trang để kiểm tra lưu tiến độ, thử offline. Xem ảnh chụp và sửa những gì chưa đẹp/chưa rõ.
- Kiểm tra lại: tất cả màn/chế độ đều mở sẵn ở lần chơi đầu tiên (không còn biểu tượng ổ khóa).
- **Báo cáo cuối** (ngắn gọn, tiếng Việt): bảng 10 game (tên, thư mục, nội dung chính), những gì đã kiểm (kích thước màn hình, luồng chơi, lỗi đã sửa) và **những gì chưa kiểm được** (ví dụ: âm thanh/giọng đọc chưa nghe được bằng tai trên máy headless, chưa thử trên iPhone/iPad thật).
