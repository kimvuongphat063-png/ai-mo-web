# Bộ game 2 — 10 game HTML mới cho bé 5–7 tuổi

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

1. **Bé Tập Viết** → thư mục `Be Tap Viet`
2. **Đồng Hồ Vui** → thư mục `Dong Ho Vui`
3. **Rô-bốt Lập Trình** → thư mục `Ro Bot Lap Trinh`
4. **Bác Sĩ Thú Nhí** → thư mục `Bac Si Thu Nhi`
5. **Nối Số Vẽ Tranh** → thư mục `Noi So Ve Tranh`
6. **Tìm Bóng Cho Bạn** → thư mục `Tim Bong Cho Ban`
7. **Xếp Tháp Cao** → thư mục `Xep Thap Cao`
8. **Ban Nhạc Thú Con** → thư mục `Ban Nhac Thu Con`
9. **Cái Gì Biến Mất** → thư mục `Cai Gi Bien Mat`
10. **Dán Hình Tạo Cảnh** → thư mục `Dan Hinh Tao Canh`

Mô tả chi tiết (đây là định hướng tối thiểu — hãy làm hay hơn nếu bạn thấy cách tốt hơn):

### 1. Bé Tập Viết  —  thư mục `Be Tap Viet`
Tập tô và viết theo nét: 29 chữ cái tiếng Việt (A Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y, cả hoa và thường), số 0–9, hình cơ bản (tròn, vuông, tam giác, sao), rồi vài từ ngắn (bố, mẹ, bé, cá).
- Màn chơi: chữ rất to ở giữa, nét mờ dạng chấm chấm, mũi tên + số thứ tự từng nét, điểm bắt đầu nhấp nháy. Bé kéo ngón theo nét, một vệt màu sáp/cầu vồng tô lên nét; lệch quá xa thì vệt mờ đi và nhân vật cây bút chì (mascot của bạn) chỉ tay về điểm cần đi — không phạt.
- Kỹ thuật: mỗi nét là một path SVG; lấy mẫu điểm dọc path, theo dõi tiến độ (progress) và khoảng cách ngón tới path; bán kính chấp nhận rộng cho bé 5 tuổi, có 3 mức chính xác (Dễ/Vừa/Khó) bé tự chọn. Nét phải vẽ đúng thứ tự và đúng chiều mới được tính (nhưng chỉ nhắc nhẹ).
- Xong một chữ: chữ "sống dậy" (nhảy, mắt miệng), giọng đọc tên chữ và một từ ví dụ có hình (B – bóng 🎈, C – cá 🐟…); số thì đếm bằng ngón tay/đồ vật.
- Chế độ: Tập tô (có nét mờ) · Tự viết (chỉ điểm bắt đầu, chấm hình dáng rộng rãi) · Vẽ tự do (bảng trắng nhiều màu, lưu ảnh).
- Bảng chữ cái sáng dần theo chữ đã tập; 3 sao theo độ gọn nét. Gợi ý icon: chữ A to có nét tô màu cam và mũi tên chỉ hướng.

### 2. Đồng Hồ Vui  —  thư mục `Dong Ho Vui`
Học xem giờ với đồng hồ kim to, số rõ, kim giờ ngắn màu khác kim phút dài; nền đổi sáng/tối theo giờ; cảnh sinh hoạt tương ứng (7 giờ thức dậy, 12 giờ ăn trưa, 21 giờ đi ngủ).
- Chế độ: (1) "Mấy giờ rồi?" — nhìn đồng hồ, chọn 1 trong 3 đáp án (số to + giọng đọc). (2) "Chỉnh đồng hồ" — kéo kim tới giờ yêu cầu; kéo kim phút thì kim giờ quay theo đúng tỉ lệ, snap 5 phút, tiếng tích tắc. (3) "Ghép đồng hồ" — nối đồng hồ kim với đồng hồ điện tử. (4) "Một ngày của bé" — xếp các hoạt động theo giờ trong ngày.
- Mức độ (mở sẵn): giờ đúng → giờ rưỡi → 15 phút / số phút bất kỳ (7 tuổi).
- Gà trống mascot gáy khi đúng; sưu tập mặt đồng hồ (mèo, hoa, rô-bốt, cầu vồng) để đổi.

