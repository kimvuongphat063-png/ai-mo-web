import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
export default function Page(){return <main className="auth-page"><Suspense fallback={<p>Đang tải…</p>}><LoginForm/></Suspense></main>}
