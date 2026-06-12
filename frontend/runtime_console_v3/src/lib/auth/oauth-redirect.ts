export const OAUTH_RETURN_COOKIE = "tcg_oauth_return";

const OAUTH_REDIRECT_KEY = "oauth_redirect";
const OAUTH_PENDING_KEY = "oauth_pending";
const OAUTH_LOGIN_STARTED_KEY = "oauth_login_started";
const OAUTH_MAX_AGE_MS = 10 * 60 * 1000;
const OAUTH_COOKIE_MAX_AGE_SEC = 600;

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

function isRecentGoogleReturn(): boolean {
  if (typeof document === "undefined") return false;
  const ref = document.referrer;
  return ref.includes("accounts.google.com") || ref.includes("google.com/");
}

function isRecentOAuthLoginStart(): boolean {
  const raw = sessionStorage.getItem(OAUTH_LOGIN_STARTED_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts) || Date.now() - ts > OAUTH_MAX_AGE_MS) {
    sessionStorage.removeItem(OAUTH_LOGIN_STARTED_KEY);
    return false;
  }
  return true;
}

export function markOAuthLoginStarted() {
  sessionStorage.setItem(OAUTH_LOGIN_STARTED_KEY, String(Date.now()));
}

export function clearOAuthLoginStarted() {
  sessionStorage.removeItem(OAUTH_LOGIN_STARTED_KEY);
}

function setOAuthReturnCookie(path: string) {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(normalizePath(path));
  document.cookie = `${OAUTH_RETURN_COOKIE}=${value}; path=/; max-age=${OAUTH_COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

export function clearOAuthReturnCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${OAUTH_RETURN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function setOAuthRedirectTarget(path: string) {
  markOAuthLoginStarted();
  const data: OAuthRedirectData = {
    target: normalizePath(path),
    timestamp: Date.now(),
  };
  const serialized = JSON.stringify(data);
  sessionStorage.setItem(OAUTH_REDIRECT_KEY, serialized);
  localStorage.setItem(OAUTH_PENDING_KEY, serialized);
  setOAuthReturnCookie(data.target);
}

export function clearOAuthRedirectState() {
  sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
  localStorage.removeItem(OAUTH_PENDING_KEY);
  clearOAuthLoginStarted();
  clearOAuthReturnCookie();
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

  const stored = readStoredTarget();
  if (stored) return stored;

  if (hasOAuthUrlMarkers() || isRecentGoogleReturn() || isRecentOAuthLoginStart()) {
    return "/judge";
  }

  return null;
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
