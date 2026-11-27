export type AppSuiteKey =
  | "commercial"
  | "finance"
  | "production"
  | "marketing"
  | "governance"
  | "education"
  | "cognitive";

export type AppCategoryKey =
  | "kinh-doanh"
  | "tai-chinh"
  | "san-xuat"
  | "marketing"
  | "quan-tri"
  | "hoc-tap"
  | "ky-nang";

export interface HtmlAppItem {
  slug: string;
  title: string;
  category: AppCategoryKey;
  categoryLabel: string;
  suite: AppSuiteKey;
  suiteLabel: string;
  summary: string;
  description: string;
  suitableFor: string;
  highlights: string[];
  fileName: string;
  status: "ready" | "preview";
  badge?: string;
  isFeatured?: boolean;
  featuredRank?: number;
  coffeePrice?: number;
  engineSpec?: string;
}

export const SUITE_DEFINITIONS: Record<
  AppSuiteKey,
  {
    label: string;
    englishTitle: string;
    description: string;
    iconName: string;
    gradient: string;
    accentColor: string;
  }
> = {
  commercial: {
    label: "Kinh doanh & Bán lẻ",
    englishTitle: "Commercial & Sales Suite",
    description: "Bộ công cụ tính lãi thật, chống bán lỗ trên sàn TMĐT, quản lý đơn hàng, bán lẻ, F&B, spa và lập báo giá tức thì.",
    iconName: "Calculator",
    gradient: "from-blue-600/10 to-indigo-600/10",
    accentColor: "#155EEF",
  },
  finance: {
    label: "Tài chính, Kế toán & Thuế",
    englishTitle: "Finance, Accounting & Tax Suite",
    description: "Hệ thống kế toán quản trị, dòng tiền 13 tuần, công nợ, đối chiếu sao kê, hóa đơn điện tử và nghĩa vụ thuế 100% offline.",
    iconName: "Receipt",
    gradient: "from-amber-600/10 to-orange-600/10",
    accentColor: "#D97706",
  },
  production: {
    label: "Sản xuất, Mua hàng & Kho",
    englishTitle: "Manufacturing, Procurement & Warehouse Suite",
    description: "Định mức BOM, lệnh sản xuất phân xưởng, kế hoạch nguyên liệu, KCS chất lượng, hạn dùng và quản trị tồn kho FEFO.",
    iconName: "Factory",
    gradient: "from-slate-600/10 to-zinc-600/10",
    accentColor: "#475569",
  },
  marketing: {
    label: "Tiếp thị & Tăng trưởng",
    englishTitle: "Marketing & Growth Engine",
    description: "Đo lường hiệu quả ROAS đa kênh, lịch nội dung marketing, phễu tuyển sinh và quản trị mục tiêu OKR.",
    iconName: "Megaphone",
    gradient: "from-rose-600/10 to-pink-600/10",
    accentColor: "#E11D48",
  },
  governance: {
    label: "Hợp đồng & Quản trị",
    englishTitle: "Contracts & Operations Governance",
    description: "Theo dõi hợp đồng kinh tế, ngân sách năm, báo cáo quản trị giám đốc, chăm sóc khách hàng và quản lý tài sản cho thuê.",
    iconName: "Briefcase",
    gradient: "from-emerald-600/10 to-teal-600/10",
    accentColor: "#059669",
  },
  education: {
    label: "Giáo dục & Học tập",
    englishTitle: "Algorithmic Math & Learning Suite",
    description: "Động cơ sinh đề thi A4 GDPT 2018, giải toán THCS BigInt, ôn tập ngoại ngữ và bộ công cụ quản lý trường học, trung tâm đào tạo.",
    iconName: "GraduationCap",
    gradient: "from-purple-600/10 to-violet-600/10",
    accentColor: "#7C3AED",
  },
  cognitive: {
    label: "Kỹ năng & Tốc độ",
    englishTitle: "Cognitive & Typing Engine",
    description: "Hệ thống luyện công thái học bàn phím 10 ngón và phản xạ tư duy đạt chuẩn WPM.",
    iconName: "Keyboard",
    gradient: "from-cyan-600/10 to-blue-600/10",
    accentColor: "#0284C7",
  },
};

