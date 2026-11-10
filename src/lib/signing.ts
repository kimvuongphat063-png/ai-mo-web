import { createHmac, timingSafeEqual } from "node:crypto";

export function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hmacSign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSignedValue<T>(value: T, secret: string) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${hmacSign(payload, secret)}`;
}

export function verifySignedValue<T>(token: string | null | undefined, secret: string): T | null {
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !constantTimeEqual(hmacSign(payload, secret), signature)) return null;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T; }
  catch { return null; }
}
