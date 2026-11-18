import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, ExternalLink, ArrowLeft, MessageSquare, ShieldCheck, Clock } from "lucide-react";
import { CONTACT_INFO, organizationJsonLd } from "@/lib/organization";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Liên hệ | AI Mở Studio",
  description:
    "Thông tin liên hệ chính thức của AI Mở Studio. Hotline/Zalo: 0988366917 (Jacky Tran), email tranngochoanganh6789@gmail.com. Phản hồi trong một ngày làm việc.",
  alternates: {
    canonical: "https://www.heyaimo.com/lien-he",
  },
  openGraph: {
    title: "Liên hệ | AI Mở Studio",
    description:
      "Thông tin liên hệ chính thức của AI Mở Studio: Hotline/Zalo 0988366917, Email, Facebook và địa chỉ tại TP. Hồ Chí Minh.",
    url: "https://www.heyaimo.com/lien-he",
    siteName: "AI MỞ",
    locale: "vi_VN",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <main id="main-content" className="flex-1 bg-[#FAFBFD] pb-16 sm:pb-24">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 2xl:px-8 pt-6 sm:pt-10">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-200/70 text-xs sm:text-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-bold text-neutral-600 hover:text-[#0057ff] transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Trang chủ</span>
            </Link>
            <div className="flex items-center gap-2 text-neutral-400 text-xs">
              <span>AI MỞ</span>
              <span>/</span>
              <span className="text-neutral-700 font-semibold">Liên hệ</span>
            </div>
          </div>

          {/* Header */}
          <div className="max-w-3xl mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0057ff] text-xs font-extrabold uppercase tracking-wide mb-3">
              ✦ Thông tin liên hệ chính thức
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-[44px] font-black tracking-tight text-neutral-900 leading-[1.18] mb-4">
              Liên hệ với AI Mở Studio
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
              Chúng tôi luôn sẵn sàng hỗ trợ, tư vấn công cụ AI và giải đáp mọi thắc mắc của bạn về sản phẩm số, khóa học và hợp tác phát triển. Mọi yêu cầu đều được phản hồi trong vòng một ngày làm việc.
            </p>
          </div>

          {/* Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Column: Official Contact Details */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-neutral-200/80 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.06)] space-y-5">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-400 block mb-1">
                    Đơn vị chủ quản
                  </span>
                  <div className="text-xl font-black text-neutral-900">
                    {CONTACT_INFO.organizationName}
                  </div>
                </div>

                {/* 1. Hotline / Zalo */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5 text-[#0057ff]" />
                    <span>Hotline/Zalo</span>
                  </div>
                  <div className="pl-5.5 space-y-2">
                    <div className="text-base sm:text-lg font-black text-neutral-900">
                      {CONTACT_INFO.hotline.display}{" "}
                      <span className="text-sm font-semibold text-neutral-600">
                        ({CONTACT_INFO.hotline.name})
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                      <a
                        href={CONTACT_INFO.hotline.telLink}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#0057ff] text-xs font-bold border border-blue-200 hover:bg-[#0057ff] hover:text-white transition-colors"
                      >
                        <Phone className="w-3 h-3 fill-current" />
                        <span>Bấm để gọi điện</span>
                      </a>
                      <a
                        href={CONTACT_INFO.hotline.zaloLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold border border-cyan-200 hover:bg-cyan-600 hover:text-white transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Mở Zalo chat</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* 2. Email Liên hệ chính */}
                <div className="space-y-1.5 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5 text-[#0057ff]" />
                    <span>Email liên hệ (chính)</span>
                  </div>
                  <div className="pl-5.5">
                    <a
                      href={CONTACT_INFO.emailPrimary.link}
                      className="text-sm sm:text-base font-bold text-[#0057ff] hover:underline underline-offset-3 break-all"
                    >
                      {CONTACT_INFO.emailPrimary.address}
                    </a>
                  </div>
                </div>

                {/* 3. Email Hỗ trợ */}
                <div className="space-y-1.5 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Email hỗ trợ</span>
                  </div>
                  <div className="pl-5.5 space-y-1">
                    <a
                      href={CONTACT_INFO.emailSupport.link}
                      className="text-sm sm:text-base font-bold text-neutral-800 hover:text-[#0057ff] hover:underline underline-offset-3 break-all"
                    >
                      {CONTACT_INFO.emailSupport.address}
                    </a>
                    <div className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>{CONTACT_INFO.emailSupport.note}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Facebook */}
                <div className="space-y-1.5 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    <ExternalLink className="w-3.5 h-3.5 text-[#0057ff]" />
                    <span>Facebook</span>
                  </div>
                  <div className="pl-5.5">
                    <a
                      href={CONTACT_INFO.facebook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-semibold text-[#0057ff] hover:underline underline-offset-3 break-all flex items-center gap-1.5"
                    >
                      <span>{CONTACT_INFO.facebook.url}</span>
                    </a>
                  </div>
                </div>

                {/* 5. Địa chỉ */}
                <div className="space-y-1.5 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Địa chỉ</span>
                  </div>
                  <div className="pl-5.5 space-y-2">
                    <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-medium">
                      {CONTACT_INFO.address.full}
                    </p>
                    <a
                      href={CONTACT_INFO.address.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0057ff] hover:underline underline-offset-2"
                    >
                      <span>Mở vị trí trên Google Maps →</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Cam kết minh bạch */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3 text-xs text-neutral-700 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-[#0057ff] shrink-0 mt-0.5" />
                <span>
                  <strong>Bảo mật thông tin:</strong> Mọi thông tin gửi qua form hoặc liên hệ trực tiếp đều được bảo vệ nghiêm ngặt và chỉ sử dụng để hỗ trợ bạn.
                </span>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
