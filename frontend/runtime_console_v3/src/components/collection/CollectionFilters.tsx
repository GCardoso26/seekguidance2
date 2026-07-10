"use client";

import { Input } from "@/components/ui/input";
import { COLLECTION_CONDITIONS } from "@/lib/collection";
import type { CollectionSort } from "@/lib/collection";

interface CollectionFiltersProps {
  q: string;
  game: string;
  condition: string;
  foil: string;
  sort: CollectionSort;
  onQChange: (v: string) => void;
  onGameChange: (v: string) => void;
  onConditionChange: (v: string) => void;
  onFoilChange: (v: string) => void;
  onSortChange: (v: CollectionSort) => void;
}

export function CollectionFilters({
  q,
  game,
  condition,
  foil,
  sort,
  onQChange,
  onGameChange,
  onConditionChange,
  onFoilChange,
  onSortChange,
}: CollectionFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Input
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        placeholder="Buscar por nome"
        className="border-border bg-card"
      />
      <select
        value={game}
        onChange={(e) => onGameChange(e.target.value)}
        className="rounded-md border border-border bg-card px-3 py-2 text-sm"
      >
        <option value="">Todos os jogos</option>
        <option value="MTG">Magic</option>
        <option value="POKEMON">Pokémon</option>
        <option value="YGO">Yu-Gi-Oh!</option>
        <option value="LORCANA">Lorcana</option>
      </select>
      <select
        value={condition}
        onChange={(e) => onConditionChange(e.target.value)}
        className="rounded-md border border-border bg-card px-3 py-2 text-sm"
      >
        <option value="">Condição</option>
        {COLLECTION_CONDITIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={foil}
        onChange={(e) => onFoilChange(e.target.value)}
        className="rounded-md border border-border bg-card px-3 py-2 text-sm"
      >
        <option value="">Foil / Normal</option>
        <option value="foil">Foil</option>
        <option value="normal">Normal</option>
      </select>
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as CollectionSort)}
        className="rounded-md border border-border bg-card px-3 py-2 text-sm"
      >
        <option value="name">Ordenar: nome</option>
        <option value="acquired">Ordenar: data</option>
      </select>
    </div>
  );
}
