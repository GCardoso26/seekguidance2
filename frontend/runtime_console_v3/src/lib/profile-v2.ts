/** Player Profile V2 — hub de identidade do jogador (sem novo BC). */

export type ProfileSectionId =
  | "resumo"
  | "colecao"
  | "decks"
  | "marketplace"
  | "compras"
  | "vendas"
  | "wishlist"
  | "favoritos"
  | "conquistas"
  | "estatisticas"
  | "historico"
  | "configuracoes";

export type ProfileNavItem = {
  id: ProfileSectionId;
  href: string;
  label: string;
  exact?: boolean;
};

export const PROFILE_NAV: ProfileNavItem[] = [
  { id: "resumo", href: "/perfil", label: "Resumo", exact: true },
  { id: "colecao", href: "/colecao", label: "Coleção" },
  { id: "decks", href: "/perfil/decks", label: "Decks" },
  { id: "marketplace", href: "/perfil/marketplace", label: "Marketplace" },
  { id: "compras", href: "/perfil/compras", label: "Compras" },
  { id: "vendas", href: "/perfil/vendas", label: "Vendas" },
  { id: "wishlist", href: "/perfil/wishlist", label: "Wishlist" },
  { id: "favoritos", href: "/perfil/favoritos", label: "Favoritos" },
  { id: "conquistas", href: "/perfil/conquistas", label: "Conquistas" },
  { id: "estatisticas", href: "/perfil/estatisticas", label: "Estatísticas" },
  { id: "historico", href: "/perfil/historico", label: "Histórico" },
  { id: "configuracoes", href: "/perfil/configuracoes", label: "Configurações" },
];

export function publicProfilePath(username: string, suffix = ""): string {
  const base = `/u/${encodeURIComponent(username)}`;
  if (!suffix) return base;
  return `${base}/${suffix.replace(/^\//, "")}`;
}

export function slugifyDeckName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "deck";
}
