import { NextRequest, NextResponse } from "next/server";
import { getCoffeeOrderStatus } from "@/lib/coffee-orders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Thiếu orderId" }, { status: 400 });
  }

  try {
    const status = await getCoffeeOrderStatus(orderId);
    if (!status) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    return NextResponse.json(status, {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[Coffee Status] Error:", err);
    return NextResponse.json({ error: "Lỗi kiểm tra trạng thái" }, { status: 500 });
  }
}
