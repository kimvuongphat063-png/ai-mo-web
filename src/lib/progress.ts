import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const progressSchema = z.object({
  completed: z.array(z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/)).max(1000),
  updatedAt: z.string().datetime(),
});
export type Progress = z.infer<typeof progressSchema>;

function progressPath(userId: string) {
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeUserId || safeUserId !== userId) throw new Error("Invalid authenticated user ID");
  return path.join(process.cwd(), "data", "progress", `${safeUserId}.json`);
}

export async function readProgress(userId: string): Promise<Progress> {
  try {
    return progressSchema.parse(JSON.parse(await readFile(progressPath(userId), "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { completed: [], updatedAt: new Date(0).toISOString() };
    throw error;
  }
}

export async function setLessonProgress(userId: string, courseSlug: string, lessonSlug: string, completed: boolean) {
  const current = await readProgress(userId);
  const key = `${courseSlug}/${lessonSlug}`;
  const entries = new Set(current.completed);
  if (completed) entries.add(key); else entries.delete(key);
  const value = progressSchema.parse({ completed: [...entries].sort(), updatedAt: new Date().toISOString() });
  const target = progressPath(userId);
  await mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await rename(temp, target);
  return value;
}
