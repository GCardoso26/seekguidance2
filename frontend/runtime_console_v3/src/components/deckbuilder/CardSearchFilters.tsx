"use client";

import type { GameConfigOption } from "@/lib/game-config";
import { Input } from "@/components/ui/input";
import type { CatalogSetOption } from "@/types/search";

interface CardSearchFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  setCode?: string;
  onSetCodeChange: (value: string | undefined) => void;
  rarity?: string;
  onRarityChange: (value: string | undefined) => void;
  availableSets: CatalogSetOption[];
  rarityOptions?: GameConfigOption[];
  gameSpecificTypes?: string[];
  selectedType?: string;
  onTypeChange: (value: string | undefined) => void;
}

export function CardSearchFilters({
  query,
  onQueryChange,
  setCode,
  onSetCodeChange,
  rarity,
  onRarityChange,
  availableSets,
  rarityOptions = [],
  gameSpecificTypes = [],
  selectedType,
  onTypeChange,
}: CardSearchFiltersProps) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Buscar carta..."
        className="border-border bg-card"
      />
      <select
        value={setCode ?? ""}
        onChange={(e) => onSetCodeChange(e.target.value || undefined)}
        className="rounded-md border border-border bg-card px-3 py-2 text-sm"
      >
        <option value="">Todos os sets</option>
        {availableSets.map((set) => (
          <option key={set.code} value={set.code}>
            {set.name}
          </option>
        ))}
      </select>
      <select
        value={rarity ?? ""}
        onChange={(e) => onRarityChange(e.target.value || undefined)}
        className="rounded-md border border-border bg-card px-3 py-2 text-sm"
      >
        <option value="">Qualquer raridade</option>
        {rarityOptions.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <select
        value={selectedType ?? ""}
        onChange={(e) => onTypeChange(e.target.value || undefined)}
        className="rounded-md border border-border bg-card px-3 py-2 text-sm"
      >
        <option value="">Todos os tipos</option>
        {gameSpecificTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}
