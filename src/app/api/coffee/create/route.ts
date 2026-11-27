import { NextRequest, NextResponse } from "next/server";
import { createCoffeeOrder } from "@/lib/coffee-orders";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SEPAY_API_KEY?.trim()) {
      return NextResponse.json(
        { error: "Thanh toán tải app đang tạm thời chưa sẵn sàng" },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const appSlug = typeof body?.appSlug === "string" ? body.appSlug.trim() : "";
    const amount = typeof body?.amount === "number" ? body.amount : undefined;

    if (!appSlug) {
      return NextResponse.json(
        { error: "Thiếu mã ứng dụng (appSlug)" },
        { status: 400 }
      );
    }

    const order = await createCoffeeOrder(appSlug, amount);
    return NextResponse.json(order, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    const message = err?.message || "Không thể tạo mã thanh toán";
    const status = message.includes("không thuộc") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
