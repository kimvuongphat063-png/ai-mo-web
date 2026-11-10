import type { VideoPromptOutput, PromptModel } from "./schema";

export function formatScriptToMarkdown(
  script: VideoPromptOutput,
  activeModel: PromptModel = "all"
): string {
  const lines: string[] = [];

  lines.push(`# ${script.title}`);
  lines.push("");
  lines.push(`> ${script.summary}`);
  lines.push("");
  lines.push("## 1. Thông tin tổng quan");
  lines.push(`- **Thể loại nội dung:** ${script.contentType}`);
  lines.push(`- **Phong cách hình ảnh:** ${script.visualStyle}`);
  lines.push(`- **Nền tảng đăng tải:** ${script.publishingPlatform}`);
  lines.push(`- **Mô hình định dạng prompt:** ${script.promptModel || script.videoModel || "Veo 3 & Grok"}`);
  lines.push(`- **Tỷ lệ khung hình:** ${script.aspectRatio}`);
  lines.push(`- **Thời lượng:** ${script.durationSeconds} giây`);
  lines.push(`- **Tông giọng:** ${script.tone}`);
  lines.push(`- **Đối tượng mục tiêu:** ${script.targetAudience}`);
  lines.push("");
  lines.push(`### 🎯 Hook mở đầu`);
  lines.push(`> "${script.hook}"`);
  lines.push("");
  lines.push(`### 📢 Lời kêu gọi hành động (CTA)`);
  lines.push(`> "${script.cta}"`);
  lines.push("");
  lines.push(`### 📝 Toàn bộ lời thoại (Full Script)`);
  lines.push("```text");
  lines.push(script.voiceoverFull);
  lines.push("```");
  lines.push("");

  lines.push("## 2. Bảng phân cảnh Storyboard");
  lines.push("");
  lines.push(
    "| Cảnh | Thời lượng | Kịch bản gốc / Thoại | Góc máy & Chuyển động | Bối cảnh & Ánh sáng |"
  );
  lines.push(
    "| :--- | :--- | :--- | :--- | :--- |"
  );

  for (const scene of script.scenes) {
    const timeRange = `${scene.startSecond}s - ${scene.endSecond}s`;
    const scriptSeg = (scene.originalScriptSegment || scene.voiceover || scene.onScreenText || "—")
      .replace(/\|/g, "\\|")
      .replace(/\n/g, " ");
    const camera = `${scene.cameraShot} (${scene.cameraAngle || "Eye-level"}), ${scene.cameraMovement}`.replace(/\|/g, "\\|");
    const lightingSetting = `${scene.setting} (${scene.lighting})`.replace(/\|/g, "\\|");

    lines.push(
      `| Cảnh ${scene.sceneNumber} | ${timeRange} | ${scriptSeg} | ${camera} | ${lightingSetting} |`
    );
  }
  lines.push("");

  lines.push("## 3. Chi tiết từng phân cảnh & Prompt Video AI");
  lines.push("");

  for (const scene of script.scenes) {
    lines.push(`### Cảnh ${scene.sceneNumber} (${scene.startSecond}s - ${scene.endSecond}s): ${scene.scenePurpose}`);
    if (scene.originalScriptSegment) {
      lines.push(`- **Kịch bản gốc tương ứng:** "${scene.originalScriptSegment}"`);
    }
    lines.push(`- **Chủ thể:** ${scene.subject}`);
    lines.push(`- **Bối cảnh:** ${scene.setting}`);
    lines.push(`- **Hành động & Diễn xuất:** ${scene.characterAction || scene.action}`);
    if (scene.facialExpression || scene.emotion) {
      lines.push(`- **Biểu cảm & Cảm xúc:** ${[scene.facialExpression, scene.emotion].filter(Boolean).join(" • ")}`);
    }
    lines.push(`- **Góc máy:** ${scene.cameraShot} (${scene.cameraAngle || "Eye-level"})`);
    lines.push(`- **Chuyển động:** ${scene.cameraMovement}`);
    lines.push(`- **Ánh sáng:** ${scene.lighting}`);
    lines.push(`- **Âm thanh & SFX:** ${scene.soundDesign}`);
    lines.push(`- **Chuyển cảnh:** ${scene.transition}`);
    if (scene.continuityNotes) {
      lines.push(`- **Tính liền mạch (Continuity):** ${scene.continuityNotes}`);
    }
    if (scene.onScreenText) {
      lines.push(`- **Chữ hiện trên màn hình:** "${scene.onScreenText}"`);
    }
    lines.push("");

    if (scene.modelPrompts) {
      if (activeModel === "all" || activeModel === "both" || activeModel === "veo3") {
        lines.push(`#### 🎥 Google Veo 3 Prompt`);
        lines.push("```text");
        lines.push(scene.modelPrompts.veo3);
        lines.push("```");
        lines.push("");
      }

      if (activeModel === "all" || activeModel === "both" || activeModel === "grok") {
        lines.push(`#### ⚡ xAI Grok Video Prompt`);
        lines.push("```text");
        lines.push(scene.modelPrompts.grok);
        lines.push("```");
        lines.push("");
      }

      if (activeModel === "all" || activeModel === "seedance-2-5") {
        if (scene.modelPrompts.seedance25) {
          lines.push(`#### 🎬 ByteDance Seedance 2.5 Prompt`);
          lines.push("```text");
          lines.push(scene.modelPrompts.seedance25);
          lines.push("```");
          lines.push("");
        }
      }

      if (activeModel === "all" || activeModel === "seedance-2") {
        if (scene.modelPrompts.seedance2) {
          lines.push(`#### 🏷️ ByteDance Seedance 2.0 (Tags) Prompt`);
          lines.push("```text");
          lines.push(scene.modelPrompts.seedance2);
          lines.push("```");
          lines.push("");
        }
      }

      if (activeModel === "all" || activeModel === "muse") {
        if (scene.modelPrompts.muse) {
          lines.push(`#### 💎 Tencent Muse Commercial Prompt`);
          lines.push("```text");
          lines.push(scene.modelPrompts.muse);
          lines.push("```");
          lines.push("");
        }
      }
    } else {
      lines.push(`#### 📽️ Video Prompt`);
      lines.push("```text");
      lines.push(scene.prompt);
      lines.push("```");
      lines.push("");
    }

    if (scene.negativePrompt) {
      lines.push(`- **Negative Prompt:** \`${scene.negativePrompt}\``);
      lines.push("");
    }
  }

  lines.push("## 4. Nội dung bài đăng Social");
  lines.push(`### Caption`);
  lines.push("```text");
  lines.push(script.caption);
  lines.push("```");
  lines.push("");
  lines.push(`### Hashtags`);
  lines.push(script.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "));
  lines.push("");

  if (script.keywords && script.keywords.length > 0) {
    lines.push(`### Keywords SEO`);
    lines.push(`\`${script.keywords.join(", ")}\``);
    lines.push("");
  }

  if (script.warnings && script.warnings.length > 0) {
    lines.push("## 5. Lưu ý tuân thủ");
    for (const w of script.warnings) {
      lines.push(`- ⚠️ ${w}`);
    }
    lines.push("");
  }

  if (script.missingInformation && script.missingInformation.length > 0) {
    lines.push("## 6. Thông tin cần bổ sung / Giả định");
    for (const m of script.missingInformation) {
      lines.push(`- ℹ️ ${m}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push(`*Kịch bản được tạo bởi AI Mở Universal Video Prompt Studio*`);

  return lines.join("\n");
}
