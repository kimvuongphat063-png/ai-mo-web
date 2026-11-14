# Bộ game 5 — 10 game HTML mới cho bé 5–7 tuổi

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
- Ghép Câu Vui (`Ghep Cau Vui`, Bộ game 4)
- Chia Đều Bánh (`Chia Deu Banh`, Bộ game 4)
- Xếp Hình Tangram (`Xep Hinh Tangram`, Bộ game 4)
- Vườn Hoa Của Bé (`Vuon Hoa Cua Be`, Bộ game 4)
- Cái Nào Khác Loại (`Cai Nao Khac Loai`, Bộ game 4)
- Phòng Thí Nghiệm Màu (`Phong Thi Nghiem Mau`, Bộ game 4)
- Bắn Kẹo Màu (`Ban Keo Mau`, Bộ game 4)
- Máy Kể Chuyện (`May Ke Chuyen`, Bộ game 4)
- Tìm Hình Chung (`Tim Hinh Chung`, Bộ game 4)
- Rắn Và Thang (`Ran Va Thang`, Bộ game 4)

## 3. Mười game của bộ này (làm đúng tên và tên thư mục dưới đây)

1. **Vỗ Tay Đếm Tiếng** → thư mục `Vo Tay Dem Tieng`
2. **Cân Thăng Bằng** → thư mục `Can Thang Bang`
3. **Sudoku Hình** → thư mục `Sudoku Hinh`
4. **Mặc Gì Hôm Nay** → thư mục `Mac Gi Hom Nay`
5. **Đoán Xem Là Gì** → thư mục `Doan Xem La Gi`
6. **Ai Sống Ở Đâu** → thư mục `Ai Song O Dau`
7. **Sút Bóng Ghi Bàn** → thư mục `Sut Bong Ghi Ban`
8. **Xây Nhà Gạch Màu** → thư mục `Xay Nha Gach Mau`
9. **Sắp Xếp Câu Chuyện** → thư mục `Sap Xep Cau Chuyen`
10. **Khảo Cổ Khủng Long** → thư mục `Khao Co Khung Long`

Mô tả chi tiết (đây là định hướng tối thiểu — hãy làm hay hơn nếu bạn thấy cách tốt hơn):

### 1. Vỗ Tay Đếm Tiếng  —  thư mục `Vo Tay Dem Tieng`
Đếm âm tiết (tiếng) trong từ: hình + từ (con voi, xe đạp, máy bay, bánh mì, ô tô…), giọng đọc chậm; bé gõ trống/vỗ tay theo từng tiếng (mỗi chạm = 1 tiếng, một ô sáng lên) rồi bấm "Xong", hoặc chọn số tiếng (1–4); đúng → từ tách thành các tiếng nhảy múa và được đọc lại từng tiếng.
- Cấp (mở sẵn): 1–2 tiếng → 3–4 tiếng → "ghép tiếng": kéo các tiếng xáo trộn thành từ đúng thứ tự.
- Bộ ≥ 100 từ có emoji; không có giọng thì sau 1 lần sai hiện từ tách tiếng bằng gạch nhẹ.

### 2. Cân Thăng Bằng  —  thư mục `Can Thang Bang`
Cân hai đĩa với các vật có "nặng" khác nhau (gấu = 3, bóng = 1, sách = 2, xe = 4…): (1) "Bên nào nặng hơn?" — cân nghiêng hoạt hình, bé chọn; (2) "Làm cân thăng bằng" — kéo quả cân 1/2/5 vào đĩa cho cân bằng; (3) "Ai nặng bằng ai" — suy luận (2 bóng = 1 sách…) cho 7 tuổi; (4) Tự do đặt đồ lên cân.
- Vật lý nghiêng mượt, tiếng cót két, thú ngồi lên cân hài hước; số đĩa hiện khi cần. Mọi màn mở sẵn.

### 3. Sudoku Hình  —  thư mục `Sudoku Hinh`
Sudoku bằng hình: 4×4 (khối 2×2) → 6×6 (khối 2×3) với trái cây / thú / hình thay cho số; chạm ô trống rồi chọn hình từ khay (hoặc kéo); hình trùng hàng/cột/khối sẽ rung nhẹ (có thể tắt gợi ý).
- Sinh đề tự động có duy nhất một lời giải; cấp theo số ô trống; gợi ý điền 1 ô; sao theo số gợi ý dùng. Mọi cấp mở sẵn.
- Xong → các hình nhảy theo sóng; chủ đề đổi theo bảng.

### 4. Mặc Gì Hôm Nay  —  thư mục `Mac Gi Hom Nay`
Nhìn thời tiết qua cửa sổ (nắng, mưa, lạnh/tuyết, gió, nóng) → chọn quần áo và phụ kiện cho nhân vật từ tủ (áo mưa, ủng, mũ len, khăn, kính râm, mũ rộng vành, ô, găng tay…). Mặc hợp → nhân vật ra ngoài chơi (hoạt hình theo thời tiết); chưa hợp → nhân vật run/ướt/nóng toát mồ hôi hài hước và gợi ý nhẹ.
- Chế độ Tự do dress-up (nhiều áo, màu, kiểu tóc) + chụp ảnh; bài "Bốn mùa".
- Nhiều nhân vật (bé trai, bé gái, thú), lưu bộ đồ; mọi thời tiết mở sẵn.

