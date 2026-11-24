import { CatalogPage } from "@/components/catalog";

export default function Page() {
  return (
    <CatalogPage
      title="Công cụ làm việc cùng AI"
      eyebrow="CÔNG CỤ VIỆT · WORKFLOW THẬT"
      intro="Ứng dụng desktop riêng tư và web app gọn nhẹ, được xây từ chính những vướng mắc của người mới."
      filter={(p) => p.kind === "desktop" || p.kind === "webapp"}
      themeColor="#d4ff00"
      mascotImage="/mascot/v2-fullbody-tools.png"
      mascotSpeech="🎬 Đạo diễn kịch bản & prompt AI chuẩn xác cho Veo, Kling, Sora!"
      mascotRole="AI MỞ · CREATIVE DIRECTOR"
    />
  );
}
