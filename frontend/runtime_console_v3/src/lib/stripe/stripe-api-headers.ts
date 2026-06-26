import { resolveSupabaseProxyAuth } from "@/lib/supabase/proxy-auth";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function stripeApiHeaders(userId?: string): Promise<Record<string, string>> {
  const { userId: resolvedUserId, accessToken } = await resolveSupabaseProxyAuth();
  const id = userId ?? resolvedUserId;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (id) {
    headers["X-Judge-User-Id"] = id;
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

export { API_BASE };
