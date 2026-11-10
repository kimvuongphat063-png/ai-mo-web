"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  Layers,
  Video,
  Clapperboard,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/studio/ui";
import { UNIVERSAL_PRESETS, type PromptKichBanPreset } from "@/lib/promptkichban/presets";
import {
  CONTENT_TYPES,
  PUBLISHING_PLATFORMS,
  VIDEO_MODELS,
  ASPECT_RATIOS,
  VISUAL_STYLES,
  PERFORMANCE_MODES,
  PACING_OPTIONS,
  type PromptKichBanInput,
  type ContentType,
  type VisualStyle,
  type PublishingPlatform,
  type VideoModel,
  type PromptModel,
  type AspectRatio,
  type PerformanceMode,
  type PacingOption,
  type VoiceGender,
  type VoiceRegion,
  type VoiceAge,
  type VoiceRole,
  type SpeakingSpeed,
  type Emotion,
} from "@/lib/promptkichban/schema";

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  review: "Review sản phẩm / Dịch vụ",
  "product-review": "Review sản phẩm",
  tvc: "TVC quảng cáo thương hiệu",
  tutorial: "Hướng dẫn từng bước",
  tips: "Tips & Mẹo vặt",
  storytelling: "Storytelling / Câu chuyện",
  podcast: "Podcast / Trò chuyện",
  education: "Giáo dục / Kiến thức",
  entertainment: "Giải trí / Xu hướng",
  trend: "Bắt trend viral",
  sales: "Bán hàng / Chốt đơn",
  custom: "Tùy chỉnh khác",
};

const PLATFORM_LABELS: Record<PublishingPlatform, { label: string; badge: string }> = {
  tiktok: { label: "TikTok", badge: "Vertical 9:16" },
  reels: { label: "Instagram Reels", badge: "Vertical 9:16" },
  shorts: { label: "YouTube Shorts", badge: "Vertical 9:16" },
  youtube: { label: "YouTube Video", badge: "Landscape 16:9" },
  facebook: { label: "Facebook Video", badge: "Đa định dạng" },
  custom: { label: "Tùy chỉnh", badge: "Custom" },
};

const VIDEO_MODEL_LABELS: Record<VideoModel, { name: string; tag: string }> = {
  both: { name: "Google Veo 3 & Grok", tag: "Tạo đồng thời 2 model hàng đầu" },
  veo3: { name: "Google Veo 3", tag: "Cấu trúc thẻ ngoặc cinematic [Tags]" },
  grok: { name: "xAI Grok Video", tag: "Miêu tả trực quan động thái chuyển động" },
};

const VISUAL_STYLE_LABELS: Record<VisualStyle, string> = {
  cinematic: "Cinematic điện ảnh (Độ sâu trường ảnh cao, ánh sáng studio)",
  "tech-cinematic": "Công nghệ hiện đại (Ánh sáng LED neon, phản xạ kim loại)",
  ugc: "UGC chân thực (Quay điện thoại, góc nhìn đời thường gần gũi)",
  documentary: "Phim tài liệu (Góc rộng, ánh sáng tự nhiên mộc mạc)",
  luxury: "Sang trọng cao cấp (Chuyển động chậm, macro chi tiết)",
  "clean-commercial": "Thương mại sạch sẽ (Ánh sáng trắng đều, tối giản)",
  lifestyle: "Lifestyle phong cách sống (Ấm áp, giàu cảm xúc)",
  educational: "Giáo dục trực quan (Góc máy rõ ràng, tập trung thông điệp)",
  "energetic-social": "Năng động xã hội (Nhịp cắt nhanh, màu sắc rực rỡ)",
  custom: "Phong cách tùy chỉnh",
};

const PERFORMANCE_MODE_LABELS: Record<PerformanceMode, { title: string; desc: string }> = {
  "hands-or-POV": {
    title: "Góc nhìn thứ nhất (POV / Bàn tay)",
    desc: "Cận cảnh bàn tay thao tác, góc nhìn người trải nghiệm trực tiếp",
  },
  "no-person": {
    title: "Không có người (Pure Visual)",
    desc: "Tập trung 100% vào vật thể, bối cảnh, cảnh quan hoặc đồ họa",
  },
  "person-no-face-focus": {
    title: "Có người nhưng không rõ mặt",
    desc: "Chủ thể quay lưng, góc nghiêng hoặc khuất mặt, tạo sự bí ẩn và tập trung hành động",
  },
  "presenter-on-camera": {
    title: "Diễn giả / Diễn xuất trước ống kính",
    desc: "Người dẫn chuyện nhìn thẳng camera, biểu cảm gương mặt và cử chỉ tự nhiên",
  },
  custom: {
    title: "Chế độ diễn xuất tùy chỉnh",
    desc: "Tự động phân bổ diễn xuất theo ngữ cảnh kịch bản của bạn",
  },
};

