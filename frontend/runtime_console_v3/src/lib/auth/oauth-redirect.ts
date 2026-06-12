const OAUTH_REDIRECT_KEY = "oauth_redirect";
const OAUTH_PENDING_KEY = "oauth_pending";

type OAuthRedirectData = {
  target: string;
  timestamp: number;
};

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
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

/** Consome flags OAuth e retorna o destino, ou null se não houver fluxo pendente. */
export function tryConsumeOAuthRedirect(): string | null {
  if (typeof window === "undefined") return null;

  const sessionData = sessionStorage.getItem(OAUTH_REDIRECT_KEY);
  const localData = localStorage.getItem(OAUTH_PENDING_KEY);
  const data = sessionData ?? localData;
  if (!data) return null;

  try {
    const parsed = JSON.parse(data) as OAuthRedirectData;
    sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
    localStorage.removeItem(OAUTH_PENDING_KEY);
    return normalizePath(parsed.target);
  } catch {
    sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
    localStorage.removeItem(OAUTH_PENDING_KEY);
    return null;
  }
}