export const HTML_APPS: HtmlAppItem[] = [
  {
    "slug": "lai-that-tung-don",
    "title": "Tính lãi thật từng đơn hàng",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Tính nhanh 3 giây ra lãi ròng & giá bán hòa vốn sau khi trừ preset phí sàn Shopee/TikTok/Lazada 2026, thuế TMĐT 1.5%, Affiliate, Ads/ROAS và hoàn hàng.",
    "description": "Bộ máy tính lãi thật chuẩn biểu phí 2026 cho chủ shop Shopee, TikTok Shop, Lazada và bán đa kênh. Tự động khấu trừ phí sàn, thuế TMĐT 1.5%, hoa hồng Affiliate, chi phí quảng cáo (ROAS/Ads), đóng gói và tỷ lệ hoàn hàng để biết ngay lãi ròng từng đơn & giá bán hòa vốn chỉ trong 3 giây.",
    "suitableFor": "Chủ shop online Shopee, TikTok Shop, Lazada, nhà bán hàng dropship và kinh doanh đa kênh.",
    "highlights": [
      "Preset biểu phí Shopee, TikTok Shop & Lazada 2026",
      "Khấu trừ thuế TMĐT 1.5%, hoa hồng Affiliate & ROAS/Ads",
      "Tính chi phí ẩn tỷ lệ hoàn hàng & đóng gói",
      "Tính nhanh 3 giây ra lãi ròng & giá bán hòa vốn"
    ],
    "fileName": "lai-that-tung-don.html",
    "status": "ready",
    "badge": "Chuẩn Sàn 2026",
    "isFeatured": true,
    "featuredRank": 1,
    "coffeePrice": 20000,
    "engineSpec": "E-com Profit & Breakeven Engine 2026"
  },
  {
    "slug": "nhip-marketing-2027",
    "title": "Nhịp Marketing & Lịch Chiến Dịch 2027",
    "category": "marketing",
    "categoryLabel": "Tiếp thị & Tăng trưởng",
    "suite": "marketing",
    "suiteLabel": "Tiếp thị & Tăng trưởng",
    "summary": "Biến 35 mốc lễ Tết & Mega Sale 2027 thành kế hoạch tuần cho shop, kèm 14 mẫu chiến dịch, 20 góc content và xuất lịch .ics vào điện thoại.",
    "description": "Bộ kế hoạch hành động năm 2027 đóng gói bởi AI Mở Studio cho chủ shop Bán lẻ, F&B, Spa, Giáo dục và Dịch vụ. Tự động lùi mốc chuẩn bị trước ngày sale, lọc theo ngành & kênh chính, cập nhật lưu ý Luật TMĐT & livestream 2027 và xuất thẳng lịch nhắc việc sang iPhone / Google Calendar.",
    "suitableFor": "Chủ shop Bán lẻ, F&B, Spa, trung tâm Giáo dục, Marketer và đội ngũ Content đa kênh.",
    "highlights": [
      "35 mốc lễ & Mega Sale 2027 lọc theo ngành",
      "14 mẫu chiến dịch tự chia mốc chuẩn bị",
      "20 góc ý tưởng nội dung tuần thực chiến",
      "Xuất lịch .ics vào iPhone & Google Calendar"
    ],
    "fileName": "nhip-marketing-2027.html",
    "status": "ready",
    "badge": "Mới · 2027",
    "isFeatured": true,
    "featuredRank": 2,
    "coffeePrice": 20000,
    "engineSpec": "Marketing Planner & ICS Calendar Engine"
  },
  {
    "slug": "bac-si-camp-fmp",
    "title": "Bác Sĩ Camp & Hòa Vốn FMP",
    "category": "marketing",
    "categoryLabel": "Tiếp thị & Tăng trưởng",
    "suite": "marketing",
    "suiteLabel": "Tiếp thị & Tăng trưởng",
    "summary": "Tính nhanh CPO hòa vốn, giá tin nhắn trần và chẩn đoán 4 lớp chiến dịch Ads theo quy tắc Tắt – Giữ – Scale 15–20%. Dùng thử miễn phí 1 Camp, mở khóa Pro & tải Offline qua SePay.",
    "description": "Công cụ chẩn đoán tài chính & hiệu suất quảng cáo đóng gói bởi AI Mở Studio. Giúp chủ shop và team Ads biết chính xác ngưỡng CPO hòa vốn trước khi chạy, chấm điểm 8 chỉ số phễu (Reach/Lead, tỷ lệ chốt, tần suất, lãi ròng), Import CSV Facebook/TikTok Ads, kiểm soát tỷ lệ ngân sách lãng phí dưới 15% và xuất Prompt AI sửa hook/kịch bản chỉ với 1 click.",
    "suitableFor": "Chủ shop online, người tự chạy Facebook/TikTok Ads, team Marketing in-house và học viên thực chiến.",
    "highlights": [
      "Tính CPO hòa vốn, CPO an toàn & giá tin nhắn trần chuẩn tài chính",
      "Phiếu Khám Camp 4 lớp với quy tắc Tắt – Giữ – Tăng ngân sách 15–20%",
      "Import CSV Ads, đo tỷ lệ lãng phí < 15% & Copy Prompt AI 1-click",
      "Dùng thử miễn phí trên web, mở khóa Pro & tải Offline tự động qua SePay"
    ],
    "fileName": "bac-si-camp-fmp.html",
    "status": "ready",
    "badge": "Pro · SePay",
    "isFeatured": true,
    "featuredRank": 3,
    "coffeePrice": 50000,
    "engineSpec": "FMP Breakeven & 4-Layer Ads Diagnostic Engine"
  },
  {
    "slug": "gia-ban-khuyen-mai",
    "title": "Định giá bán & Khuyến mãi",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Tính toán giá bán tối thiểu, mức giảm tối đa cho phép và mô phỏng các đợt flash sale không lo lỗ.",
    "description": "Giúp người bán lập phương án khuyến mãi an toàn, biết chính xác điểm hòa vốn và biên độ an toàn trước khi bấm kích hoạt voucher hay giảm giá.",
    "suitableFor": "Chủ cửa hàng, marketer, người làm chiến dịch bán lẻ.",
    "highlights": [
      "Tìm điểm hòa vốn",
      "Mô phỏng 3 phương án giảm giá",
      "Cảnh báo bán lỗ tức thì",
      "Lưu trữ cục bộ bảo mật"
    ],
    "fileName": "gia-ban-khuyen-mai.html",
    "status": "ready",
    "badge": "Thực dụng",
    "isFeatured": true,
    "featuredRank": 3,
    "engineSpec": "Thuật toán Flash Sale Breakeven"
  },
  {
    "slug": "bao-gia-chi-tiet",
    "title": "Tạo bảng báo giá chuyên nghiệp",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Soạn thảo, quản lý danh mục sản phẩm, in trực tiếp và xuất file Excel báo giá gửi khách hàng trong 2 phút.",
    "description": "Giải pháp báo giá nhanh cho các đơn vị kinh doanh dịch vụ, cung cấp hàng hóa, không cần mở phần mềm kế toán cồng kềnh.",
    "suitableFor": "Freelancer, đội ngũ sales B2B, cửa hàng dịch vụ kỹ thuật.",
    "highlights": [
      "Soạn báo giá có chiết khấu",
      "Mẫu in chuẩn PDF A4",
      "Xuất file Excel đầy đủ công thức",
      "Nhập xuất danh mục nhanh"
    ],
    "fileName": "bao-gia-chi-tiet.html",
    "status": "ready",
    "badge": "B2B Pro",
    "isFeatured": true,
    "featuredRank": 7,
    "engineSpec": "Trình kết xuất PDF A4 Vector"
  },
  {
    "slug": "cong-tac-vien-affiliate-hoa-hong",
    "title": "Quản lý Cộng tác viên & Affiliate",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Theo dõi đơn hàng qua CTV, quản lý kỳ đối soát hoa hồng và lập danh sách thanh toán minh bạch.",
    "description": "Giải pháp tinh gọn để mở rộng đội ngũ cộng tác viên bán lẻ mà không cần đầu tư hệ thống affiliate đắt đỏ.",
    "suitableFor": "Nhà bán hàng, đại lý phân phối, xưởng sản xuất muốn phát triển mạng lưới CTV.",
    "highlights": [
      "Ghi nhận đơn theo mã CTV",
      "Chốt đối soát theo chu kỳ",
      "Lịch sử chi trả minh bạch",
      "Không sợ nhầm lẫn đơn"
    ],
    "fileName": "cong-tac-vien-affiliate-hoa-hong.html",
    "status": "ready",
    "engineSpec": "Sổ cái đối soát hoa hồng"
  },
  {
    "slug": "dai-ly-nha-phan-phoi-chiet-khau",
    "title": "Quản lý Đại lý & Chiết khấu",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Quản lý công nợ đại lý, hạn mức thanh toán, chiết khấu theo volume và thưởng doanh số quý.",
    "description": "Giúp doanh nghiệp phân phối kiểm soát chặt công nợ đại lý, hạn chế tối đa rủi ro tồn nợ quá hạn.",
    "suitableFor": "Nhà phân phối sỉ, xưởng gia công, nhà sản xuất phân phối đa kênh.",
    "highlights": [
      "Quản lý hạn mức công nợ",
      "Chiết khấu theo số lượng đơn",
      "Cảnh báo quá hạn thanh toán",
      "Theo dõi thưởng quý"
    ],
    "fileName": "dai-ly-nha-phan-phoi-chiet-khau.html",
    "status": "ready",
    "engineSpec": "Bộ tính chiết khấu bậc thang"
  },
  {
    "slug": "chi-tieu-hoa-hong-sale",
    "title": "Tính chỉ tiêu & Hoa hồng Sale",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Quản lý KPI doanh số theo kỳ, tính hoa hồng lũy tiến theo bậc và minh bạch bảng kê chi trả cho nhân viên.",
    "description": "Xóa tan tranh cãi về hoa hồng cuối tháng. Thiết lập công thức bậc thang rõ ràng, tự động tính thưởng phạt và xuất phiếu xác nhận.",
    "suitableFor": "Trưởng nhóm kinh doanh, chủ shop có đội ngũ bán hàng từ 2–20 người.",
    "highlights": [
      "Tính hoa hồng bậc thang",
      "Theo dõi tiến độ hoàn thành KPI",
      "Bảng đối soát từng nhân viên",
      "Xuất phiếu lương thưởng"
    ],
    "fileName": "chi-tieu-hoa-hong-sale.html",
    "status": "ready",
    "engineSpec": "Thuật toán tính KPI lũy tiến"
  },
  {
    "slug": "bao-hanh-sua-chua",
    "title": "Quản lý Bảo hành & Sửa chữa",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Tiếp nhận thiết bị, theo dõi thay thế linh kiện, xuất phiếu hẹn trả và báo cáo chi phí sửa chữa.",
    "description": "Giải pháp cho các xưởng bảo hành, tiệm sửa chữa điện thoại, máy tính, điện máy gia dụng theo dõi vòng đời thiết bị khách gửi.",
    "suitableFor": "Cửa hàng điện máy, kỹ thuật máy tính, sửa chữa thiết bị di động.",
    "highlights": [
      "In phiếu tiếp nhận chuẩn",
      "Theo dõi linh kiện đã dùng",
      "Báo cáo doanh thu sửa chữa",
      "Tra cứu nhanh theo số điện thoại"
    ],
    "fileName": "bao-hanh-sua-chua.html",
    "status": "ready",
    "engineSpec": "Sổ theo dõi vòng đời thiết bị"
  },
  {
    "slug": "ngan-sach-gia-dinh",
    "title": "Quản lý ngân sách gia đình",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Sổ theo dõi thu chi 12 tháng, chia hạn mức từng danh mục và kiểm soát tiến độ mục tiêu tiết kiệm.",
    "description": "Ứng dụng tài chính cá nhân độc lập, không kết nối tài khoản ngân hàng, đảm bảo bí mật số dư và chi tiêu 100% trên thiết bị của bạn.",
    "suitableFor": "Gia đình trẻ, cá nhân muốn quản lý chi tiêu có kế hoạch, người hướng tới tự do tài chính.",
    "highlights": [
      "Phân bổ hạn mức 6 hũ / phong bì",
      "Biểu đồ chi tiêu 12 tháng",
      "Kế hoạch tiết kiệm mục tiêu",
      "Xuất báo cáo chi tiết"
    ],
    "fileName": "ngan-sach-gia-dinh.html",
    "status": "ready",
    "badge": "An toàn",
    "isFeatured": true,
    "featuredRank": 7,
    "engineSpec": "Mô hình phân bổ 6 phong bì"
  },
  {
    "slug": "cham-soc-khach-sau-ban",
    "title": "Chăm sóc khách hàng sau bán",
    "category": "quan-tri",
    "categoryLabel": "Hợp đồng & Quản trị",
    "suite": "governance",
    "suiteLabel": "Hợp đồng & Quản trị",
    "summary": "Lên lịch nhắc gọi điện bảo dưỡng, tái mua hàng, nhật ký tương tác và giữ chân khách hàng cũ.",
    "description": "Chi phí tìm khách mới đắt gấp 5 lần giữ khách cũ. App này giúp bạn tự động nhắc nhở thời điểm cần liên hệ lại theo chu kỳ sử dụng của sản phẩm.",
    "suitableFor": "Cửa hàng bán lẻ, spa, nha khoa, kỹ thuật dịch vụ, đại lý mỹ phẩm.",
    "highlights": [
      "Nhắc lịch tương tác tự động",
      "Phân nhóm khách VIP / thường",
      "Nhật ký chăm sóc chi tiết",
      "Sao lưu JSON an toàn"
    ],
    "fileName": "cham-soc-khach-sau-ban.html",
    "status": "ready",
    "engineSpec": "Bộ đếm chu kỳ tái mua LTV"
  },
  {
    "slug": "toan-cap-2",
    "title": "Giải & Ra đề Toán Cấp 2 (Lớp 6–9)",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Bộ máy giải toán BigInt chi tiết từng bước, chấm điểm trực tiếp và tự động sinh đề thi A4 từ Lớp 6 đến Lớp 9.",
    "description": "Động cơ giải toán đại số & hình học THCS trực tiếp trên trình duyệt. Tích hợp giải phương trình, hệ phương trình, rút gọn căn thức, tìm cực trị với từng bước giải thích logic chặt chẽ.",
    "suitableFor": "Học sinh THCS (lớp 6–9), giáo viên toán cấp 2, phụ huynh cần công cụ kiểm tra bài tập.",
    "highlights": [
      "Động cơ giải từng bước BigInt",
      "Chấm điểm tương tác thời gian thực",
      "Sinh đề kiểm tra A4 tự động kèm đáp án",
      "Hoạt động 100% offline bảo mật"
    ],
    "fileName": "toan-cap-2.html",
    "status": "ready",
    "badge": "Động cơ BigInt",
    "isFeatured": true,
    "featuredRank": 4,
    "engineSpec": "Động cơ toán học BigInt + LaTeX-lite"
  },
  {
    "slug": "toan-cap-1",
    "title": "Máy ra đề Toán Cấp 1 (Lớp 1–5)",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Tự động sinh đề Toán từ Lớp 1 đến Lớp 5 theo chuẩn GDPT 2018, xuất phiếu in A4 chuẩn và kèm ma trận đáp án.",
    "description": "Bộ công cụ sư phạm toán học offline dành cho giáo viên và phụ huynh. Tự động sinh ngẫu nhiên hàng ngàn đề toán lớp 1–5 có phân hóa 4 mức độ nhận thức, hỗ trợ in A4 chuẩn sư phạm và xem ma trận lời giải chi tiết.",
    "suitableFor": "Giáo viên tiểu học, phụ huynh có con học lớp 1 đến lớp 5, trung tâm bồi dưỡng toán.",
    "highlights": [
      "Chuẩn chương trình GDPT 2018",
      "Sinh đề ngẫu nhiên không trùng lặp",
      "Xuất file in A4 chuẩn sư phạm",
      "Kèm đáp án & ma trận chi tiết"
    ],
    "fileName": "toan-cap-1.html",
    "status": "ready",
    "badge": "GDPT 2018",
    "isFeatured": true,
    "featuredRank": 5,
    "engineSpec": "Trình tạo đề GDPT 2018 Vector"
  },
  {
    "slug": "toan-bang-tieng-anh-3-5",
    "title": "Toán bằng tiếng Anh lớp 3–5",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "540 bài toán tư duy bằng tiếng Anh kèm đọc phát âm từ khóa học thuật cho học sinh song ngữ.",
    "description": "Rèn luyện đồng thời tư duy logic toán học và khả năng đọc hiểu thuật ngữ tiếng Anh chuyên ngành tiểu học.",
    "suitableFor": "Học sinh tiểu học trường song ngữ, quốc tế hoặc chuẩn bị thi toán Cambridge/Kangaroo.",
    "highlights": [
      "540 đề toán song ngữ",
      "Giải thích từ khóa toán học",
      "Âm thanh đọc câu hỏi tự nhiên",
      "Chế độ luyện câu sai thông minh"
    ],
    "fileName": "toan-bang-tieng-anh-3-5.html",
    "status": "ready",
    "badge": "Song ngữ",
    "engineSpec": "Bộ câu hỏi Cambridge/Kangaroo"
  },
  {
    "slug": "tu-vung-tieng-anh",
    "title": "Luyện từ vựng tiếng Anh 3–9",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Kho từ vựng theo chủ đề, luyện phát âm chuẩn, trắc nghiệm phản xạ và điền từ cho học sinh từ lớp 3 đến lớp 9.",
    "description": "App học từ vựng không áp lực, phân chia theo cấp độ từ cơ bản đến trung học, giúp nhớ từ qua ngữ cảnh và giọng đọc máy.",
    "suitableFor": "Học sinh lớp 3–9, người bắt đầu xây lại nền tảng từ vựng.",
    "highlights": [
      "Phân cấp từ lớp 3 đến lớp 9",
      "Có giọng đọc mẫu phát âm",
      "Bài tập điền từ và xếp câu",
      "Không quảng cáo phiền toái"
    ],
    "fileName": "tu-vung-tieng-anh.html",
    "status": "ready",
    "engineSpec": "Trình luyện ngữ âm Web Speech"
  },
  {
    "slug": "ghep-van-chinh-ta",
    "title": "Ghép vần & Chính tả tiếng Việt 1–3",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "195 bài tập ghép âm, vần, phân biệt thanh điệu và gõ từ chuẩn ngữ pháp cho học sinh tiểu học.",
    "description": "Bộ bài học tương tác sinh động giúp con rèn chính tả tiếng Việt, phát hiện âm vần dễ lẫn (l/n, s/x, ch/tr, dấu hỏi/ngã).",
    "suitableFor": "Phụ huynh có con học lớp 1, 2, 3 và giáo viên tiểu học.",
    "highlights": [
      "195 bài tập chuẩn chương trình",
      "Thử thách 3 phút phản xạ",
      "Sổ lưu lại các câu làm sai",
      "Xuất bảng điểm tiến bộ"
    ],
    "fileName": "ghep-van-chinh-ta.html",
    "status": "ready",
    "engineSpec": "Bộ quy tắc chính tả tiếng Việt"
  },
  {
    "slug": "on-bai-10-phut",
    "title": "Ôn bài 10 phút mỗi ngày",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Ngân hàng 1.002 câu hỏi ôn luyện kiến thức nhanh theo từng môn học trong các phiên 10 phút ngắn gọn.",
    "description": "Phương pháp ôn tập ngắt quãng (Spaced Repetition) giúp học sinh nắm vững kiến thức trọng tâm mà không bị quá tải thời gian.",
    "suitableFor": "Học sinh tiểu học và phụ huynh muốn đồng hành ôn bài 10 phút mỗi tối.",
    "highlights": [
      "1.002 câu hỏi trắc nghiệm",
      "Phiên học cố định 10 phút",
      "Hỗ trợ nhiều tài khoản con",
      "Báo cáo tiến bộ từng môn"
    ],
    "fileName": "on-bai-10-phut.html",
    "status": "ready",
    "engineSpec": "Bộ đệm Spaced Repetition"
  },
  {
    "slug": "on-tap-toan-tieng-viet-hk1-lop-4",
    "title": "Ôn tập Toán & Tiếng Việt lớp 4 (Học kỳ 1)",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Ôn tập theo đề cương học kỳ I và SGK Kết nối tri thức: 19 mảng Toán, 12 bài đọc, 117 câu Tiếng Việt và 3 kiểu bài viết.",
    "description": "Bài luyện tự biên soạn theo đề cương trường và đối chiếu Toán 4, Tiếng Việt 4 tập một bộ Kết nối tri thức với cuộc sống. Bé luyện theo chủ đề hoặc tạo đề, xem lời giải, ôn câu sai và tập viết có bảng tự rà. Đây không phải đề kiểm tra chính thức.",
    "suitableFor": "Học sinh lớp 4 ôn thi học kỳ 1, phụ huynh và giáo viên tiểu học.",
    "highlights": [
      "19 mảng Toán và bản đồ bài học SGK",
      "12 bài đọc, 117 câu Tiếng Việt",
      "Tạo đề, ôn câu sai, in phiếu",
      "Tải HTML dùng offline, lưu tiến độ cục bộ"
    ],
    "fileName": "on-tap-toan-tieng-viet-hk1-lop-4.html",
    "status": "ready",
    "badge": "Toán & Tiếng Việt",
    "isFeatured": true,
    "featuredRank": 7,
    "engineSpec": "Bộ sinh bài Toán và ngân hàng Tiếng Việt lớp 4"
  },
  {
    "slug": "on-tap-tieng-anh-hk1-lop-4-petrus-ky",
    "title": "English 4 · Ôn tập học kỳ 1 (Petrus Ký)",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Hệ thống ôn luyện tiếng Anh lớp 4 trọn vẹn 10 Unit học kỳ 1 theo chuẩn chương trình trường Petrus Ký.",
    "description": "Bộ ứng dụng tương tác ôn luyện ngữ pháp, từ vựng, phát âm và bài tập mẫu của toàn bộ 10 Unit tiếng Anh lớp 4 học kỳ 1. Giúp học sinh nắm chắc từ vựng, cấu trúc câu và tự tin đạt điểm 10 thi học kỳ.",
    "suitableFor": "Học sinh lớp 4 trường Petrus Ký và các trường tiểu học chuẩn quốc gia / song ngữ.",
    "highlights": [
      "Trọn vẹn 10 Unit tiếng Anh HK1",
      "Luyện từ vựng, ngữ pháp & phát âm",
      "Bài tập trắc nghiệm chấm điểm tự động",
      "Hoạt động offline độc lập"
    ],
    "fileName": "on-tap-tieng-anh-hk1-lop-4-petrus-ky.html",
    "status": "ready",
    "badge": "English 4 HK1",
    "isFeatured": true,
    "featuredRank": 8,
    "engineSpec": "10 Unit English 4 Interactive Bank"
  },
  {
    "slug": "on-tap-hoc-ky-1-lop-4-petrus-ky",
    "title": "Góc ôn tập học kỳ 1 lớp 4 (Petrus Ký)",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Bộ đề trắc nghiệm tổng hợp bám sát đề cương học kỳ 1 lớp 4 trường Petrus Ký.",
    "description": "Bộ câu hỏi trắc nghiệm số hóa trực tiếp từ đề cương ôn thi học kỳ I để học sinh tự luyện thi tại nhà, kiểm tra tiến độ và củng cố kiến thức trọng tâm.",
    "suitableFor": "Học sinh lớp 4 và phụ huynh ôn thi học kỳ.",
    "highlights": [
      "52 mục câu hỏi trọng tâm",
      "Chấm điểm tức thì",
      "Xem đáp án và lời giải",
      "Dành cho mục đích tham khảo ôn tập"
    ],
    "fileName": "on-tap-hoc-ky-1-lop-4-petrus-ky.html",
    "status": "ready",
    "badge": "Đề cương HK1",
    "engineSpec": "Đề cương số hóa tương tác"
  },
  {
    "slug": "luyen-go-10-ngon",
    "title": "Luyện gõ phím 10 ngón",
    "category": "ky-nang",
    "categoryLabel": "Kỹ năng & Tốc độ",
    "suite": "cognitive",
    "suiteLabel": "Kỹ năng & Tốc độ",
    "summary": "90 bài luyện tập từ cơ bản đến nâng cao, kiểm tra tốc độ gõ chuẩn WPM trong 60 giây.",
    "description": "Hệ thống bài tập luyện gõ phím tiếng Việt và tiếng Anh chuẩn công thái học. Hỗ trợ nhiều hồ sơ học viên, lưu lại biểu đồ tiến bộ và chứng nhận tốc độ.",
    "suitableFor": "Học sinh, sinh viên, người mới làm việc văn phòng, lập trình viên.",
    "highlights": [
      "90 bài tập có hướng dẫn ngón",
      "Bài test tốc độ 60 giây chuẩn WPM",
      "Quản lý nhiều học viên",
      "Hoạt động 100% offline"
    ],
    "fileName": "luyen-go-10-ngon.html",
    "status": "ready",
    "badge": "Công thái học",
    "isFeatured": true,
    "featuredRank": 6,
    "engineSpec": "Đồng hồ đo tốc độ WPM & Keystroke"
  },
  {
    "slug": "don-hang-shop-online",
    "fileName": "don-hang-shop-online.html",
    "title": "Quản lý đơn hàng Shop Online đa kênh",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Ghi nhận, phân loại trạng thái đơn hàng từ TikTok, Shopee, Facebook và đối soát tiền về ví.",
    "description": "Bộ sổ quản lý đơn hàng độc lập giúp chủ shop tổng hợp đơn từ nhiều kênh vào một nơi duy nhất. Tự động tính tổng doanh thu, phí ship, phụ thu và tình trạng giao nhận an toàn trên máy.",
    "suitableFor": "Chủ shop bán lẻ, người bán hàng online đa sàn, kinh doanh cá nhân.",
    "highlights": [
      "Tổng hợp đơn đa kênh",
      "Theo dõi trạng thái đóng gói & giao",
      "Tự động tính tiền hàng thực thu",
      "Lưu trữ offline không lo rò rỉ dữ liệu"
    ],
    "engineSpec": "Sổ cái quản lý đơn hàng đa kênh",
    "status": "ready"
  },
  {
    "slug": "giao-hang-cod",
    "fileName": "giao-hang-cod.html",
    "title": "Theo dõi giao hàng & Đối soát COD",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Kiểm soát tiền thu hộ COD từ các đơn vị vận chuyển GHN, GHTK, Viettel Post, chống sót tiền thu hộ.",
    "description": "Hệ thống quản lý đối soát dòng tiền COD độc lập, giúp người bán nhận diện ngay các đơn đã giao thành công nhưng shipper hoặc nhà vận chuyển chưa chuyển khoản trả tiền.",
    "suitableFor": "Chủ shop kinh doanh online, nhân viên kế toán kho vận bán lẻ.",
    "highlights": [
      "Đối soát tiền COD từng đơn",
      "Phát hiện tiền thu hộ bị treo",
      "Thống kê tỷ lệ giao thành công",
      "Xuất file đối soát Excel tức thì"
    ],
    "engineSpec": "Engine đối soát tiền thu hộ COD",
    "status": "ready"
  },
  {
    "slug": "hang-ky-gui-dai-ly-ctv",
    "fileName": "hang-ky-gui-dai-ly-ctv.html",
    "title": "Quản lý hàng ký gửi & Đại lý CTV",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Theo dõi tồn kho hàng ký gửi tại các điểm bán, công nợ tiền hàng đã bán và hạn thu hồi sản phẩm.",
    "description": "Giải pháp cho các xưởng sản xuất, tiệm bánh, xưởng may gửi hàng bán tại các showroom hoặc cộng tác viên. Kiểm soát số lượng hàng thực tế còn ở điểm ký gửi.",
    "suitableFor": "Xưởng thủ công, đơn vị ký gửi hàng tiêu dùng, mỹ phẩm, thời trang.",
    "highlights": [
      "Theo dõi hàng tại từng điểm gửi",
      "Tính tiền hàng đã bán được",
      "Cảnh báo thu hồi hàng chậm",
      "Biên bản bàn giao ký gửi"
    ],
    "engineSpec": "Sổ theo dõi ký gửi đa điểm",
    "status": "ready"
  },
  {
    "slug": "quan-ly-tap-hoa",
    "fileName": "quan-ly-tap-hoa.html",
    "title": "Quản lý cửa hàng tạp hóa & Bán lẻ",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Sổ quản lý danh mục hàng hóa, tính tiền quầy thu ngân nhanh và cảnh báo sắp hết hàng cho tiệm tạp hóa.",
    "description": "Ứng dụng bán lẻ cực nhẹ chạy ngay trên trình duyệt mà không cần cài đặt phần mềm POS nặng nề. Phù hợp cho tiệm tạp hóa gia đình ghi chép bán hàng hàng ngày.",
    "suitableFor": "Chủ tiệm tạp hóa, cửa hàng tiện lợi nhỏ, hộ kinh doanh gia đình.",
    "highlights": [
      "Giao diện tính tiền quầy nhanh",
      "Quản lý giá nhập và giá bán lẻ",
      "Cảnh báo mặt hàng sắp hết tồn",
      "Chạy mượt cả trên máy tính cũ"
    ],
    "engineSpec": "POS Thu ngân Tạp hóa Lite",
    "status": "ready"
  },
  {
    "slug": "quan-ly-quan-ca-phe",
    "fileName": "quan-ly-quan-ca-phe.html",
    "title": "Quản lý quán cà phê & Nhà hàng F&B",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Quản lý order theo bàn, tính tổng hóa đơn đồ uống và báo cáo doanh thu cuối ngày cho quán cà phê.",
    "description": "Giải pháp quản lý bàn và đồ uống tinh gọn cho quán cafe, trà sữa, quán ăn nhỏ. Không phí duy trì hàng tháng, hoạt động độc lập ngay cả khi mất kết nối mạng internet.",
    "suitableFor": "Chủ quán cafe, tiệm trà sữa, quán ăn gia đình, quầy take-away.",
    "highlights": [
      "Sơ đồ quản lý bàn trực quan",
      "In phiếu order và hóa đơn nhanh",
      "Thống kê món bán chạy nhất",
      "Bảo mật dữ liệu kinh doanh 100%"
    ],
    "engineSpec": "F&B Table & Order Manager",
    "status": "ready"
  },
  {
    "slug": "quan-ly-spa-salon",
    "fileName": "quan-ly-spa-salon.html",
    "title": "Quản lý Spa, Salon & Lịch dịch vụ",
    "category": "kinh-doanh",
    "categoryLabel": "Kinh doanh & Bán lẻ",
    "suite": "commercial",
    "suiteLabel": "Kinh doanh & Bán lẻ",
    "summary": "Xếp lịch hẹn khách hàng, theo dõi thẻ liệu trình dịch vụ và tính hoa hồng thợ làm đẹp.",
    "description": "Ứng dụng dành riêng cho tiệm nail, hair salon, thẩm mỹ viện và spa mini. Quản lý lịch hẹn không lo trùng giờ, theo dõi số buổi liệu trình còn lại của từng khách.",
    "suitableFor": "Chủ tiệm spa, salon tóc, tiệm nail, cơ sở thẩm mỹ chăm sóc da.",
    "highlights": [
      "Lịch hẹn khách theo khung giờ",
      "Theo dõi thẻ liệu trình còn lại",
      "Tính doanh thu và hoa hồng thợ",
      "Lưu trữ lịch sử làm đẹp của khách"
    ],
    "engineSpec": "Salon & Appointment Scheduler",
    "status": "ready"
  },
  {
    "slug": "bang-ke-hoa-don-dien-tu",
    "fileName": "bang-ke-hoa-don-dien-tu.html",
    "title": "Bảng kê hóa đơn điện tử đầu vào & đầu ra",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Quản lý, phân loại danh sách hóa đơn điện tử mua vào và bán ra phục vụ kê khai thuế định kỳ.",
    "description": "Giúp kế toán viên và chủ doanh nghiệp kiểm soát chặt chẽ số lượng hóa đơn, thuế suất VAT 5%, 8%, 10% và tổng tiền thuế được khấu trừ mà không lo thất lạc hóa đơn.",
    "suitableFor": "Kế toán nội bộ, kế toán dịch vụ, chủ doanh nghiệp SME.",
    "highlights": [
      "Tách riêng nhóm thuế suất 5%, 8%, 10%",
      "Kiểm tra số hóa đơn trùng lặp",
      "Tổng hợp số thuế đầu vào / đầu ra",
      "Xuất file đối chiếu chuẩn XML/Excel"
    ],
    "engineSpec": "Sổ kê hóa đơn điện tử chuẩn thuế",
    "status": "ready"
  },
  {
    "slug": "cau-noi-loi-nhuan-thu-nhap-tinh-thue",
    "fileName": "cau-noi-loi-nhuan-thu-nhap-tinh-thue.html",
    "title": "Cầu nối lợi nhuận & Thu nhập tính thuế TNDN",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Xác định các khoản điều chỉnh tăng giảm (B1 đến B14) từ lợi nhuận kế toán sang thu nhập chịu thuế TNDN.",
    "description": "Công cụ hỗ trợ quyết toán thuế thu nhập doanh nghiệp cuối năm. Rà soát chi phí không được trừ theo quy định hiện hành và xác định đúng số thuế TNDN phải nộp.",
    "suitableFor": "Kế toán thuế, kế toán trưởng, giám đốc tài chính doanh nghiệp.",
    "highlights": [
      "Bảng điều chỉnh chỉ tiêu B1–B14 chuẩn",
      "Tự động phân loại chi phí không hợp lệ",
      "Mô phỏng số thuế TNDN phải nộp",
      "Giảm thiểu rủi ro bị truy thu thuế"
    ],
    "engineSpec": "Mô hình cầu nối quyết toán TNDN",
    "status": "ready"
  },
  {
    "slug": "chuyen-doi-tai-khoan-tt99",
    "fileName": "chuyen-doi-tai-khoan-tt99.html",
    "title": "Chuyển đổi bảng hệ thống tài khoản TT99/2025",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Tra cứu và đối chiếu chuyển đổi hệ thống tài khoản kế toán doanh nghiệp theo Thông tư mới nhất.",
    "description": "Hỗ trợ doanh nghiệp cập nhật bảng hệ thống tài khoản kế toán mới theo Thông tư 99/2025/TT-BTC. Chuyển đổi số dư đầu kỳ nhanh chóng, chính xác giữa các tài khoản tương đương.",
    "suitableFor": "Kế toán viên, kiểm toán viên, sinh viên tài chính kế toán.",
    "highlights": [
      "Bản đồ đối chiếu tài khoản cũ - mới",
      "Gợi ý tài khoản thay thế tức thì",
      "Kiểm tra cân đối số dư chuyển đổi",
      "Tra cứu nhanh bằng phím tắt"
    ],
    "engineSpec": "Từ điển chuyển đổi tài khoản kế toán",
    "status": "ready"
  },
  {
    "slug": "cong-no-phai-thu",
    "fileName": "cong-no-phai-thu.html",
    "title": "Quản lý công nợ phải thu & Phân tích tuổi nợ",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Theo dõi số dư nợ của từng khách hàng, cảnh báo nợ quá hạn và phân tích tuổi nợ (Aging Report).",
    "description": "Giúp doanh nghiệp bảo toàn dòng tiền, phân loại các khoản nợ trong hạn, quá hạn 30, 60, 90 ngày để có kế hoạch thu hồi nợ kịp thời trước khi thành nợ xấu.",
    "suitableFor": "Kế toán công nợ, giám đốc kinh doanh, chủ doanh nghiệp.",
    "highlights": [
      "Phân nhóm tuổi nợ 30-60-90-180 ngày",
      "Cảnh báo khách hàng vượt hạn mức nợ",
      "In biên bản đối chiếu công nợ",
      "Lập kế hoạch thu tiền tuần"
    ],
    "engineSpec": "Aging Schedule & Receivables Engine",
    "status": "ready"
  },
  {
    "slug": "cong-no-phai-tra",
    "fileName": "cong-no-phai-tra.html",
    "title": "Quản lý công nợ phải trả & Lịch thanh toán",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Kiểm soát công nợ nhà cung cấp, lịch đến hạn thanh toán tiền hàng để chủ động dòng tiền chi trả.",
    "description": "Tránh phạt trễ hạn hoặc mất uy tín với nhà cung ứng. Lên lịch chi trả theo thứ tự ưu tiên và tối ưu hóa thời gian tận dụng vốn lưu động.",
    "suitableFor": "Kế toán thanh toán, quản lý mua hàng, thủ quỹ.",
    "highlights": [
      "Lịch thanh toán nợ theo tuần",
      "Ưu tiên khoản nợ có chiết khấu sớm",
      "Theo dõi số dư nợ từng nhà cung cấp",
      "Hạn chế rủi ro thiếu hụt ngân quỹ"
    ],
    "engineSpec": "Payables & Due Date Scheduler",
    "status": "ready"
  },
  {
    "slug": "doi-chieu-sao-ke",
    "fileName": "doi-chieu-sao-ke.html",
    "title": "Đối chiếu sao kê ngân hàng & Sổ tiền gửi",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Tự động so khớp từng dòng giao dịch sao kê ngân hàng với sổ quỹ tiền gửi kế toán, tìm ngay chênh lệch.",
    "description": "Tiết kiệm hàng giờ dò tìm từng giao dịch bằng mắt thường. Nhanh chóng phát hiện các khoản phí ngân hàng chưa hạch toán, lệnh chuyển tiền bị treo hoặc nhầm lẫn số tiền.",
    "suitableFor": "Kế toán tiền gửi, kiểm toán nội bộ, thủ quỹ doanh nghiệp.",
    "highlights": [
      "So khớp tự động theo mã giao dịch & số tiền",
      "Phát hiện khoản chênh lệch tức thì",
      "Báo cáo đối chiếu số dư cuối tháng",
      "Bảo mật tuyệt đối không tải dữ liệu lên web"
    ],
    "engineSpec": "Bank Reconciliation Matching Engine",
    "status": "ready"
  },
  {
    "slug": "du-bao-dong-tien-13-tuan",
    "fileName": "du-bao-dong-tien-13-tuan.html",
    "title": "Dự báo dòng tiền 13 tuần (13-Week Cashflow)",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Mô hình dự báo dòng tiền trực tiếp (Direct Cashflow) 13 tuần chuẩn quốc tế cho CEO và CFO.",
    "description": "Nhìn thấy trước điểm gãy dòng tiền từ 1 đến 3 tháng để kịp thời đàm phán giãn nợ hoặc kích cầu doanh thu. Công cụ quản trị thanh khoản sống còn cho mọi doanh nghiệp.",
    "suitableFor": "Giám đốc điều hành (CEO), Giám đốc tài chính (CFO), Chủ sáng lập startup.",
    "highlights": [
      "Mô hình 13 tuần chuẩn quốc tế",
      "Dự báo dòng tiền thu - chi theo tuần",
      "Cảnh báo thời điểm số dư âm",
      "Mô phỏng kịch bản dòng tiền xấu nhất"
    ],
    "engineSpec": "13-Week Direct Cashflow Model",
    "status": "ready"
  },
  {
    "slug": "ho-so-chung-tu-thieu",
    "fileName": "ho-so-chung-tu-thieu.html",
    "title": "Theo dõi hồ sơ chứng từ kế toán còn thiếu",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Lập danh sách theo dõi các khoản chi chưa có hóa đơn VAT, biên bản nghiệm thu hoặc hợp đồng gốc.",
    "description": "Giúp bộ phận kế toán đôn đốc nhân sự và nhà cung cấp bổ sung chứng từ kịp thời trước kỳ thanh kiểm tra quyết toán thuế. Không còn nỗi lo bị xuất toán chi phí.",
    "suitableFor": "Kế toán tổng hợp, kế toán trưởng, kiểm soát viên nội bộ.",
    "highlights": [
      "Phân loại chứng từ theo mức độ ưu tiên",
      "Nhắc nhở người phụ trách bổ sung",
      "Trạng thái đã nhận / còn thiếu rõ ràng",
      "Xuất danh sách đòi chứng từ"
    ],
    "engineSpec": "Audit Compliance Document Tracker",
    "status": "ready"
  },
  {
    "slug": "kiem-tra-so-sach",
    "fileName": "kiem-tra-so-sach.html",
    "title": "Kiểm tra rà soát sổ sách trước khóa sổ",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Bộ quy tắc kiểm tra tính hợp lý, cân đối các tài khoản tài sản và nguồn vốn trước khi lập báo cáo tài chính.",
    "description": "Tự động rà soát số dư âm bất thường ở tài khoản 111, 112, 131, 331, kiểm tra tính liên tục của chứng từ và cảnh báo các bút toán hạch toán lệch.",
    "suitableFor": "Kế toán tổng hợp, kế toán trưởng làm BCTC cuối năm.",
    "highlights": [
      "Cảnh báo tài khoản có số dư bất thường",
      "Kiểm tra cân đối phát sinh Nợ - Có",
      "Rà soát chi phí trích trước",
      "Checklist chuẩn trước khi khóa sổ"
    ],
    "engineSpec": "Pre-closing Trial Balance Auditor",
    "status": "ready"
  },
  {
    "slug": "lich-nop-thue-nsnn",
    "fileName": "lich-nop-thue-nsnn.html",
    "title": "Lịch nghĩa vụ thuế & Nộp ngân sách nhà nước",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Theo dõi hạn nộp tờ khai thuế GTGT, TNCN, TNDN tạm tính và tiền thuế phải nộp vào kho bạc.",
    "description": "Cập nhật đầy đủ các mốc thời gian nộp thuế định kỳ theo tháng, quý và năm. Tránh hoàn toàn việc bị phạt tiền chậm nộp tờ khai hoặc chậm nộp thuế theo luật Quản lý thuế.",
    "suitableFor": "Kế toán thuế, chủ hộ kinh doanh, giám đốc doanh nghiệp vừa và nhỏ.",
    "highlights": [
      "Lịch đếm ngược hạn nộp tờ khai",
      "Tính tiền chậm nộp thuế tự động (0.03%/ngày)",
      "Theo dõi biên lai nộp tiền vào NSNN",
      "Phân loại thuế môn bài, GTGT, TNDN, TNCN"
    ],
    "engineSpec": "Tax Due Date & Penalty Calculator",
    "status": "ready"
  },
  {
    "slug": "nhat-ky-chung-can-doi",
    "fileName": "nhat-ky-chung-can-doi.html",
    "title": "Nhật ký chung & Bảng cân đối số phát sinh",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Ghi chép sổ nhật ký chung và tự động kết chuyển lên bảng cân đối số phát sinh tài khoản.",
    "description": "Bộ khung sổ sách kế toán cốt lõi giúp người làm kế toán độc lập nhập liệu định khoản Nợ/Có và tự động sinh bảng cân đối số phát sinh nhanh chóng mà không cần phần mềm phức tạp.",
    "suitableFor": "Kế toán viên, doanh nghiệp siêu nhỏ, người học thực hành kế toán.",
    "highlights": [
      "Nhập liệu định khoản Nợ / Có trực quan",
      "Tự động cộng phát sinh và số dư cuối kỳ",
      "Kiểm tra tuyệt đối cân đối Nợ = Có",
      "Xuất bảng cân đối dạng bảng tính"
    ],
    "engineSpec": "General Journal & Balance Sheet Engine",
    "status": "ready"
  },
  {
    "slug": "phan-bo-chi-phi",
    "fileName": "phan-bo-chi-phi.html",
    "title": "Phân bổ chi phí trả trước & Công cụ dụng cụ",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Quản lý tài khoản 242, lập bảng trích phân bổ chi phí thuê nhà, CCDC vào chi phí hàng tháng.",
    "description": "Tự động tính số tiền cần trích phân bổ trong từng tháng, số dư còn lại chưa phân bổ và cảnh báo khi tài sản hoặc công cụ dụng cụ đã hết thời gian phân bổ.",
    "suitableFor": "Kế toán tổng hợp, kế toán chi phí doanh nghiệp.",
    "highlights": [
      "Lập bảng phân bổ chi phí 242 theo tháng",
      "Tính đúng số ngày thực tế trong kỳ",
      "Theo dõi số dư còn lại chính xác",
      "Hạch toán tự động từng kỳ"
    ],
    "engineSpec": "Prepaid Expense Amortization Table",
    "status": "ready"
  },
  {
    "slug": "ra-soat-chi-phi",
    "fileName": "ra-soat-chi-phi.html",
    "title": "Rà soát chi phí hợp lý hợp lệ 2026",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Bộ tiêu chí rà soát hồ sơ thanh toán, hợp đồng, hóa đơn đảm bảo chi phí được trừ khi quyết toán thuế.",
    "description": "Checklist kiểm tra 12 điều kiện chi phí hợp lý: chứng từ thanh toán không dùng tiền mặt trên 20 triệu, định mức xăng xe, công tác phí và phúc lợi cho người lao động.",
    "suitableFor": "Kế toán thuế, kiểm soát chi phí, ban giám đốc.",
    "highlights": [
      "Checklist 12 điều kiện chi phí được trừ",
      "Cảnh báo giao dịch tiền mặt trên 20 triệu",
      "Tính hạn mức chi phúc lợi 01 tháng lương",
      "Bảo vệ chi phí trước đoàn thanh tra thuế"
    ],
    "engineSpec": "Tax Deductible Expense Verifier",
    "status": "ready"
  },
  {
    "slug": "so-quy-phieu-thu-chi",
    "fileName": "so-quy-phieu-thu-chi.html",
    "title": "Sổ quỹ tiền mặt & Phiếu thu chi tự động",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Quản lý tồn quỹ tiền mặt hàng ngày, tự động sinh và in phiếu thu, phiếu chi kèm chữ ký chuẩn.",
    "description": "Bộ sổ quỹ tiền mặt cực chuẩn dành cho thủ quỹ và kế toán nội bộ. Cập nhật số dư tức thì sau mỗi bút toán thu chi, không bao giờ lo âm quỹ tiền mặt.",
    "suitableFor": "Thủ quỹ công ty, kế toán nội bộ, chủ cửa hàng kinh doanh.",
    "highlights": [
      "In phiếu thu / phiếu chi chuẩn mẫu",
      "Theo dõi tồn quỹ tiền mặt theo thời gian thực",
      "Đối chiếu sổ quỹ với tiền kiểm đếm thực tế",
      "Lưu trữ offline bảo mật số dư"
    ],
    "engineSpec": "Cash Book & Voucher Generator",
    "status": "ready"
  },
  {
    "slug": "so-thu-chi-gia-dinh",
    "fileName": "so-thu-chi-gia-dinh.html",
    "title": "Sổ thu chi gia đình & Kế hoạch chi tiêu",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Nhật ký ghi chép chi tiêu sinh hoạt hàng ngày, phân loại tiền ăn, học phí, tiền điện nước và tiết kiệm.",
    "description": "Giao diện đơn giản, dễ dùng cho mọi thành viên trong gia đình. Giúp kiểm soát chi tiêu không bị vung tay quá trán, lập quỹ khẩn cấp và theo dõi tài sản gia đình.",
    "suitableFor": "Người quản lý tài chính gia đình, các cặp vợ chồng trẻ, cá nhân muốn sống tiết kiệm.",
    "highlights": [
      "Ghi nhanh khoản thu chi trong ngày",
      "Biểu đồ phân tích cơ cấu chi tiêu",
      "Cảnh báo khi vượt hạn mức tháng",
      "Không chia sẻ dữ liệu ra server ngoài"
    ],
    "engineSpec": "Family Spending & Budget Ledger",
    "status": "ready"
  },
  {
    "slug": "so-von-loi-nhuan-ho-kinh-doanh",
    "fileName": "so-von-loi-nhuan-ho-kinh-doanh.html",
    "title": "Sổ vốn & Lợi nhuận hộ kinh doanh cá thể",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Quản lý vốn góp kinh doanh, chi phí nhập hàng, doanh thu bán hàng và tính lợi nhuận ròng của chủ hộ.",
    "description": "Thiết kế chuẩn hóa cho hộ kinh doanh cá thể, quán ăn, xưởng nhỏ muốn biết chính xác đồng vốn bỏ ra sinh lời bao nhiêu mỗi tháng mà không cần học kế toán phức tạp.",
    "suitableFor": "Chủ hộ kinh doanh cá thể, tiểu thương, người khởi nghiệp quy mô nhỏ.",
    "highlights": [
      "Theo dõi biến động nguồn vốn kinh doanh",
      "Tính lãi gộp và lãi ròng hàng tháng",
      "Quản lý công nợ khách quen",
      "Báo cáo doanh số đơn giản, dễ hiểu"
    ],
    "engineSpec": "Sole Proprietorship Capital & Profit Ledger",
    "status": "ready"
  },
  {
    "slug": "tai-san-co-dinh-khau-hao",
    "fileName": "tai-san-co-dinh-khau-hao.html",
    "title": "Quản lý tài sản cố định & Trích khấu hao",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Theo dõi danh mục TSCĐ, khung thời gian khấu hao theo Thông tư 45/2013 và lập bảng tính trích khấu hao.",
    "description": "Tự động tính khấu hao đường thẳng hàng tháng, theo dõi nguyên giá, giá trị hao mòn lũy kế và giá trị còn lại của máy móc, xe cộ, nhà xưởng công ty.",
    "suitableFor": "Kế toán tài sản, kế toán tổng hợp, quản lý cơ sở vật chất.",
    "highlights": [
      "Khung trích khấu hao chuẩn TT45/2013",
      "Tính khấu hao tự động theo tháng / quý / năm",
      "Theo dõi lịch sử thanh lý, điều chuyển TSCĐ",
      "Xuất bảng phân bổ khấu hao vào giá thành"
    ],
    "engineSpec": "Fixed Asset Depreciation Matrix",
    "status": "ready"
  },
  {
    "slug": "tinh-bhxh-bhyt-bhtn",
    "fileName": "tinh-bhxh-bhyt-bhtn.html",
    "title": "Bảng tính trích đóng BHXH, BHYT, BHTN & KPCĐ",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Tính toán chính xác tỷ lệ đóng bảo hiểm 32% (doanh nghiệp 21.5%, người lao động 10.5%) theo mức lương đóng.",
    "description": "Cập nhật mức trần đóng BHXH/BHYT (20 lần lương cơ sở) và BHTN (20 lần lương tối thiểu vùng). Hỗ trợ lập bảng tổng hợp đóng bảo hiểm hàng tháng gửi cơ quan BHXH.",
    "suitableFor": "Chuyên viên C&B, kế toán tiền lương, nhân sự hành chính.",
    "highlights": [
      "Cập nhật mức đóng BHXH 32% chuẩn",
      "Kiểm tra mức trần đóng bảo hiểm",
      "Tách riêng phần DN nộp và NLĐ nộp",
      "Xuất bảng đối chiếu tiền lương & bảo hiểm"
    ],
    "engineSpec": "Payroll Social Insurance Calculator",
    "status": "ready"
  },
  {
    "slug": "to-khai-gtgt",
    "fileName": "to-khai-gtgt.html",
    "title": "Bảng tổng hợp lập tờ khai thuế GTGT",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Tổng hợp các chỉ tiêu [21] đến [43] phục vụ lập tờ khai thuế giá trị gia tăng mẫu 01/GTGT theo quý/tháng.",
    "description": "Hỗ trợ kế toán đối chiếu số thuế GTGT đầu vào được khấu trừ, số thuế GTGT đầu ra phải nộp và xác định số thuế còn được khấu trừ chuyển kỳ sau ([43]) hay phải nộp ([40]).",
    "suitableFor": "Kế toán thuế, đại lý thuế, chủ doanh nghiệp theo dõi số thuế phải nộp.",
    "highlights": [
      "Đầy đủ mã chỉ tiêu [21] đến [43] chuẩn",
      "Tự động so khớp thuế đầu vào & đầu ra",
      "Hỗ trợ cả kê khai tháng và quý",
      "Hạn chế sai lệch số học trên tờ khai thuế"
    ],
    "engineSpec": "VAT Tax Declaration Form 01/GTGT",
    "status": "ready"
  },
  {
    "slug": "trich-lap-du-phong",
    "fileName": "trich-lap-du-phong.html",
    "title": "Tính trích lập dự phòng nợ phải thu & Hàng tồn kho",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Tính mức trích lập dự phòng nợ khó đòi theo tuổi nợ (30%, 50%, 70%, 100%) và dự phòng giảm giá hàng tồn kho.",
    "description": "Giúp doanh nghiệp tuân thủ đúng quy định trích lập dự phòng tài chính theo Thông tư 48/2019/TT-BTC, bảo đảm tính thận trọng của báo cáo tài chính và quyền lợi chi phí được trừ.",
    "suitableFor": "Kế toán trưởng, kiểm toán viên, giám đốc tài chính.",
    "highlights": [
      "Tỷ lệ trích lập dự phòng theo TT48/2019",
      "Định giá giá trị thuần có thể thực hiện (NRV)",
      "Tự động tính hoàn nhập hoặc trích thêm",
      "Hồ sơ chứng minh hợp lệ trước kiểm toán"
    ],
    "engineSpec": "Financial Provision & Reserve Engine",
    "status": "ready"
  },
  {
    "slug": "ty-gia-cong-no-ngoai-te",
    "fileName": "ty-gia-cong-no-ngoai-te.html",
    "title": "Theo dõi tỷ giá & Đánh giá công nợ ngoại tệ",
    "category": "tai-chinh",
    "categoryLabel": "Tài chính & Thuế",
    "suite": "finance",
    "suiteLabel": "Tài chính, Kế toán & Thuế",
    "summary": "Quản lý công nợ USD/EUR, hạch toán chênh lệch tỷ giá thực tế phát sinh và đánh giá lại số dư cuối kỳ (TK 413).",
    "description": "Hỗ trợ các doanh nghiệp xuất nhập khẩu theo dõi chính xác biến động tỷ giá ngân hàng mua/bán, tính lãi lỗ chênh lệch tỷ giá từng hợp đồng và cuối năm tài chính.",
    "suitableFor": "Kế toán thanh toán quốc tế, doanh nghiệp XNK, công ty FDI.",
    "highlights": [
      "Theo dõi song song nguyên tệ và VND",
      "Hạch toán chênh lệch tỷ giá TK 413, 515, 635",
      "Đánh giá lại số dư ngoại tệ cuối năm",
      "Quản trị rủi ro biến động tỷ giá hối đoái"
    ],
    "engineSpec": "FX Currency & Revaluation Matrix",
    "status": "ready"
  },
  {
    "slug": "danh-gia-nha-cung-cap-dinh-ky",
    "fileName": "danh-gia-nha-cung-cap-dinh-ky.html",
    "title": "Đánh giá nhà cung cấp định kỳ theo tiêu chí",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Chấm điểm nhà cung ứng theo 5 tiêu chí: chất lượng, tiến độ giao hàng, giá cả, dịch vụ và điều khoản thanh toán.",
    "description": "Xây dựng ma trận chấm điểm khách quan giúp phòng mua hàng lựa chọn đối tác tin cậy, thương lượng mức chiết khấu tốt hơn và loại bỏ các nhà cung cấp kém chất lượng.",
    "suitableFor": "Trưởng phòng mua hàng (Procurement), quản lý chuỗi cung ứng, giám đốc sản xuất.",
    "highlights": [
      "Ma trận trọng số 5 tiêu chí chuẩn",
      "Chấm điểm xếp loại A, B, C, D",
      "Lịch sử đánh giá qua các kỳ",
      "Báo cáo so sánh năng lực nhà cung ứng"
    ],
    "engineSpec": "Vendor Evaluation & Scoring Matrix",
    "status": "ready"
  },
  {
    "slug": "dinh-luong-mon-gia-von-gia-ban",
    "fileName": "dinh-luong-mon-gia-von-gia-ban.html",
    "title": "Định lượng món ăn & Tính giá vốn F&B",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Xây dựng định lượng nguyên liệu từng món ăn, tính Food Cost % và đề xuất giá bán tối ưu cho quán ăn.",
    "description": "Giúp chủ quán F&B kiểm soát thất thoát nguyên liệu, biết chính xác mỗi dĩa đồ ăn hay ly đồ uống tốn bao nhiêu tiền vốn để định giá thực đơn có lãi bền vững.",
    "suitableFor": "Bếp trưởng, chủ quán ăn, nhà hàng, quán cà phê, tiệm bánh.",
    "highlights": [
      "Định lượng chi tiết từng gram nguyên liệu",
      "Tính tỷ lệ Food Cost % chuẩn ngành",
      "Đề xuất giá bán theo biên lợi nhuận kỳ vọng",
      "Tự động cập nhật giá vốn khi giá nguyên liệu đổi"
    ],
    "engineSpec": "F&B Recipe Costing & Food Cost Calculator",
    "status": "ready"
  },
  {
    "slug": "dinh-muc-nguyen-vat-lieu-bom",
    "fileName": "dinh-muc-nguyen-vat-lieu-bom.html",
    "title": "Định mức nguyên vật liệu sản xuất (BOM)",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Quản lý bảng định mức nguyên vật liệu (Bill of Materials) đa cấp cho từng mã thành phẩm sản xuất.",
    "description": "Công cụ thiết yếu cho các xưởng cơ khí, may mặc, chế biến gỗ và sản xuất hàng tiêu dùng. Tính toán tổng lượng vật tư cần xuất kho cho một lô sản xuất cụ thể.",
    "suitableFor": "Kỹ sư sản xuất, quản đốc xưởng, kế toán kho vật tư.",
    "highlights": [
      "Cấu trúc cây định mức BOM chuẩn",
      "Tính tổng vật tư cần cho số lượng thành phẩm",
      "Kiểm tra hao hụt trong quá trình gia công",
      "Xuất yêu cầu cấp phát vật tư chuẩn"
    ],
    "engineSpec": "Bill of Materials (BOM) Multi-level Matrix",
    "status": "ready"
  },
  {
    "slug": "gia-cong-ngoai-giao-nhan",
    "fileName": "gia-cong-ngoai-giao-nhan.html",
    "title": "Quản lý gia công ngoài & Giao nhận bán thành phẩm",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Theo dõi số lượng vật tư giao cho đơn vị gia công, kiểm soát tỷ lệ thu hồi thành phẩm và phế liệu.",
    "description": "Ngăn chặn thất thoát nguyên phụ liệu khi thuê xưởng ngoài gia công. Kiểm tra tiến độ hoàn thành, đơn giá gia công công đoạn và lập biên bản đối soát tiền công.",
    "suitableFor": "Quản lý sản xuất ngành may mặc, cơ khí chế tạo, in ấn bao bì.",
    "highlights": [
      "Ghi nhận xuất phôi / vật tư gia công",
      "Kiểm soát tỷ lệ hao hụt thỏa thuận",
      "Theo dõi bán thành phẩm gửi nhiều xưởng",
      "Bảng đối soát thanh toán tiền công"
    ],
    "engineSpec": "Subcontracting & Outsource Production Tracker",
    "status": "ready"
  },
  {
    "slug": "giao-nhan-van-chuyen-hang",
    "fileName": "giao-nhan-van-chuyen-hang.html",
    "title": "Theo dõi giao nhận vận chuyển hàng hóa",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Quản lý các chuyến xe vận chuyển hàng, lái xe phụ trách, chi phí cước và biên bản giao nhận có ký nhận.",
    "description": "Bộ sổ điều phối xe và hàng hóa nội bộ giúp doanh nghiệp kiểm soát cước vận tải, tình trạng giao hàng từng chuyến, giảm thiểu thời gian chờ và thất lạc hàng hóa.",
    "suitableFor": "Điều phối viên logistics, quản lý đội xe tải, thủ kho giao nhận.",
    "highlights": [
      "Lập lịch phân chuyến xe hàng ngày",
      "Theo dõi trạng thái giao từng chuyến",
      "Kiểm soát chi phí cước xe và cầu đường",
      "Quản lý biên bản giao nhận có ký xác nhận"
    ],
    "engineSpec": "Fleet & Dispatch Delivery Logistics Log",
    "status": "ready"
  },
  {
    "slug": "hao-hut-nguyen-vat-lieu",
    "fileName": "hao-hut-nguyen-vat-lieu.html",
    "title": "Kiểm soát định mức hao hụt nguyên vật liệu",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "So sánh tỷ lệ hao hụt thực tế với định mức kỹ thuật cho phép, phát hiện công đoạn làm rơi vãi vật tư.",
    "description": "Nhận diện sớm các nguyên nhân gây lãng phí nguyên liệu trong quá trình sản xuất: máy móc bị lỗi, thao tác công nhân chưa chuẩn hoặc chất lượng nguyên liệu đầu vào kém.",
    "suitableFor": "Quản đốc phân xưởng, kỹ sư Lean/Kaizen, kế toán giá thành.",
    "highlights": [
      "So sánh định mức cho phép vs thực tế",
      "Cảnh báo khi vượt ngưỡng hao hụt đỏ",
      "Phân tích nguyên nhân theo từng máy / ca",
      "Đề xuất biện pháp khắc phục tiết kiệm"
    ],
    "engineSpec": "Material Scrap & Variance Analyzer",
    "status": "ready"
  },
  {
    "slug": "ke-hoach-ca-lam-tang-ca-xuong",
    "fileName": "ke-hoach-ca-lam-tang-ca-xuong.html",
    "title": "Kế hoạch phân ca làm & Tăng ca phân xưởng",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Sắp xếp lịch ca 1, ca 2, ca đêm và phê duyệt số giờ làm thêm (Overtime) của công nhân xưởng sản xuất.",
    "description": "Cân đối nhân lực vận hành máy móc theo công suất đơn hàng. Kiểm soát tổng số giờ tăng ca của người lao động không vượt quá quy định của Bộ luật Lao động.",
    "suitableFor": "Quản đốc xưởng, tổ trưởng sản xuất, nhân sự tiền lương nhà máy.",
    "highlights": [
      "Sắp ca xoay vòng công bằng, rõ ràng",
      "Theo dõi số giờ tăng ca (OT) từng người",
      "Cảnh báo chạm trần 200–300 giờ OT/năm",
      "Tính hệ số lương tăng ca 150%, 200%, 300%"
    ],
    "engineSpec": "Shift Scheduling & Overtime Compliance Matrix",
    "status": "ready"
  },
  {
    "slug": "ke-hoach-mua-nguyen-lieu",
    "fileName": "ke-hoach-mua-nguyen-lieu.html",
    "title": "Kế hoạch mua nguyên liệu & Điểm đặt hàng an toàn",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Tính toán lượng tồn kho an toàn (Safety Stock) và điểm đặt hàng lại (Reorder Point - ROP) theo chu kỳ cấp hàng.",
    "description": "Không bao giờ để dây chuyền sản xuất phải dừng vì thiếu nguyên liệu, đồng thời tránh tồn kho quá mức gây đọng vốn lưu động. Cân bằng tối ưu giữa chi phí lưu kho và chi phí mua hàng.",
    "suitableFor": "Chuyên viên mua hàng, quản lý kho vật tư, điều độ sản xuất.",
    "highlights": [
      "Tính điểm đặt hàng lại ROP tự động",
      "Mức tồn kho an toàn theo thời gian giao hàng",
      "Cảnh báo vật tư dưới ngưỡng báo động",
      "Lập đề xuất mua hàng kịp thời"
    ],
    "engineSpec": "MRP & Reorder Point (ROP) Calculator",
    "status": "ready"
  },
  {
    "slug": "ke-hoach-san-xuat-don-hang",
    "fileName": "ke-hoach-san-xuat-don-hang.html",
    "title": "Kế hoạch tiến độ sản xuất theo đơn hàng",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Lập lịch trình sản xuất tổng thể (Master Production Schedule), kiểm soát tiến độ từng đơn và hạn giao hàng.",
    "description": "Bản đồ điều phối sản xuất trực quan giúp ban quản đốc biết rõ đơn hàng nào đang chạy, máy nào đang làm và đơn hàng nào có nguy cơ trễ hạn giao cho khách.",
    "suitableFor": "Phòng kế hoạch sản xuất, giám đốc nhà máy, quản đốc.",
    "highlights": [
      "Biểu đồ tiến độ sản xuất trực quan",
      "Theo dõi hạn giao hàng từng đơn (Lead time)",
      "Cảnh báo nguy cơ nghẽn cổ chai chuyền",
      "Điều chỉnh công suất ca kíp linh hoạt"
    ],
    "engineSpec": "Master Production Schedule (MPS) Planner",
    "status": "ready"
  },
  {
    "slug": "khuon-mau-dung-cu-muon-tra",
    "fileName": "khuon-mau-dung-cu-muon-tra.html",
    "title": "Quản lý mượn trả khuôn mẫu & Dụng cụ đồ gá",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Kiểm soát ai đang mượn dụng cụ nào, tình trạng khuôn mẫu khi trả và lịch bảo dưỡng vệ sinh gá đặt.",
    "description": "Chấm dứt tình trạng thất lạc dụng cụ cơ khí đắt tiền hoặc khuôn mẫu bị hư hỏng không rõ người chịu trách nhiệm. Quản lý việc bàn giao rõ ràng tại kho dụng cụ xưởng.",
    "suitableFor": "Thủ kho dụng cụ, xưởng cơ khí khuôn mẫu, tổ bảo trì.",
    "highlights": [
      "Ghi nhận mượn / trả dụng cụ theo tên thợ",
      "Kiểm tra tình trạng hao mòn khuôn mẫu",
      "Lịch bảo trì mài khuôn định kỳ",
      "Tra cứu tức thì vị trí lưu trữ dụng cụ"
    ],
    "engineSpec": "Tooling & Mold Custody Tracking Log",
    "status": "ready"
  },
  {
    "slug": "kiem-tra-chat-luong-lo",
    "fileName": "kiem-tra-chat-luong-lo.html",
    "title": "Kiểm tra chất lượng kiểm nghiệm theo lô (KCS / QC)",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Lập phiếu kiểm nghiệm chất lượng theo tiêu chuẩn AQL, ghi nhận tỷ lệ lỗi và phê duyệt xuất/nhập lô hàng.",
    "description": "Quy trình kiểm soát chất lượng đầu vào (IQC), trong quá trình (PQC) và thành phẩm (OQC). Đảm bảo chỉ những sản phẩm đạt chuẩn mới được nhập kho hoặc giao khách.",
    "suitableFor": "Nhân viên KCS/QC/QA, quản lý chất lượng nhà máy.",
    "highlights": [
      "Tiêu chuẩn lấy mẫu kiểm tra AQL",
      "Phân loại lỗi nặng, lỗi nhẹ, lỗi nghiêm trọng",
      "Biên bản kiểm nghiệm chất lượng theo lô",
      "Thống kê tỷ lệ lỗi theo nhà cung cấp"
    ],
    "engineSpec": "AQL Quality Inspection & QC Acceptance Log",
    "status": "ready"
  },
  {
    "slug": "lenh-san-xuat-cong-doan",
    "fileName": "lenh-san-xuat-cong-doan.html",
    "title": "Lệnh sản xuất & Điều phối công đoạn chuyền",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Phát lệnh sản xuất chi tiết cho từng tổ/công đoạn: cắt, hàn, sơn, lắp ráp, đóng gói hoàn thiện.",
    "description": "Theo dõi số lượng bán thành phẩm chuyển giao giữa các công đoạn. Nhận diện ngay công đoạn đang bị ứ đọng bán thành phẩm (WIP) để kịp thời hỗ trợ nhân sự.",
    "suitableFor": "Tổ trưởng sản xuất, quản đốc chuyền, kế toán kho bán thành phẩm.",
    "highlights": [
      "In phiếu lệnh sản xuất công đoạn chuẩn",
      "Theo dõi sản lượng đạt được của từng tổ",
      "Kiểm soát lượng bán thành phẩm dở dang WIP",
      "Đồng bộ tiến độ giữa các chuyền"
    ],
    "engineSpec": "Shop Floor Routing & Work Order Tracker",
    "status": "ready"
  },
  {
    "slug": "lich-bao-tri-may-moc",
    "fileName": "lich-bao-tri-may-moc.html",
    "title": "Lập lịch & Nhật ký bảo trì máy móc thiết bị",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Lên lịch bảo dưỡng phòng ngừa (Preventive Maintenance), ghi nhật ký thay dầu, thay linh kiện máy móc.",
    "description": "Bảo dưỡng định kỳ giúp tăng tuổi thọ thiết bị và giảm thiểu thời gian dừng máy đột xuất. Quản lý lịch sử sửa chữa của từng động cơ, máy nén khí, dây chuyền.",
    "suitableFor": "Kỹ sư bảo trì cơ điện, quản lý thiết bị nhà máy, xưởng cơ khí.",
    "highlights": [
      "Lịch bảo dưỡng định kỳ tuần / tháng / năm",
      "Nhắc thay nhớt, lọc gió, vòng bi",
      "Ghi nhật ký sửa chữa từng mã máy",
      "Thống kê chi phí phụ tùng thay thế"
    ],
    "engineSpec": "Preventive Maintenance Schedule & Asset Log",
    "status": "ready"
  },
  {
    "slug": "lo-hang-han-dung-trong-kho",
    "fileName": "lo-hang-han-dung-trong-kho.html",
    "title": "Quản lý lô sản xuất & Hạn dùng trong kho (FEFO)",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Kiểm soát ngày sản xuất (NSX), hạn sử dụng (HSD) từng lô hàng theo nguyên tắc xuất trước hết hạn trước.",
    "description": "Giải pháp cho kho dược phẩm, thực phẩm, mỹ phẩm, hóa chất. Cảnh báo sớm các lô hàng còn dưới 30, 60 ngày hết hạn để ưu tiên xuất bán hoặc có phương án xử lý.",
    "suitableFor": "Thủ kho thực phẩm, dược phẩm, mỹ phẩm, quản lý kho hàng tiêu dùng.",
    "highlights": [
      "Nguyên tắc xuất kho ưu tiên FEFO",
      "Cảnh báo lô hàng cận date theo màu sắc",
      "Truy xuất nguồn gốc lô hàng theo số Lot/Batch",
      "Giảm thiểu tối đa hàng bị hủy do hết hạn"
    ],
    "engineSpec": "FEFO Batch & Expiry Date Management System",
    "status": "ready"
  },
  {
    "slug": "luong-cong-nhan-theo-san-pham",
    "fileName": "luong-cong-nhan-theo-san-pham.html",
    "title": "Tính lương khoán sản phẩm công nhân trực tiếp",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Ghi nhận sản lượng từng công nhân, nhân đơn giá công đoạn và tính lương khoán sản phẩm cuối tháng.",
    "description": "Tính lương minh bạch, công bằng dựa trên năng suất thực tế. Công nhân có thể tự theo dõi sản lượng hàng ngày, loại bỏ tranh cãi khi nhận phiếu lương.",
    "suitableFor": "Kế toán tiền lương xưởng may, xưởng gỗ, xưởng gia công cơ khí.",
    "highlights": [
      "Đơn giá khoán theo từng loại công đoạn",
      "Cộng dồn sản lượng theo từng ngày làm việc",
      "Tự động trừ sản phẩm lỗi nếu có thỏa thuận",
      "In bảng kê lương sản phẩm cho từng công nhân"
    ],
    "engineSpec": "Piece-rate Payroll & Output Engine",
    "status": "ready"
  },
  {
    "slug": "nang-suat-phe-pham",
    "fileName": "nang-suat-phe-pham.html",
    "title": "Theo dõi năng suất chuyền & Tỷ lệ phế phẩm lỗi",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Đo lường hiệu suất tổng thể thiết bị (OEE), sản lượng đạt chuẩn và tỷ lệ phế phẩm theo từng ca sản xuất.",
    "description": "Cung cấp góc nhìn thực tế về hiệu quả hoạt động của nhà máy. Giúp ban điều hành xác định nguyên nhân chính gây hao hụt sản lượng để cải tiến liên tục.",
    "suitableFor": "Giám đốc nhà máy, quản đốc sản xuất, chuyên viên cải tiến quy trình.",
    "highlights": [
      "Đo tỷ lệ sản phẩm đạt chuẩn First Pass Yield",
      "Phân loại dạng lỗi phế phẩm phổ biến",
      "Biểu đồ năng suất so với mục tiêu ca",
      "Hỗ trợ chuẩn hóa quản lý chất lượng Lean"
    ],
    "engineSpec": "Defect Rate & OEE Yield Tracker",
    "status": "ready"
  },
  {
    "slug": "nhat-ky-su-co-dung-may",
    "fileName": "nhat-ky-su-co-dung-may.html",
    "title": "Nhật ký xử lý sự cố dừng máy sản xuất (Downtime)",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Ghi nhận thời gian dừng máy do hỏng hóc, thiếu vật tư hoặc cúp điện; tính thời gian phục hồi MTTR & MTBF.",
    "description": "Phân tích nguyên nhân gốc rễ (RCA) của các vụ dừng máy kéo dài. Giúp xưởng nâng cao độ tin cậy của máy móc và rút ngắn thời gian sửa chữa của đội bảo trì.",
    "suitableFor": "Kỹ sư cơ điện, trưởng ca sản xuất, quản đốc nhà máy.",
    "highlights": [
      "Đo thời gian dừng máy từng vụ việc",
      "Tính chỉ số MTTR (sửa chữa) & MTBF (ổn định)",
      "Phân loại nguyên nhân: điện, cơ khí, vật tư",
      "Báo cáo tổng thời gian dừng máy theo tháng"
    ],
    "engineSpec": "Downtime Incident & MTTR/MTBF Log",
    "status": "ready"
  },
  {
    "slug": "phan-bo-chi-phi-san-xuat-chung",
    "fileName": "phan-bo-chi-phi-san-xuat-chung.html",
    "title": "Phân bổ chi phí sản xuất chung vào giá thành (TK 627)",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Phân bổ tiền điện, nước, khấu hao nhà xưởng và chi phí quản lý xưởng vào từng loại thành phẩm sản xuất.",
    "description": "Áp dụng các tiêu thức phân bổ khoa học: theo chi phí nguyên vật liệu trực tiếp, nhân công trực tiếp hoặc số giờ máy chạy. Tính đúng giá thành đơn vị sản phẩm.",
    "suitableFor": "Kế toán giá thành, kế toán trưởng doanh nghiệp sản xuất.",
    "highlights": [
      "Hỗ trợ 3 tiêu thức phân bổ phổ biến",
      "Tự động kết chuyển chi phí TK 627 sang TK 154",
      "Tính giá thành đơn vị thành phẩm chính xác",
      "So sánh biến động chi phí qua các đợt sản xuất"
    ],
    "engineSpec": "Overhead Cost Allocation Matrix",
    "status": "ready"
  },
  {
    "slug": "phieu-xuat-vat-tu-san-xuat",
    "fileName": "phieu-xuat-vat-tu-san-xuat.html",
    "title": "Lập & In phiếu xuất vật tư sản xuất theo lệnh",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Tạo phiếu xuất kho vật tư kèm số lệnh sản xuất, thủ kho và người nhận ký xác nhận bàn giao đầy đủ.",
    "description": "Quy chuẩn hóa việc xuất kho vật tư, hạn chế tối đa việc công nhân tự ý lấy vật tư không có lệnh. Lưu trữ lịch sử xuất kho chi tiết theo từng đơn hàng cụ thể.",
    "suitableFor": "Thủ kho vật tư, nhân viên điều độ sản xuất, kế toán kho.",
    "highlights": [
      "In phiếu xuất kho chuẩn biểu mẫu kế toán",
      "Gắn liền với mã lệnh sản xuất tương ứng",
      "Trừ tồn kho vật tư tự động và chính xác",
      "Lưu trữ offline an toàn không lo mất dữ liệu"
    ],
    "engineSpec": "Material Requisition & Issue Voucher",
    "status": "ready"
  },
  {
    "slug": "quan-ly-thu-mua",
    "fileName": "quan-ly-thu-mua.html",
    "title": "Quy trình quản lý thu mua & So sánh báo giá",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Theo dõi yêu cầu mua hàng (PR), lập bảng so sánh báo giá 3 nhà cung cấp và phát hành đơn mua (PO).",
    "description": "Minh bạch hóa hoạt động thu mua vật tư, trang thiết bị công ty. Giúp ban giám đốc phê duyệt báo giá nhanh chóng dựa trên sự so sánh rõ ràng về giá, chất lượng và thời gian giao hàng.",
    "suitableFor": "Nhân viên mua hàng (Purchasing), trưởng phòng vật tư, ban giám đốc.",
    "highlights": [
      "So sánh báo giá trực quan 3 nhà cung cấp",
      "Theo dõi trạng thái từ PR đến khi nhận hàng PO",
      "Lưu trữ lịch sử báo giá qua từng thời kỳ",
      "Quy trình phê duyệt minh bạch, chống tiêu cực"
    ],
    "engineSpec": "Purchase Requisition & Vendor Quotation Compare",
    "status": "ready"
  },
  {
    "slug": "ton-kho-thanh-pham-don-cho-giao",
    "fileName": "ton-kho-thanh-pham-don-cho-giao.html",
    "title": "Kiểm soát tồn kho thành phẩm & Đơn chờ giao",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Đối chiếu số lượng thành phẩm có sẵn trong kho với số lượng khách đã đặt đang chờ xuất kho giao hàng.",
    "description": "Tránh tình trạng nhận đơn bán nhưng thực tế kho không còn đủ hàng để giao. Tách biệt rõ tồn kho thực tế, tồn kho khả dụng và tồn kho đang giữ chỗ cho đơn đặt trước.",
    "suitableFor": "Thủ kho thành phẩm, nhân viên bán hàng, quản lý đơn hàng.",
    "highlights": [
      "Phân biệt tồn thực tế vs tồn khả dụng",
      "Khóa giữ hàng cho đơn đặt trước tự động",
      "Cảnh báo khi đơn hàng vượt quá tồn sẵn có",
      "Lên kế hoạch xuất kho giao hàng chuẩn xác"
    ],
    "engineSpec": "Finished Goods Available-to-Promise (ATP) Matrix",
    "status": "ready"
  },
  {
    "slug": "vi-tri-hang-trong-kho",
    "fileName": "vi-tri-hang-trong-kho.html",
    "title": "Sơ đồ quản lý vị trí hàng trong kho bãi",
    "category": "san-xuat",
    "categoryLabel": "Sản xuất & Kho vận",
    "suite": "production",
    "suiteLabel": "Sản xuất, Mua hàng & Kho",
    "summary": "Quản lý vị trí hàng hóa theo Dãy - Kệ - Tầng - Ô (Aisle - Rack - Shelf - Bin) giúp tìm kiếm hàng trong 30 giây.",
    "description": "Tối ưu hóa hành trình lấy hàng (Picking) cho nhân viên kho. Dễ dàng tra cứu xem mặt hàng bất kỳ đang nằm ở ô kệ nào, sức chứa còn trống bao nhiêu mà không cần chạy khắp kho.",
    "suitableFor": "Thủ kho, nhân viên soạn hàng kho logistics, quản lý chuỗi cung ứng.",
    "highlights": [
      "Mã hóa vị trí kho Dãy - Kệ - Tầng - Ô chuẩn",
      "Tra cứu vị trí sản phẩm tức thì bằng ô tìm kiếm",
      "Sơ đồ trực quan sức chứa của từng ô kệ",
      "Giảm 70% thời gian tìm kiếm và nhầm lẫn hàng"
    ],
    "engineSpec": "Warehouse Bin Location & Slotting System",
    "status": "ready"
  },
  {
    "slug": "hieu-qua-quang-cao",
    "fileName": "hieu-qua-quang-cao.html",
    "title": "Đo lường hiệu quả quảng cáo & ROAS đa kênh",
    "category": "marketing",
    "categoryLabel": "Tiếp thị & Tăng trưởng",
    "suite": "marketing",
    "suiteLabel": "Tiếp thị & Tăng trưởng",
    "summary": "Tính chi phí trên mỗi đơn hàng (CPA), tỷ suất hoàn vốn quảng cáo (ROAS) từ Facebook, TikTok và Google Ads.",
    "description": "Giúp người chạy ads và chủ doanh nghiệp biết chính xác chiến dịch nào đang mang lại lợi nhuận thật, chiến dịch nào đang đốt tiền để kịp thời tăng ngân sách hoặc tắt camp.",
    "suitableFor": "Media buyer, Marketer, chủ shop chạy quảng cáo online.",
    "highlights": [
      "Tính ROAS, CPA, CAC tự động",
      "So sánh hiệu quả Facebook vs TikTok vs Google",
      "Tính toán điểm hòa vốn của từng chiến dịch",
      "Báo cáo hiệu quả quảng cáo theo ngày"
    ],
    "engineSpec": "Ad Spend & ROAS Attribution Calculator",
    "status": "ready"
  },
  {
    "slug": "lich-noi-dung-marketing",
    "fileName": "lich-noi-dung-marketing.html",
    "title": "Lịch nội dung Content Marketing & Đa kênh",
    "category": "marketing",
    "categoryLabel": "Tiếp thị & Tăng trưởng",
    "suite": "marketing",
    "suiteLabel": "Tiếp thị & Tăng trưởng",
    "summary": "Lên kế hoạch sản xuất bài viết, kịch bản video TikTok/Reels và lịch đăng tải bài trên các nền tảng mạng xã hội.",
    "description": "Quản lý dòng chảy nội dung của phòng marketing. Theo dõi trạng thái ý tưởng, bản thảo, duyệt bài và ngày giờ xuất bản trên Facebook, TikTok, YouTube và Website.",
    "suitableFor": "Content creator, Social Media Manager, đội ngũ marketing in-house.",
    "highlights": [
      "Lịch xuất bản nội dung dạng lịch tháng",
      "Quản lý kịch bản video ngắn TikTok/Reels",
      "Trạng thái từ Ý tưởng ➔ Duyệt ➔ Đã đăng",
      "Phân loại nội dung theo trụ cột thông điệp"
    ],
    "engineSpec": "Social Content Calendar & Editorial Pipeline",
    "status": "ready"
  },
  {
    "slug": "muc-tieu-marketing-okr",
    "fileName": "muc-tieu-marketing-okr.html",
    "title": "Quản trị mục tiêu OKR & KPI phòng Marketing",
    "category": "marketing",
    "categoryLabel": "Tiếp thị & Tăng trưởng",
    "suite": "marketing",
    "suiteLabel": "Tiếp thị & Tăng trưởng",
    "summary": "Thiết lập Mục tiêu (Objectives) và Các kết quả then chốt (Key Results) theo quý cho đội ngũ tăng trưởng.",
    "description": "Giúp cả đội ngũ marketing tập trung vào những ưu tiên tạo ra tăng trưởng thực sự. Theo dõi tiến độ hoàn thành % mục tiêu theo thời gian thực hàng tuần.",
    "suitableFor": "CMO, Marketing Leader, Growth Hacker, Founder startup.",
    "highlights": [
      "Khung quản trị OKR theo quý chuẩn",
      "Đo lường tiến độ % Key Results thời gian thực",
      "Gắn trách nhiệm rõ ràng cho từng cá nhân",
      "Đánh giá xếp loại thành quả cuối kỳ minh bạch"
    ],
    "engineSpec": "Growth Marketing OKR & KPI Dashboard",
    "status": "ready"
  },
  {
    "slug": "tuyen-sinh-pheu-lien-he",
    "fileName": "tuyen-sinh-pheu-lien-he.html",
    "title": "Quản trị phễu tuyển sinh & Tỷ lệ chuyển đổi liên hệ",
    "category": "marketing",
    "categoryLabel": "Tiếp thị & Tăng trưởng",
    "suite": "marketing",
    "suiteLabel": "Tiếp thị & Tăng trưởng",
    "summary": "Theo dõi số lượng data phụ huynh/học viên tiềm năng từ Form đăng ký, đo tỷ lệ chốt đơn của đội ngũ tư vấn.",
    "description": "Giải pháp cho trung tâm ngoại ngữ, tin học, trường mầm non và các khóa đào tạo kỹ năng. Nhắc nhở lịch gọi lại cho phụ huynh, chống rớt data tư vấn tuyển sinh.",
    "suitableFor": "Trưởng phòng tuyển sinh, tư vấn viên trung tâm đào tạo, trường học tư thục.",
    "highlights": [
      "Phễu chuyển đổi: Data ➔ Liên hệ ➔ Hẹn test ➔ Nhập học",
      "Theo dõi tỷ lệ chốt của từng tư vấn viên",
      "Nhật ký cuộc gọi tư vấn và nhu cầu khóa học",
      "Báo cáo chi phí trên mỗi học viên mới nhập học"
    ],
    "engineSpec": "Admissions Funnel & Lead Conversion CRM",
    "status": "ready"
  },
  {
    "slug": "bao-cao-quan-tri-giam-doc",
    "fileName": "bao-cao-quan-tri-giam-doc.html",
    "title": "Báo cáo quản trị tóm tắt cho Giám đốc điều hành",
    "category": "quan-tri",
    "categoryLabel": "Hợp đồng & Quản trị",
    "suite": "governance",
    "suiteLabel": "Hợp đồng & Quản trị",
    "summary": "Bức tranh tài chính & vận hành tổng quan: Doanh thu, Lợi nhuận ròng, Tiền mặt thực tế và các chỉ số sức khỏe.",
    "description": "Chỉ với 5 phút mỗi sáng, CEO nắm trọn tình hình sống còn của doanh nghiệp mà không cần đọc hàng chục trang báo cáo kế toán rườm rà. Tập trung vào các chỉ số tạo ra dòng tiền.",
    "suitableFor": "Chủ tịch, Tổng giám đốc (CEO), Chủ sáng lập công ty.",
    "highlights": [
      "Bảng điều khiển 3 chỉ số vàng: Doanh thu · Lãi · Tiền",
      "Cảnh báo chỉ số tài chính nằm ngoài ngưỡng",
      "So sánh thực tế so với mục tiêu kế hoạch",
      "Hoạt động offline độc lập, bảo mật tối đa"
    ],
    "badge": "Executive",
    "engineSpec": "Executive Summary KPI Dashboard",
    "status": "ready"
  },
  {
    "slug": "ke-hoach-ngan-sach-nam",
    "fileName": "ke-hoach-ngan-sach-nam.html",
    "title": "Lập kế hoạch phân bổ ngân sách hoạt động cả năm",
    "category": "quan-tri",
    "categoryLabel": "Hợp đồng & Quản trị",
    "suite": "governance",
    "suiteLabel": "Hợp đồng & Quản trị",
    "summary": "Xây dựng ngân sách chi phí theo từng phòng ban, kiểm soát tỷ lệ chi phí trên doanh thu mục tiêu.",
    "description": "Giúp doanh nghiệp chủ động điều tiết nguồn vốn trong suốt 12 tháng. So sánh chi phí thực tế phát sinh với hạn mức ngân sách được duyệt để ngăn chặn bội chi.",
    "suitableFor": "Ban giám đốc, phòng tài chính kế hoạch, trưởng các bộ phận.",
    "highlights": [
      "Phân bổ hạn mức chi phí cho từng phòng ban",
      "So sánh Ngân sách dự kiến vs Thực chi (Variance)",
      "Cảnh báo khi phòng ban vượt hạn mức duyệt",
      "Mô hình lập kế hoạch tài chính linh hoạt"
    ],
    "engineSpec": "Annual Operating Budgeting Matrix",
    "status": "ready"
  },
  {
    "slug": "theo-doi-hop-dong",
    "fileName": "theo-doi-hop-dong.html",
    "title": "Theo dõi tình trạng hợp đồng kinh tế & Cảnh báo gia hạn",
    "category": "quan-tri",
    "categoryLabel": "Hợp đồng & Quản trị",
    "suite": "governance",
    "suiteLabel": "Hợp đồng & Quản trị",
    "summary": "Quản lý ngày ký, giá trị hợp đồng, các mốc nghiệm thu, thanh toán và tự động đếm ngược ngày hết hạn.",
    "description": "Tránh bỏ quên các hợp đồng sắp hết hạn cần đàm phán tái ký hoặc bị phạt vi phạm tiến độ thanh toán. Quản lý toàn bộ danh mục hợp đồng mua vào và bán ra của doanh nghiệp.",
    "suitableFor": "Pháp chế doanh nghiệp, thư ký ban giám đốc, nhân viên kinh doanh hợp đồng.",
    "highlights": [
      "Đếm ngược ngày hết hạn hợp đồng theo màu",
      "Theo dõi các đợt thanh toán theo tiến độ",
      "Lưu trữ điều khoản phạt và giá trị hợp đồng",
      "Phân loại hợp đồng mua, bán, thuê, dịch vụ"
    ],
    "engineSpec": "Contract Lifecycle & Expiry Alert Matrix",
    "status": "ready"
  },
  {
    "slug": "quan-ly-cho-thue",
    "fileName": "quan-ly-cho-thue.html",
    "title": "Quản lý hợp đồng cho thuê mặt bằng, xe & thiết bị",
    "category": "quan-tri",
    "categoryLabel": "Hợp đồng & Quản trị",
    "suite": "governance",
    "suiteLabel": "Hợp đồng & Quản trị",
    "summary": "Quản lý tiền cọc, kỳ thu tiền thuê, theo dõi trạng thái tài sản đang cho thuê hay đang trống.",
    "description": "Công cụ quản trị danh mục tài sản cho thuê chuyên nghiệp: văn phòng, ki-ốt, căn hộ, xe tự lái, máy móc công trình. Tự động thông báo ngày cần gửi giấy báo thu tiền.",
    "suitableFor": "Chủ mặt bằng cho thuê, đơn vị quản lý bất động sản, công ty cho thuê thiết bị.",
    "highlights": [
      "Theo dõi tài sản đang thuê / còn trống",
      "Quản lý tiền đặt cọc và hoàn trả",
      "Lịch nhắc thu tiền thuê nhà/thiết bị",
      "In hóa đơn / giấy báo thanh toán tiền thuê"
    ],
    "engineSpec": "Leasing Asset & Rent Collection Schedule",
    "status": "ready"
  },
  {
    "slug": "quan-ly-nha-tro",
    "fileName": "quan-ly-nha-tro.html",
    "title": "Quản lý nhà trọ, căn hộ dịch vụ & Điện nước",
    "category": "quan-tri",
    "categoryLabel": "Hợp đồng & Quản trị",
    "suite": "governance",
    "suiteLabel": "Hợp đồng & Quản trị",
    "summary": "Ghi chỉ số điện nước đầu - cuối kỳ, tính tiền phòng trọ và tự động xuất tin nhắn báo tiền phòng.",
    "description": "Giải pháp cho chủ nhà trọ, chung cư mini, căn hộ dịch vụ quản lý từ 5 đến 50 phòng. Nhập số điện nước chỉ mất 2 phút mỗi tháng, tự động tính tổng tiền kèm chi phí vệ sinh, wifi.",
    "suitableFor": "Chủ nhà trọ, quản lý tòa nhà căn hộ mini, dịch vụ phòng trọ sinh viên.",
    "highlights": [
      "Tính tiền điện nước theo chỉ số công tơ",
      "Sinh tin nhắn báo tiền phòng gửi Zalo",
      "Theo dõi tình trạng đóng tiền từng phòng",
      "Quản lý thông tin tạm trú của khách thuê"
    ],
    "engineSpec": "Rental Room & Utility Billing Engine",
    "status": "ready"
  },
  {
    "slug": "khach-hang-nhac-cham",
    "fileName": "khach-hang-nhac-cham.html",
    "title": "Nhắc hẹn gặp khách hàng & Chăm sóc định kỳ",
    "category": "quan-tri",
    "categoryLabel": "Hợp đồng & Quản trị",
    "suite": "governance",
    "suiteLabel": "Hợp đồng & Quản trị",
    "summary": "Lên lịch hẹn tư vấn, lịch tái khám, lịch bảo dưỡng và nhắc nhở nhân viên kinh doanh gọi điện thoại.",
    "description": "Giữ mối quan hệ bền vững với các khách hàng quan trọng. Không bao giờ bỏ quên một cuộc hẹn đã hứa với đối tác hoặc khách hàng tiềm năng.",
    "suitableFor": "Nhân viên kinh doanh, chuyên viên tư vấn tài chính, dịch vụ chăm sóc khách hàng.",
    "highlights": [
      "Sắp xếp lịch hẹn theo ngày giờ cụ thể",
      "Nhật ký ghi chú nội dung cuộc gọi trước",
      "Phân loại khách VIP / Khách tiềm năng",
      "Cảnh báo các cuộc hẹn sắp đến hạn"
    ],
    "engineSpec": "Client Relationship & Callback Reminder Log",
    "status": "ready"
  },
  {
    "slug": "lich-hen-gap-khach-nhac-viec",
    "fileName": "lich-hen-gap-khach-nhac-viec.html",
    "title": "Quản lý lịch hẹn đối tác & Nhật ký nhắc việc",
    "category": "quan-tri",
    "categoryLabel": "Hợp đồng & Quản trị",
    "suite": "governance",
    "suiteLabel": "Hợp đồng & Quản trị",
    "summary": "Lập danh sách các cuộc gặp làm việc, chuẩn bị tài liệu trước cuộc họp và giao việc phát sinh sau họp.",
    "description": "Biến các cuộc họp thành hành động thực tế. Ghi nhận rõ ràng nội dung cam kết, ai làm việc gì và thời hạn hoàn thành của các công việc phát sinh từ cuộc gặp đối tác.",
    "suitableFor": "Trợ lý giám đốc, quản lý dự án, người làm việc với nhiều đối tác.",
    "highlights": [
      "Ghi biên bản họp nhanh và súc tích",
      "Giao việc và thời hạn hoàn thành sau họp",
      "Lịch làm việc với từng đối tác quan trọng",
      "Đồng bộ công việc cá nhân hiệu quả"
    ],
    "engineSpec": "Partner Meeting & Action Items Matrix",
    "status": "ready"
  },
  {
    "slug": "giai-ly-lop-6-9",
    "fileName": "giai-ly-lop-6-9.html",
    "title": "Công cụ giải bài tập Vật lý THCS Lớp 6–9",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Hỗ trợ giải các dạng bài tập cơ học, nhiệt học, quang học và điện học THCS kèm giải thích công thức.",
    "description": "Bộ động cơ thuật toán giải toán vật lý trung học cơ sở. Giúp học sinh nắm vững bản chất hiện tượng vật lý, hiểu rõ cách áp dụng công thức và từng bước tính toán kết quả.",
    "suitableFor": "Học sinh lớp 6–9, giáo viên dạy môn Khoa học tự nhiên / Vật lý.",
    "highlights": [
      "Giải chi tiết từng bước có đơn vị đo",
      "Tra cứu nhanh công thức vật lý trọng tâm",
      "Bài tập thực hành tính toán tương tác",
      "Hoạt động 100% offline không cần mạng"
    ],
    "engineSpec": "THCS Physics Formula & Solver Engine",
    "status": "ready"
  },
  {
    "slug": "canh-bao-hoc-vien-bo-hoc",
    "fileName": "canh-bao-hoc-vien-bo-hoc.html",
    "title": "Cảnh báo sớm học viên trung tâm có nguy cơ bỏ học",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Phát hiện học viên nghỉ học quá số buổi, kết quả kiểm tra sút giảm để giáo viên kịp thời liên hệ hỗ trợ.",
    "description": "Giữ vững sĩ số và doanh thu của trung tâm đào tạo. Nhận diện các dấu hiệu bất thường trước khi học viên nản lòng và đưa ra quyết định dừng khóa học.",
    "suitableFor": "Quản lý trung tâm ngoại ngữ, tin học, giáo viên chủ nhiệm.",
    "highlights": [
      "Thuật toán phát hiện nguy cơ nghỉ học sớm",
      "Cảnh báo khi nghỉ quá 2 buổi liên tiếp",
      "Gợi ý kịch bản liên hệ phụ huynh",
      "Bảo toàn tỷ lệ học sinh hoàn thành khóa"
    ],
    "engineSpec": "Student Retention & Churn Warning Matrix",
    "status": "ready"
  },
  {
    "slug": "chi-phi-van-hanh-trung-tam-dao-tao",
    "fileName": "chi-phi-van-hanh-trung-tam-dao-tao.html",
    "title": "Kiểm soát chi phí vận hành trung tâm đào tạo",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Quản lý tiền thuê mặt bằng, điện nước lớp học, văn phòng phẩm, khấu hao bàn ghế và chi phí quản lý.",
    "description": "Giúp chủ trường mầm non tư thục hoặc trung tâm bồi dưỡng văn hóa tính toán chính xác điểm hòa vốn sĩ số học viên và kiểm soát chặt các khoản chi tiêu hàng tháng.",
    "suitableFor": "Chủ trung tâm đào tạo, quản lý cơ sở giáo dục tư thục.",
    "highlights": [
      "Phân loại chi phí cố định vs biến đổi",
      "Xác định sĩ số hòa vốn của trung tâm",
      "Báo cáo chi phí vận hành từng chi nhánh",
      "Hạn chế thất thoát vật tư đào tạo"
    ],
    "engineSpec": "Education Center Overhead & Breakeven Model",
    "status": "ready"
  },
  {
    "slug": "cong-no-hoc-phi-nhac-dong",
    "fileName": "cong-no-hoc-phi-nhac-dong.html",
    "title": "Quản lý công nợ học phí & Nhắc đóng phí tự động",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Theo dõi học viên chưa đóng học phí, sắp đến hạn tái đăng ký và tự động tạo tin nhắn thông báo cho phụ huynh.",
    "description": "Giúp trung tâm thu học phí đúng hạn mà vẫn giữ thái độ lịch sự, chuyên nghiệp. Không sợ sót học viên học chui hoặc quên đóng học phí đầu kỳ.",
    "suitableFor": "Kế toán học phí, nhân viên giáo vụ, chủ cơ sở dạy kèm.",
    "highlights": [
      "Tự động sinh tin nhắn nhắc đóng học phí",
      "Theo dõi số dư nợ theo từng lớp học",
      "Quản lý lịch sử các đợt đóng tiền",
      "Tích hợp mẫu thông báo lịch sự, văn minh"
    ],
    "engineSpec": "Tuition Receivables & Reminder Message Generator",
    "status": "ready"
  },
  {
    "slug": "diem-danh-theo-buoi-goi-hoc",
    "fileName": "diem-danh-theo-buoi-goi-hoc.html",
    "title": "Điểm danh học viên theo buổi & Gói học",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Điểm danh có mặt, vắng mặt có phép/không phép và tự động trừ số buổi trong gói học (ví dụ gói 12 buổi, 24 buổi).",
    "description": "Loại bỏ hoàn toàn sổ điểm danh giấy dễ thất lạc. Biết chính xác học viên nào sắp học hết gói học để tư vấn phụ huynh tái đăng ký kịp thời.",
    "suitableFor": "Giáo viên trung tâm năng khiếu, tiếng Anh, yoga, bơi lội, võ thuật.",
    "highlights": [
      "Điểm danh 1 chạm có mặt / vắng mặt",
      "Đếm ngược số buổi học còn lại của gói",
      "Cảnh báo học viên sắp hết hạn gói học",
      "Xuất bảng điểm danh tháng gửi phụ huynh"
    ],
    "engineSpec": "Attendance & Class Package Credit Tracker",
    "status": "ready"
  },
  {
    "slug": "doanh-thu-loi-nhuan-theo-lop",
    "fileName": "doanh-thu-loi-nhuan-theo-lop.html",
    "title": "Báo cáo doanh thu & Lợi nhuận theo từng lớp học",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Tổng hợp học phí thu được, trừ tiền thù lao giáo viên và tiền phòng để biết lớp nào có lãi cao nhất.",
    "description": "Giúp ban quản lý trung tâm đưa ra quyết định mở thêm lớp hay gộp các lớp có sĩ số thấp. Đánh giá hiệu quả kinh doanh của từng khóa học và bộ môn.",
    "suitableFor": "Giám đốc trung tâm đào tạo, trưởng phòng đào tạo.",
    "highlights": [
      "Tính tỷ suất lợi nhuận ròng từng lớp",
      "Trừ lương giáo viên theo giờ chính xác",
      "So sánh hiệu quả giữa các bộ môn",
      "Đưa ra khuyến nghị mở lớp tối ưu"
    ],
    "engineSpec": "Class Profitability & Contribution Margin Engine",
    "status": "ready"
  },
  {
    "slug": "giao-trinh-tai-lieu-thiet-bi-day-hoc",
    "fileName": "giao-trinh-tai-lieu-thiet-bi-day-hoc.html",
    "title": "Kiểm kê giáo trình, tài liệu & Thiết bị dạy học",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Quản lý kho sách giáo trình, máy chiếu, loa trợ giảng, mô hình thí nghiệm và dụng cụ học tập.",
    "description": "Kiểm soát việc cấp phát giáo trình cho học viên mới và quản lý mượn trả thiết bị trợ giảng của giáo viên. Hạn chế thất lạc tài sản giáo dục của nhà trường.",
    "suitableFor": "Cán bộ thư viện, thủ kho thiết bị trường học, trung tâm đào tạo.",
    "highlights": [
      "Quản lý tồn kho sách giáo trình",
      "Theo dõi thiết bị trợ giảng đang cho mượn",
      "Cảnh báo bổ sung sách khi sắp hết kho",
      "Biên bản kiểm kê thiết bị định kỳ"
    ],
    "engineSpec": "Curriculum & Teaching Asset Inventory System",
    "status": "ready"
  },
  {
    "slug": "giao-vien-thinh-giang-chung-chi-hop-dong",
    "fileName": "giao-vien-thinh-giang-chung-chi-hop-dong.html",
    "title": "Hồ sơ giáo viên thỉnh giảng, chứng chỉ & Hợp đồng",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Quản lý hồ sơ giáo viên, bằng cấp, chứng chỉ sư phạm, hợp đồng thỉnh giảng và đơn giá thù lao tiết dạy.",
    "description": "Lưu trữ đầy đủ thông tin nhân sự giáo viên thỉnh giảng phục vụ công tác thanh kiểm tra của ngành giáo dục. Quản lý hạn hợp đồng và định mức thù lao minh bạch.",
    "suitableFor": "Phòng tổ chức cán bộ, nhân sự trường học, trung tâm ngoại ngữ.",
    "highlights": [
      "Lưu hồ sơ bằng cấp và chứng chỉ giảng dạy",
      "Theo dõi thời hạn hợp đồng thỉnh giảng",
      "Đơn giá thù lao tiết dạy của từng giáo viên",
      "Tìm kiếm nhanh giáo viên theo môn chuyên môn"
    ],
    "engineSpec": "Faculty Credential & Lecturer Contract System",
    "status": "ready"
  },
  {
    "slug": "hoc-bong-giam-hoc-phi-uu-dai",
    "fileName": "hoc-bong-giam-hoc-phi-uu-dai.html",
    "title": "Chính sách xét duyệt học bổng & Ưu đãi học phí",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Quản lý danh sách học sinh nhận học bổng, chính sách giảm học phí cho anh chị em ruột hoặc hộ nghèo.",
    "description": "Đảm bảo tính công bằng và minh bạch trong việc áp dụng các gói miễn giảm học phí. Kiểm soát tổng ngân sách học bổng mà trường hoặc trung tâm trao tặng mỗi năm.",
    "suitableFor": "Hội đồng xét học bổng, ban giám hiệu trường tư thục, phòng kế toán.",
    "highlights": [
      "Thiết lập tiêu chuẩn xét duyệt học bổng",
      "Tính tỷ lệ giảm trừ học phí tự động",
      "Tổng kết ngân sách tài trợ học bổng",
      "In quyết định trao học bổng trang trọng"
    ],
    "engineSpec": "Scholarship & Tuition Discount Policy Matrix",
    "status": "ready"
  },
  {
    "slug": "ke-hoach-bai-giang-tien-do",
    "fileName": "ke-hoach-bai-giang-tien-do.html",
    "title": "Kế hoạch bài giảng & Phân phối chương trình dạy",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Theo dõi tiến độ dạy học từng tuần, số tiết đã hoàn thành và đối chiếu với khung phân phối chương trình.",
    "description": "Hỗ trợ giáo viên và tổ trưởng chuyên môn kiểm tra việc thực hiện chương trình giảng dạy, đảm bảo không bị cháy giáo án hoặc chậm tiến độ trước các kỳ thi.",
    "suitableFor": "Giáo viên bộ môn, tổ trưởng chuyên môn, phòng học vụ.",
    "highlights": [
      "Lập khung kế hoạch bài giảng theo tuần",
      "Đánh dấu bài đã dạy / bài dự kiến",
      "Cảnh báo lệch tiến độ phân phối chương trình",
      "Chuẩn hóa hồ sơ giáo án giảng dạy"
    ],
    "engineSpec": "Curriculum Syllabus & Lesson Plan Tracker",
    "status": "ready"
  },
  {
    "slug": "ket-qua-dau-vao-dau-ra-tien-bo",
    "fileName": "ket-qua-dau-vao-dau-ra-tien-bo.html",
    "title": "Theo dõi kết quả đầu vào, đầu ra & Tiến bộ học tập",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Lưu điểm thi xếp lớp đầu vào (Placement Test), điểm kiểm tra định kỳ và đánh giá mức độ tiến bộ của học viên.",
    "description": "Minh chứng rõ ràng về chất lượng đào tạo gửi tới phụ huynh. Biểu đồ trực quan cho thấy sự tiến bộ về kiến thức và kỹ năng của học sinh sau mỗi khóa học.",
    "suitableFor": "Giáo viên chủ nhiệm, chuyên viên khảo thí, giám đốc đào tạo.",
    "highlights": [
      "So sánh điểm Placement Test vs Điểm thi kết khóa",
      "Biểu đồ đường tiến bộ của từng học viên",
      "In phiếu báo cáo kết quả học tập đẹp mắt",
      "Khẳng định uy tín chất lượng đào tạo"
    ],
    "engineSpec": "Student Assessment & Progress Analytics Engine",
    "status": "ready"
  },
  {
    "slug": "lich-day-luong-giao-vien-theo-gio",
    "fileName": "lich-day-luong-giao-vien-theo-gio.html",
    "title": "Xếp lịch giảng dạy & Tính lương giáo viên theo giờ",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Xếp thời khóa biểu dạy học không trùng phòng, tự động cộng dồn số giờ dạy và tính phiếu lương cuối tháng.",
    "description": "Giải pháp xếp thời khóa biểu và tính thù lao giảng dạy cho các trung tâm có nhiều giáo viên cơ hữu và thỉnh giảng. Xuất phiếu đối soát số giờ dạy chi tiết cho từng thầy cô.",
    "suitableFor": "Phòng học vụ, kế toán tiền lương trung tâm, ban giám hiệu.",
    "highlights": [
      "Kiểm tra tránh trùng lịch phòng học & giáo viên",
      "Tự động nhân đơn giá tiết dạy theo từng cấp độ",
      "Tính phụ cấp trợ giảng và thưởng chuyên cần",
      "In bảng kê chi trả thù lao giảng dạy chuẩn"
    ],
    "engineSpec": "Teacher Schedule & Hourly Payroll Matrix",
    "status": "ready"
  },
  {
    "slug": "lich-thi-ky-thi-thu-phong-thi",
    "fileName": "lich-thi-ky-thi-thu-phong-thi.html",
    "title": "Sắp xếp phòng thi, lịch thi & Kết quả thi thử",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Phân bổ danh sách thí sinh vào các phòng thi theo số báo danh, in danh sách phòng và bảng điểm thi thử.",
    "description": "Công cụ tổ chức kỳ thi thử vào 10, thi thử tốt nghiệp THPT hoặc kỳ thi học kỳ chuyên nghiệp. Tự động chia phòng thi theo số lượng bàn ghế có sẵn.",
    "suitableFor": "Hội đồng thi nhà trường, trung tâm luyện thi, cán bộ coi thi.",
    "highlights": [
      "Đánh số báo danh SBD tự động",
      "Chia danh sách thí sinh vào các phòng thi",
      "In phiếu thu bài và danh sách ký tên",
      "Tổng hợp và xếp thứ hạng điểm thi thử"
    ],
    "engineSpec": "Exam Room Allocation & Result Ranking System",
    "status": "ready"
  },
  {
    "slug": "ngoai-khoa-da-ngoai-thu-tien",
    "fileName": "ngoai-khoa-da-ngoai-thu-tien.html",
    "title": "Tổ chức hoạt động ngoại khóa, dã ngoại & Quản lý thu tiền",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Lập danh sách học sinh tham gia dã ngoại, thu tiền đóng góp, dự toán chi phí xe cộ, ăn uống và vé vào cổng.",
    "description": "Giúp trường học và ban phụ huynh tổ chức các chuyến đi thực tế, học tập ngoài trời an toàn, chu đáo và thu chi minh bạch tới từng đồng cho toàn thể phụ huynh.",
    "suitableFor": "Ban đại diện cha mẹ học sinh, giáo viên chủ nhiệm, tổng phụ trách Đội.",
    "highlights": [
      "Lập danh sách học sinh và người nhà tham gia",
      "Dự toán chi phí xe cộ, ăn uống, bảo hiểm",
      "Cập nhật tình trạng đóng góp từng học sinh",
      "Báo cáo quyết toán thu chi chuyến đi công khai"
    ],
    "engineSpec": "Field Trip & Extracurricular Budget Manager",
    "status": "ready"
  },
  {
    "slug": "quan-ly-hoc-vien-lop-hoc",
    "fileName": "quan-ly-hoc-vien-lop-hoc.html",
    "title": "Quản lý toàn diện hồ sơ học viên & Phân lớp",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Hồ sơ thông tin học viên, số điện thoại phụ huynh, trạng thái học tập và phân chia lớp học khoa học.",
    "description": "Cơ sở dữ liệu học sinh độc lập, an toàn lưu trữ trên máy tính. Dễ dàng tìm kiếm thông tin phụ huynh khi cần liên lạc khẩn cấp mà không sợ rò rỉ thông tin cá nhân của các con.",
    "suitableFor": "Giáo vụ trường học, quản lý trung tâm đào tạo, giáo viên chủ nhiệm.",
    "highlights": [
      "Lưu đầy đủ thông tin học sinh & phụ huynh",
      "Phân loại học viên theo lớp và trình độ",
      "Tìm kiếm nhanh theo tên hoặc số điện thoại",
      "Dữ liệu được mã hóa lưu trữ offline tuyệt đối"
    ],
    "engineSpec": "Student Information System (SIS) Lite",
    "status": "ready"
  },
  {
    "slug": "thu-chi-quy-lop-phu-huynh",
    "fileName": "thu-chi-quy-lop-phu-huynh.html",
    "title": "Sổ thu chi quỹ lớp & Báo cáo minh bạch phụ huynh",
    "category": "hoc-tap",
    "categoryLabel": "Học tập & Giáo dục",
    "suite": "education",
    "suiteLabel": "Giáo dục & Học tập",
    "summary": "Ghi chép quỹ hội phụ huynh lớp, các khoản chi khen thưởng, nước uống, hoạt động phong trào kèm ảnh hóa đơn.",
    "description": "Minh bạch hóa tài chính lớp học để tạo niềm tin tuyệt đối giữa phụ huynh và giáo viên. Tự động xuất file báo cáo thu chi chi tiết gửi vào nhóm Zalo lớp cuối mỗi học kỳ.",
    "suitableFor": "Ban đại diện cha mẹ học sinh, thủ quỹ chi hội phụ huynh lớp.",
    "highlights": [
      "Ghi chép thu chi quỹ lớp theo từng đợt",
      "Cập nhật số tiền đóng của từng học sinh",
      "Tính số dư quỹ lớp chính xác từng ngày",
      "Xuất bảng sao kê thu chi công khai gửi Zalo"
    ],
    "engineSpec": "Parent-Teacher Class Fund Transparency Ledger",
    "status": "ready"
  }
];
