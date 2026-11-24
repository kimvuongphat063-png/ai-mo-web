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
      <div className="rounded-2xl border border-white/12 bg-[#101420] p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Back & Title */}
          <div className="space-y-1">
            <button
              onClick={onBackToInput}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#00e5ff] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Chỉnh sửa input / Tạo kịch bản mới</span>
            </button>
            <h1 className="text-lg sm:text-xl font-extrabold text-white line-clamp-1">
              {output.title}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#d4ff00]/15 text-[#d4ff00] border border-[#d4ff00]/30">
                {output.durationSeconds} giây
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/15">
                {output.scenes.length} phân cảnh
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/15">
                {output.aspectRatio}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/15">
                {output.publishingPlatform}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/15">
                {output.contentType}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/15">
                Model: {output.videoModel === "both" ? "Veo 3 & Grok" : output.videoModel || output.promptModel}
              </span>
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
                className={`cursor-pointer font-bold ${
                  currentDocumentId
                    ? "bg-white/10 hover:bg-white/15 text-slate-200 border-white/20"
                    : "bg-[#00e5ff]/20 hover:bg-[#00e5ff] text-[#00e5ff] hover:text-black border border-[#00e5ff]/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                }`}
              >
                {isSavingCloud ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : currentDocumentId ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
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
              variant="primary"
              size="sm"
              onClick={() => handleCopy(formatScriptToMarkdown(output, "all"), "copy-all")}
              className="cursor-pointer !bg-[#d4ff00] hover:!bg-[#b8e000] !text-black font-black shadow-[0_0_15px_rgba(212,255,0,0.35)]"
              style={{ color: "#000000", fontWeight: 900 }}
            >
              {copiedKey === "copy-all" ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span style={{ color: "#000000", fontWeight: 900 }}>Đã chép toàn bộ</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span style={{ color: "#000000", fontWeight: 900 }}>Chép kịch bản</span>
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadMarkdown}
              className="cursor-pointer bg-white/5 hover:bg-white/10 text-slate-200 border-white/15 font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Tải Markdown (.md)</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadJSON}
              className="cursor-pointer bg-white/5 hover:bg-white/10 text-slate-200 border-white/15 font-semibold"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Tải JSON</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Summary & Hook Banner ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/12 bg-[#101420] p-4 sm:p-5 grid gap-3 sm:grid-cols-2 shadow-lg">
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#d4ff00]" />
            Hook mở đầu video (3 giây đầu)
          </span>
          <p className="text-sm font-medium text-slate-200 bg-[#0d121f] p-3 rounded-xl border border-white/12 leading-relaxed">
            &ldquo;{output.hook}&rdquo;
          </p>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clapperboard className="h-3.5 w-3.5 text-[#00e5ff]" />
            Kêu gọi hành động (CTA)
          </span>
          <p className="text-sm font-medium text-slate-200 bg-[#0d121f] p-3 rounded-xl border border-white/12 leading-relaxed">
            &ldquo;{output.cta}&rdquo;
          </p>
        </div>
      </div>

      {/* ── 3-Column Storyboard Workspace (Desktop Layout) ────────────────── */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">
        {/* ── CỘT 1: Danh sách cảnh (Timeline) ────────────────────────────── */}
        <div className="lg:col-span-3 rounded-2xl border border-white/12 bg-[#101420] p-3.5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#d4ff00]" />
              Phân cảnh ({output.scenes.length})
            </span>
            <span className="text-[11px] text-[#00e5ff] font-semibold">Timeline</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {output.scenes.map((scene, idx) => {
              const isSelected = idx === selectedSceneIndex;
              return (
                <button
                  key={scene.sceneNumber}
                  type="button"
                  onClick={() => handleSelectScene(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-[#d4ff00] bg-[#d4ff00]/10 ring-1 ring-[#d4ff00] text-white shadow-[0_0_15px_rgba(212,255,0,0.15)]"
                      : "border-white/10 bg-[#0d121f] hover:bg-white/[0.08] text-slate-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span
                        className={`h-5 w-5 rounded-md text-[10px] font-black flex items-center justify-center ${
                          isSelected
                            ? "bg-[#d4ff00] text-black"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {scene.sceneNumber}
                      </span>
                      Cảnh {scene.sceneNumber}
                      {scene.isLocked && (
                        <span title="Cảnh này đã bị khóa">
                          <Lock className="h-3 w-3 text-amber-400 shrink-0" />
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {scene.startSecond}s - {scene.endSecond}s
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-200 line-clamp-1 mb-1">
                    {scene.scenePurpose}
                  </p>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed bg-black/40 border border-white/5 p-2 rounded-lg">
                    &ldquo;{scene.originalScriptSegment || scene.voiceover}&rdquo;
                  </p>

                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 font-medium line-clamp-1">
                      {scene.cameraShot}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 font-medium line-clamp-1">
                      {scene.cameraMovement}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CỘT 2: Chi tiết cảnh & Biên tập (Editor) ────────────────────── */}
        <div className="lg:col-span-5 rounded-2xl border border-white/12 bg-[#101420] p-4 sm:p-5 space-y-4 shadow-lg">
          {selectedScene ? (
            <>
              {/* Scene Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-[#00e5ff] text-black text-xs font-black flex items-center justify-center">
                    {selectedScene.sceneNumber}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                      Chi tiết Cảnh {selectedScene.sceneNumber}
                      {selectedScene.isLocked && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Đã khóa
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Thời lượng: {selectedScene.startSecond}s – {selectedScene.endSecond}s ({selectedScene.endSecond - selectedScene.startSecond}s) · {selectedScene.scenePurpose}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Lock Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleLock(selectedScene.sceneNumber)}
                    className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                      selectedScene.isLocked
                        ? "border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                        : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
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
                        <Unlock className="h-3.5 w-3.5 text-slate-400" />
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
                      className="p-1.5 rounded-lg border border-white/15 bg-white/5 text-xs font-medium text-slate-300 hover:text-[#00e5ff] hover:border-[#00e5ff]/40 hover:bg-[#00e5ff]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
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
                      className="cursor-pointer !bg-[#d4ff00] hover:!bg-[#b8e000] !text-black font-black"
                      style={{ color: "#000000", fontWeight: 900 }}
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span style={{ color: "#000000", fontWeight: 900 }}>Lưu sửa</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Original Script Segment (Preserved Verbatim) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#d4ff00]" />
                    Kịch bản gốc tương ứng (Thoại tiếng Việt)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Giữ nguyên câu chữ</span>
                </label>
                <textarea
                  rows={2}
                  value={editScriptSegment}
                  onChange={(e) => {
                    setEditScriptSegment(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Đoạn kịch bản gốc tương ứng với cảnh này..."
                  className="w-full rounded-xl border border-white/15 bg-[#0d121f] p-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]/30 outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Character Action & Actor Performance */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clapperboard className="h-3.5 w-3.5 text-[#00e5ff]" />
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
                  className="w-full rounded-xl border border-white/15 bg-[#0d121f] p-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]/30 outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Camera Shot & Angle & Movement */}
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
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
                    className="w-full h-8.5 rounded-lg border border-white/15 bg-[#0d121f] px-2.5 text-xs text-white focus:border-[#00e5ff] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
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
                    className="w-full h-8.5 rounded-lg border border-white/15 bg-[#0d121f] px-2.5 text-xs text-white focus:border-[#00e5ff] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
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
                    className="w-full h-8.5 rounded-lg border border-white/15 bg-[#0d121f] px-2.5 text-xs text-white focus:border-[#00e5ff] outline-none"
                  />
                </div>
              </div>

              {/* Visual Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-[#d4ff00]" />
                  Mô tả hình ảnh tổng quan
                </label>
                <textarea
                  rows={2}
                  value={editVisualDesc}
                  onChange={(e) => {
                    setEditVisualDesc(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full rounded-xl border border-white/15 bg-[#0d121f] p-2.5 text-xs text-white focus:border-[#00e5ff] outline-none leading-relaxed"
                />
              </div>

              {/* Continuity Notes & OnScreen Text */}
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
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
                    className="w-full h-8.5 rounded-lg border border-white/15 bg-[#0d121f] px-2.5 text-xs text-white focus:border-[#00e5ff] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
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
                    className="w-full h-8.5 rounded-lg border border-white/15 bg-[#0d121f] px-2.5 text-xs text-white focus:border-[#00e5ff] outline-none"
                  />
                </div>
              </div>

              {/* Shot Details Grid */}
              <div className="rounded-xl border border-white/10 bg-[#0d121f] p-3.5 grid gap-2.5 grid-cols-2 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Ánh sáng:</span>
                  <span className="text-slate-200">{selectedScene.lighting}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Bối cảnh:</span>
                  <span className="text-slate-200">{selectedScene.setting}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Âm thanh / SFX:</span>
                  <span className="text-slate-200">{selectedScene.soundDesign}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Chuyển cảnh:</span>
                  <span className="text-slate-200">{selectedScene.transition}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Chọn một cảnh từ danh sách bên trái để xem và sửa chi tiết.
            </div>
          )}
        </div>

        {/* ── CỘT 3: Prompt theo Model AI (Veo 3 & Grok) ───────────────────── */}
        <div className="lg:col-span-4 rounded-2xl border border-white/12 bg-[#101420] p-4 sm:p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#d4ff00]" />
              Prompt Video AI Cảnh {selectedScene?.sceneNumber || 1}
            </span>
            <span className="text-[11px] text-[#00e5ff] font-bold">
              Tiếng Anh chuẩn model
            </span>
          </div>

          {/* Model Switcher Tabs */}
          <div
            role="tablist"
            aria-label="Chọn mô hình Video AI"
            className="flex flex-wrap gap-1 p-1 rounded-xl bg-[#0d121f] border border-white/12"
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
                  className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#00e5ff] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>

          {/* Model Description Notice */}
          <div className="text-[11px] text-slate-300 bg-white/[0.03] p-2.5 rounded-lg border border-white/10 flex items-center gap-1.5">
            <span className="font-bold text-[#00e5ff]">
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
              <span className="text-xs font-bold text-white">
                Full Generation Prompt
              </span>
              <button
                type="button"
                onClick={() => handleCopy(currentPromptText, `prompt-${selectedSceneIndex}-${activeModelTab}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-black bg-[#d4ff00] hover:bg-[#b8e000] shadow-[0_0_15px_rgba(212,255,0,0.35)] transition-all cursor-pointer"
                style={{ color: "#000000", fontWeight: 900 }}
              >
                {copiedKey === `prompt-${selectedSceneIndex}-${activeModelTab}` ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span style={{ color: "#000000", fontWeight: 900 }}>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span style={{ color: "#000000", fontWeight: 900 }}>Sao chép Prompt</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="w-full max-h-[300px] overflow-y-auto p-3.5 rounded-xl border border-white/15 bg-[#070a12] text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                {currentPromptText}
              </pre>
            </div>
          </div>

          {/* Negative Prompt */}
          {selectedScene?.negativePrompt && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Negative Prompt (Loại trừ lỗi)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedScene.negativePrompt, `neg-${selectedSceneIndex}`)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === `neg-${selectedSceneIndex}` ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
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
              <div className="p-2.5 rounded-lg bg-[#070a12] border border-white/15 text-[11px] font-mono text-slate-400">
                {selectedScene.negativePrompt}
              </div>
            </div>
          )}

          {/* Quick instructions on how to use */}
          <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-200">Cách dùng prompt này:</p>
            <p>1. Bấm <strong>Sao chép Prompt</strong> ở trên.</p>
            <p>2. Dán vào ô nhập câu lệnh của {TAB_MODELS.find((m) => m.id === activeModelTab)?.name}.</p>
            <p>3. Chọn tỷ lệ khung hình <strong>{output.aspectRatio}</strong> và render clip.</p>
          </div>
        </div>
      </div>

      {/* ── Social Package: Caption, Hashtags & Keywords ──────────────────── */}
      <div className="rounded-2xl border border-white/12 bg-[#101420] p-4 sm:p-5 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5 text-[#00e5ff]" />
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#00e5ff] bg-[#00e5ff]/20 hover:bg-[#00e5ff] hover:text-black border border-[#00e5ff]/40 transition-all cursor-pointer"
          >
            {copiedKey === "copy-social" ? (
              <>
                <Check className="h-3.5 w-3.5" />
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

        <div className="space-y-2.5">
          <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed bg-[#0d121f] p-3.5 rounded-xl border border-white/15">
            {output.caption}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {output.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>

          {output.keywords && output.keywords.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Search className="h-3 w-3" />
                Keywords:
              </span>
              {output.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Warnings / Policy notices */}
        {output.warnings && output.warnings.length > 0 && (
          <div className="mt-3 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
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
