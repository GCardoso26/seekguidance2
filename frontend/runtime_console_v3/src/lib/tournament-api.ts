import type { NextRequest } from "next/server";
import { resolveSupabaseProxyAuth } from "@/lib/supabase/proxy-auth";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

import { API_PROXY_BASE, fetchApiResilient } from "@/lib/api-proxy-base";

export const TOURNAMENT_API_BASE = API_PROXY_BASE;

export { fetchApiResilient };

export async function tournamentProxyHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const { userId, accessToken } = await resolveSupabaseProxyAuth();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (userId) {
    headers["X-Judge-User-Id"] = userId;
  }
  return headers;
}

/** Inclui JWT do Runtime Console (tcg_access) para operações admin do catálogo. */
export async function catalogProxyHeaders(request?: NextRequest): Promise<Record<string, string>> {
  const headers = await tournamentProxyHeaders();
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value ?? request?.cookies.get(ACCESS_COOKIE)?.value;
  if (access) {
    headers.Authorization = `Bearer ${access}`;
  }
  return headers;
}
