# Bộ game 3 — 10 game HTML mới cho bé 5–7 tuổi

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

1. **Dấu Thanh Kỳ Diệu** → thư mục `Dau Thanh Ky Dieu`
2. **Cá Sấu So Sánh** → thư mục `Ca Sau So Sanh`
3. **Nối Ống Nước** → thư mục `Noi Ong Nuoc`
4. **Thú Cưng Của Bé** → thư mục `Thu Cung Cua Be`
5. **Tìm Điểm Khác Nhau** → thư mục `Tim Diem Khac Nhau`
6. **Qua Đường An Toàn** → thư mục `Qua Duong An Toan`
7. **Chém Trái Cây** → thư mục `Chem Trai Cay`
8. **Bướm Đối Xứng** → thư mục `Buom Doi Xung`
9. **Cảm Xúc Của Bé** → thư mục `Cam Xuc Cua Be`
10. **Khủng Long Chạy Nhảy** → thư mục `Khung Long Chay Nhay`

Mô tả chi tiết (đây là định hướng tối thiểu — hãy làm hay hơn nếu bạn thấy cách tốt hơn):

### 1. Dấu Thanh Kỳ Diệu  —  thư mục `Dau Thanh Ky Dieu`
Học 6 thanh điệu tiếng Việt: ngang, huyền (`), sắc (´), hỏi (?), ngã (~), nặng (.). Màn chơi: hình + từ thiếu dấu (ví dụ "ca" với hình con cá 🐟) + giọng đọc "cá"; 6 nút dấu to, mỗi dấu một màu và một hình "giọng lên/xuống"; chọn đúng → dấu bay vào đúng vị trí nguyên âm, từ nhảy múa và được đọc lại.
- Bộ từ ≥ 60 cặp hình–từ có emoji minh họa được (cá/cà, lá/là, bò/bó, mẹ/mè, ngã, gà, mũ, nhà, chó, mèo, gấu, bé, cờ, sữa, kẹo…).
- Khi thiết bị không có giọng tiếng Việt: sau 1 lần sai hiện từ đầy đủ mờ mờ để bé so dấu.
- Chế độ "Nghe & chọn từ": 3 từ chỉ khác dấu (ma/má/mà) + hình, chọn từ đúng. Chế độ "Đọc dấu": chạm dấu để nghe mẫu "ba, bà, bá, bả, bã, bạ" với đường cong giọng động.
- Sưu tập "vườn dấu thanh"; mọi cấp mở sẵn.

### 2. Cá Sấu So Sánh  —  thư mục `Ca Sau So Sanh`
So sánh nhiều/ít, lớn/bé: hai bên là nhóm đồ vật (hoặc số), giữa là cá sấu há miệng; bé chạm/xoay cá sấu quay về bên nhiều hơn (miệng = dấu >, <), hoặc chọn "bằng nhau"; cá sấu "ăn" bên lớn với hoạt hình nhai vui.
- Cấp (mở sẵn): so số lượng 1–5 → đến 10 xếp lộn xộn → so số viết đến 20 → so phép tính đơn giản (3+2 ? 4) cho 7 tuổi; chế độ "Xếp hàng" kéo 3–4 số/đồ vật từ bé đến lớn.
- Trợ giúp đếm: chạm từng đồ vật để đếm (sáng lên + đọc số).
- Sao theo số đúng; cá sấu đổi mũ khi đạt mốc.

### 3. Nối Ống Nước  —  thư mục `Noi Ong Nuoc`
Lưới ống nước 3×3 → 6×6 (ống thẳng, cong, chữ T, chữ thập); chạm ô để xoay 90°; dẫn nước từ vòi đến chậu hoa / hồ cá / bồn tắm voi; nước chảy hoạt hình dọc ống khi thông, hoa nở/cá nhảy/voi tắm khi nước tới.
- Sinh màn tự động: tạo đường đi ngẫu nhiên rồi xoay ngẫu nhiên các ô, chắc chắn có lời giải; cấp cao có ống trang trí thừa và 2 nguồn nước màu.
- Không phạt, có nút gợi ý (xoay đúng 1 ô). Mọi cấp mở sẵn.

### 4. Thú Cưng Của Bé  —  thư mục `Thu Cung Cua Be`
Nuôi thú ảo: chọn 1 trong 5–6 thú (mèo, chó, thỏ, rồng con, chim cánh cụt, gấu trúc), chọn tên từ danh sách. Nhu cầu dạng biểu tượng: đói, tắm, chơi, ngủ. Hành động: cho ăn (kéo món ăn tới miệng, thú nhai), tắm (chà xà phòng tạo bọt, xịt nước, sấy), chơi (mini-game ném/bắt bóng), ngủ (tắt đèn, hát ru, thú ngáy).
- Thú lớn qua 3 giai đoạn theo số ngày chơi (lưu localStorage); thú không bao giờ "chết" hay quá buồn — chỉ nhắc nhẹ.
- Kiếm "tim" khi chăm sóc → mở mũ, nơ, đồ chơi, trang trí phòng. Mọi thứ cơ bản mở sẵn, chỉ đồ trang trí là phần thưởng.

### 5. Tìm Điểm Khác Nhau  —  thư mục `Tim Diem Khac Nhau`
Hai bức tranh (cảnh SVG bạn vẽ) cạnh nhau (trên/dưới ở điện thoại dọc), 3–5 điểm khác (màu, thiếu/thừa, kích thước, lật); chạm điểm khác ở bức nào cũng được → khoanh tròn cả hai bức; chạm sai: gợn sóng nhẹ, không phạt.
- Sinh biến thể tự động từ mẫu cảnh (mỗi cảnh có 10–15 phần tử có thể đổi), nên chơi lại không lặp. ≥8 cảnh (phòng ngủ, bãi biển, nông trại, lớp học, vũ trụ…).
- Kính lúp khi giữ ngón; gợi ý sau 20 giây (một vùng nhấp nháy); sao theo số gợi ý dùng.

### 6. Qua Đường An Toàn  —  thư mục `Qua Duong An Toan`
Giáo dục an toàn giao thông qua các màn ngắn: (1) Đèn giao thông — đợi đèn xanh người đi bộ rồi chạm "đi"; (2) Nhìn trái – nhìn phải — chạm mũi tên để nhân vật ngoảnh, thấy xe thì đợi; (3) Qua đường ở vạch kẻ — kéo nhân vật đi đúng vạch; (4) Đội mũ bảo hiểm trước khi ngồi xe máy; (5) Đi trên vỉa hè, không chạy ra đường lấy bóng; (6) Thắt dây an toàn trên ô tô.
- Xe cộ có mặt dễ thương; xe luôn phanh lại trước khi va chạm và nhắc nhẹ ("Đợi đèn xanh nhé!") — không có tai nạn.
- Huy hiệu "Công dân nhí" theo màn; tất cả màn mở sẵn, chơi lại thoải mái.

### 7. Chém Trái Cây  —  thư mục `Chem Trai Cay`
Trái cây bay lên theo quỹ đạo parabol, bé vuốt ngón để chém: lát cắt theo đường vuốt, nước ép bắn tóe, hai nửa rơi xoay; combo khi chém nhiều quả một đường; không có bom, không thua.
- Chế độ: Tự do (chơi tới khi bé thích, có "vòng" 60 giây để tính sao) · "Chỉ chém…" (chỉ chém táo / chỉ chém quả đỏ — chém nhầm thì rau cải chỉ "nhột", không phạt nặng) · "Đếm & chém" (chém đúng N quả rồi dừng, bé tự đếm).
- Slow-motion nhẹ khi combo, trái cây có mặt dễ thương; hỗ trợ chuột và cảm ứng; nền thay đổi (bếp, rừng, biển).

### 8. Bướm Đối Xứng  —  thư mục `Buom Doi Xung`
Đối xứng gương: cánh trái của bướm có mẫu chấm/hình màu, bé tô cánh phải cho giống (lưới ô, chạm ô để đổi màu từ bảng); cấp: lưới 3×3 → 5×5 → đối xứng 4 góc (bông hoa, bông tuyết); mẫu sinh ngẫu nhiên nên không lặp. Xong → bướm vỗ cánh bay lên, hoa nở.
- Chế độ Tự do "Gương thần": vẽ một bên, bên kia tự vẽ theo; kính vạn hoa 4/6/8 gương, màu đổi dần theo nét; lưu ảnh PNG.
- Không phạt; ô sai chỉ nhấp nháy khi bé bấm "Kiểm tra".

### 9. Cảm Xúc Của Bé  —  thư mục `Cam Xuc Cua Be`
Nhận biết và gọi tên cảm xúc: (1) "Bạn gấu thấy thế nào?" — hoạt cảnh ngắn (mất bóng, sinh nhật, sấm sét, được ôm) rồi chọn khuôn mặt đúng; (2) "Làm mặt" — kéo lông mày, mắt, miệng để tạo cảm xúc theo yêu cầu, có "gương" phản chiếu; (3) "Giúp bạn vui" — chọn hành động tốt (ôm, chia sẻ, xin lỗi, rủ chơi); (4) "Hít thở" — bong bóng phồng/xẹp 4 giây để bình tĩnh.
- 8 cảm xúc: vui, buồn, giận, sợ, ngạc nhiên, buồn ngủ, xấu hổ, yêu thương; tên đọc bằng giọng, nhiều nhân vật thú.
- Không đúng/sai gắt gao: trả lời khác thì giải thích nhẹ nhàng. Sưu tập "bộ mặt" bé đã làm.

### 10. Khủng Long Chạy Nhảy  —  thư mục `Khung Long Chay Nhay`
Endless runner thân thiện: khủng long tự chạy, chạm để nhảy (giữ để nhảy cao), chạm 2 lần để nhảy đôi; nhặt trái cây/sao; chướng ngại (khúc gỗ, xương rồng, vũng nước) chỉ làm vấp khựng lại và rơi vài sao — không chết.
- Một vòng kết thúc khi tới "cổng đích" (60–90 giây), sao theo trái cây nhặt được; chế độ "Em bé" chậm hơn.
- Mở nhân vật (khủng long các màu, thỏ, mèo) bằng trái cây; parallax 4 lớp, ngày → hoàng hôn → đêm; tất cả đường chạy mở sẵn.

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
