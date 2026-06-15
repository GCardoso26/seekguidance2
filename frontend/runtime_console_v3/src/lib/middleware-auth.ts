import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { isAdminEmailServer } from "@/lib/judge-rbac-server";

type JwtPayload = {
  role?: string;
  email?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

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

export function isAdminRequest(request: {
  cookies: { get: (name: string) => { value: string } | undefined; getAll: () => { name: string; value: string }[] };
}): boolean {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (access) {
    const payload = decodeJwtPayload(access);
    if (payload?.role === "admin") return true;
  }

  const sbToken = supabaseAccessToken(request);
  if (sbToken) {
    const payload = decodeJwtPayload(sbToken);
    if (payload?.role === "admin") return true;
    const email = payload?.email?.toLowerCase();
    if (isAdminEmailServer(email)) return true;
  }

  return false;
}
