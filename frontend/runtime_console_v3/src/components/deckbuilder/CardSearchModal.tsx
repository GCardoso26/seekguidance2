"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useCardSearch, useCatalogSets } from "@/hooks/useCardSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { gameFilters } from "@/lib/game-filters";
import type { DeckBuilderZoneId } from "@/types/deck";
import type { UnifiedCard } from "@/types/card";
import { CardSearchFilters } from "./CardSearchFilters";
import { CardSearchResults } from "./CardSearchResults";

interface CardSearchModalProps {
  open: boolean;
  onClose: () => void;
  gameCode: string;
  defaultZone: DeckBuilderZoneId;
  onCardSelect: (card: UnifiedCard, zone: DeckBuilderZoneId) => void;
}

export function CardSearchModal({
  open,
  onClose,
  gameCode,
  defaultZone,
  onCardSelect,
}: CardSearchModalProps) {
  const [query, setQuery] = useState("");
  const [setCode, setSetCode] = useState<string | undefined>();
  const [rarity, setRarity] = useState<string | undefined>();
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const debouncedQuery = useDebounce(query, 300);

  const gameSlug = gameCode.toLowerCase();
  const filterConfig = gameFilters[gameSlug] ?? {};
  const { data: availableSets = [] } = useCatalogSets(gameCode);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useCardSearch({
    q: debouncedQuery,
    game: gameCode,
    set: setCode,
    rarity: rarity ? [rarity] : undefined,
    limit: 24,
  });

  const cards = useMemo(() => {
    const base = data?.pages.flatMap((p) => p.cards) ?? [];
    if (!selectedType) return base;
    return base.filter((card) => {
      const typeLine = String(card.gameData?.type_line || card.gameData?.type || "").toLowerCase();
      return typeLine.includes(selectedType.toLowerCase());
    });
  }, [data, selectedType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 p-4 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Adicionar carta</h2>
            <p className="text-xs text-muted-foreground">Arraste para a zona desejada ou clique para adicionar no {defaultZone}</p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <CardSearchFilters
            query={query}
            onQueryChange={setQuery}
            setCode={setCode}
            onSetCodeChange={setSetCode}
            rarity={rarity}
            onRarityChange={setRarity}
            availableSets={availableSets}
            gameSpecificTypes={filterConfig.types}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />
          <CardSearchResults
            cards={cards}
            loading={isLoading}
            onSelect={(card) => onCardSelect(card, defaultZone)}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
          />
        </div>
      </div>
    </div>
  );
}
