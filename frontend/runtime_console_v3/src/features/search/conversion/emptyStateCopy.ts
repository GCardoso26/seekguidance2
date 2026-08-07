import { EMPTY_OFFERS_MESSAGE, NO_STOCK_CARD_MESSAGE } from "./types";
import type { PurchaseIntent } from "./types";

export type EmptyStateModel = {
  title: string;
  description: string;
  suggestions: Array<{ label: string; href: string }>;
};

/**
 * Empty state honesto — nunca página em branco, nunca inventa estoque.
 */
export function buildSearchEmptyState(
  query: string,
  intent: PurchaseIntent,
): EmptyStateModel {
  const q = query.trim();
  const title = q ? EMPTY_OFFERS_MESSAGE : "Nenhum produto encontrado";
  const description = q
    ? `Não há ofertas ativas para “${q}” no momento. Veja similares, coleções ou entre na lista de interesse.`
    : "Busque por uma carta, booster ou acessório para ver ofertas do marketplace.";

  const suggestions: EmptyStateModel["suggestions"] = [
    { label: "Singles", href: "/loja/singles" },
    { label: "Selados", href: "/loja/selados" },
    { label: "Acessórios", href: "/loja/acessorios" },
    { label: "Lista de interesse", href: "/wishlist" },
  ];

  if (intent === "accessory") {
    suggestions.unshift({
      label: "Ver acessórios no marketplace",
      href: "/loja/selados?category=accessory",
    });
  } else if (intent === "sealed") {
    suggestions.unshift({
      label: "Ver selados no marketplace",
      href: "/loja/selados?category=booster",
    });
  } else if (q) {
    suggestions.unshift({
      label: "Buscar no catálogo de cartas",
      href: `/loja/busca?q=${encodeURIComponent(q)}`,
    });
  }

  return { title, description, suggestions };
}

export function noStockCardCopy(): string {
  return NO_STOCK_CARD_MESSAGE;
}

export function offerCountLabel(count: number): string {
  if (count <= 0) return NO_STOCK_CARD_MESSAGE;
  if (count === 1) return "1 oferta disponível";
  return `${count} ofertas disponíveis`;
}
