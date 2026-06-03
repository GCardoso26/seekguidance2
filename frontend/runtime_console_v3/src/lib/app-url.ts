/**
 * URL pública da app (OAuth, links partilháveis).
 * Preferir NEXT_PUBLIC_APP_URL (build Vercel) em vez de window.location.origin.
 */

export function getAppUrl(fallbackOrigin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  if (fallbackOrigin) return fallbackOrigin.replace(/\/$/, "");
  return "";
}

/** Path relativo ou URL absoluta → redirect OAuth completo. */
export function buildAppRedirectUrl(path = "/judge", fallbackOrigin?: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = getAppUrl(fallbackOrigin);
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Callback Supabase PKCE — sempre no domínio público da app. */
export function buildOAuthCallbackUrl(nextPath = "/judge", fallbackOrigin?: string): string {
  const base = getAppUrl(fallbackOrigin);
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}
