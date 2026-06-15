/** RBAC Judge — metadados Supabase no client; emails admin só no servidor (`judge-rbac-server.ts`). */

export function isSupabaseAdminUser(user: {
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
} | null): boolean {
  if (!user) return false;
  const metaRole =
    (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.role as string | undefined);
  return metaRole === "admin";
}

export function isConsoleAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export function canAccessIngestion(role: string | null | undefined): boolean {
  return role === "admin" || role === "operator";
}

const JUDGE_ROLES = new Set(["judge", "head_judge", "admin"]);

export function isJudgeRole(role: string | null | undefined): boolean {
  return Boolean(role && JUDGE_ROLES.has(role));
}

export function isJudgeUser(
  _user: { email?: string | null } | null,
  role?: string | null,
): boolean {
  return isJudgeRole(role);
}