const ASPECT_RATIO_LABELS: Record<AspectRatio, string> = {
  "9:16": "9:16 (Dọc — TikTok / Reels / Shorts)",
  "16:9": "16:9 (Ngang — YouTube / TVC)",
  "1:1": "1:1 (Vuông — Feed Facebook / Insta)",
  "4:5": "4:5 (Dọc chuẩn Feed)",
};

const DURATION_PRESETS = [15, 30, 45, 60, 90];

const PROGRESS_MESSAGES = [
  "Đang đọc kịch bản...",
  "Đang phân tích nhịp phân cảnh...",
  "Đang giữ nguyên câu chữ thoại...",
  "Đang tạo prompt cho Google Veo 3 & Grok...",
  "Đang hoàn tất storyboard...",
];

interface InputFormProps {
  initialValues?: Partial<PromptKichBanInput>;
  isLoading: boolean;
  onSubmit: (values: PromptKichBanInput) => void;
}

export function InputForm({ initialValues, isLoading, onSubmit }: InputFormProps) {
  // Form State
  const [scriptText, setScriptText] = useState(
    initialValues?.scriptText || initialValues?.inputText || ""
  );
  const [contentType, setContentType] = useState<ContentType>(
    initialValues?.contentType || "review"
  );
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(
    initialValues?.visualStyle || "cinematic"
  );
  const [publishingPlatform, setPublishingPlatform] = useState<PublishingPlatform>(
    initialValues?.publishingPlatform || "tiktok"
  );
  const [videoModel, setVideoModel] = useState<VideoModel>(
    initialValues?.videoModel || "both"
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    initialValues?.aspectRatio || "9:16"
  );
  const [durationSeconds, setDurationSeconds] = useState<number>(
    initialValues?.durationSeconds || 30
  );
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(
    initialValues?.performanceMode || "hands-or-POV"
  );

  // Advanced Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [characterDescription, setCharacterDescription] = useState(
    initialValues?.characterDescription || ""
  );
  const [pacing, setPacing] = useState<PacingOption>(
    initialValues?.pacing || "balanced"
  );
  const [seoEnabled, setSeoEnabled] = useState<boolean>(
    initialValues?.seoEnabled ?? false
  );
  const [cta, setCta] = useState(initialValues?.cta || initialValues?.callToAction || "");
  const [additionalRequirements, setAdditionalRequirements] = useState(
    initialValues?.additionalRequirements || ""
  );

  // Legacy voice options (optional)
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(
    initialValues?.voiceGender || "neutral"
  );
  const [voiceRegion, setVoiceRegion] = useState<VoiceRegion>(
    initialValues?.voiceRegion || "south"
  );
  const [voiceAge, setVoiceAge] = useState<VoiceAge>(
    initialValues?.voiceAge || "young"
  );
  const [voiceRole, setVoiceRole] = useState<VoiceRole>(
    initialValues?.voiceRole || "reviewer"
  );
  const [speakingSpeed, setSpeakingSpeed] = useState<SpeakingSpeed>(
    initialValues?.speakingSpeed || "normal"
  );
  const [emotion, setEmotion] = useState<Emotion>(
    initialValues?.emotion || "friendly"
  );
  const [tone, setTone] = useState(initialValues?.voiceTone || initialValues?.tone || "Tự nhiên, chân thật");

  // Loading animation state
  const [progressIndex, setProgressIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setProgressIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [isLoading]);

  // Apply a Preset
  const handleApplyPreset = (preset: PromptKichBanPreset) => {
    setScriptText(preset.scriptText || preset.inputText || "");
    setContentType(preset.contentType);
    setVisualStyle(preset.visualStyle);
    setPublishingPlatform(preset.publishingPlatform);
    setVideoModel(preset.videoModel || "both");
    setAspectRatio(preset.aspectRatio);
    setDurationSeconds(preset.durationSeconds);
    setPerformanceMode(preset.performanceMode || "hands-or-POV");
    if (preset.characterDescription) setCharacterDescription(preset.characterDescription);
    if (preset.pacing) setPacing(preset.pacing);
    if (preset.seoEnabled !== undefined) setSeoEnabled(preset.seoEnabled);
    if (preset.cta || preset.callToAction) setCta(preset.cta || preset.callToAction || "");
    if (preset.additionalRequirements) setAdditionalRequirements(preset.additionalRequirements);
    if (preset.voiceGender) setVoiceGender(preset.voiceGender);
    if (preset.voiceRegion) setVoiceRegion(preset.voiceRegion);
    if (preset.voiceAge) setVoiceAge(preset.voiceAge);
    if (preset.voiceRole) setVoiceRole(preset.voiceRole);
    if (preset.speakingSpeed) setSpeakingSpeed(preset.speakingSpeed);
    if (preset.emotion) setEmotion(preset.emotion);
    if (preset.tone) setTone(preset.tone);
  };

  const isInputValid = scriptText.trim().length >= 20;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInputValid || isLoading) return;
    setProgressIndex(0);

    const values: PromptKichBanInput = {
      scriptText: scriptText.trim(),
      inputText: scriptText.trim(),
      contentType,
      visualStyle,
      publishingPlatform,
      videoModel,
      promptModel: (videoModel === "veo3" ? "veo3" : videoModel === "grok" ? "grok" : "all") as PromptModel,
      aspectRatio,
      durationSeconds,
      performanceMode,
      characterDescription: characterDescription.trim() || undefined,
      voiceLanguage: "vi",
      language: "vi",
      voiceTone: tone.trim(),
      pacing,
      seoEnabled,
      cta: cta.trim() || undefined,
      additionalRequirements: additionalRequirements.trim() || undefined,
      voiceGender,
      voiceRegion,
      voiceAge,
      voiceRole,
      speakingSpeed,
      emotion,
      tone: tone.trim(),
      callToAction: cta.trim() || undefined,
    };

    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Mẫu kịch bản gợi ý (Presets) ─────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-subtle text-accent">
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="text-xs font-semibold text-text uppercase tracking-wider">
              Mẫu gợi ý theo ngành hàng
            </span>
          </div>
          <span className="text-[11px] text-muted">Bấm vào mẫu để tự động điền</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {UNIVERSAL_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-left p-2.5 rounded-lg border border-border bg-surface-2/50 hover:bg-surface-2 hover:border-accent/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-medium text-text group-hover:text-accent line-clamp-1">
                  {p.name}
                </span>
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-surface border border-border text-muted shrink-0">
                  {p.badge}
                </span>
              </div>
              <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                {p.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Kịch bản video (Script Textarea — Core Input) ─────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="scriptText" className="text-xs font-bold text-text flex items-center gap-1.5">
            <Video className="h-4 w-4 text-accent" />
            Kịch bản video của bạn (bắt buộc)
          </label>
          <span className="text-[11px] text-muted">
            {scriptText.trim().length} / 12,000 ký tự (tối thiểu 20)
          </span>
        </div>

        <textarea
          id="scriptText"
          rows={5}
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          placeholder="Dán toàn bộ kịch bản, lời thoại hoặc dàn ý video của bạn vào đây...&#10;&#10;Hệ thống sẽ giữ nguyên 100% câu chữ thoại, chia thành từng phân cảnh hợp lý và tạo prompt mô tả hình ảnh cho Google Veo 3 & xAI Grok."
          className="w-full rounded-lg border border-border bg-surface-2/30 p-3 text-sm text-text placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-hidden leading-relaxed resize-y"
        />

        {!isInputValid && scriptText.length > 0 && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            Nội dung kịch bản cần tối thiểu 20 ký tự để AI có đủ dữ liệu phân cảnh.
          </p>
        )}
      </div>

      {/* ── Thiết lập kỹ thuật cốt lõi (Platform, Model, Ratio, Duration) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Nền tảng xuất bản */}
        <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
          <label className="text-xs font-semibold text-text mb-1.5 block">
            Nền tảng đăng tải
          </label>
          <select
            value={publishingPlatform}
            onChange={(e) => setPublishingPlatform(e.target.value as PublishingPlatform)}
            className="w-full h-9 rounded-md border border-border bg-surface px-2.5 text-xs text-text focus:border-accent outline-hidden cursor-pointer"
          >
            {PUBLISHING_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {PLATFORM_LABELS[platform]?.label || platform}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-muted mt-1">
            {PLATFORM_LABELS[publishingPlatform]?.badge}
          </p>
        </div>

        {/* Video Prompt Model */}
        <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
          <label className="text-xs font-semibold text-text mb-1.5 block">
            Model Video AI
          </label>
          <select
            value={videoModel}
            onChange={(e) => setVideoModel(e.target.value as VideoModel)}
            className="w-full h-9 rounded-md border border-border bg-surface px-2.5 text-xs text-text focus:border-accent outline-hidden cursor-pointer font-medium"
          >
            {VIDEO_MODELS.map((model) => (
              <option key={model} value={model}>
                {VIDEO_MODEL_LABELS[model]?.name || model}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-muted mt-1 truncate">
            {VIDEO_MODEL_LABELS[videoModel]?.tag}
          </p>
        </div>

        {/* Tỷ lệ khung hình */}
        <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
          <label className="text-xs font-semibold text-text mb-1.5 block">
            Tỷ lệ khung hình
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="w-full h-9 rounded-md border border-border bg-surface px-2.5 text-xs text-text focus:border-accent outline-hidden cursor-pointer"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ASPECT_RATIO_LABELS[ratio]}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-muted mt-1">Độ phân giải tương thích video engine</p>
        </div>

        {/* Thời lượng */}
        <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
          <label className="text-xs font-semibold text-text mb-1.5 block">
            Thời lượng video
          </label>
          <div className="flex items-center gap-1.5">
            <select
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              className="w-full h-9 rounded-md border border-border bg-surface px-2.5 text-xs text-text focus:border-accent outline-hidden cursor-pointer"
            >
              {DURATION_PRESETS.map((dur) => (
                <option key={dur} value={dur}>
                  {dur} giây
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-muted mt-1">Phân bổ 3 - 6 phân cảnh liên tục</p>
        </div>
      </div>

      {/* ── Phong cách hình ảnh & Chế độ diễn xuất ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Phong cách thị giác */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-text flex items-center gap-1.5">
            <Clapperboard className="h-4 w-4 text-accent" />
            Phong cách hình ảnh & Ánh sáng
          </label>
          <select
            value={visualStyle}
            onChange={(e) => setVisualStyle(e.target.value as VisualStyle)}
            className="w-full h-9 rounded-md border border-border bg-surface px-2.5 text-xs text-text focus:border-accent outline-hidden cursor-pointer"
          >
            {VISUAL_STYLES.map((style) => (
              <option key={style} value={style}>
                {VISUAL_STYLE_LABELS[style] || style}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted">
            Xác lập ánh sáng, độ tương phản và chất liệu quang học cho máy quay.
          </p>
        </div>

        {/* Chế độ thể hiện & diễn xuất */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-text flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-accent" />
            Chế độ diễn xuất & Nhân vật
          </label>
          <select
            value={performanceMode}
            onChange={(e) => setPerformanceMode(e.target.value as PerformanceMode)}
            className="w-full h-9 rounded-md border border-border bg-surface px-2.5 text-xs text-text focus:border-accent outline-hidden cursor-pointer font-medium"
          >
            {PERFORMANCE_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {PERFORMANCE_MODE_LABELS[mode]?.title || mode}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted">
            {PERFORMANCE_MODE_LABELS[performanceMode]?.desc}
          </p>
        </div>
      </div>

      {/* ── Tùy chỉnh nâng cao (Accordion) ─────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 text-xs font-semibold text-text hover:bg-surface-2/40 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-accent" />
            <span>Tùy chỉnh nâng cao (Mô tả nhân vật, nhịp điệu, SEO, CTA...)</span>
          </span>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-4 pt-0 border-t border-border/60 space-y-4 animate-in fade-in duration-150">
            {/* Hàng 1: Thể loại & Nhịp điệu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              <div>
                <label className="text-xs font-medium text-text-2 mb-1 block">
                  Thể loại nội dung
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="w-full h-9 rounded-md border border-border bg-surface px-2.5 text-xs text-text"
                >
                  {CONTENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CONTENT_TYPE_LABELS[type] || type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-text-2 mb-1 block">
                  Nhịp điệu phân cảnh (Pacing)
                </label>
                <select
                  value={pacing}
                  onChange={(e) => setPacing(e.target.value as PacingOption)}
                  className="w-full h-9 rounded-md border border-border bg-surface px-2.5 text-xs text-text"
                >
                  {PACING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "slow"
                        ? "Chậm rãi & Chiêm nghiệm (Slow)"
                        : opt === "fast"
                        ? "Dồn dập & Bắt mắt (Fast)"
                        : "Cân bằng & Tự nhiên (Balanced)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hàng 2: Mô tả nhân vật & SEO Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-text-2 mb-1 block">
                  Mô tả nhân vật / trang phục (tùy chọn)
                </label>
                <input
                  type="text"
                  value={characterDescription}
                  onChange={(e) => setCharacterDescription(e.target.value)}
                  placeholder="Ví dụ: Nữ 25 tuổi, tóc đen ngắn, áo sơ mi trắng tối giản..."
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-text"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 rounded-md border border-border bg-surface-2/30 cursor-pointer h-9">
                  <input
                    type="checkbox"
                    checked={seoEnabled}
                    onChange={(e) => setSeoEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-xs font-medium text-text flex items-center gap-1">
                    <Search className="h-3.5 w-3.5 text-accent" />
                    Sinh Keywords SEO
                  </span>
                </label>
              </div>
            </div>

            {/* Hàng 3: Kêu gọi hành động (CTA) & Tông thái */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-2 mb-1 block">
                  Lời kêu gọi hành động (CTA)
                </label>
                <input
                  type="text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="Ví dụ: Nhấn vào link bio để nhận tư vấn hoặc tải tài liệu..."
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-text"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-2 mb-1 block">
                  Tông thái / Cảm xúc chủ đạo
                </label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="Ví dụ: Chân thật, dí dỏm, truyền cảm hứng..."
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-text"
                />
              </div>
            </div>

            {/* Hàng 4: Yêu cầu kỹ thuật bổ sung */}
            <div>
              <label className="text-xs font-medium text-text-2 mb-1 block">
                Yêu cầu bổ sung cho camera & đạo cụ (tùy chọn)
              </label>
              <textarea
                rows={2}
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                placeholder="Ví dụ: Cần nhiều góc quay cận cảnh chi tiết, chuyển cảnh lướt nhanh, ánh sáng vàng ấm..."
                className="w-full rounded-md border border-border bg-surface p-2.5 text-xs text-text leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Nút Phân tích & Tạo Prompt ────────────────────────────────────── */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          disabled={!isInputValid || isLoading}
          className="w-full h-12 text-base font-semibold shadow-md shadow-accent/20 cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span>{PROGRESS_MESSAGES[progressIndex]}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Phân tích kịch bản và tạo prompt
            </span>
          )}
        </Button>
        <p className="text-center text-[11px] text-muted mt-2">
          Hệ thống miễn phí · Tối ưu hóa prompt chuyên sâu cho Google Veo 3 & xAI Grok Video.
        </p>

        {/* ── Quyền riêng tư & Điều khoản AI ───────────────────────────────── */}
        <div className="mt-4 rounded-xl border border-border/70 bg-surface-2/40 p-3.5 text-[11px] text-muted space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-text text-xs">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>Chính sách quyền riêng tư & Điều khoản AI</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-muted leading-relaxed">
            <li>
              <strong className="text-text-2">Bảo toàn kịch bản:</strong> Toàn bộ câu từ của kịch bản gốc được lưu giữ nguyên vẹn vào từng phân cảnh; hệ thống không tự ý bịa đặt thông số hay cam kết sai lệch.
            </li>
            <li>
              <strong className="text-text-2">Riêng tư mặc định:</strong> Mọi kịch bản lưu trong tài khoản của bạn được giữ ở chế độ riêng tư (Private). Bạn có toàn quyền xem, đổi tên hoặc xóa vĩnh viễn bất kỳ lúc nào.
            </li>
            <li>
              <strong className="text-text-2">Công cụ tạo prompt:</strong> Đây là công cụ tạo câu lệnh (Prompt Engineering) cho các engine video như Google Veo 3 và xAI Grok; hệ thống không trực tiếp sinh file video.
            </li>
          </ul>
        </div>
      </div>
    </form>
  );
}
