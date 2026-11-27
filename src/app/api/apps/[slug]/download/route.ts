import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { getSession } from "@/lib/auth";
import { HTML_APPS } from "@/lib/apps-data";
import { verifyPaidCoffeeOrder } from "@/lib/coffee-orders";

const OFFLINE_UNLOCK_SCRIPT = "<script>window.__AIMO_OFFLINE_UNLOCKED__=true;</script>";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const app = HTML_APPS.find((a) => a.slug === slug);

  if (!app) {
    return NextResponse.json({ error: "Ứng dụng không tồn tại" }, { status: 404 });
  }

  const isCoffeeApp = Boolean(app.coffeePrice && app.coffeePrice > 0);

  if (isCoffeeApp) {
    const orderId = request.nextUrl.searchParams.get("orderId")?.trim() || "";
    const isPaid = await verifyPaidCoffeeOrder(orderId, slug);

    if (!isPaid) {
      const coffeeRedirectPath = `/apps/${slug}?coffee=1`;
      const acceptHeader = request.headers.get("accept") || "";
      if (acceptHeader.includes("application/json")) {
        const priceLabel = `${(app.coffeePrice || 20000).toLocaleString("vi-VN")}đ`;
        return NextResponse.json(
          {
            error: `Vui lòng mời AI Mở 1 ly cà phê ${priceLabel} qua VietQR để tải bản Offline trọn đời`,
            redirect: coffeeRedirectPath,
          },
          { status: 402 },
        );
      }
      return NextResponse.redirect(new URL(coffeeRedirectPath, request.url));
    }
  } else {
    const session = await getSession();

    // Free apps: gate download with free account login to capture lead email
    if (!session) {
      const returnUrl = `/apps/${slug}`;
      const loginUrl = new URL(`/login?next=${encodeURIComponent(returnUrl)}`, request.url);

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
  }

  // Serve standalone HTML file with offline unlock flag injected
  const filePath = path.join(process.cwd(), "public", "html-apps", app.fileName);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File ứng dụng chưa sẵn sàng" }, { status: 404 });
  }

  let htmlContent = fs.readFileSync(filePath, "utf8");
  if (/<head[^>]*>/i.test(htmlContent)) {
    htmlContent = htmlContent.replace(/<head[^>]*>/i, (match) => `${match}\n${OFFLINE_UNLOCK_SCRIPT}`);
  } else {
    htmlContent = `${OFFLINE_UNLOCK_SCRIPT}\n${htmlContent}`;
  }

  const outputBuffer = Buffer.from(htmlContent, "utf8");

  return new NextResponse(outputBuffer, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${app.fileName}"`,
      "Content-Length": String(outputBuffer.byteLength),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