### 3. Rô-bốt Lập Trình  —  thư mục `Ro Bot Lap Trinh`
Lập trình không cần chữ kiểu Bee-Bot/Lightbot: lưới 4×4 → 6×6, rô-bốt dễ thương phải đến ngôi sao/ngôi nhà và nhặt pin trên đường.
- Khối lệnh to: ⬆ tiến, ⟲ quay trái, ⟳ quay phải, ✨ hành động (bật đèn/nhặt), và khối "lặp ×2/×3" cho 7 tuổi. Chạm khối để thêm vào dải chương trình, kéo thả để sắp xếp, kéo ra ngoài để xóa.
- Nút "Chạy": rô-bốt đi từng bước, khối đang chạy sáng lên; đụng tường thì rô-bốt "Ối!" lắc đầu và dừng ở chỗ đó, chương trình giữ nguyên để bé sửa (không reset). Nút "Từng bước" để chạy 1 lệnh, "Xóa hết", "Quay về đầu".
- ≈30 màn thiết kế tay tăng dần (có tường, hố, cầu, cổng cần bật công tắc) + chế độ Tự do (bé tự đặt tường/sao rồi lập trình). Tất cả màn mở sẵn.
- 3 sao khi dùng ít khối (chỉ là thưởng, không ép).

### 4. Bác Sĩ Thú Nhí  —  thư mục `Bac Si Thu Nhi`
Phòng khám thú: bệnh nhân là các con thú (SVG của bạn) với triệu chứng kể bằng hình trong bong bóng (sốt 🤒, trầy đầu gối, răng đau, bẩn, bụng đau, buồn ngủ…).
- Dụng cụ trên khay: nhiệt kế, ống nghe, băng dán (chọn hoa văn), thìa thuốc, túi chườm, xà phòng + vòi nước, bàn chải, kính lúp, kẹo mút thưởng. Chạm hoặc kéo dụng cụ lên đúng chỗ; chỗ cần chữa phát sáng nhẹ nếu bé loay hoay lâu.
- Mỗi dụng cụ có tương tác riêng: nhiệt kế cột đỏ dâng lên, ống nghe nghe tiếng tim "thịch thịch" (tổng hợp bằng WebAudio), băng dán dính lại, xà phòng chà tạo bọt, chườm thì hơi lạnh bốc lên… Không có "sai": chỉ có "chưa đúng chỗ" (bạn thú lắc đầu).
- Kết thúc ca: bệnh nhân khỏe, nhận sticker, bé được điểm "nụ cười"; sổ bệnh nhân (sưu tập), trang trí phòng khám (tranh, cây, đèn) mua bằng nụ cười. Không máu, không kim tiêm.

### 5. Nối Số Vẽ Tranh  —  thư mục `Noi So Ve Tranh`
Nối các điểm theo thứ tự để hiện tranh (≥16 tranh: cá, mèo, xe, tên lửa, ngôi nhà, bướm, thuyền, cây thông…). Đường nối màu cầu vồng; nối xong tranh được tô màu, chuyển động và đọc tên.
- Chế độ: 1→10, 1→20, chữ cái A→Y, đếm cách 2 (2, 4, 6…), đếm cách 5/10 (7 tuổi). Điểm tiếp theo nhấp nháy sau vài giây; chạm sai: số rung nhẹ và giọng đọc số cần tìm.
- Có thể kéo ngón liên tục qua các điểm hoặc chạm từng điểm.
- Phòng tranh lưu các tranh đã hoàn thành (với màu bé chọn); mỗi lần chơi lại thứ tự/vị trí số có biến thể.

