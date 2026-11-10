"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Clock,
  Trash2,
  ArrowRight,
  Video,
  FileText,
  Cloud,
  HardDrive,
  Edit2,
  Check,
  RefreshCw,
  LogIn,
  Lock,
} from "lucide-react";
import { Button, Badge } from "@/components/studio/ui";
import type { VideoPromptOutput } from "@/lib/promptkichban/schema";
import type { PromptKichBanDocumentDto } from "@/lib/promptkichban/document-store";

export interface StoredScriptItem {
  id: string;
  savedAt: string;
  output: VideoPromptOutput;
}

interface LibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  items: StoredScriptItem[];
  onSelect: (item: StoredScriptItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  // Cloud library props (Phase 4)
  currentUser?: { userId: string; email: string; name: string } | null;
  cloudDocuments?: PromptKichBanDocumentDto[];
  isLoadingCloud?: boolean;
  onSelectCloudDocument?: (doc: PromptKichBanDocumentDto) => void;
  onRenameCloudDocument?: (id: string, newTitle: string) => Promise<void>;
  onDeleteCloudDocument?: (id: string) => Promise<void>;
  onRefreshCloud?: () => void;
  // Local-to-cloud migration props (Phase 4B)
  onSyncItemToCloud?: (item: StoredScriptItem) => Promise<void>;
  onSyncAllToCloud?: () => Promise<void>;
  isSyncingCloud?: boolean;
}

