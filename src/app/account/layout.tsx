import { requirePageRole } from "@/lib/auth";
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole("learner");
  return children;
}
