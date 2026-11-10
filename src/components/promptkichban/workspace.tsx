"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  Share2,
  Clapperboard,
  Sparkles,
  Layers,
  FileText,
  FileCode,
  AlertTriangle,
  Save,
  Clock,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button, Badge } from "@/components/studio/ui";
import type { VideoPromptOutput, VideoScene } from "@/lib/promptkichban/schema";
import { formatScriptToMarkdown } from "@/lib/promptkichban/markdown";

interface WorkspaceProps {
  output: VideoPromptOutput;
  onBackToInput: () => void;
  onUpdateOutput: (updated: VideoPromptOutput) => void;
  onRegenerateScene?: (sceneNumber: number) => void;
  // Cloud library sync props (Phase 4)
  currentUser?: { userId: string; email: string; name: string } | null;
  currentDocumentId?: string | null;
  isSavingCloud?: boolean;
  onSaveToCloud?: () => void;
}

type TabModel = "veo3" | "grok" | "seedance25" | "seedance2" | "muse";

const TAB_MODELS: Array<{
  id: TabModel;
  name: string;
  badge: string;
  desc: string;
}> = [
  { id: "veo3", name: "Google Veo 3", badge: "Veo 3", desc: "Cấu trúc thẻ [Subject & Action], [Cinematography], [Lighting] chuẩn điện ảnh" },
  { id: "grok", name: "xAI Grok Video", badge: "Grok", desc: "Miêu tả trực quan động thái chuyển động, độ tương phản và chi tiết vật lý" },
  { id: "seedance25", name: "Seedance 2.5", badge: "ByteDance", desc: "Dòng thời gian At [0s-Ns] cho video ngắn TikTok/Shorts" },
  { id: "seedance2", name: "Seedance 2.0", badge: "ByteDance", desc: "Cú pháp pipe phân tách [Subject] | [Shot] --neg" },
  { id: "muse", name: "Tencent Muse", badge: "Tencent", desc: "Chuẩn TVC thương mại, Optical Profile 35mm" },
];

