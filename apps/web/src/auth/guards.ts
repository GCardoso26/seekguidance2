import type { AuthState, CurrentUser, RoleName } from "@/src/types/auth";

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: "anonymous" | "missing_role"; redirectTo?: string };

/**
 * Frontend route guards — UX only. Backend RBAC remains authoritative.
 */
export function requireAuth(
  state: AuthState,
  user: CurrentUser | null,
): GuardResult {
  if (state === "loading") {
    return { ok: false, reason: "anonymous" };
  }
  if (state !== "authenticated" || !user) {
    return { ok: false, reason: "anonymous", redirectTo: "/login" };
  }
  return { ok: true };
}

export function requireRole(
  state: AuthState,
  user: CurrentUser | null,
  role: RoleName,
): GuardResult {
  const auth = requireAuth(state, user);
  if (!auth.ok) return auth;
  if (!user!.roles.includes(role)) {
    return { ok: false, reason: "missing_role", redirectTo: "/session" };
  }
  return { ok: true };
}

export function canAccessSeller(user: CurrentUser | null): boolean {
  return Boolean(user?.roles.includes("seller"));
}
