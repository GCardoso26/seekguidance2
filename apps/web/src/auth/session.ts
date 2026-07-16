/**
 * Session storage — aligned with backend User → Session → JWT.
 *
 * Access token: memory only (XSS exposure window reduced).
 * Refresh token: body-compat storage until SECURITY-001 (HttpOnly cookie).
 */

import type { AuthSession, CurrentUser, RoleName } from "@/src/types/auth";

const REFRESH_KEY = "judgetcg.refreshToken";
const USER_META_KEY = "judgetcg.userMeta";

let accessToken: string | null = null;
let accessExpiresAtMs = 0;
let currentUser: CurrentUser | null = null;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return sessionStorage.getItem(REFRESH_KEY);
}

export function getCurrentUser(): CurrentUser | null {
  return currentUser;
}

export function isAccessTokenExpired(nowMs = Date.now()): boolean {
  if (!accessToken) return true;
  // Refresh a few seconds early
  return nowMs >= accessExpiresAtMs - 5_000;
}

export function hasSessionMaterial(): boolean {
  return Boolean(getRefreshToken() || accessToken);
}

export function applyAuthSession(
  session: AuthSession,
  meta?: { email?: string; displayName?: string },
): CurrentUser {
  accessToken = session.accessToken;
  accessExpiresAtMs = Date.now() + session.expiresIn * 1000;

  const prev = currentUser;
  currentUser = {
    userId: session.userId,
    roles: session.roles as RoleName[],
    sessionId: session.sessionId,
    email: meta?.email ?? prev?.email,
    displayName: meta?.displayName ?? prev?.displayName,
  };

  if (canUseStorage()) {
    sessionStorage.setItem(REFRESH_KEY, session.refreshToken);
    sessionStorage.setItem(
      USER_META_KEY,
      JSON.stringify({
        email: currentUser.email,
        displayName: currentUser.displayName,
      }),
    );
  }

  return currentUser;
}

export function loadPersistedUserMeta(): { email?: string; displayName?: string } {
  if (!canUseStorage()) return {};
  const raw = sessionStorage.getItem(USER_META_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as { email?: string; displayName?: string };
  } catch {
    return {};
  }
}

export function clearSession(): void {
  accessToken = null;
  accessExpiresAtMs = 0;
  currentUser = null;
  if (canUseStorage()) {
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_META_KEY);
    sessionStorage.removeItem("judgetcg.sellerShopCreatedAtMs");
    sessionStorage.removeItem("judgetcg.sellerId");
    sessionStorage.removeItem("judgetcg.sellerFirstListingDone");
    sessionStorage.removeItem("judgetcg.cartId");
    sessionStorage.removeItem("judgetcg.cartDisplayMeta");
  }
}

/** Test / SSR helpers */
export function __resetSessionForTests(): void {
  clearSession();
}
