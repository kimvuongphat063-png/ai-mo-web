"use client";

import { useState, useEffect, useCallback } from "react";
import { Alert } from "@/components/studio/ui";
import { PromptKichBanHeader } from "@/components/promptkichban/header";
import { InputForm } from "@/components/promptkichban/input-form";
import { Workspace } from "@/components/promptkichban/workspace";
import { GuideModal } from "@/components/promptkichban/guide-modal";
import { LibraryDrawer, type StoredScriptItem } from "@/components/promptkichban/library-drawer";
import type { PromptKichBanInput, VideoPromptOutput } from "@/lib/promptkichban/schema";
import type { PromptKichBanDocumentDto } from "@/lib/promptkichban/document-store";

const STORAGE_KEY_HISTORY = "aimo_promptkichban_history";
const STORAGE_KEY_CURRENT = "aimo_promptkichban_current";
const MAX_HISTORY_ITEMS = 20;

function makeFallbackInput(output: VideoPromptOutput): PromptKichBanInput {
  const text = output.voiceoverFull || output.summary || output.title;
  return {
    scriptText: text,
    inputText: text,
    contentType: output.contentType,
    visualStyle: output.visualStyle,
    publishingPlatform: output.publishingPlatform,
    videoModel: output.videoModel || "both",
    promptModel: output.promptModel || "all",
    aspectRatio: output.aspectRatio,
    durationSeconds: output.durationSeconds,
    performanceMode: "hands-or-POV",
    voiceLanguage: "vi",
    language: "vi",
    pacing: "balanced",
    seoEnabled: false,
    tone: output.tone || "Tự nhiên, chân thật",
    cta: output.cta,
    callToAction: output.cta,
    voiceGender: "neutral",
    voiceRegion: "south",
    voiceAge: "young",
    voiceRole: "reviewer",
    speakingSpeed: "normal",
    emotion: "friendly",
  };
}