### 5. Đoán Xem Là Gì  —  thư mục `Doan Xem La Gi`
Đoán hình bị che: lỗ nhìn nhỏ di chuyển / phóng to dần / mờ dần / lật từng mảnh; bé chọn 1 trong 3 đáp án (hình + tên); đoán sớm được nhiều sao hơn, đoán sai không mất gì (chỉ mở thêm gợi ý).
- Chủ đề: thú, xe cộ, đồ vật, trái cây; ≥ 80 hình (emoji lớn và SVG); thám tử thỏ với kính lúp.
- Chế độ "Phóng to", "Mảnh ghép", "Bóng mờ"; vòng 8 câu; mọi chủ đề mở sẵn.

### 6. Ai Sống Ở Đâu  —  thư mục `Ai Song O Dau`
Bản đồ 5–6 môi trường (rừng, biển, nông trại, sa mạc, bắc cực, rừng mưa): thú xuất hiện, bé kéo/chạm đưa về đúng nhà; cảnh đó dần "sống" hơn (thêm thú, âm thanh môi trường tổng hợp); sai → thú run (bắc cực nóng quá!) và gợi ý.
- Cấp 2: "Ai ăn gì?" (thỏ – cà rốt), "Con của ai?" (mẹ – con); bách khoa mini: chạm thú → tên + 1 câu thú vị bằng giọng.
- Sưu tập thú đã về đúng nhà; mọi môi trường mở sẵn.

### 7. Sút Bóng Ghi Bàn  —  thư mục `Sut Bong Ghi Ban`
Đá phạt đền: vuốt để sút (hướng + lực + xoáy theo đường vuốt), thủ môn thú nhảy đoán hướng; vòng tròn mục tiêu bonus trong khung thành; 5 lượt một vòng; không thua, sao theo số bàn.
- Chế độ thủ môn: kéo thú chắn bóng; chế độ 2 bé thay lượt sút/bắt.
- Sân cỏ, khán giả thú vẫy cờ, pháo giấy, áo đội mở bằng bàn thắng; vật lý bóng mượt (cong, nảy xà ngang).

### 8. Xây Nhà Gạch Màu  —  thư mục `Xay Nha Gach Mau`
Xây bằng khối trên lưới (nhìn ngang kiểu lego/pixel có chiều sâu giả): chọn khối (gạch màu, cửa, cửa sổ, mái, cây, đèn, bảng hiệu), chạm ô để đặt, chạm lại để xóa, kéo để tô dài; (1) "Xây theo mẫu" — bản vẽ mờ bên cạnh, so sánh khi bé bấm "Xong"; (2) Tự do; thú dọn vào ở khi nhà có cửa + mái (hoạt hình, đèn sáng ban đêm).
- Lưu nhiều công trình, xuất ảnh; nhiều mẫu (nhà, lâu đài, tên lửa, cây); tiếng "cạch" khi đặt. Mọi mẫu mở sẵn.

### 9. Sắp Xếp Câu Chuyện  —  thư mục `Sap Xep Cau Chuyen`
Sắp xếp trình tự 3 → 5 thẻ: thói quen hằng ngày (dậy – đánh răng – ăn sáng – đi học), vòng đời (trứng – nòng nọc – ếch; hạt – mầm – hoa; sâu – kén – bướm), nấu ăn, xây người tuyết, thả diều…; kéo thẻ vào các ô 1-2-3; đúng → chuỗi chạy như phim hoạt hình ngắn + giọng kể.
- Bộ ≥ 30 chuỗi có hình minh họa rõ; thẻ sai chỗ rung nhẹ, gợi ý "cái gì xảy ra trước?".
- Chế độ "Kể lại": chạm từng thẻ để nghe câu; mọi chuỗi mở sẵn.

### 10. Khảo Cổ Khủng Long  —  thư mục `Khao Co Khung Long`
Khai quật: chà ngón (chổi) để gạt cát trên canvas (lớp cát bị xóa theo nét), hiện dần xương; xẻng gạt nhanh hơn nhưng thô; gõ nhẹ để tách đá; thu từng mảnh xương → ghép vào khung xương (kéo tới đúng vị trí, snap) → khủng long sống dậy, gầm (tổng hợp), tên được đọc (T-rex, Tri-ce-ra-tops, Stegosaurus…).
- 8–10 loài; bảo tàng trưng bày (sưu tập) với thẻ thông tin 1 câu; nhiều khu đào (sa mạc, băng, núi lửa); đồ vật bất ngờ (trứng, hóa thạch cá, đá quý).
- Mọi khu đào mở sẵn; cát/bụi bay mượt.

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
