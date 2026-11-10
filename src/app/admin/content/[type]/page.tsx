import { DashboardShell } from "@/components/dashboard";
import { CmsCrud } from "@/components/cms-crud";
import { collectionFor, entityTypeSchema, readCms, type CmsEntityType } from "@/lib/cms";

const titles: Record<CmsEntityType, string> = { products: "Sản phẩm", courses: "Khóa học & bài học", paths: "Lộ trình", tools: "Công cụ", affiliates: "Affiliate", bundles: "Bộ giải pháp", resources: "Tài nguyên", articles: "Bài viết" };
export default async function Page({ params }: { params: Promise<{ type: string }> }) {
  const type = entityTypeSchema.parse((await params).type); const initial = collectionFor(type, await readCms());
  return <DashboardShell admin title={titles[type]}><p>Quản lý nội dung xuất bản, thứ tự hiển thị và SEO. Mọi thay đổi đều được kiểm tra và ghi nguyên tử.</p><CmsCrud type={type} initial={initial}/></DashboardShell>;
}
