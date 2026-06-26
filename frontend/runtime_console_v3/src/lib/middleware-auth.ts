import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { verifyRuntimeAccessToken, verifySupabaseAccessToken } from "@/lib/auth/verify-access-token";
import { isAdminEmailServer } from "@/lib/judge-rbac-server";

function supabaseAccessToken(request: { cookies: { getAll: () => { name: string; value: string }[] } }): string | null {
  const hit = request.cookies
    .getAll()
    .find((c) => c.name.includes("-auth-token") && c.name.startsWith("sb-"));
  if (!hit?.value) return null;
  try {
    const parsed = JSON.parse(hit.value) as unknown;
    if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
    if (parsed && typeof parsed === "object" && "access_token" in parsed) {
      return String((parsed as { access_token: string }).access_token);
    }
  } catch {
    return null;
  }
  return null;
}

function runtimeAuthSecret(): string | null {
  const secret = (process.env.RUNTIME_AUTH_SECRET ?? "").trim();
  return secret || null;
}

function supabaseJwtSecret(): string | null {
  const secret = (process.env.SUPABASE_JWT_SECRET ?? "").trim();
  return secret || null;
}

export async function isAdminRequest(request: {
  cookies: { get: (name: string) => { value: string } | undefined; getAll: () => { name: string; value: string }[] };
}): Promise<boolean> {
  const runtimeSecret = runtimeAuthSecret();
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (access && runtimeSecret) {
    const payload = await verifyRuntimeAccessToken(access, runtimeSecret);
    if (payload?.role === "admin") return true;
  }

  const jwtSecret = supabaseJwtSecret();
  const sbToken = supabaseAccessToken(request);
  if (sbToken && jwtSecret) {
    const payload = await verifySupabaseAccessToken(sbToken, jwtSecret);
    if (payload?.role === "admin") return true;
    const email = payload?.email?.toLowerCase();
    if (isAdminEmailServer(email)) return true;
  }

  return false;
}
