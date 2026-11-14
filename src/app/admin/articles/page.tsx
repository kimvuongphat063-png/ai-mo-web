import { DashboardShell } from "@/components/dashboard";
import { readCms } from "@/lib/cms";
import { AdminArticlesClient } from "./articles-client";

export const metadata = {
  title: "Quản lý Bài viết & Blog Kiến Thức AI — Admin AI MỞ",
};

export default async function AdminArticlesPage() {
  const cms = await readCms();
  const articles = cms.articles.sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <DashboardShell admin title="Quản lý Bài viết & Blog Kiến Thức AI">
      <p className="text-sm text-neutral-600 mb-6">
        Thêm mới, chỉnh sửa nội dung bài viết và xuất bản lên chuyên mục <b>Kiến thức AI</b> (<code>/guides</code>).
      </p>
      <AdminArticlesClient initialArticles={articles} />
    </DashboardShell>
  );
}
