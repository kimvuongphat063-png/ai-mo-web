import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản — AI MỞ",
  description: "Tạo tài khoản miễn phí để tải trọn bộ ứng dụng HTML offline, tài liệu và công cụ AI thực chiến.",
};

export default function RegisterPage() {
  return (
    <main id="main-content" className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center text-sm text-neutral-500 py-12">Đang tải biểu mẫu...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
