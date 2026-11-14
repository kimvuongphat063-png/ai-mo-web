export interface HomeContent {
  heroBadge: string;
  heroTitle: string;
  heroDesc: string;
  quickActionsTitle: string;
  quickActionsDesc: string;
  toolsTitle: string;
  toolsDesc: string;
  pathTitle: string;
  pathDesc: string;
  articlesTitle: string;
  articlesDesc: string;
  exploreTitle: string;
  exploreDesc: string;
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  heroBadge: "AI Studio của AI Mở",
  heroTitle: "Học AI bằng cách tạo ra thứ dùng được.",
  heroDesc: "Bộ công cụ AI thực tế, ứng dụng miễn phí và lộ trình thực hành dành cho người làm việc thật. Không lý thuyết suông.",
  quickActionsTitle: "Bắt đầu nhanh với 3 việc phổ biến nhất",
  quickActionsDesc: "Không cần đọc tài liệu dài dòng. Chọn một bài toán và thử ngay trên trình duyệt.",
  toolsTitle: "Bộ công cụ AI giải quyết bài toán thật",
  toolsDesc: "Mỗi công cụ xử lý một việc cụ thể, có thể dùng ngay mà không cần kết nối API phức tạp.",
  pathTitle: "Lộ trình học AI thực chiến",
  pathDesc: "Học theo sản phẩm đầu ra, không học theo tính năng trừu tượng.",
  articlesTitle: "Kiến thức & Hướng dẫn thực hành",
  articlesDesc: "Những bài viết thực chiến, chia sẻ kinh nghiệm dùng AI vào công việc hàng ngày.",
  exploreTitle: "Khám phá thêm trên AI Mở",
  exploreDesc: "Bốn lối đi rõ ràng: mỗi ô là một điểm đến cụ thể.",
};
