/** RBAC server-only — emails admin/painel nunca expostos no bundle do browser. */

export function parseAdminEmailsServer(): string[] {
  const raw = process.env.JUDGE_ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_JUDGE_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function parseJudgeEmailsServer(): string[] {
  const raw = process.env.JUDGE_PANEL_EMAILS ?? process.env.NEXT_PUBLIC_JUDGE_PANEL_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmailServer(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmailsServer().includes(email.toLowerCase());
}

export function isJudgeEmailServer(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseJudgeEmailsServer().includes(email.toLowerCase());
}
