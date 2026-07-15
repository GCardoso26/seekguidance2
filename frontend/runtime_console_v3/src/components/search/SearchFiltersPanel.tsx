"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Filter, X } from "lucide-react";
import { useMemo } from "react";
import { ALL_GAME_IDS, GAME_TOKENS } from "@/lib/tcg-tokens";
import { gameFilters } from "@/lib/game-filters";
import type { CatalogSetOption, SearchFilters } from "@/types/search";

interface SearchFiltersPanelProps {
  filters: SearchFilters;
  onChange: (updates: Partial<SearchFilters>) => void;
  onClear: () => void;
  availableSets: CatalogSetOption[];
  lockGame?: boolean;
}

const RARITY_OPTIONS = [
  { value: "common", label: "Common", color: "#9CA3AF" },
  { value: "uncommon", label: "Uncommon", color: "#22C55E" },
  { value: "rare", label: "Rare", color: "#3B82F6" },
  { value: "mythic", label: "Mythic", color: "#EF4444" },
  { value: "special", label: "Special", color: "#F59E0B" },
  { value: "legendary", label: "Legendary", color: "#8B5CF6" },
];

const CONDITION_OPTIONS = [
  { value: "NM", label: "Near Mint" },
  { value: "LP", label: "Lightly Played" },
  { value: "MP", label: "Moderately Played" },
  { value: "HP", label: "Heavily Played" },
  { value: "DM", label: "Damaged" },
];

const LANGUAGE_OPTIONS = [
  { value: "pt", label: "Português" },
  { value: "en", label: "Inglês" },
  { value: "ja", label: "Japonês" },
  { value: "es", label: "Espanhol" },
  { value: "fr", label: "Francês" },
  { value: "de", label: "Alemão" },
];

function hasActiveFilters(filters: SearchFilters): boolean {
  return !!(
    filters.set ||
    filters.rarity?.length ||
    filters.condition?.length ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.language ||
    filters.colors?.length ||
    (filters.foil !== null && filters.foil !== undefined)
  );
}

function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.set) count++;
  if (filters.rarity?.length) count += filters.rarity.length;
  if (filters.condition?.length) count += filters.condition.length;
  if (filters.priceMin !== undefined) count++;
  if (filters.priceMax !== undefined) count++;
  if (filters.language) count++;
  if (filters.colors?.length) count += filters.colors.length;
  if (filters.foil !== null && filters.foil !== undefined) count++;
  return count;
}

function FilterContent({
  filters,
  onChange,
  onClear,
  availableSets,
  lockGame = false,
}: SearchFiltersPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Jogo</h3>
        <div className="space-y-1">
          {ALL_GAME_IDS.map((id) => {
            const token = GAME_TOKENS[id];
            const locked = lockGame && filters.game === id;
            return (
              <label
                key={id}
                className={`flex items-center gap-2 ${lockGame && !locked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <input
                  type="radio"
                  name="game-filter"
                  checked={filters.game === id}
                  disabled={lockGame}
                  onChange={() => {
                    if (lockGame) return;
                    onChange({ game: filters.game === id ? undefined : id });
                  }}
                  className="h-4 w-4"
                />
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: token.primary }}
                  aria-hidden
                />
                <span className="text-sm text-foreground">{token.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {availableSets.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Coleção</h3>
          <select
            value={filters.set || ""}
            onChange={(e) => onChange({ set: e.target.value || undefined })}
            className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
            aria-label="Filtrar por coleção"
          >
            <option value="">Todas</option>
            {availableSets.map((set) => (
              <option key={set.code} value={set.code}>
                {set.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(filters.game === "mtg" || filters.game === "magic") && gameFilters.mtg?.colors && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Cores (Magic)</h3>
          <div className="flex flex-wrap gap-2">
            {gameFilters.mtg.colors.map((color) => {
              const selected = filters.colors?.includes(color.value) ?? false;
              return (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  onClick={() => {
                    const current = filters.colors ?? [];
                    const next = selected
                      ? current.filter((c) => c !== color.value)
                      : [...current, color.value];
                    onChange({ colors: next.length > 0 ? next : undefined });
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    selected ? "border-primary ring-2 ring-primary/30" : "border-border"
                  }`}
                  style={{
                    backgroundColor: color.color,
                    color: color.value === "W" ? "#1F2937" : "#F9FAFB",
                  }}
                >
                  {color.value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold">Raridade</h3>
        <div className="space-y-1">
          {RARITY_OPTIONS.map((rarity) => (
            <label key={rarity.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.rarity?.includes(rarity.value) ?? false}
                onChange={(e) => {
                  const current = filters.rarity ?? [];
                  const next = e.target.checked
                    ? [...current, rarity.value]
                    : current.filter((r) => r !== rarity.value);
                  onChange({ rarity: next.length > 0 ? next : undefined });
                }}
                className="h-4 w-4"
              />
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: rarity.color }}
                aria-hidden
              />
              <span className="text-sm font-medium text-foreground">{rarity.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Condição</h3>
        <div className="space-y-1">
          {CONDITION_OPTIONS.map((condition) => (
            <label key={condition.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.condition?.includes(condition.value) ?? false}
                onChange={(e) => {
                  const current = filters.condition ?? [];
                  const next = e.target.checked
                    ? [...current, condition.value]
                    : current.filter((c) => c !== condition.value);
                  onChange({ condition: next.length > 0 ? next : undefined });
                }}
                className="h-4 w-4"
              />
              <span className="text-sm">{condition.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Preço (USD)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin ?? ""}
            onChange={(e) =>
              onChange({ priceMin: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm"
            aria-label="Preço mínimo"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax ?? ""}
            onChange={(e) =>
              onChange({ priceMax: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm"
            aria-label="Preço máximo"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Idioma</h3>
        <select
          value={filters.language || ""}
          onChange={(e) => onChange({ language: e.target.value || undefined })}
          className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
          aria-label="Filtrar por idioma"
        >
          <option value="">Todos</option>
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Acabamento</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { value: null, label: "Todos" },
            { value: true, label: "Foil" },
            { value: false, label: "Normal" },
          ].map((opt) => (
            <label key={String(opt.value)} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="foil-filter"
                checked={filters.foil === opt.value || (opt.value === null && filters.foil == null)}
                onChange={() => onChange({ foil: opt.value })}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2 text-sm hover:bg-muted"
      >
        <X className="h-4 w-4" />
        Limpar filtros
      </button>
    </div>
  );
}

export function SearchFiltersPanel(props: SearchFiltersPanelProps) {
  const activeCount = useMemo(() => countActiveFilters(props.filters), [props.filters]);

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20">
          <h2 className="mb-4 text-lg font-semibold">Filtros</h2>
          <FilterContent {...props} />
        </div>
      </aside>

      <div className="lg:hidden">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="flex min-h-11 items-center gap-2 rounded-md border border-border px-4 py-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters(props.filters) && (
                <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>
              )}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(20rem,90vw)] overflow-y-auto border-r border-border bg-background p-4 shadow-xl">
              <Dialog.Title className="mb-4 text-lg font-semibold">Filtros</Dialog.Title>
              <FilterContent {...props} />
              <Dialog.Close asChild>
                <button type="button" className="mt-4 w-full rounded-md bg-primary py-2 text-sm text-primary-foreground">
                  Aplicar
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
