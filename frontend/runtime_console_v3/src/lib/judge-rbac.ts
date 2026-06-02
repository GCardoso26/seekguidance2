/** RBAC Judge — emails admin via env + metadados Supabase. */

export function parseAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_JUDGE_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSupabaseAdminUser(user: {
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
} | null): boolean {
  if (!user) return false;
  const email = user.email?.toLowerCase();
  if (email && parseAdminEmails().includes(email)) return true;
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
