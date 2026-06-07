import { createSupabaseServerClient } from "@/lib/supabase/server";

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
