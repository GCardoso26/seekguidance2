/**
 * Editorial Platform — content types + contextual relations (Epic 15).
 * Not a CMS BC — structure + navigation hooks only.
 */

export const EDITORIAL_TYPES = [
  "news",
  "guide",
  "deck_tech",
  "review",
  "meta_shift",
  "expansion",
  "article",
  "weekly_ranking",
] as const;

export type EditorialType = (typeof EDITORIAL_TYPES)[number];

export type EditorialRelation = {
  cardIds?: string[];
  deckIds?: string[];
  expansionCodes?: string[];
  gameSlug?: string;
  tournamentIds?: string[];
  marketplaceQuery?: string;
};

export type EditorialDocument = {
  id: string;
  type: EditorialType;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string;
  relations: EditorialRelation;
  heroImage?: string;
};

export const EDITORIAL_TYPE_LABELS: Record<EditorialType, string> = {
  news: "Notícias",
  guide: "Guias",
  deck_tech: "Deck Tech",
  review: "Review",
  meta_shift: "Mudanças de meta",
  expansion: "Expansões",
  article: "Artigos",
  weekly_ranking: "Ranking semanal",
};

/** Contextual nav generated from relations — no domain logic. */
export function editorialDeepLinks(doc: EditorialDocument): Array<{ label: string; href: string }> {
  const links: Array<{ label: string; href: string }> = [];
  const r = doc.relations;
  if (r.gameSlug) links.push({ label: "Portal", href: `/${r.gameSlug}` });
  for (const code of r.expansionCodes ?? []) {
    links.push({
      label: `Expansão ${code}`,
      href: r.gameSlug ? `/${r.gameSlug}/sets/${code.toLowerCase()}` : "/loja",
    });
  }
  for (const cardId of (r.cardIds ?? []).slice(0, 3)) {
    links.push({ label: "Carta", href: `/cards/${encodeURIComponent(cardId)}` });
  }
  for (const deckId of (r.deckIds ?? []).slice(0, 2)) {
    links.push({ label: "Deck", href: `/decks/${deckId}` });
  }
  for (const tid of (r.tournamentIds ?? []).slice(0, 2)) {
    links.push({ label: "Torneio", href: `/tournament/${tid}` });
  }
  if (r.marketplaceQuery) {
    links.push({
      label: "Marketplace",
      href: `/loja/busca?q=${encodeURIComponent(r.marketplaceQuery)}`,
    });
  }
  return links;
}

/** Seed catalog for UI — real content can come from newsletter/Assets later. */
export const EDITORIAL_SEED: EditorialDocument[] = [
  {
    id: "seed-1",
    type: "meta_shift",
    title: "Meta da semana · o que está subindo",
    slug: "meta-da-semana",
    summary: "Movers e decks públicos em destaque.",
    publishedAt: new Date().toISOString(),
    relations: { gameSlug: "lorcana", marketplaceQuery: "lorcana" },
  },
  {
    id: "seed-2",
    type: "expansion",
    title: "Novas expansões nos portais",
    slug: "expansoes",
    summary: "Landings de set com Theme Engine e Asset Pipeline.",
    publishedAt: new Date().toISOString(),
    relations: { gameSlug: "mtg" },
  },
  {
    id: "seed-3",
    type: "deck_tech",
    title: "Deck Tech · complete faltantes",
    slug: "deck-tech-faltantes",
    summary: "Do workspace ao marketplace em um clique.",
    publishedAt: new Date().toISOString(),
    relations: { gameSlug: "pokemon" },
  },
];
