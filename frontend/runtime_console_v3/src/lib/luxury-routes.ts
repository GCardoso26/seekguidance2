/** Rotas que não recebem o shell luxury (mesa judge, ops, auth técnico). */
const EXACT_EXCLUDE = new Set([
  "/judge",
  "/login",
  "/auth/callback",
]);

const PREFIX_EXCLUDE = [
  "/admin",
  "/observability",
  "/ingestion",
  "/deployments",
  "/incidents",
  "/federation",
  "/tenants",
  "/replay",
  "/developer",
  "/dashboard",
  "/overlay",
  "/auth/",
  "/judge/",
];

/** App pages: header luxury, sem footer (MobileLayout ou conteúdo próprio). */
const PREFIX_MINIMAL = [
  "/player",
  "/social",
  "/marketplace",
  "/stores",
  "/leagues",
  "/tournament",
  "/search",
  "/settings",
  "/payment",
  "/pricing",
  "/privacidade",
  "/onboarding",
];

export type LuxuryShellVariant = "full" | "minimal" | "none";

export function getLuxuryShellVariant(pathname: string): LuxuryShellVariant {
  if (EXACT_EXCLUDE.has(pathname)) return "none";
  if (PREFIX_EXCLUDE.some((p) => pathname === p || pathname.startsWith(p))) return "none";
  if (PREFIX_MINIMAL.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "minimal";
  }
  return "full";
}
