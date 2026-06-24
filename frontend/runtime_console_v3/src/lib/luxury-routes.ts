/** Rotas que não recebem o shell luxury (app shell próprio ou ops). */
const EXACT_EXCLUDE = new Set([
  "/",
  "/judge",
  "/login",
  "/entrar",
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
  "/perfil",
  "/loja",
  "/vendedor",
  "/carrinho",
  "/checkout",
  "/decks",
  "/player",
  "/social",
  "/marketplace",
  "/catalog",
  "/games",
  "/cards",
  "/store/dashboard",
  "/store/onboarding",
  "/stores",
  "/leagues",
  "/tournament",
  "/search",
  "/settings",
  "/payment",
  "/onboarding",
  "/comunidade",
  "/notifications",
];

export type LuxuryShellVariant = "full" | "minimal" | "none";

export function getLuxuryShellVariant(pathname: string): LuxuryShellVariant {
  if (EXACT_EXCLUDE.has(pathname)) return "none";
  if (PREFIX_EXCLUDE.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "none";
  }
  return "full";
}
