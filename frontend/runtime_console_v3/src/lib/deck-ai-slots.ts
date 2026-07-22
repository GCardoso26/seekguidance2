export type DeckAiSlotId =
  | "improve-deck"
  | "find-combos"
  | "find-substitutions"
  | "reduce-cost"
  | "adapt-meta"
  | "complete-from-collection"
  | "explain-curve"
  | "explain-legality";

export type DeckAiSlot = {
  id: DeckAiSlotId;
  label: string;
  description: string;
};

/** Pontos de extensão IA — não implementados; consomem só APIs públicas no futuro. */
export const DECK_AI_SLOTS: DeckAiSlot[] = [
  {
    id: "improve-deck",
    label: "Melhorar deck",
    description: "Sugestões de upgrade com Catalog + Analytics.",
  },
  {
    id: "find-combos",
    label: "Encontrar combos",
    description: "Combinações a partir do catálogo e meta.",
  },
  {
    id: "find-substitutions",
    label: "Substituições",
    description: "Alternativas por preço e legalidade.",
  },
  {
    id: "reduce-cost",
    label: "Reduzir custo",
    description: "Budget swaps via Pricing + Marketplace.",
  },
  {
    id: "adapt-meta",
    label: "Adaptar ao meta",
    description: "Ajustes com Analytics (quando disponível).",
  },
  {
    id: "complete-from-collection",
    label: "Completar com Collection",
    description: "Prioriza cartas que você já possui.",
  },
  {
    id: "explain-curve",
    label: "Explicar curva",
    description: "Narrativa da curva de mana/custo.",
  },
  {
    id: "explain-legality",
    label: "Explicar legalidade",
    description: "Resumo das regras do formato (Catalog).",
  },
];
