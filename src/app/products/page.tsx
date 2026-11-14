import { CatalogPage } from "@/components/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sản phẩm số & Tài nguyên AI — AI MỞ",
  description: "Kho sản phẩm số, template prompt và bộ công cụ đóng gói sẵn để bạn ứng dụng ngay vào công việc.",
  alternates: {
    canonical: "https://www.heyaimo.com/products",
  },
};

export default function ProductsPage() {
  return (
    <CatalogPage
      title="Sản phẩm số & Tài nguyên thực chiến"
      eyebrow="TÀI NGUYÊN SỐ · TEMPLATE · KHÓA HỌC"
      intro="Kho sản phẩm số thực chiến, bộ prompt đóng gói và công cụ độc lập giúp bạn tiết kiệm hàng chục giờ làm việc mỗi tuần."
      filter={() => true}
    />
  );
}
