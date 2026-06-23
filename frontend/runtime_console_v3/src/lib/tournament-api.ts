import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const TOURNAMENT_API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function tournamentProxyHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) headers["X-Judge-User-Id"] = user.id;
  }
  return headers;
}

/** Inclui JWT do Runtime Console (tcg_access) para operações admin do catálogo. */
export async function catalogProxyHeaders(request?: NextRequest): Promise<Record<string, string>> {
  const headers = await tournamentProxyHeaders();
  const jar = await cookies();
  let access = jar.get(ACCESS_COOKIE)?.value ?? request?.cookies.get(ACCESS_COOKIE)?.value;
  if (access) {
    headers.Authorization = `Bearer ${access}`;
  }
  return headers;
}
