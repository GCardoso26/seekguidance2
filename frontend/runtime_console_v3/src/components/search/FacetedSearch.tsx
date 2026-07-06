"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { CardGrid } from "@/components/cards/CardGrid";
import { QuickViewModal } from "@/components/cards/QuickViewModal";
import { ProductFiltersSidebar } from "@/components/marketplace/ProductFiltersSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filtersFromSearchParams,
  searchParamsFromFilters,
  useCardSearch,
  useCatalogSets,
} from "@/hooks/useCardSearch";
import type { SearchFilters } from "@/types/search";
import { useAnalytics } from "@/hooks/useAnalytics";

interface FacetedSearchProps {
  initialGame?: string;
  initialQuery?: string;
  searchBasePath?: string;
  cardDetailPath?: string;
}

export function FacetedSearch({
  initialGame,
  initialQuery,
  searchBasePath = "/loja/busca",
  cardDetailPath,
}: FacetedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SearchFilters>(() => ({
    ...filtersFromSearchParams(searchParams),
    q: initialQuery || searchParams.get("q") || undefined,
    game: initialGame || searchParams.get("game") || undefined,
    sortBy: (searchParams.get("sort") as SearchFilters["sortBy"]) || "relevance",
  }));

  const [debouncedQ, setDebouncedQ] = useState(filters.q ?? "");
  const [quickViewCardId, setQuickViewCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { track } = useAnalytics();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(filters.q ?? ""), 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const queryFilters = useMemo(
    () => ({ ...filters, q: debouncedQ || undefined }),
    [filters, debouncedQ],
  );

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCardSearch(queryFilters);

  const { data: availableSets = [] } = useCatalogSets(filters.game);

  const cards = useMemo(() => data?.pages.flatMap((p) => p.cards) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  useEffect(() => {
    const q = debouncedQ.trim();
    if (q.length >= 2) {
      track("search", {
        query: q,
        game: filters.game,
        set: filters.set,
        results_count: total,
      });
    }
  }, [debouncedQ, filters.game, filters.set, total, track]);

  const syncURL = useCallback(
    (next: SearchFilters) => {
      const params = searchParamsFromFilters(next);
      const qs = params.toString();
      router.replace(qs ? `${searchBasePath}?${qs}` : searchBasePath, { scroll: false });
    },
    [router, searchBasePath],
  );

  const updateFilters = useCallback(
    (updates: Partial<SearchFilters>) => {
      setFilters((prev) => {
        const gameChanged =
          updates.game !== undefined && updates.game !== prev.game;
        const next: SearchFilters = { ...prev, ...updates };
        if (gameChanged) {
          next.set = undefined;
          if (next.game !== "MTG") {
            next.colors = undefined;
          }
        }
        syncURL(next);
        return next;
      });
    },
    [syncURL],
  );

  useEffect(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    setFilters({
      ...fromUrl,
      q: initialQuery || fromUrl.q,
      game: initialGame || fromUrl.game,
      sortBy: fromUrl.sortBy ?? "relevance",
    });
    setDebouncedQ(initialQuery || fromUrl.q || "");
  }, [searchParams, initialGame, initialQuery]);

  useEffect(() => {
    if (!filters.set || availableSets.length === 0) return;
    const isValid = availableSets.some((s) => s.code === filters.set);
    if (!isValid) {
      updateFilters({ set: undefined });
    }
  }, [availableSets, filters.set, updateFilters]);

  const clearFilters = useCallback(() => {
    const cleared: SearchFilters = {
      q: undefined,
      game: initialGame,
      sortBy: "relevance",
      foil: null,
    };
    setFilters(cleared);
    setDebouncedQ("");
    syncURL(cleared);
  }, [initialGame, syncURL]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          value={filters.q ?? ""}
          onChange={(e) => updateFilters({ q: e.target.value || undefined })}
          placeholder="Buscar cartas…"
          className="h-11 flex-1"
          aria-label="Buscar cartas"
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <ProductFiltersSidebar
          filters={filters}
          onChange={updateFilters}
          onClear={clearFilters}
          availableSets={availableSets}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {isLoading && cards.length === 0 ? "Carregando…" : `${total.toLocaleString("pt-BR")} resultados`}
            </p>

            <div className="flex items-center gap-2">
              <select
                value={filters.sortBy ?? "relevance"}
                onChange={(e) =>
                  updateFilters({ sortBy: e.target.value as SearchFilters["sortBy"] })
                }
                className="min-h-11 rounded-md border border-border bg-background px-3 py-2 text-sm"
                aria-label="Ordenar resultados"
              >
                <option value="relevance">Relevância</option>
                <option value="price_asc">Preço: menor → maior</option>
                <option value="price_desc">Preço: maior → menor</option>
                <option value="name_asc">Nome: A → Z</option>
                <option value="name_desc">Nome: Z → A</option>
                <option value="newest">Mais recentes</option>
              </select>

              <div className="flex rounded-md border border-border">
                <Button
                  type="button"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="min-h-11"
                  onClick={() => setViewMode("grid")}
                  aria-label="Visualização em grade"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="min-h-11"
                  onClick={() => setViewMode("list")}
                  aria-label="Visualização em lista"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isError && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              Erro ao carregar cartas. Tente novamente em instantes.
            </p>
          )}

          <CardGrid
            cards={cards}
            viewMode={viewMode}
            isLoading={isLoading || isFetchingNextPage}
            hasMore={Boolean(hasNextPage)}
            onLoadMore={() => fetchNextPage()}
            onViewDetail={(id) => {
              if (cardDetailPath) {
                router.push(`${cardDetailPath}/${encodeURIComponent(id)}`);
              } else {
                setQuickViewCardId(id);
              }
            }}
            onAddToDeck={(card) => router.push(`/decks?add=${card.id}`)}
            onAddToCart={() => router.push("/carrinho")}
          />
        </div>
      </div>

      <QuickViewModal
        cardId={quickViewCardId}
        isOpen={Boolean(quickViewCardId)}
        onClose={() => setQuickViewCardId(null)}
      />
    </div>
  );
}
