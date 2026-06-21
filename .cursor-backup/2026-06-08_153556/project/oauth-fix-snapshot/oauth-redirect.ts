const OAUTH_NEXT_KEY = "oauth_next";
const OAUTH_PENDING_KEY = "oauth_pending";

export function setOAuthRedirectTarget(path: string) {
  const next = path.startsWith("/") ? path : `/${path}`;
  sessionStorage.setItem(OAUTH_NEXT_KEY, next);
  localStorage.setItem(OAUTH_NEXT_KEY, next);
  sessionStorage.setItem(OAUTH_PENDING_KEY, "1");
  localStorage.setItem(OAUTH_PENDING_KEY, "1");
}

export function clearOAuthRedirectState() {
  sessionStorage.removeItem(OAUTH_NEXT_KEY);
  localStorage.removeItem(OAUTH_NEXT_KEY);
  sessionStorage.removeItem(OAUTH_PENDING_KEY);
  localStorage.removeItem(OAUTH_PENDING_KEY);
}

function readOAuthNext(fallback = "/judge"): string {
  return (
    sessionStorage.getItem(OAUTH_NEXT_KEY) ??
    localStorage.getItem(OAUTH_NEXT_KEY) ??
    fallback
  );
}

function isOAuthReturnPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/auth/callback";
}

function hasOAuthUrlMarkers(): boolean {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  return (
    search.includes("code=") ||
    search.includes("auth=") ||
    hash.includes("access_token") ||
    hash.includes("refresh_token")
  );
}

/** Redireciona após OAuth quando há sessão e fluxo pendente. */
export function tryConsumeOAuthRedirect(hasSession: boolean): boolean {
  if (typeof window === "undefined" || !hasSession) return false;

  const pathname = window.location.pathname;
  if (!isOAuthReturnPath(pathname)) return false;

  const pending =
    sessionStorage.getItem(OAUTH_PENDING_KEY) ?? localStorage.getItem(OAUTH_PENDING_KEY);
  const shouldRedirect = Boolean(pending) || hasOAuthUrlMarkers();
  if (!shouldRedirect) return false;

  const target = readOAuthNext();
  clearOAuthRedirectState();

  const normalized = target.startsWith("/") ? target : `/${target}`;
  if (pathname === normalized) return false;

  window.location.replace(normalized);
  return true;
}