export default function PromptKichBanPage() {
  const [mode, setMode] = useState<"input" | "workspace">("input");
  const [currentInput, setCurrentInput] = useState<PromptKichBanInput | null>(null);
  const [currentOutput, setCurrentOutput] = useState<VideoPromptOutput | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegeneratingScene, setIsRegeneratingScene] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Authenticated user & Cloud library state (Phase 4)
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    email: string;
    name: string;
  } | null>(null);
  const [cloudDocuments, setCloudDocuments] = useState<PromptKichBanDocumentDto[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [isSyncingLocalToCloud, setIsSyncingLocalToCloud] = useState(false);

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // LocalStorage history
  const [historyItems, setHistoryItems] = useState<StoredScriptItem[]>([]);

  // Fetch cloud documents
  const fetchCloudDocuments = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingCloud(true);
    try {
      const res = await fetch("/api/promptkichban/documents?limit=50");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          setCloudDocuments(data.data);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingCloud(false);
    }
  }, [currentUser]);

  // Load user session on mount
  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Load cloud documents when user logs in
  useEffect(() => {
    if (!currentUser) return;
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) setIsLoadingCloud(true);
    });

    fetch("/api/promptkichban/documents?limit=50")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && Array.isArray(data?.data)) {
          setCloudDocuments(data.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoadingCloud(false);
      });
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  // Load local history & current draft on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const rawHist = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (rawHist) {
          const parsed = JSON.parse(rawHist);
          if (Array.isArray(parsed)) {
            setHistoryItems(parsed);
          }
        }

        const rawCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
        if (rawCurrent) {
          const parsed = JSON.parse(rawCurrent);
          if (parsed?.output?.scenes && Array.isArray(parsed.output.scenes)) {
            setCurrentOutput(parsed.output);
            if (parsed.input) {
              setCurrentInput(parsed.input);
            }
            if (parsed.documentId) {
              setCurrentDocumentId(parsed.documentId);
            }
            setMode("workspace");
          }
        }
      } catch {
        // Corrupted localStorage JSON handled safely without crashing app
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save history to storage
  const saveToHistory = useCallback((output: VideoPromptOutput, input: PromptKichBanInput) => {
    try {
      const newItem: StoredScriptItem = {
        id: `script-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        savedAt: new Date().toISOString(),
        output,
      };

      setHistoryItems((prev) => {
        const updated = [newItem, ...prev.filter((i) => i.output.title !== output.title)].slice(
          0,
          MAX_HISTORY_ITEMS
        );
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
        return updated;
      });

      localStorage.setItem(
        STORAGE_KEY_CURRENT,
        JSON.stringify({ output, input, savedAt: new Date().toISOString() })
      );
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Handle single item deletion from local history
  const handleDeleteHistoryItem = (id: string) => {
    try {
      const updated = historyItems.filter((item) => item.id !== id);
      setHistoryItems(updated);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Clear all local history
  const handleClearAllHistory = () => {
    try {
      setHistoryItems([]);
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {
      // Ignore
    }
  };

  // Select script from local library
  const handleSelectHistoryItem = (item: StoredScriptItem) => {
    setCurrentOutput(item.output);
    setCurrentDocumentId(null);
    setMode("workspace");
    setErrorMessage(null);
  };

  // Select script from cloud library
  const handleSelectCloudDocument = (doc: PromptKichBanDocumentDto) => {
    setCurrentOutput(doc.outputSnapshot);
    setCurrentInput(doc.inputSnapshot);
    setCurrentDocumentId(doc.id);
    setMode("workspace");
    setErrorMessage(null);
  };

  // Rename a cloud document
  const handleRenameCloudDocument = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/promptkichban/documents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error("Không thể đổi tên kịch bản");
      const data = await res.json();
      if (data?.data) {
        setCloudDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, title: newTitle } : d))
        );
        if (currentDocumentId === id && currentOutput) {
          setCurrentOutput({ ...currentOutput, title: newTitle });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi đổi tên";
      setErrorMessage(msg);
    }
  };

  // Delete a cloud document
  const handleDeleteCloudDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/promptkichban/documents/${id}`, {
        method: "DELETE",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (!res.ok) throw new Error("Không thể xóa kịch bản khỏi tài khoản");
      setCloudDocuments((prev) => prev.filter((d) => d.id !== id));
      if (currentDocumentId === id) {
        setCurrentDocumentId(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi xóa kịch bản";
      setErrorMessage(msg);
    }
  };

  // Save / Sync to Cloud Account
  const handleSaveToCloud = async () => {
    if (!currentOutput) return;

    if (!currentUser) {
      window.location.href = `/login?next=${encodeURIComponent("/promptkichban")}`;
      return;
    }

    setIsSavingCloud(true);
    setErrorMessage(null);

    const effectiveInput: PromptKichBanInput = currentInput || makeFallbackInput(currentOutput);

    try {
      if (currentDocumentId) {
        // Update existing document
        const res = await fetch(`/api/promptkichban/documents/${currentDocumentId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            title: currentOutput.title,
            outputSnapshot: currentOutput,
          }),
        });

        if (!res.ok) throw new Error("Không thể cập nhật kịch bản lên tài khoản");
        const data = await res.json();
        if (data?.data) {
          setCloudDocuments((prev) =>
            prev.map((d) => (d.id === currentDocumentId ? data.data : d))
          );
        }
      } else {
        // Create new document
        const res = await fetch("/api/promptkichban/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            title: currentOutput.title,
            inputSnapshot: effectiveInput,
            outputSnapshot: currentOutput,
          }),
        });

        if (!res.ok) throw new Error("Không thể lưu kịch bản vào tài khoản");
        const data = await res.json();
        if (data?.data) {
          setCurrentDocumentId(data.data.id);
          setCloudDocuments((prev) => [data.data, ...prev]);
        }
      }
      setSuccessMessage("Đã lưu kịch bản thành công vào tài khoản!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu vào tài khoản.";
      setErrorMessage(msg);
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Sync a single local item to cloud
  const handleSyncLocalItemToCloud = async (item: StoredScriptItem) => {
    if (!currentUser) return;
    setIsSyncingLocalToCloud(true);
    setErrorMessage(null);

    try {
      // Check duplicate
      const duplicate = cloudDocuments.some(
        (doc) => doc.title.trim().toLowerCase() === item.output.title.trim().toLowerCase()
      );
      if (duplicate) {
        setSuccessMessage(`Kịch bản "${item.output.title}" đã tồn tại trên tài khoản.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        return;
      }

      const effectiveInput: PromptKichBanInput = makeFallbackInput(item.output);

      const res = await fetch("/api/promptkichban/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          title: item.output.title,
          inputSnapshot: effectiveInput,
          outputSnapshot: item.output,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Không thể đồng bộ kịch bản này.");
      }

      const data = await res.json();
      if (data?.data) {
        setCloudDocuments((prev) => [data.data, ...prev]);
        setSuccessMessage(`Đã đồng bộ "${item.output.title}" lên tài khoản!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi đồng bộ kịch bản.";
      setErrorMessage(msg);
    } finally {
      setIsSyncingLocalToCloud(false);
    }
  };

  // Batch sync all local items to cloud
  const handleSyncAllLocalToCloud = async () => {
    if (!currentUser || historyItems.length === 0 || isSyncingLocalToCloud) return;
    setIsSyncingLocalToCloud(true);
    setErrorMessage(null);
    let successCount = 0;
    let failCount = 0;

    for (const item of historyItems) {
      const duplicate = cloudDocuments.some(
        (doc) => doc.title.trim().toLowerCase() === item.output.title.trim().toLowerCase()
      );
      if (duplicate) {
        successCount++;
        continue;
      }

      const effectiveInput: PromptKichBanInput = makeFallbackInput(item.output);

      try {
        const res = await fetch("/api/promptkichban/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            title: item.output.title,
            inputSnapshot: effectiveInput,
            outputSnapshot: item.output,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.data) {
            setCloudDocuments((prev) => [data.data, ...prev]);
            successCount++;
          }
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsSyncingLocalToCloud(false);
    if (failCount === 0) {
      setSuccessMessage(`Đã đồng bộ thành công ${successCount} kịch bản lên tài khoản!`);
    } else {
      setErrorMessage(`Đồng bộ hoàn tất: ${successCount} thành công, ${failCount} thất bại.`);
    }
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Update output from workspace edits
  const handleUpdateOutput = (updated: VideoPromptOutput) => {
    setCurrentOutput(updated);
    try {
      // Update in current storage
      const rawCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
      const parsed = rawCurrent ? JSON.parse(rawCurrent) : {};
      localStorage.setItem(
        STORAGE_KEY_CURRENT,
        JSON.stringify({ ...parsed, output: updated, documentId: currentDocumentId })
      );

      // Update in local history list
      setHistoryItems((prev) => {
        const updatedList = prev.map((item) => {
          if (item.output.title === updated.title) {
            return { ...item, output: updated };
          }
          return item;
        });
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedList));
        return updatedList;
      });
    } catch {
      // Ignore
    }
  };

  // Submit Handler
  const handleGenerate = async (values: PromptKichBanInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentInput(values);
    setCurrentDocumentId(null);

    try {
      const response = await fetch("/api/promptkichban/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            data.error ||
              data.message ||
              "Bạn đã sử dụng hết lượt tạo kịch bản hôm nay (3 lượt/ngày cho khách). Vui lòng thử lại vào ngày mai hoặc đăng nhập!"
          );
        }
        throw new Error(
          data.error ||
            data.message ||
            "Không thể tạo kịch bản. Vui lòng kiểm tra lại nội dung và thử lại."
        );
      }

      const receivedOutput = data.output || data.data;
      if (!receivedOutput || !receivedOutput.scenes) {
        throw new Error("Phản hồi kịch bản không đúng cấu trúc yêu cầu.");
      }

      setCurrentOutput(receivedOutput);
      setMode("workspace");
      saveToHistory(receivedOutput, values);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo kịch bản. Vui lòng thử lại.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate single scene handler
  const handleRegenerateScene = async (sceneNumber: number) => {
    if (!currentOutput || isRegeneratingScene) return;

    const effectiveInput: PromptKichBanInput = currentInput || makeFallbackInput(currentOutput);

    setIsRegeneratingScene(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/promptkichban/regenerate-scene", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          output: currentOutput,
          input: effectiveInput,
          sceneNumber,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể tạo lại cảnh này.");
      }

      const updated = data.output || data.data;
      if (updated && updated.scenes) {
        handleUpdateOutput(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tạo lại cảnh này.";
      setErrorMessage(msg);
    } finally {
      setIsRegeneratingScene(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090c14] text-slate-100 flex flex-col cyber-dark-studio selection:bg-[#d4ff00] selection:text-black">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <PromptKichBanHeader
        historyCount={historyItems.length + cloudDocuments.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* ── Main Content Container ────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Notifications */}
        {errorMessage && (
          <div className="mb-6">
            <Alert tone="error" title="Thông báo">
              <p className="text-xs leading-relaxed">{errorMessage}</p>
            </Alert>
          </div>
        )}

        {successMessage && (
          <div className="mb-6">
            <Alert tone="success" title="Thành công">
              <p className="text-xs leading-relaxed">{successMessage}</p>
            </Alert>
          </div>
        )}

        {/* View Mode Switching */}
        {mode === "input" ? (
          <div className="max-w-3xl mx-auto">
            <InputForm
              initialValues={currentInput || undefined}
              isLoading={isLoading}
              onSubmit={handleGenerate}
            />
          </div>
        ) : (
          currentOutput && (
            <Workspace
              output={currentOutput}
              onBackToInput={() => {
                setMode("input");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onUpdateOutput={handleUpdateOutput}
              onRegenerateScene={handleRegenerateScene}
              currentUser={currentUser}
              currentDocumentId={currentDocumentId}
              isSavingCloud={isSavingCloud}
              onSaveToCloud={handleSaveToCloud}
            />
          )
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0d121f] py-5 mt-auto text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>
            © 2026 AI Mở · Universal Video Prompt Studio. Thiết kế tối ưu cho cộng đồng sáng tạo video.
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-slate-300 hover:text-[#00e5ff] transition-colors cursor-pointer"
            >
              Cẩm nang prompt AI
            </button>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="text-slate-300 hover:text-[#d4ff00] transition-colors cursor-pointer"
            >
              Thư viện của tôi ({historyItems.length + cloudDocuments.length})
            </button>
          </div>
        </div>
      </footer>

      {/* ── Drawers & Modals ──────────────────────────────────────────────── */}
      <LibraryDrawer
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onSelect={handleSelectHistoryItem}
        onDelete={handleDeleteHistoryItem}
        onClearAll={handleClearAllHistory}
        currentUser={currentUser}
        cloudDocuments={cloudDocuments}
        isLoadingCloud={isLoadingCloud}
        onSelectCloudDocument={handleSelectCloudDocument}
        onRenameCloudDocument={handleRenameCloudDocument}
        onDeleteCloudDocument={handleDeleteCloudDocument}
        onRefreshCloud={fetchCloudDocuments}
        onSyncItemToCloud={handleSyncLocalItemToCloud}
        onSyncAllToCloud={handleSyncAllLocalToCloud}
        isSyncingCloud={isSyncingLocalToCloud}
      />

      <GuideModal open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
