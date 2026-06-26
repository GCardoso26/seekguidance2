import { combineChunks } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BASE64_PREFIX = "base64-";

type SupabaseSessionJson = {
  access_token?: string;
  user?: { id?: string };
};

function decodeBase64Url(value: string): string {
  const pad = "=".repeat((4 - (value.length % 4)) % 4);
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

function parseSupabaseSessionPayload(raw: string): SupabaseSessionJson | null {
  let decoded = raw;
  if (decoded.startsWith(BASE64_PREFIX)) {
    decoded = decodeBase64Url(decoded.slice(BASE64_PREFIX.length));
  }
  try {
    return JSON.parse(decoded) as SupabaseSessionJson;
  } catch {
    return null;
  }
}

async function readSessionFromCookies(): Promise<SupabaseSessionJson | null> {
  const jar = await cookies();
  const all = jar.getAll();
  const seed = all.find((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
  if (!seed) return null;

  const key = seed.name.replace(/\.\d+$/, "");
  const combined = await combineChunks(key, async (chunkName) => {
    return all.find((c) => c.name === chunkName)?.value ?? null;
  });
  if (!combined) return null;
  return parseSupabaseSessionPayload(combined);
}

/** Resolve userId + access_token para proxy BFF → FastAPI (JWT verificado no backend). */
export async function resolveSupabaseProxyAuth(): Promise<{
  userId: string | null;
  accessToken: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const fromCookies = await readSessionFromCookies();
    return {
      userId: fromCookies?.user?.id ?? null,
      accessToken: fromCookies?.access_token ?? null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let accessToken = session?.access_token ?? null;
  let userId = user?.id ?? session?.user?.id ?? null;

  if (!accessToken) {
    const fromCookies = await readSessionFromCookies();
    accessToken = fromCookies?.access_token ?? null;
    userId = userId ?? fromCookies?.user?.id ?? null;
  }

  return { userId, accessToken };
}
