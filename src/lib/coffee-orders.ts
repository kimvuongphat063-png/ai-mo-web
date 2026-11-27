import "server-only";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { HTML_APPS } from "@/lib/apps-data";

const SEABANK_ACCOUNT = "666006668789";
const SEABANK_ACCOUNT_NAME = "TRAN NGOC HOANG ANH";
const ORDER_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let cachedPrisma: any = null;

function getPrisma() {
  if (!cachedPrisma) {
    const url = process.env.DATABASE_URL;
    const adapter = url ? new PrismaPg({ connectionString: url }) : undefined;
    cachedPrisma = new (PrismaClient as any)(adapter ? { adapter } : {});
  }
  return cachedPrisma;
}

export function generateTransferCode(): string {
  const bytes = randomBytes(6);
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `AIMO${suffix}`;
}

export function generateOrderId(): string {
  return `COF-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function buildVietQrUrl(amount: number, transferCode: string): string {
  return `https://img.vietqr.io/image/seabank-${SEABANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    transferCode
  )}&accountName=${encodeURIComponent(SEABANK_ACCOUNT_NAME)}`;
}

export interface CreatedCoffeeOrder {
  orderId: string;
  transferCode: string;
  appSlug: string;
  amount: number;
  status: string;
  expiresAt: string;
  qrUrl: string;
}

export async function createCoffeeOrder(
  appSlug: string,
  requestedAmount?: number
): Promise<CreatedCoffeeOrder> {
  const app = HTML_APPS.find((a) => a.slug === appSlug);
  if (!app || !app.coffeePrice || app.coffeePrice <= 0) {
    throw new Error("Ứng dụng không thuộc danh sách mở khóa cà phê");
  }

  const minAmount = app.coffeePrice;
  const amount =
    typeof requestedAmount === "number" && Number.isFinite(requestedAmount) && requestedAmount >= minAmount
      ? Math.round(requestedAmount)
      : minAmount;

  const db = getPrisma();
  const expiresAt = new Date(Date.now() + ORDER_TTL_MS);

  // Retry once on rare transferCode collision
  for (let attempt = 0; attempt < 3; attempt++) {
    const orderId = generateOrderId();
    const transferCode = generateTransferCode();
    try {
      const created = await db.coffeeOrder.create({
        data: {
          orderId,
          transferCode,
          appSlug,
          amount,
          status: "pending",
          expiresAt,
        },
      });
      return {
        orderId: created.orderId,
        transferCode: created.transferCode,
        appSlug: created.appSlug,
        amount: created.amount,
        status: created.status,
        expiresAt: created.expiresAt.toISOString(),
        qrUrl: buildVietQrUrl(created.amount, created.transferCode),
      };
    } catch (err: any) {
      if (attempt === 2) throw err;
    }
  }

  throw new Error("Không thể khởi tạo mã thanh toán");
}

export interface CoffeeOrderStatusResult {
  orderId: string;
  appSlug: string;
  amount: number;
  status: "pending" | "paid" | "expired";
  paidAt: string | null;
  expiresAt: string;
}

export async function getCoffeeOrderStatus(
  orderId: string
): Promise<CoffeeOrderStatusResult | null> {
  const db = getPrisma();
  const order = await db.coffeeOrder.findUnique({
    where: { orderId },
  });
  if (!order) return null;

  let status = order.status as "pending" | "paid" | "expired";
  if (status === "pending" && order.expiresAt.getTime() < Date.now()) {
    status = "expired";
    await db.coffeeOrder
      .update({
        where: { orderId },
        data: { status: "expired" },
      })
      .catch(() => {});
  }

  return {
    orderId: order.orderId,
    appSlug: order.appSlug,
    amount: order.amount,
    status,
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    expiresAt: order.expiresAt.toISOString(),
  };
}

export async function verifyPaidCoffeeOrder(
  orderId: string,
  appSlug: string
): Promise<boolean> {
  if (!orderId || !appSlug) return false;
  try {
    const db = getPrisma();
    const order = await db.coffeeOrder.findUnique({
      where: { orderId },
      select: { appSlug: true, status: true },
    });
    return Boolean(order && order.appSlug === appSlug && order.status === "paid");
  } catch {
    return false;
  }
}

export interface SepayWebhookPayload {
  id?: number;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string | null;
  code?: string | null;
  content?: string;
  transferType?: string;
  description?: string;
  transferAmount?: number;
  accumulated?: number;
  referenceCode?: string;
}

export function extractTransferCode(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.toUpperCase().match(/AIMO[A-Z0-9]{6}/);
  return match ? match[0] : null;
}

export async function processSepayWebhook(payload: SepayWebhookPayload): Promise<{
  matched: boolean;
  reason?: string;
  orderId?: string;
}> {
  if (payload.transferType !== "in") {
    return { matched: false, reason: "ignored_outgoing" };
  }

  const transferAmount = Number(payload.transferAmount || 0);
  if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
    return { matched: false, reason: "invalid_amount" };
  }

  const candidateCode =
    extractTransferCode(payload.content) ||
    extractTransferCode(payload.code) ||
    extractTransferCode(payload.description);

  if (!candidateCode) {
    return { matched: false, reason: "no_transfer_code" };
  }

  const db = getPrisma();

  // Idempotency check by SePay transaction ID
  if (typeof payload.id === "number") {
    const existingByTx = await db.coffeeOrder.findUnique({
      where: { sepayTxId: payload.id },
      select: { orderId: true },
    });
    if (existingByTx) {
      return { matched: true, reason: "already_processed", orderId: existingByTx.orderId };
    }
  }

  const order = await db.coffeeOrder.findUnique({
    where: { transferCode: candidateCode },
  });

  if (!order) {
    return { matched: false, reason: "order_not_found" };
  }

  if (order.status === "paid") {
    return { matched: true, reason: "already_paid", orderId: order.orderId };
  }

  if (transferAmount < order.amount) {
    return { matched: false, reason: "underpaid", orderId: order.orderId };
  }

  await db.coffeeOrder.update({
    where: { id: order.id },
    data: {
      status: "paid",
      paidAt: new Date(),
      paidAmount: Math.round(transferAmount),
      sepayTxId: typeof payload.id === "number" ? payload.id : null,
      referenceCode: payload.referenceCode || null,
      gateway: payload.gateway || null,
    },
  });

  return { matched: true, orderId: order.orderId };
}
