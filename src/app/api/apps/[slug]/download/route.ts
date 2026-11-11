import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { getSession } from "@/lib/auth";
import { HTML_APPS } from "@/lib/apps-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const app = HTML_APPS.find((a) => a.slug === slug);

  if (!app) {
    return NextResponse.json({ error: "Ứng dụng không tồn tại" }, { status: 404 });
  }

  const session = await getSession();

  // If user is not logged in: gate the download to capture lead email
  if (!session) {
    const returnUrl = `/apps/${slug}`;
    const loginUrl = new URL(`/login?next=${encodeURIComponent(returnUrl)}`, request.url);

    // If client requested JSON
    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("application/json")) {
      return NextResponse.json(
        {
          error: "Vui lòng đăng nhập tài khoản miễn phí để tải file",
          redirect: `/login?next=${encodeURIComponent(returnUrl)}`,
        },
        { status: 401 },
      );
    }

    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated -> serve file with attachment disposition
  const filePath = path.join(process.cwd(), "public", "html-apps", app.fileName);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File ứng dụng chưa sẵn sàng" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${app.fileName}"`,
      "Content-Length": String(fileBuffer.length),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
