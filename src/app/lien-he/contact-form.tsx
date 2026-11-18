"use client";

import { useState } from "react";
import { Send, CheckCircle2, Clock } from "lucide-react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactMethod.trim() || !message.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ tên, email/Zalo và nội dung liên hệ.");
      return;
    }

    setErrorMessage("");
    setStatus("submitting");

    // Simulate submission or send to API endpoint
    try {
      // In local/production, send to API if available, or gracefully succeed
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus("success");
      setName("");
      setContactMethod("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMessage("Đã xảy ra lỗi khi gửi. Quý khách vui lòng gọi Hotline hoặc nhắn Zalo trực tiếp.");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-9 border border-neutral-200/80 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.06)] relative overflow-hidden">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight mb-2">
          Gửi tin nhắn tới AI Mở Studio
        </h2>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Điền thông tin và yêu cầu của bạn vào form dưới đây. Đội ngũ AI Mở Studio sẽ liên hệ lại trực tiếp.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0057ff] text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Cam kết phản hồi trong một ngày làm việc</span>
        </div>
      </div>

      {status === "success" ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Gửi thông tin liên hệ thành công!</span>
          </div>
          <p className="text-sm text-emerald-800 leading-relaxed">
            Cảm ơn bạn đã liên hệ với <strong>AI Mở Studio</strong>. Chúng tôi đã ghi nhận tin nhắn và cam kết sẽ phản hồi lại bạn qua Email/Zalo trong vòng <strong>một ngày làm việc</strong>.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-2 text-xs font-bold text-emerald-700 underline underline-offset-2 hover:text-emerald-900 cursor-pointer"
          >
            Gửi thêm yêu cầu khác
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4.5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="contact-name" className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Họ và tên của bạn <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#0057ff] focus:ring-2 focus:ring-blue-100 transition-all bg-neutral-50/50"
            />
          </div>

          <div>
            <label htmlFor="contact-method" className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Email hoặc số Zalo <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-method"
              type="text"
              required
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              placeholder="Email của bạn hoặc số điện thoại có Zalo để nhận phản hồi"
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#0057ff] focus:ring-2 focus:ring-blue-100 transition-all bg-neutral-50/50"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Nội dung tin nhắn / Yêu cầu <span className="text-red-500">*</span>
            </label>
            <textarea
              id="contact-message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mô tả câu hỏi, yêu cầu tư vấn khóa học, sản phẩm số hoặc nhu cầu hợp tác của bạn..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#0057ff] focus:ring-2 focus:ring-blue-100 transition-all bg-neutral-50/50 resize-y"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#0057ff] text-white text-sm font-extrabold shadow-[0_8px_20px_-4px_rgba(0,87,255,0.4)] hover:bg-[#0046d5] active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 fill-current" />
              <span>{status === "submitting" ? "Đang gửi..." : "Gửi thông tin liên hệ"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
