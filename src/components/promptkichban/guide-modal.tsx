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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#101420] shadow-2xl p-6 text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4ff00]/15 text-[#d4ff00]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 id="guide-title" className="text-base font-bold text-white">
                Cẩm nang sử dụng Prompt Video AI
              </h2>
              <p className="text-xs text-slate-400">
                Cách sao chép prompt và tạo video trên từng công cụ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Đóng cẩm nang"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm">
          {/* Note */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0d121f] border border-[#00e5ff]/30 text-slate-200">
            <Info className="h-5 w-5 text-[#00e5ff] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="text-[#00e5ff] font-bold">Nguyên tắc hoạt động:</strong>{" "}
              PromptKichBan là xưởng biên tập kịch bản và tối ưu câu lệnh (Prompt Engineering). 
              Hệ thống xuất ra prompt tiếng Anh chuẩn cú pháp cho từng công cụ AI video hàng đầu hiện nay. 
              Bạn chỉ cần bấm <strong>Sao chép</strong> và dán vào công cụ tương ứng để render video.
            </div>
          </div>

          {/* Model Guides */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Google Veo 3 */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#0d121f] hover:border-[#00e5ff]/50 transition-colors">
              <div className="flex items-center gap-2 mb-2 font-bold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/20 text-[#00e5ff] text-xs font-black">
                  V
                </span>
                Google Veo 3
              </div>
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                Được chia cấu trúc thẻ <code className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[11px] font-mono text-[#00e5ff]">[Cinematography]</code>,{" "}
                <code className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[11px] font-mono text-[#00e5ff]">[Lighting]</code> và hỗ trợ gắn tham số <code className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[11px] font-mono text-[#d4ff00]">--no</code>.
              </p>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Tối ưu video điện ảnh, góc quay mượt
              </div>
            </div>

            {/* xAI Grok Video */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#0d121f] hover:border-[#00e5ff]/50 transition-colors">
              <div className="flex items-center gap-2 mb-2 font-bold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15 text-white text-xs font-black">
                  G
                </span>
                xAI Grok Video
              </div>
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                Định dạng tự nhiên giàu chi tiết thị giác kèm các trường <code className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[11px] font-mono text-[#00e5ff]">Camera:</code>,{" "}
                <code className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[11px] font-mono text-[#00e5ff]">Lighting:</code> và <code className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[11px] font-mono text-[#d4ff00]">Negative:</code>.
              </p>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Tối ưu mô tả chuyển động sắc nét
              </div>
            </div>

            {/* ByteDance Seedance 2.5 */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#0d121f] hover:border-[#00e5ff]/50 transition-colors">
              <div className="flex items-center gap-2 mb-2 font-bold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/20 text-red-400 text-xs font-black">
                  S
                </span>
                Seedance 2.5
              </div>
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                Áp dụng cú pháp dòng thời gian <code className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[11px] font-mono text-[#00e5ff]">At [0s-Ns]...</code> giúp AI nhận thức đúng nhịp điệu diễn xuất theo từng giây.
              </p>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Tối ưu video TikTok, short form
              </div>
            </div>

            {/* Tencent Muse */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#0d121f] hover:border-[#00e5ff]/50 transition-colors">
              <div className="flex items-center gap-2 mb-2 font-bold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400 text-xs font-black">
                  M
                </span>
                Tencent Muse
              </div>
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                Chuyên sâu cho TVC & Commercial với hồ sơ quang học <code className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[11px] font-mono text-[#00e5ff]">Optical Profile:</code> 35mm, ánh sáng studio chuẩn thương mại.
              </p>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Tối ưu cận cảnh sản phẩm cao cấp
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="p-4 rounded-xl border border-white/10 bg-[#0d121f]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
              Quy trình 3 bước thực hiện
            </h3>
            <ol className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4ff00] text-black text-[11px] font-black">
                  1
                </span>
                <span>
                  <strong className="text-white">Chọn mẫu và tạo storyboard:</strong> Dán kịch bản hoặc chọn Preset gợi ý ➔ Bấm <em>Phân tích kịch bản và tạo prompt</em>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4ff00] text-black text-[11px] font-black">
                  2
                </span>
                <span>
                  <strong className="text-white">Chọn model bạn muốn dùng:</strong> Ở giao diện kết quả, chọn tab <em>Veo 3, Grok, Seedance 2.5</em> hoặc <em>Muse</em> để xem prompt tương ứng.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4ff00] text-black text-[11px] font-black">
                  3
                </span>
                <span>
                  <strong className="text-white">Sao chép và render:</strong> Bấm nút <em>Sao chép Prompt</em> cho từng cảnh ➔ Dán vào web hoặc app tạo video để sinh clip.
                </span>
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="primary"
            onClick={onClose}
            size="sm"
            className="!bg-[#d4ff00] hover:!bg-[#b8e000] !text-black font-black px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(212,255,0,0.35)] cursor-pointer"
            style={{ color: "#000000", fontWeight: 900 }}
          >
            <span style={{ color: "#000000", fontWeight: 900 }}>Đã hiểu, bắt đầu ngay</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
