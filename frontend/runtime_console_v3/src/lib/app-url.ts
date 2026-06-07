/**
 * URL pública da app (OAuth, links partilháveis).
 * No browser em produção: usa sempre window.location.origin (evita localhost no bundle).
 */

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/** Origin real do pedido (Vercel/proxy). */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    if (host) return stripTrailingSlash(`${forwardedProto}://${host}`);
  }
  return stripTrailingSlash(url.origin);
}

export function getAppUrl(fallbackOrigin?: string): string {
  if (typeof window !== "undefined") {
    const origin = stripTrailingSlash(window.location.origin);
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();

    // Em produção/preview: origin actual — nunca localhost de env desatualizado
    if (!isLocalhostUrl(origin)) {
      return origin;
    }

    // Dev local: permitir tunnel via env (ex. ngrok) ou localhost
    if (fromEnv && !isLocalhostUrl(fromEnv)) {
      return stripTrailingSlash(fromEnv);
    }
    return origin;
  }

  if (fallbackOrigin && !isLocalhostUrl(fallbackOrigin)) {
    return stripTrailingSlash(fallbackOrigin);
  }

  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv && !isLocalhostUrl(fromEnv)) {
    return stripTrailingSlash(fromEnv);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return stripTrailingSlash(`https://${vercelUrl}`);
  }

  if (fallbackOrigin) return stripTrailingSlash(fallbackOrigin);
  return "";
}

/** Path relativo ou URL absoluta → redirect completo. */
export function buildAppRedirectUrl(path = "/judge", fallbackOrigin?: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = getAppUrl(fallbackOrigin);
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Evita open redirect — só paths relativos internos. */
export function safeNextPath(raw: string | null | undefined, fallback = "/judge"): string {
  const next = (raw ?? fallback).trim();
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

/** Callback Supabase PKCE no domínio actual da app. */
export function buildOAuthCallbackUrl(nextPath = "/judge", fallbackOrigin?: string): string {
  const base = getAppUrl(fallbackOrigin);
  const next = safeNextPath(nextPath);
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}