export function Workspace({
  output,
  onBackToInput,
  onUpdateOutput,
  onRegenerateScene,
  currentDocumentId,
  isSavingCloud = false,
  onSaveToCloud,
}: WorkspaceProps) {
  // Active selected scene index (0-based)
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);

  // Active prompt model tab
  const [activeModelTab, setActiveModelTab] = useState<TabModel>(
    output.videoModel === "grok" ? "grok" : "veo3"
  );

  // Copy state trackers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedScene: VideoScene | undefined = output.scenes[selectedSceneIndex];

  // Editable scene state
  const [editScriptSegment, setEditScriptSegment] = useState(
    selectedScene?.originalScriptSegment || selectedScene?.voiceover || ""
  );
  const [editCharacterAction, setEditCharacterAction] = useState(
    selectedScene?.characterAction || selectedScene?.action || ""
  );
  const [editVisualDesc, setEditVisualDesc] = useState(selectedScene?.visualDescription || "");
  const [editCameraShot, setEditCameraShot] = useState(selectedScene?.cameraShot || "");
  const [editCameraAngle, setEditCameraAngle] = useState(selectedScene?.cameraAngle || "Eye-level");
  const [editCameraMovement, setEditCameraMovement] = useState(
    selectedScene?.cameraMovement || ""
  );
  const [editOnScreenText, setEditOnScreenText] = useState(selectedScene?.onScreenText || "");
  const [editContinuityNotes, setEditContinuityNotes] = useState(
    selectedScene?.continuityNotes || ""
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync edit state when scene index changes
  const handleSelectScene = (index: number) => {
    setSelectedSceneIndex(index);
    const target = output.scenes[index];
    if (target) {
      setEditScriptSegment(target.originalScriptSegment || target.voiceover || "");
      setEditCharacterAction(target.characterAction || target.action || "");
      setEditVisualDesc(target.visualDescription || "");
      setEditCameraShot(target.cameraShot || "");
      setEditCameraAngle(target.cameraAngle || "Eye-level");
      setEditCameraMovement(target.cameraMovement || "");
      setEditOnScreenText(target.onScreenText || "");
      setEditContinuityNotes(target.continuityNotes || "");
      setHasUnsavedChanges(false);
    }
  };

  // Toggle scene lock
  const handleToggleLock = (sceneNumber: number) => {
    const updatedScenes = output.scenes.map((s) => {
      if (s.sceneNumber === sceneNumber) {
        return { ...s, isLocked: !s.isLocked };
      }
      return s;
    });

    onUpdateOutput({
      ...output,
      scenes: updatedScenes,
    });
  };

  // Save edits back to output
  const handleSaveSceneEdits = () => {
    if (!selectedScene) return;

    const updatedScenes = [...output.scenes];
    updatedScenes[selectedSceneIndex] = {
      ...selectedScene,
      originalScriptSegment: editScriptSegment,
      voiceover: editScriptSegment,
      characterAction: editCharacterAction,
      action: editCharacterAction,
      visualDescription: editVisualDesc,
      cameraShot: editCameraShot,
      cameraAngle: editCameraAngle,
      cameraMovement: editCameraMovement,
      onScreenText: editOnScreenText,
      continuityNotes: editContinuityNotes,
    };

    const updatedOutput: VideoPromptOutput = {
      ...output,
      scenes: updatedScenes,
      voiceoverFull: updatedScenes
        .map((s) => s.originalScriptSegment || s.voiceover)
        .filter(Boolean)
        .join(" "),
    };

    onUpdateOutput(updatedOutput);
    setHasUnsavedChanges(false);
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    const md = formatScriptToMarkdown(output, "all");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `storyboard-${output.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download JSON file
  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(output, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `storyboard-${output.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Prompt getter for selected scene & active model
  const currentPromptText = useMemo(() => {
    if (!selectedScene) return "";
    if (selectedScene.modelPrompts) {
      return selectedScene.modelPrompts[activeModelTab] || selectedScene.prompt;
    }
    return selectedScene.prompt;
  }, [selectedScene, activeModelTab]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ── Top Workspace Header ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Back & Title */}
          <div className="space-y-1">
            <button
              onClick={onBackToInput}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-text-2 hover:text-accent transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Chỉnh sửa input / Tạo kịch bản mới</span>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-text line-clamp-1">
              {output.title}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <Badge tone="accent">{output.durationSeconds} giây</Badge>
              <Badge tone="neutral">{output.scenes.length} phân cảnh</Badge>
              <Badge tone="neutral">{output.aspectRatio}</Badge>
              <Badge tone="neutral">{output.publishingPlatform}</Badge>
              <Badge tone="neutral">{output.contentType}</Badge>
              <Badge tone="neutral">Model: {output.videoModel === "both" ? "Veo 3 & Grok" : output.videoModel || output.promptModel}</Badge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onSaveToCloud && (
              <Button
                variant={currentDocumentId ? "secondary" : "primary"}
                size="sm"
                onClick={onSaveToCloud}
                disabled={isSavingCloud}
                className="cursor-pointer"
              >
                {isSavingCloud ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : currentDocumentId ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span>Đã lưu vào tài khoản</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Lưu vào tài khoản</span>
                  </>
                )}
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCopy(formatScriptToMarkdown(output, "all"), "copy-all")}
              className="cursor-pointer"
            >
              {copiedKey === "copy-all" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span>Đã chép toàn bộ</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Chép kịch bản</span>
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadMarkdown}
              className="cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Tải Markdown (.md)</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadJSON}
              className="cursor-pointer"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Tải JSON</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Summary & Hook Banner ────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface-2/40 p-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Hook mở đầu video (3 giây đầu)
          </span>
          <p className="text-sm font-medium text-text bg-surface p-2.5 rounded-lg border border-border">
            &ldquo;{output.hook}&rdquo;
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1">
            <Clapperboard className="h-3.5 w-3.5 text-accent" />
            Kêu gọi hành động (CTA)
          </span>
          <p className="text-sm font-medium text-text bg-surface p-2.5 rounded-lg border border-border">
            &ldquo;{output.cta}&rdquo;
          </p>
        </div>
      </div>

      {/* ── 3-Column Storyboard Workspace (Desktop Layout) ────────────────── */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">
        {/* ── CỘT 1: Danh sách cảnh (Timeline) ────────────────────────────── */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-surface p-3 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-accent" />
              Phân cảnh ({output.scenes.length})
            </span>
            <span className="text-[11px] text-muted font-medium">Timeline</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {output.scenes.map((scene, idx) => {
              const isSelected = idx === selectedSceneIndex;
              return (
                <button
                  key={scene.sceneNumber}
                  type="button"
                  onClick={() => handleSelectScene(idx)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-accent bg-accent-subtle/40 ring-1 ring-accent text-text"
                      : "border-border bg-surface hover:bg-surface-2 text-text-2 hover:text-text"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-text flex items-center gap-1.5">
                      <span
                        className={`h-4.5 w-4.5 rounded text-[10px] font-bold flex items-center justify-center ${
                          isSelected
                            ? "bg-accent text-white"
                            : "bg-surface-2 text-muted"
                        }`}
                      >
                        {scene.sceneNumber}
                      </span>
                      Cảnh {scene.sceneNumber}
                      {scene.isLocked && (
                        <span title="Cảnh này đã bị khóa">
                          <Lock className="h-3 w-3 text-warning shrink-0" />
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] font-mono text-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {scene.startSecond}s - {scene.endSecond}s
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-text line-clamp-1 mb-1">
                    {scene.scenePurpose}
                  </p>

                  <p className="text-[11px] text-muted line-clamp-2 leading-relaxed bg-surface-2/40 p-1.5 rounded">
                    &ldquo;{scene.originalScriptSegment || scene.voiceover}&rdquo;
                  </p>

                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted font-medium line-clamp-1">
                      {scene.cameraShot}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted font-medium line-clamp-1">
                      {scene.cameraMovement}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CỘT 2: Chi tiết cảnh & Biên tập (Editor) ────────────────────── */}
        <div className="lg:col-span-5 rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4">
          {selectedScene ? (
            <>
              {/* Scene Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-accent text-white text-xs font-bold flex items-center justify-center">
                    {selectedScene.sceneNumber}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-text flex items-center gap-1.5">
                      Chi tiết Cảnh {selectedScene.sceneNumber}
                      {selectedScene.isLocked && (
                        <Badge tone="warning">Đã khóa</Badge>
                      )}
                    </h2>
                    <p className="text-xs text-text-2">
                      Thời lượng: {selectedScene.startSecond}s – {selectedScene.endSecond}s ({selectedScene.endSecond - selectedScene.startSecond}s) · {selectedScene.scenePurpose}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Lock Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleLock(selectedScene.sceneNumber)}
                    className={`p-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      selectedScene.isLocked
                        ? "border-warning/40 bg-warning-subtle text-warning hover:bg-warning/20"
                        : "border-border bg-surface text-text-2 hover:bg-surface-2"
                    }`}
                    title={selectedScene.isLocked ? "Bấm để mở khóa cảnh" : "Bấm để khóa cảnh (giữ nguyên khi tạo lại)"}
                  >
                    {selectedScene.isLocked ? (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Đã khóa</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3.5 w-3.5 text-muted" />
                        <span className="text-[11px]">Khóa cảnh</span>
                      </>
                    )}
                  </button>

                  {/* Regenerate Scene Button */}
                  {onRegenerateScene && (
                    <button
                      type="button"
                      disabled={selectedScene.isLocked}
                      onClick={() => onRegenerateScene(selectedScene.sceneNumber)}
                      className="p-1.5 rounded-md border border-border bg-surface text-xs font-medium text-text-2 hover:text-accent hover:border-accent hover:bg-accent-subtle/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                      title={selectedScene.isLocked ? "Mở khóa cảnh trước khi tạo lại" : "Tạo lại chỉ cảnh này bằng AI"}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Tạo lại cảnh</span>
                    </button>
                  )}

                  {hasUnsavedChanges && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveSceneEdits}
                      className="cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Lưu sửa</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Original Script Segment (Preserved Verbatim) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-accent" />
                    Kịch bản gốc tương ứng (Thoại tiếng Việt)
                  </span>
                  <span className="text-[10px] text-muted font-normal">Giữ nguyên câu chữ</span>
                </label>
                <textarea
                  rows={2}
                  value={editScriptSegment}
                  onChange={(e) => {
                    setEditScriptSegment(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Đoạn kịch bản gốc tương ứng với cảnh này..."
                  className="w-full rounded-lg border border-border bg-surface p-2.5 text-xs text-text focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Character Action & Actor Performance */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                  <Clapperboard className="h-3.5 w-3.5 text-accent" />
                  Hành động của chủ thể & Diễn xuất
                </label>
                <textarea
                  rows={2}
                  value={editCharacterAction}
                  onChange={(e) => {
                    setEditCharacterAction(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Mô tả hành động của chủ thể / bàn tay / diễn viên..."
                  className="w-full rounded-lg border border-border bg-surface p-2.5 text-xs text-text focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Camera Shot & Angle & Movement */}
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-2 block">
                    Cỡ cảnh (Shot)
                  </label>
                  <input
                    type="text"
                    value={editCameraShot}
                    onChange={(e) => {
                      setEditCameraShot(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Ví dụ: Close-up"
                    className="w-full h-8.5 rounded-lg border border-border bg-surface px-2.5 text-xs text-text focus:border-accent outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-2 block">
                    Góc máy (Angle)
                  </label>
                  <input
                    type="text"
                    value={editCameraAngle}
                    onChange={(e) => {
                      setEditCameraAngle(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Ví dụ: Eye-level, Low-angle"
                    className="w-full h-8.5 rounded-lg border border-border bg-surface px-2.5 text-xs text-text focus:border-accent outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-2 block">
                    Chuyển động (Movement)
                  </label>
                  <input
                    type="text"
                    value={editCameraMovement}
                    onChange={(e) => {
                      setEditCameraMovement(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Ví dụ: Slow push-in"
                    className="w-full h-8.5 rounded-lg border border-border bg-surface px-2.5 text-xs text-text focus:border-accent outline-none"
                  />
                </div>
              </div>

              {/* Visual Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-accent" />
                  Mô tả hình ảnh tổng quan
                </label>
                <textarea
                  rows={2}
                  value={editVisualDesc}
                  onChange={(e) => {
                    setEditVisualDesc(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full rounded-lg border border-border bg-surface p-2.5 text-xs text-text focus:border-accent outline-none leading-relaxed"
                />
              </div>

              {/* Continuity Notes & OnScreen Text */}
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-2 block">
                    Tính liền mạch (Continuity Notes)
                  </label>
                  <input
                    type="text"
                    value={editContinuityNotes}
                    onChange={(e) => {
                      setEditContinuityNotes(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Duy trì ánh sáng và màu sắc đồng nhất..."
                    className="w-full h-8.5 rounded-lg border border-border bg-surface px-2.5 text-xs text-text focus:border-accent outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-2 block">
                    Chữ hiện trên màn hình (Text Overlay)
                  </label>
                  <input
                    type="text"
                    value={editOnScreenText}
                    onChange={(e) => {
                      setEditOnScreenText(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Ví dụ: TÍNH NĂNG ĐỘC BẢN..."
                    className="w-full h-8.5 rounded-lg border border-border bg-surface px-2.5 text-xs text-text focus:border-accent outline-none"
                  />
                </div>
              </div>

              {/* Shot Details Grid */}
              <div className="rounded-lg border border-border bg-surface-2/40 p-3 grid gap-2.5 grid-cols-2 text-xs">
                <div>
                  <span className="text-[11px] font-medium text-muted block">Ánh sáng:</span>
                  <span className="text-text">{selectedScene.lighting}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-muted block">Bối cảnh:</span>
                  <span className="text-text">{selectedScene.setting}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-muted block">Âm thanh / SFX:</span>
                  <span className="text-text">{selectedScene.soundDesign}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-muted block">Chuyển cảnh:</span>
                  <span className="text-text">{selectedScene.transition}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-muted text-xs">
              Chọn một cảnh từ danh sách bên trái để xem và sửa chi tiết.
            </div>
          )}
        </div>

        {/* ── CỘT 3: Prompt theo Model AI (Veo 3 & Grok) ───────────────────── */}
        <div className="lg:col-span-4 rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Prompt Video AI Cảnh {selectedScene?.sceneNumber || 1}
            </span>
            <span className="text-[11px] text-accent font-semibold">
              Tiếng Anh chuẩn model
            </span>
          </div>

          {/* Model Switcher Tabs */}
          <div
            role="tablist"
            aria-label="Chọn mô hình Video AI"
            className="flex flex-wrap gap-1 p-1 rounded-lg bg-surface-2/60 border border-border"
          >
            {TAB_MODELS.map((m) => {
              const active = activeModelTab === m.id;
              return (
                <button
                  key={m.id}
                  id={`tab-${m.id}`}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${m.id}`}
                  type="button"
                  onClick={() => setActiveModelTab(m.id)}
                  className={`flex-1 min-w-[70px] py-1 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-surface text-accent shadow-xs border border-border"
                      : "text-muted hover:text-text"
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>

          {/* Model Description Notice */}
          <div className="text-[11px] text-text-2 bg-surface-2/30 p-2 rounded-md border border-border flex items-center gap-1.5">
            <span className="font-semibold text-accent">
              {TAB_MODELS.find((m) => m.id === activeModelTab)?.badge}:
            </span>
            <span className="line-clamp-2">{TAB_MODELS.find((m) => m.id === activeModelTab)?.desc}</span>
          </div>

          {/* Prompt Box */}
          <div
            id={`panel-${activeModelTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeModelTab}`}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text">
                Full Generation Prompt
              </span>
              <button
                type="button"
                onClick={() => handleCopy(currentPromptText, `prompt-${selectedSceneIndex}-${activeModelTab}`)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-accent bg-accent-subtle hover:bg-accent-hover hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === `prompt-${selectedSceneIndex}-${activeModelTab}` ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Sao chép Prompt</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="w-full max-h-[300px] overflow-y-auto p-3.5 rounded-lg border border-border bg-surface-2/40 text-xs font-mono text-text whitespace-pre-wrap leading-relaxed select-all">
                {currentPromptText}
              </pre>
            </div>
          </div>

          {/* Negative Prompt */}
          {selectedScene?.negativePrompt && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-2">
                  Negative Prompt (Loại trừ lỗi)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedScene.negativePrompt, `neg-${selectedSceneIndex}`)}
                  className="text-[11px] text-muted hover:text-text flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === `neg-${selectedSceneIndex}` ? (
                    <>
                      <Check className="h-3 w-3 text-success" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Chép</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-2 rounded-md bg-surface-2/30 border border-border text-[11px] font-mono text-muted">
                {selectedScene.negativePrompt}
              </div>
            </div>
          )}

          {/* Quick instructions on how to use */}
          <div className="pt-2 border-t border-border text-[11px] text-muted space-y-1">
            <p className="font-semibold text-text-2">Cách dùng prompt này:</p>
            <p>1. Bấm <strong>Sao chép Prompt</strong> ở trên.</p>
            <p>2. Dán vào ô nhập câu lệnh của {TAB_MODELS.find((m) => m.id === activeModelTab)?.name}.</p>
            <p>3. Chọn tỷ lệ khung hình <strong>{output.aspectRatio}</strong> và render clip.</p>
          </div>
        </div>
      </div>

      {/* ── Social Package: Caption, Hashtags & Keywords ──────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5 text-accent" />
            Nội dung bài đăng & Caption mạng xã hội
          </span>
          <button
            type="button"
            onClick={() =>
              handleCopy(
                `${output.caption}\n\n${output.hashtags
                  .map((h) => (h.startsWith("#") ? h : `#${h}`))
                  .join(" ")}`,
                "copy-social"
              )
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-accent bg-accent-subtle hover:bg-accent-hover hover:text-white transition-all cursor-pointer"
          >
            {copiedKey === "copy-social" ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                <span>Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Sao chép Caption + Hashtag</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-text whitespace-pre-wrap leading-relaxed bg-surface-2/30 p-3 rounded-lg border border-border">
            {output.caption}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {output.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>

          {output.keywords && output.keywords.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-muted flex items-center gap-1">
                <Search className="h-3 w-3" />
                Keywords:
              </span>
              {output.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-2 text-text-2 border border-border"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Warnings / Policy notices */}
        {output.warnings && output.warnings.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-warning-subtle border border-warning/20 text-xs text-warning space-y-1">
            <span className="font-semibold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Lưu ý tuân thủ:
            </span>
            <ul className="list-disc list-inside space-y-0.5 opacity-90">
              {output.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
