import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập — AI MỞ",
  description: "Đăng nhập tài khoản AI MỞ để truy cập công cụ, tài nguyên học tập và tải ứng dụng offline.",
};

export default function LoginPage() {
  return (
    <main id="main-content" className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center text-sm text-neutral-500 py-12">Đang tải biểu mẫu...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
