"use client";

import { X, Sparkles, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/studio/ui";

interface GuideModalProps {
  open: boolean;
  onClose: () => void;
}

export function GuideModal({ open, onClose }: GuideModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl p-6 text-text"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-subtle text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 id="guide-title" className="text-base font-semibold">
                Cẩm nang sử dụng Prompt Video AI
              </h2>
              <p className="text-xs text-text-2">
                Cách sao chép prompt và tạo video trên từng công cụ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-text hover:bg-surface-2 transition-colors"
            aria-label="Đóng cẩm nang"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm">
          {/* Note */}
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-accent-subtle/60 border border-accent/20 text-text">
            <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="text-accent font-semibold">Nguyên tắc hoạt động:</strong>{" "}
              PromptKichBan là xưởng biên tập kịch bản và tối ưu câu lệnh (Prompt Engineering). 
              Hệ thống xuất ra prompt tiếng Anh chuẩn cú pháp cho từng công cụ AI video hàng đầu hiện nay. 
              Bạn chỉ cần bấm <strong>Sao chép</strong> và dán vào công cụ tương ứng để render video.
            </div>
          </div>

          {/* Model Guides */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Google Veo 3 */}
            <div className="p-4 rounded-lg border border-border bg-surface-2/40 hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-2 mb-2 font-semibold text-text">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-700 text-xs font-bold">
                  V
                </span>
                Google Veo 3
              </div>
              <p className="text-xs text-text-2 mb-2 leading-relaxed">
                Được chia cấu trúc thẻ <code className="px-1 py-0.5 bg-surface rounded text-[11px] font-mono">[Cinematography]</code>,{" "}
                <code className="px-1 py-0.5 bg-surface rounded text-[11px] font-mono">[Lighting]</code> và hỗ trợ gắn tham số <code className="px-1 py-0.5 bg-surface rounded text-[11px] font-mono">--no</code>.
              </p>
              <div className="text-[11px] text-muted flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Tối ưu video điện ảnh, góc quay mượt
              </div>
            </div>

            {/* xAI Grok Video */}
            <div className="p-4 rounded-lg border border-border bg-surface-2/40 hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-2 mb-2 font-semibold text-text">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-white text-xs font-bold">
                  G
                </span>
                xAI Grok Video
              </div>
              <p className="text-xs text-text-2 mb-2 leading-relaxed">
                Định dạng tự nhiên giàu chi tiết thị giác kèm các trường <code className="px-1 py-0.5 bg-surface rounded text-[11px] font-mono">Camera:</code>,{" "}
                <code className="px-1 py-0.5 bg-surface rounded text-[11px] font-mono">Lighting:</code> và <code className="px-1 py-0.5 bg-surface rounded text-[11px] font-mono">Negative:</code>.
              </p>
              <div className="text-[11px] text-muted flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Tối ưu mô tả chuyển động sắc nét
              </div>
            </div>

            {/* ByteDance Seedance 2.5 */}
            <div className="p-4 rounded-lg border border-border bg-surface-2/40 hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-2 mb-2 font-semibold text-text">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-red-100 text-red-700 text-xs font-bold">
                  S
                </span>
                Seedance 2.5
              </div>
              <p className="text-xs text-text-2 mb-2 leading-relaxed">
                Áp dụng cú pháp dòng thời gian <code className="px-1 py-0.5 bg-surface rounded text-[11px] font-mono">At [0s-Ns]...</code> giúp AI nhận thức đúng nhịp điệu diễn xuất theo từng giây.
              </p>
              <div className="text-[11px] text-muted flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Tối ưu video TikTok, short form
              </div>
            </div>

            {/* Tencent Muse */}
            <div className="p-4 rounded-lg border border-border bg-surface-2/40 hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-2 mb-2 font-semibold text-text">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-amber-700 text-xs font-bold">
                  M
                </span>
                Tencent Muse
              </div>
              <p className="text-xs text-text-2 mb-2 leading-relaxed">
                Chuyên sâu cho TVC & Commercial với hồ sơ quang học <code className="px-1 py-0.5 bg-surface rounded text-[11px] font-mono">Optical Profile:</code> 35mm, ánh sáng studio chuẩn thương mại.
              </p>
              <div className="text-[11px] text-muted flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Tối ưu cận cảnh sản phẩm cao cấp
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="p-4 rounded-lg border border-border bg-surface">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted mb-3">
              Quy trình 3 bước thực hiện
            </h3>
            <ol className="space-y-2.5 text-xs text-text-2">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white text-[11px] font-bold">
                  1
                </span>
                <span>
                  <strong>Chọn mẫu và tạo storyboard:</strong> Dán kịch bản hoặc chọn Preset gợi ý ➔ Bấm <em>Phân tích kịch bản và tạo prompt</em>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white text-[11px] font-bold">
                  2
                </span>
                <span>
                  <strong>Chọn model bạn muốn dùng:</strong> Ở giao diện kết quả, chọn tab <em>Veo 3, Grok, Seedance 2.5</em> hoặc <em>Muse</em> để xem prompt tương ứng.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white text-[11px] font-bold">
                  3
                </span>
                <span>
                  <strong>Sao chép và render:</strong> Bấm nút <em>Sao chép Prompt</em> cho từng cảnh ➔ Dán vào web hoặc app tạo video để sinh clip.
                </span>
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={onClose} size="sm">
            Đã hiểu, bắt đầu ngay
          </Button>
        </div>
      </div>
    </div>
  );
}
