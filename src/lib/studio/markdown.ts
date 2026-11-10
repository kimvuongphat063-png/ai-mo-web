import type { ProductProfile, Script } from "@/lib/studio";

/**
 * Render a saved script as a self-contained Markdown document.
 *
 * Pure and deterministic (no Date.now, no I/O) so it is unit-testable and safe
 * to call from both a route handler and a server component.
 */

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  reels: "Instagram Reels",
  shorts: "YouTube Shorts",
  facebook: "Facebook",
};

const GOAL_LABEL: Record<string, string> = {
  awareness: "Nhận diện",
  engagement: "Tương tác",
  conversion: "Chuyển đổi",
  lead: "Thu lead",
};

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function bulletList(title: string, items: readonly string[]): string[] {
  if (!items.length) return [];
  return ["", `### ${title}`, "", ...items.map((i) => `- ${i}`)];
}

function escapePipes(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function scriptToMarkdown(script: Script, product: ProductProfile | null): string {
  const lines: string[] = [];
  const heading = script.scripts[0]?.title ?? "Kịch bản video";

  lines.push(`# ${heading}`, "");
  lines.push(
    `- **Nền tảng:** ${PLATFORM_LABEL[script.platform] ?? script.platform}`,
    `- **Mục tiêu:** ${GOAL_LABEL[script.goal] ?? script.goal}`,
    `- **Thời lượng:** ${script.durationSeconds} giây`,
    `- **Góc bán hàng đã chọn:** ${script.selectedAngleId}`,
    `- **Tạo lúc:** ${script.createdAt}`,
    `- **Cập nhật:** ${script.updatedAt}`
  );

  // ── Product context ────────────────────────────────────────────────────────
  lines.push("", "## Bối cảnh sản phẩm", "");
  if (product) {
    lines.push(
      `- **Tên sản phẩm:** ${product.name}`,
      `- **Mô tả:** ${product.description}`,
      `- **Khách hàng mục tiêu:** ${product.targetCustomer}`,
      `- **Vấn đề giải quyết:** ${product.problemSolved}`,
      `- **Tính năng nổi bật:** ${product.featuresText}`
    );
    if (product.priceOffer) lines.push(`- **Giá / ưu đãi:** ${product.priceOffer}`);
    if (product.url) lines.push(`- **Trang sản phẩm:** ${product.url}`);
    if (product.affiliateLink) lines.push(`- **Liên kết affiliate:** ${product.affiliateLink}`);
    if (product.brandVoice) lines.push(`- **Giọng thương hiệu:** ${product.brandVoice}`);
    if (product.allowedProof) lines.push(`- **Bằng chứng được phép dùng:** ${product.allowedProof}`);
    if (product.claimsToAvoid) lines.push(`- **Claim cần tránh:** ${product.claimsToAvoid}`);
  } else {
    lines.push("> Sản phẩm gốc không còn tồn tại hoặc đã bị xoá.");
  }

  // ── Variants ───────────────────────────────────────────────────────────────
  script.scripts.forEach((variant, index) => {
    lines.push("", "---", "", `## Biến thể ${index + 1} — ${variant.title}`, "");
    lines.push(
      `- **Góc bán hàng:** ${variant.angle}`,
      `- **Hook:** ${variant.hook}`,
      `- **Thời lượng:** ${variant.durationSeconds} giây`
    );

    lines.push("", "### Timeline", "");
    lines.push("| # | Thời gian | Mục đích | Lời thoại | Hình ảnh | Text trên màn hình |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    variant.shots.forEach((shot, shotIndex) => {
      lines.push(
        `| ${shotIndex + 1} | ${mmss(shot.startSecond)}–${mmss(shot.endSecond)} | ` +
          `${escapePipes(shot.purpose)} | ${escapePipes(shot.spokenText || "—")} | ` +
          `${escapePipes(shot.visualDirection)} | ${escapePipes(shot.onScreenText || "—")} |`
      );
    });

    const extras = variant.shots
      .map((shot, i) =>
        [shot.bRoll ? `- Shot ${i + 1} B-roll: ${shot.bRoll}` : null,
         shot.cameraAction ? `- Shot ${i + 1} máy quay: ${shot.cameraAction}` : null,
         shot.ctaLine ? `- Shot ${i + 1} CTA: ${shot.ctaLine}` : null]
          .filter(Boolean)
          .join("\n")
      )
      .filter(Boolean);
    if (extras.length) lines.push("", "**Ghi chú sản xuất**", "", ...extras);

    lines.push("", "### CTA", "", variant.cta);
    lines.push("", "### Caption", "", variant.caption);

    if (variant.hashtags.length) {
      lines.push(
        "",
        "### Hashtags",
        "",
        variant.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")
      );
    }

    lines.push(...bulletList("Hook thay thế", variant.alternativeHooks));
    if (variant.audioSuggestion) lines.push("", "### Gợi ý âm thanh", "", variant.audioSuggestion);
    lines.push(...bulletList("Cảnh báo", variant.warnings));

    lines.push("", "### Disclosure", "");
    lines.push(
      variant.disclosureNote ||
        (product?.affiliateLink
          ? "Nội dung có chứa liên kết affiliate — bắt buộc công bố khi đăng tải."
          : "Không có liên kết affiliate. Vẫn cần công bố nếu đây là nội dung được tài trợ.")
    );
  });

  // ── Compliance ─────────────────────────────────────────────────────────────
  lines.push("", "---", "", "## Tuân thủ & rủi ro", "");
  if (script.complianceNotes.length) {
    lines.push(...script.complianceNotes.map((n) => `- ${n}`));
  } else {
    lines.push("- Không có ghi chú tuân thủ nào được tạo.");
  }

  lines.push("", "### Thông tin còn thiếu", "");
  if (script.missingInformation.length) {
    lines.push(...script.missingInformation.map((n) => `- ${n}`));
  } else {
    lines.push("- Không có.");
  }

  lines.push(
    "",
    "---",
    "",
    "> Nội dung do AI hỗ trợ tạo. Vui lòng kiểm chứng mọi số liệu và cam kết trước khi đăng tải."
  );

  return `${lines.join("\n")}\n`;
}

/** Filesystem-safe download filename for a script. */
export function scriptMarkdownFilename(script: Script): string {
  const base = (script.scripts[0]?.title ?? "kich-ban")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "kich-ban";
  return `${base}-${script.id.slice(0, 8)}.md`;
}
