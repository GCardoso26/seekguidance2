"use client";

import { DraggableSearchCard } from "./DraggableSearchCard";
import type { UnifiedCard } from "@/types/card";

interface CardSearchResultsProps {
  cards: UnifiedCard[];
  loading?: boolean;
  onSelect: (card: UnifiedCard) => void;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function CardSearchResults({
  cards,
  loading,
  onSelect,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}: CardSearchResultsProps) {
  return (
    <div className="space-y-3">
      <div className="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 lg:grid-cols-5">
        {loading && cards.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">Buscando cartas…</p>
        ) : null}
        {cards.map((card) => (
          <DraggableSearchCard key={card.id} card={card} onClick={() => onSelect(card)} />
        ))}
        {!loading && cards.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
        ) : null}
      </div>
      {hasNextPage ? (
        <button
          type="button"
          className="w-full rounded-md border border-border px-3 py-2 text-sm text-primary"
          onClick={onLoadMore}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
        </button>
      ) : null}
    </div>
  );
}
