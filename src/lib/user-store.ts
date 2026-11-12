import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "@/lib/auth-password";

// ─── Prisma client singleton & Resilient Fallback Store ─────────────────────

let cachedPrisma: any = null;
const inMemoryUsers = new Map<string, AuthUser>();

function getPrisma() {
  if (!cachedPrisma) {
    const url = process.env.DATABASE_URL;
    const adapter = url ? new PrismaPg({ connectionString: url }) : undefined;
    cachedPrisma = new (PrismaClient as any)(adapter ? { adapter } : {});
  }
  return cachedPrisma;
}

// ─── User lookups ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  passwordHash: string | null;
  passwordVersion: number;
  status: string;
}

/** Find a user by email for authentication. */
export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const normalized = email.toLowerCase().trim();
  try {
    const db = getPrisma();
    const user = await db.user.findUnique({
      where: { email: normalized },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        passwordHash: true,
        passwordVersion: true,
        status: true,
        deletedAt: true,
      },
    });
    if (!user || user.deletedAt) return null;
    if (user.status !== "active") return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      passwordHash: user.passwordHash,
      passwordVersion: user.passwordVersion,
      status: user.status,
    };
  } catch (dbErr) {
    console.warn("[user-store] DB lookup failed, checking in-memory user cache:", dbErr);
    return inMemoryUsers.get(normalized) ?? null;
  }
}

/** Create a new learner user for registration. */
export async function createUser(data: {
  email: string;
  password: string;
  name?: string | null;
}): Promise<AuthUser> {
  const normalized = data.email.toLowerCase().trim();
  const hashedPassword = await hashPassword(data.password);

  try {
    const db = getPrisma();
    const existing = await db.user.findUnique({
      where: { email: normalized },
    });
    if (existing) {
      throw new Error("Email đã được đăng ký tài khoản");
    }

    const user = await db.user.create({
      data: {
        email: normalized,
        passwordHash: hashedPassword,
        name: data.name?.trim() || normalized.split("@")[0],
        status: "active",
        isAdmin: false,
        passwordVersion: 0,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        passwordHash: true,
        passwordVersion: true,
        status: true,
      },
    });

    const created: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      passwordHash: user.passwordHash,
      passwordVersion: user.passwordVersion,
      status: user.status,
    };
    inMemoryUsers.set(normalized, created);
    return created;
  } catch (dbErr: any) {
    if (dbErr.message === "Email đã được đăng ký tài khoản") {
      throw dbErr;
    }
    console.warn("[user-store] DB unavailable for createUser, saving to memory session store:", dbErr);
    if (inMemoryUsers.has(normalized)) {
      throw new Error("Email đã được đăng ký tài khoản");
    }
    const fallbackUser: AuthUser = {
      id: "mem_" + randomBytes(8).toString("hex"),
      email: normalized,
      name: data.name?.trim() || normalized.split("@")[0],
      isAdmin: false,
      passwordHash: hashedPassword,
      passwordVersion: 0,
      status: "active",
    };
    inMemoryUsers.set(normalized, fallbackUser);
    return fallbackUser;
  }
}

/** Get the current passwordVersion for a user by ID (used in session verification). */
export async function getPasswordVersion(userId: string): Promise<number | null> {
  try {
    const db = getPrisma();
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { passwordVersion: true, deletedAt: true, status: true },
    });
    if (!user || user.deletedAt || user.status !== "active") return null;
    return user.passwordVersion;
  } catch (dbErr) {
    const memUser = Array.from(inMemoryUsers.values()).find((u) => u.id === userId);
    return memUser ? memUser.passwordVersion : 0;
  }
}

/** Bump passwordVersion on password change/reset. All prior sessions become invalid. */
export async function bumpPasswordVersion(userId: string): Promise<void> {
  const db = getPrisma();
  await db.user.update({
    where: { id: userId },
    data: { passwordVersion: { increment: 1 } },
  });
}

// ─── Password reset tokens ──────────────────────────────────────────────────

function sha256hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export interface ResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

/** Create a reset token. Returns the raw token (to be emailed) and the DB record. */
export async function createResetToken(userId: string): Promise<{ rawToken: string }> {
  const db = getPrisma();
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = sha256hex(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return { rawToken };
}

/** Validate and consume a reset token. Returns the userId if valid, null otherwise. */
export async function consumeResetToken(rawToken: string): Promise<string | null> {
  const db = getPrisma();
  const tokenHash = sha256hex(rawToken);
  const now = new Date();

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record) return null;
  if (record.usedAt) return null;          // already consumed
  if (record.expiresAt < now) return null;  // expired

  // Mark as used (single-use)
  await db.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: now },
  });

  return record.userId;
}

/** Clean up expired/reset tokens (optional, for periodic maintenance). */
export async function cleanupResetTokens(): Promise<number> {
  const db = getPrisma();
  const result = await db.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null, lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      ],
    },
  });
  return result.count;
}
