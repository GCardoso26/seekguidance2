import { createChunks, createServerClient, stringToBase64URL } from "@supabase/ssr";
import { createSupabaseAnonClient } from "./supabase-client";

/**
 * Gera Playwright storageState com cookies chunked (limite ~4 KB/cookie no browser).
 * Cookies únicos grandes passam no middleware HTTP mas falham no `document.cookie` → getSession null.
 */
export async function buildStorageState(email: string, password: string, baseURL: string) {
  const anon = createSupabaseAnonClient();
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error ?? new Error("No session");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const projectRef = new URL(url).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  // Valida sessão via SSR client (mesmo encoding do app)
  const probeCookies: { name: string; value: string }[] = [];
  const server = createServerClient(url, key, {
    cookies: {
      getAll() {
        return probeCookies.map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          const idx = probeCookies.findIndex((c) => c.name === name);
          if (idx >= 0) probeCookies[idx] = { name, value };
          else probeCookies.push({ name, value });
        }
      },
    },
  });

  const { error: setErr } = await server.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
  if (setErr) throw setErr;

  const sessionJson = JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: data.session.token_type,
    user: data.session.user,
  });
  const encoded = `base64-${stringToBase64URL(sessionJson)}`;
  const chunks = createChunks(cookieName, encoded);

  const hostname = new URL(baseURL).hostname;
  return {
    cookies: chunks.map(({ name, value }) => ({
      name,
      value,
      domain: hostname,
      path: "/",
      httpOnly: false,
      secure: baseURL.startsWith("https"),
      sameSite: "Lax" as const,
    })),
    origins: [],
  };
}
