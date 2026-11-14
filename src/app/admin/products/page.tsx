import { DashboardShell } from "@/components/dashboard";
import { readCms } from "@/lib/cms";
import { AdminProductsClient } from "./products-client";
import { requirePageRole } from "@/lib/auth";

export const metadata = {
  title: "Quản lý Sản phẩm số & App — Admin AI MỞ",
};

export default async function AdminProductsPage() {
  await requirePageRole("admin");
  const cms = await readCms();

  return (
    <DashboardShell admin title="Quản lý Sản phẩm số & Ứng dụng">
      <div className="mb-6">
        <p className="text-sm text-neutral-600">
          Thêm mới, sửa giá, cập nhật link tải app desktop, webapp, tài nguyên số hoặc khóa học. Sản phẩm xuất bản sẽ tự động hiển thị trên toàn trang web.
        </p>
      </div>
      <AdminProductsClient initialProducts={cms.products} />
    </DashboardShell>
  );
}
