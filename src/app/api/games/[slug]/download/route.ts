import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { getSession } from "@/lib/auth";
import { GAMES_DATA } from "@/lib/games-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const game = GAMES_DATA.find((g) => g.slug === slug);

  if (!game) {
    return NextResponse.json({ error: "Trò chơi không tồn tại" }, { status: 404 });
  }

  const session = await getSession();

  // If user is not logged in: gate the download to capture lead email
  if (!session) {
    const returnUrl = `/games`;
    const loginUrl = new URL(`/login?next=${encodeURIComponent(returnUrl)}`, request.url);

    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("application/json")) {
      return NextResponse.json(
        {
          error: "Vui lòng đăng nhập tài khoản miễn phí để tải game",
          redirect: `/login?next=${encodeURIComponent(returnUrl)}`,
        },
        { status: 401 },
      );
    }

    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated -> serve file with attachment disposition
  const relativeZip = game.zip || `downloads/games/${game.slug}.zip`;
  const filePath = path.join(process.cwd(), "public", "games", relativeZip);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File game chưa sẵn sàng để tải về" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const zipFileName = `${game.slug}.zip`;

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFileName}"`,
      "Content-Length": String(fileBuffer.length),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