### 6. Tìm Bóng Cho Bạn  —  thư mục `Tim Bong Cho Ban`
Ghép đồ vật với bóng đen của nó: 3–6 bóng trên màn, kéo hình vào đúng bóng (hoặc chạm hình rồi chạm bóng).
- Cấp độ (mở sẵn): bóng đúng chiều → bóng bị xoay/lật → bóng gần giống nhau (hai con mèo khác tư thế) → "bóng của ai" (một bóng, nhiều hình ứng viên).
- Chủ đề: thú, đồ chơi, xe cộ, trái cây, dụng cụ. Bối cảnh ban đêm, ngón tay là đèn pin rọi sáng vùng quanh.
- Ghép đúng: hình "nhảy" vào bóng, bóng bừng sáng thành màu, chuông; sai: bóng rung, hình quay về. Sao theo số lần sai (nhẹ nhàng).

### 7. Xếp Tháp Cao  —  thư mục `Xep Thap Cao`
Khối trượt qua lại trên đỉnh tháp, chạm để thả; phần thừa bị cắt rơi xuống; thả thật khớp → "Hoàn hảo!" và khối rộng lại một chút. Camera cuộn lên; nền đổi từ mặt đất → mây → chim → bầu trời sao.
- Một vòng = 20 khối (không thua): thả trượt hoàn toàn thì khối rơi, tháp lắc "Ối!" và tiếp tục; sao theo số lần hoàn hảo và độ cao.
- Chủ đề khối: bánh kếp, hộp quà, bánh kem tầng, thú chồng nhau, gạch màu; nhân vật mèo công nhân đội mũ.
- Kỷ lục độ cao, huy hiệu; vật lý rơi/đung đưa mượt bằng rAF.

### 8. Ban Nhạc Thú Con  —  thư mục `Ban Nhac Thu Con`
Máy soạn nhạc dạng lưới (step sequencer): 16 bước × 6–8 hàng, mỗi hàng là một con thú với âm thanh riêng tổng hợp bằng WebAudio: voi – trống kick, khỉ – snare, chim – hi-hat, gấu – bass, mèo – giai điệu (thang ngũ cung nên bật gì cũng hay), thỏ – chuông, ếch – blip…
- Bật/tắt ô bằng chạm (kéo để bật nhiều ô), vòng lặp chạy liên tục với vạch chạy; thú nhảy/mở miệng đúng nhịp của mình.
- Tempo (chậm/vừa/nhanh), xóa, ngẫu nhiên, 5 bài mẫu, lưu 5 bài của bé; chế độ "chơi live" gõ trực tiếp con thú.
- Bộ lập lịch WebAudio chính xác (lookahead), không trễ, không click.

### 9. Cái Gì Biến Mất  —  thư mục `Cai Gi Bien Mat`
Trò ảo thuật trí nhớ: thỏ ảo thuật gia bày 3–8 đồ vật, "nhớ kỹ nhé", tấm rèm kéo lại, một món biến mất (cấp cao: đổi chỗ, thêm món mới, đổi màu), rèm mở, bé chọn trong 3–4 đáp án hoặc chỉ vào chỗ trống.
- Thời gian nhìn do bé quyết (chạm "Xong rồi"), có nút "xem lại" không phạt.
- Chủ đề: đồ chơi, trái cây, thú, đồ dùng; tiếng "poof", khói tím; sao theo số đúng trong vòng 5 lượt. Các cấp độ mở sẵn.

### 10. Dán Hình Tạo Cảnh  —  thư mục `Dan Hinh Tao Canh`
Sticker scene builder (kiểu Toca): chọn nền (nông trại, biển, vũ trụ, thành phố, rừng, tiệc sinh nhật), khay sticker theo nhóm (thú, người, xe, cây cối, đồ vật, thời tiết); kéo vào cảnh, chạm sticker thì nó kêu/nhảy/có hoạt hình riêng; phóng to/thu nhỏ/lật bằng nút nhỏ quanh sticker (hoặc 2 ngón); kéo vào thùng để xóa.
- Gợi ý nhiệm vụ nhỏ không bắt buộc ("Làm bữa tiệc cho 3 bạn thú").
- Nút "Play": cảnh sống dậy (sticker cử động, ngày → đêm, mưa/nắng).
- Lưu nhiều cảnh với thumbnail, xuất PNG.

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
