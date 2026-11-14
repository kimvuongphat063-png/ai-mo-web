import Link from "next/link";

export const accountNav = [
  ["/account/learning", "Đang học"],
  ["/account/library", "Góc học"],
  ["/account/licenses", "Giấy phép"],
  ["/account/orders", "Đơn hàng"],
  ["/account/support", "Hỗ trợ"],
];

const adminSections = [
  { label: "Nội dung & Giao diện", links: [["/admin", "Tổng quan"], ["/admin-cards", "Ảnh & Title Trang Chủ"], ["/admin/articles", "Bài viết Blog (Kiến thức AI)"], ["/admin/content/products", "Sản phẩm số"], ["/admin/content/courses", "Khóa học"], ["/admin/content/paths", "Lộ trình"], ["/admin/content/tools", "Công cụ"], ["/admin/content/resources", "Góc học"]] },
  { label: "Đề xuất/Affiliate", links: [["/admin/content/affiliates", "Đề xuất/Affiliate"], ["/admin/content/bundles", "Bundle"]] },
  { label: "Khách hàng", links: [["/admin/orders", "Khách hàng & đơn hàng"], ["/admin/licenses", "Giấy phép"]] },
  { label: "Cài đặt", links: [["/admin/analytics", "Phân tích"], ["/admin/settings", "Cài đặt"]] },
];
export const adminNav = adminSections.flatMap((section) => section.links);

export function Stat({ label, value, detail, note }: { label: string; value: string; detail?: string; note?: string }) { return <div className="dash-card"><span>{label}</span><b>{value}</b><p>{detail || note}</p></div>; }

export function DashboardShell({ title = "Không gian làm việc", admin = false, area, children }: { title?: string; admin?: boolean; area?: string; children: React.ReactNode }) {
  const isAdmin = admin || area?.toLowerCase() === "admin";
  return <main className={`${isAdmin ? "admin" : "account"}-shell container`}>
    <aside className="side-nav" aria-label={isAdmin ? "Điều hướng quản trị" : "Điều hướng tài khoản"}>
      <h2>{isAdmin ? "AI MỞ / CMS" : "Không gian của bạn"}</h2>
      {isAdmin ? adminSections.map((section) => <section key={section.label}><h3>{section.label}</h3>{section.links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</section>) : accountNav.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
    </aside>
    <section className="dashboard"><span className="eyebrow">{isAdmin ? "QUẢN TRỊ NỘI DUNG" : "TÀI KHOẢN DEMO"}</span><h1>{title}</h1>{children}</section>
  </main>;
}
