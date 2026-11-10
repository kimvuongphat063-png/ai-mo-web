import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";

export async function GET() {
  const auth = await authorizeApi();
  if (auth.error) return auth.error;
  // Only expose non-sensitive fields — never passwordHash, secrets, or version.
  const { userId, email, name, role } = auth.session;
  return NextResponse.json({ user: { userId, email, name, role } });
}
