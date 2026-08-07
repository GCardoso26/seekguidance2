/** Rotas que não recebem o shell luxury (app shell próprio ou ops).
 * Fluxos transacionais (carrinho/checkout/pedidos/vendedor) ficam em Galeria clara —
 * nunca Noite de Leilão (design.md §7).
 */
const EXACT_EXCLUDE = new Set([
  "/",
  "/judge",
  "/login",
  "/entrar",
  "/suporte",
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
  "/pedidos",
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
  "/comprador",
  "/colecao",
  "/portal",
];

/** Prefixos que devem permanecer em Galeria clara (nunca auction). */
export const GALLERY_LOCKED_PREFIXES = [
  "/carrinho",
  "/checkout",
  "/pedidos",
  "/vendedor",
  "/loja/busca",
] as const;

export function isGalleryLockedPath(pathname: string): boolean {
  return GALLERY_LOCKED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`),
  );
}

export type LuxuryShellVariant = "full" | "minimal" | "none";

export function getLuxuryShellVariant(pathname: string): LuxuryShellVariant {
  if (EXACT_EXCLUDE.has(pathname)) return "none";
  if (PREFIX_EXCLUDE.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "none";
  }
  return "full";
}
