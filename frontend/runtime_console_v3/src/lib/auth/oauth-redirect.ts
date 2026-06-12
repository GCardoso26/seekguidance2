const OAUTH_REDIRECT_KEY = "oauth_redirect";
const OAUTH_PENDING_KEY = "oauth_pending";
const OAUTH_MAX_AGE_MS = 10 * 60 * 1000;

type OAuthRedirectData = {
  target: string;
  timestamp: number;
};

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function isOAuthReturnPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/auth/callback";
}

export function hasOAuthUrlMarkers(): boolean {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  return (
    search.includes("code=") ||
    search.includes("from_oauth=1") ||
    search.includes("auth=") ||
    hash.includes("access_token") ||
    hash.includes("refresh_token")
  );
}

export function setOAuthRedirectTarget(path: string) {
  const data: OAuthRedirectData = {
    target: normalizePath(path),
    timestamp: Date.now(),
  };
  const serialized = JSON.stringify(data);
  sessionStorage.setItem(OAUTH_REDIRECT_KEY, serialized);
  localStorage.setItem(OAUTH_PENDING_KEY, serialized);
}

export function clearOAuthRedirectState() {
  sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
  localStorage.removeItem(OAUTH_PENDING_KEY);
}

function readStoredTarget(): string | null {
  const sessionData = sessionStorage.getItem(OAUTH_REDIRECT_KEY);
  const localData = localStorage.getItem(OAUTH_PENDING_KEY);
  const data = sessionData ?? localData;
  if (!data) return null;

  try {
    const parsed = JSON.parse(data) as OAuthRedirectData;
    if (Date.now() - parsed.timestamp > OAUTH_MAX_AGE_MS) {
      clearOAuthRedirectState();
      return null;
    }
    return normalizePath(parsed.target);
  } catch {
    clearOAuthRedirectState();
    return null;
  }
}

/** Lê destino OAuth sem consumir flags — só em / ou /auth/callback. */
export function peekOAuthRedirectTarget(): string | null {
  if (typeof window === "undefined") return null;
  if (!isOAuthReturnPath(window.location.pathname)) return null;

  if (window.location.search.includes("from_oauth=1")) {
    return "/judge";
  }

  if (hasOAuthUrlMarkers()) {
    return readStoredTarget() ?? "/judge";
  }

  return readStoredTarget();
}

/** Consome flags e retorna destino. Só redireciona a partir de / ou /auth/callback. */
export function tryConsumeOAuthRedirect(): string | null {
  const target = peekOAuthRedirectTarget();
  if (!target) return null;

  clearOAuthRedirectState();
  return target;
}

/** Navegação hard — evita falhas de soft navigation RSC do App Router. */
export function performOAuthRedirect(target: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizePath(target);
  if (window.location.pathname === normalized) return;
  window.location.replace(normalized);
}
