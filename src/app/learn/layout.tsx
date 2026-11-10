import { requirePageRole } from "@/lib/auth";
export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole("learner");
  return children;
}
