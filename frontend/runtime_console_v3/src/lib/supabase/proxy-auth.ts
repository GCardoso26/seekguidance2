import { combineChunks, stringFromBase64URL } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BASE64_PREFIX = "base64-";

type SupabaseSessionJson = {
  access_token?: string;
  user?: { id?: string };
};

type CookieLike = { name: string; value: string };

function decodeJwtSub(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const pad = "=".repeat((4 - (part.length % 4)) % 4);
    const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString(
      "utf8",
    );
    const payload = JSON.parse(json) as { sub?: string };
    return payload.sub?.trim() || null;
  } catch {
    return null;
  }
}

function extractBearer(request?: NextRequest): string | null {
  const auth = request?.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

function parseSupabaseSessionPayload(raw: string): SupabaseSessionJson | null {
  let decoded = raw;
  if (decoded.startsWith(BASE64_PREFIX)) {
    decoded = stringFromBase64URL(decoded.slice(BASE64_PREFIX.length));
  }
  try {
    return JSON.parse(decoded) as SupabaseSessionJson;
  } catch {
    return null;
  }
}

async function readSessionFromCookieList(all: CookieLike[]): Promise<SupabaseSessionJson | null> {
  const seed = all.find((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
  if (!seed) return null;

  const key = seed.name.replace(/\.\d+$/, "");
  const combined = await combineChunks(key, async (chunkName) => {
    return all.find((c) => c.name === chunkName)?.value ?? null;
  });
  if (!combined) return null;
  return parseSupabaseSessionPayload(combined);
}

async function readSessionFromCookies(): Promise<SupabaseSessionJson | null> {
  const jar = await cookies();
  return readSessionFromCookieList(jar.getAll());
}

/**
 * Resolve userId + access_token para proxy BFF → FastAPI.
 * userId SEMPRE deriva do `sub` do JWT enviado — evita 403
 * "Identidade do usuário inconsistente" quando cookie.user.id ≠ JWT.sub.
 */
export async function resolveSupabaseProxyAuth(request?: NextRequest): Promise<{
  userId: string | null;
  accessToken: string | null;
}> {
  let accessToken = extractBearer(request);

  if (!accessToken && request) {
    const fromRequestCookies = await readSessionFromCookieList(request.cookies.getAll());
    accessToken = fromRequestCookies?.access_token?.trim() || null;
  }

  if (!accessToken) {
    const fromHeaderCookies = await readSessionFromCookies();
    accessToken = fromHeaderCookies?.access_token?.trim() || null;
  }

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    // Prefer session do SSR client (pode refreshar) quando o sub bate com o token em mãos.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const sessionToken = session?.access_token?.trim() || null;
    if (sessionToken) {
      if (!accessToken) {
        accessToken = sessionToken;
      } else {
        const cookieSub = decodeJwtSub(accessToken);
        const sessionSub = decodeJwtSub(sessionToken);
        if (!cookieSub || cookieSub === sessionSub) {
          accessToken = sessionToken;
        }
      }
    }
  }

  // Fonte de verdade: sub do JWT. Nunca misturar user.id de cookie com outro token.
  const userId = accessToken ? decodeJwtSub(accessToken) : null;
  return { userId, accessToken };
}