export function LibraryDrawer({
  open,
  onClose,
  items,
  onSelect,
  onDelete,
  onClearAll,
  currentUser,
  cloudDocuments = [],
  isLoadingCloud = false,
  onSelectCloudDocument,
  onRenameCloudDocument,
  onDeleteCloudDocument,
  onRefreshCloud,
  onSyncItemToCloud,
  onSyncAllToCloud,
  isSyncingCloud = false,
}: LibraryDrawerProps) {
  // Tab state: "cloud" or "local" (defaults to "cloud" if logged in and has cloud docs, else "local")
  const [activeTab, setActiveTab] = useState<"cloud" | "local">("local");

  // Inline editing state for cloud document title
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSavingRename, setIsSavingRename] = useState(false);

  if (!open) return null;

  const handleStartRename = (doc: PromptKichBanDocumentDto) => {
    setEditingDocId(doc.id);
    setEditingTitle(doc.title);
  };

  const handleSaveRename = async (id: string) => {
    if (!editingTitle.trim() || !onRenameCloudDocument) return;
    setIsSavingRename(true);
    try {
      await onRenameCloudDocument(id, editingTitle.trim());
      setEditingDocId(null);
    } catch {
      // Handled in parent
    } finally {
      setIsSavingRename(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md h-full bg-surface border-l border-border shadow-2xl flex flex-col text-text animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-text">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 id="library-drawer-title" className="text-sm font-semibold">
                Thư viện kịch bản
              </h2>
              <p className="text-xs text-muted">
                {currentUser ? `Đang đăng nhập: ${currentUser.email}` : "Chế độ khách vãng lai"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Đóng thư viện"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector: Cloud vs Local */}
        <div className="flex border-b border-border bg-surface-2/40 px-3 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("cloud")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "cloud"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>Tài khoản ({cloudDocuments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("local")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "local"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            <span>Thiết bị này ({items.length})</span>
          </button>

          {activeTab === "cloud" && currentUser && onRefreshCloud && (
            <button
              type="button"
              onClick={onRefreshCloud}
              disabled={isLoadingCloud}
              className="ml-auto p-1.5 text-muted hover:text-text transition-colors cursor-pointer"
              title="Làm mới danh sách đám mây"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingCloud ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* TAB 1: CLOUD DOCUMENTS */}
          {activeTab === "cloud" && (
            <>
              {!currentUser ? (
                <div className="rounded-xl border border-dashed border-border bg-surface-2/30 p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Cloud className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text">Đăng nhập để đồng bộ đám mây</h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      Lưu trữ kịch bản an toàn vào tài khoản của bạn để xem và chỉnh sửa trên mọi thiết bị.
                    </p>
                  </div>
                  <Link
                    href={`/login?next=${encodeURIComponent("/promptkichban")}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Đăng nhập ngay</span>
                  </Link>
                </div>
              ) : isLoadingCloud ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted">
                  <RefreshCw className="h-6 w-6 animate-spin mb-2 text-accent" />
                  <p className="text-xs">Đang tải danh sách từ tài khoản...</p>
                </div>
              ) : cloudDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 mb-3">
                    <Cloud className="h-6 w-6 text-muted" />
                  </div>
                  <p className="text-sm font-medium text-text">Chưa có kịch bản nào trên tài khoản</p>
                  <p className="text-xs max-w-xs mt-1">
                    Hãy bấm &ldquo;Lưu vào tài khoản&rdquo; trong bảng storyboard để đồng bộ kịch bản của bạn.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-[11px] text-muted px-1 pb-1 border-b border-border/40">
                    <span>Đã lưu {cloudDocuments.length}/100 kịch bản</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <Lock className="h-3 w-3" /> Riêng tư (Private)
                    </span>
                  </div>
                  {cloudDocuments.map((doc) => {
                  const isEditing = editingDocId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className="group relative rounded-lg border border-border bg-surface p-3.5 hover:border-accent hover:shadow-xs transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="w-full text-xs font-medium px-2 py-1 rounded border border-accent bg-surface-2 text-text outline-hidden"
                                placeholder="Nhập tên mới..."
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveRename(doc.id)}
                                disabled={isSavingRename}
                                className="p-1 rounded bg-accent text-white hover:bg-accent-hover cursor-pointer"
                                title="Lưu tên"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingDocId(null)}
                                className="p-1 rounded bg-surface-2 text-muted hover:text-text cursor-pointer"
                                title="Hủy"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-medium text-text line-clamp-1 group-hover:text-accent transition-colors">
                                {doc.title}
                              </h3>
                              <button
                                type="button"
                                onClick={() => handleStartRename(doc)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-text transition-opacity cursor-pointer"
                                title="Đổi tên bản lưu"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}

                          <p className="text-xs text-text-2 line-clamp-2 mt-1">
                            {doc.outputSnapshot?.summary || doc.title}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            <Badge tone="accent">{doc.durationSeconds}s</Badge>
                            <Badge tone="neutral">
                              {doc.outputSnapshot?.scenes?.length || 0} cảnh
                            </Badge>
                            <Badge tone="neutral">{doc.publishingPlatform}</Badge>
                            <span className="text-[11px] text-muted flex items-center gap-1 ml-auto">
                              <Clock className="h-3 w-3" />
                              {new Date(doc.updatedAt).toLocaleDateString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                        {onDeleteCloudDocument && (
                          <button
                            onClick={() => onDeleteCloudDocument(doc.id)}
                            className="text-xs text-muted hover:text-error flex items-center gap-1 transition-colors cursor-pointer"
                            title="Xóa kịch bản khỏi tài khoản"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Xóa</span>
                          </button>
                        )}

                        {onSelectCloudDocument && (
                          <button
                            onClick={() => {
                              onSelectCloudDocument(doc);
                              onClose();
                            }}
                            className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                          >
                            <span>Mở kịch bản</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                </>
              )}
            </>
          )}

          {/* TAB 2: LOCALSTORAGE ITEMS */}
          {activeTab === "local" && (
            <>
              {/* Migration Prompt Banner when Logged In */}
              {currentUser && items.length > 0 && (
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-3.5 space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                      <Cloud className="h-4 w-4" />
                      <span>Đồng bộ ({items.length} kịch bản)</span>
                    </div>
                    {onSyncAllToCloud && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={onSyncAllToCloud}
                        disabled={isSyncingCloud}
                        className="text-xs h-7 px-2.5"
                      >
                        {isSyncingCloud && <RefreshCw className="h-3 w-3 animate-spin mr-1" />}
                        <span>Đồng bộ tất cả</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Đồng bộ các kịch bản từ thiết bị này lên tài khoản đám mây của bạn để lưu vĩnh viễn và không bị mất khi xóa cache.
                  </p>
                </div>
              )}

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 mb-3">
                    <Video className="h-6 w-6 text-muted" />
                  </div>
                  <p className="text-sm font-medium text-text">Chưa có kịch bản nào lưu trên máy</p>
                  <p className="text-xs max-w-xs mt-1">
                    Khi bạn tạo kịch bản mới, hệ thống sẽ tự động lưu bản nháp vào đây để bạn xem lại trên trình duyệt này.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-lg border border-border bg-surface p-3.5 hover:border-accent hover:shadow-xs transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-text line-clamp-1 group-hover:text-accent transition-colors">
                          {item.output.title}
                        </h3>
                        <p className="text-xs text-text-2 line-clamp-2 mt-1">
                          {item.output.summary}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          <Badge tone="accent">{item.output.durationSeconds}s</Badge>
                          <Badge tone="neutral">{item.output.scenes.length} cảnh</Badge>
                          <Badge tone="neutral">{item.output.publishingPlatform}</Badge>
                          <span className="text-[11px] text-muted flex items-center gap-1 ml-auto">
                            <Clock className="h-3 w-3" />
                            {new Date(item.savedAt).toLocaleDateString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onDelete(item.id)}
                          className="text-xs text-muted hover:text-error flex items-center gap-1 transition-colors cursor-pointer"
                          title="Xóa kịch bản này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Xóa</span>
                        </button>

                        {currentUser && onSyncItemToCloud && (
                          <button
                            type="button"
                            onClick={() => onSyncItemToCloud(item)}
                            disabled={isSyncingCloud}
                            className="text-xs text-muted hover:text-accent flex items-center gap-1 transition-colors cursor-pointer"
                            title="Đồng bộ kịch bản này lên tài khoản"
                          >
                            <Cloud className="h-3.5 w-3.5" />
                            <span>Đồng bộ</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onSelect(item);
                          onClose();
                        }}
                        className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Mở kịch bản</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {activeTab === "local" && items.length > 0 && (
          <div className="p-3 border-t border-border bg-surface-2/40 flex items-center justify-between">
            <button
              onClick={onClearAll}
              className="text-xs text-muted hover:text-error transition-colors cursor-pointer"
            >
              Xóa tất cả lịch sử trên máy
            </button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
