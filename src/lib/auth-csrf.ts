import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin } from "@/lib/csrf";
import { authorizeApi } from "@/lib/auth";
import type { Role, Session } from "@/lib/auth";

/**
 * Combined CSRF + authorization check for mutation routes.
 * Use this instead of `authorizeApi()` alone on POST/PUT/PATCH/DELETE handlers.
 */
export async function authorizeMutation(
  request: NextRequest | Request,
  role?: Role,
): Promise<
  | { session: Session; error: null }
  | { session: null; error: NextResponse }
> {
  const csrf = requireSameOrigin(request);
  if (csrf) return { session: null, error: csrf };
  return authorizeApi(role);
}
