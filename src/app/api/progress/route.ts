import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeApi } from "@/lib/auth";
import { authorizeMutation } from "@/lib/auth-csrf";
import { findCmsCourse } from "@/lib/cms";
import { readProgress, setLessonProgress } from "@/lib/progress";
const schema = z.object({ courseSlug: z.string().regex(/^[a-z0-9-]+$/), lessonSlug: z.string().regex(/^[a-z0-9-]+$/), completed: z.boolean() });
export async function GET() {
  const auth = await authorizeApi("learner");
  if (auth.error) return auth.error;
  return NextResponse.json(await readProgress(auth.session.userId));
}
export async function PUT(request: Request) {
  const auth = await authorizeMutation(request, "learner");
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu tiến độ không hợp lệ" }, { status: 400 });
  const course = await findCmsCourse(parsed.data.courseSlug);
  const lessonExists = course?.modules.some((module) => module.lessons.some((lesson) => lesson.slug === parsed.data.lessonSlug));
  if (!lessonExists) return NextResponse.json({ error: "Không tìm thấy bài học" }, { status: 404 });
  return NextResponse.json(await setLessonProgress(auth.session.userId, parsed.data.courseSlug, parsed.data.lessonSlug, parsed.data.completed));
}
