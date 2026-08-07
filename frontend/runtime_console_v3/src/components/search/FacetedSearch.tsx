"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Rows3, Table2 } from "lucide-react";
import { CardGrid } from "@/components/cards/CardGrid";
import { MarketplaceProductsRail } from "@/components/search/MarketplaceProductsRail";
import { SearchBuyEmptyState } from "@/components/search/SearchBuyEmptyState";
import { InlineAlert } from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filtersFromSearchParams,
  searchParamsFromFilters,
  useCardSearch,
  useCatalogSets,
} from "@/hooks/useCardSearch";
import {
  classifyPurchaseIntent,
  rankCardsBuyFirst,
} from "@/features/search/conversion";
import { gameCardsPath } from "@/lib/game-routes";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import type { SearchFilters } from "@/types/search";
import { useAnalytics } from "@/hooks/useAnalytics";
import { trackEvent } from "@/lib/analytics";

/** Base path escopado a um jogo (`/pokemon/cards` ou legado `/loja/pokemon/busca`). */
function isGameScopedSearchPath(path: string): boolean {
  return /^\/[^/]+\/cards\/?$/.test(path) || /^\/loja\/[^/]+\/busca\/?$/.test(path);
}

const QuickViewModal = dynamic(
  () => import("@/components/cards/QuickViewModal").then((m) => m.QuickViewModal),
  { ssr: false },
);

const ProductFiltersSidebar = dynamic(
  () =>
    import("@/components/marketplace/ProductFiltersSidebar").then((m) => m.ProductFiltersSidebar),
  {
    ssr: false,
    loading: () => (
      <aside className="w-full shrink-0 lg:w-64" aria-hidden>
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      </aside>
    ),
  },
);

interface FacetedSearchProps {
  initialGame?: string;
  initialQuery?: string;
  searchBasePath?: string;
  cardDetailPath?: string;
  /** Quando true, o seletor de jogo fica fixo no `initialGame` (páginas por TCG). */
  lockGame?: boolean;
}

export function FacetedSearch({
  initialGame,
  initialQuery,
  searchBasePath = "/loja/busca",
  cardDetailPath,
  lockGame = false,
}: FacetedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SearchFilters>(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    const scoped = lockGame || isGameScopedSearchPath(searchBasePath);
    return {
      ...fromUrl,
      q: initialQuery || searchParams.get("q") || undefined,
      game: scoped && initialGame ? initialGame : initialGame || fromUrl.game,
      sortBy: (searchParams.get("sort") as SearchFilters["sortBy"]) || "relevance",
    };
  });

  const [debouncedQ, setDebouncedQ] = useState(filters.q ?? "");
  const [quickViewCardId, setQuickViewCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "gallery" | "compact" | "table">("grid");
  const { track } = useAnalytics();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(filters.q ?? ""), 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const { data: availableSets = [] } = useCatalogSets(filters.game);

  const queryFilters = useMemo(() => {
    const setIsValid =
      !filters.set ||
      (availableSets.length > 0 && availableSets.some((s) => s.code === filters.set));

    return {
      ...filters,
      q: debouncedQ || undefined,
      set: setIsValid ? filters.set : undefined,
    };
  }, [filters, debouncedQ, availableSets]);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useCardSearch(queryFilters);

  const rawCards = useMemo(() => data?.pages.flatMap((p) => p.cards) ?? [], [data]);
  const purchaseIntent = useMemo(
    () => classifyPurchaseIntent(debouncedQ),
    [debouncedQ],
  );
  const cards = useMemo(() => {
    // Buy-first só na relevância — outros sorts (newest, preço, nome) vêm da API.
    if (filters.sortBy && filters.sortBy !== "relevance") {
      return rawCards;
    }
    return rankCardsBuyFirst(rawCards);
  }, [rawCards, filters.sortBy]);
  const total = data?.pages[0]?.total ?? 0;
  const isDegraded = Boolean(data?.pages[0]?.degraded);
  const buyableCount = useMemo(
    () =>
      cards.filter(
        (c) =>
          (c.listingCount ?? 0) > 0 ||
          (c.availableStock ?? c.marketplaceStock ?? 0) > 0 ||
          c.lowestPrice != null,
      ).length,
    [cards],
  );

  useEffect(() => {
    const q = debouncedQ.trim();
    if (q.length >= 2) {
      track("search", {
        query: q,
        game: filters.game,
        set: filters.set,
        results_count: total,
        purchase_intent: purchaseIntent,
        buyable_count: buyableCount,
      });
      if (!isLoading && buyableCount === 0) {
        void trackEvent("search_without_products", {
          query: q,
          intent: purchaseIntent,
          catalog_total: total,
        });
      }
    }
  }, [
    debouncedQ,
    filters.game,
    filters.set,
    total,
    track,
    purchaseIntent,
    buyableCount,
    isLoading,
  ]);

  const syncURL = useCallback(
    (next: SearchFilters) => {
      const params = searchParamsFromFilters(next);
      // Em `/{slug}/cards` o jogo vem do path — não poluir a URL com ?game=.
      if (isGameScopedSearchPath(searchBasePath)) {
        params.delete("game");
      }
      const qs = params.toString();
      router.replace(qs ? `${searchBasePath}?${qs}` : searchBasePath, { scroll: false });
    },
    [router, searchBasePath],
  );

  const updateFilters = useCallback(
    (updates: Partial<SearchFilters>) => {
      setFilters((prev) => {
        if (lockGame && updates.game !== undefined && updates.game !== prev.game) {
          return prev;
        }
        const gameChanged =
          updates.game !== undefined && updates.game !== prev.game;
        const next: SearchFilters = { ...prev, ...updates };
        if (gameChanged) {
          next.set = undefined;
          if (next.game !== "MTG") {
            next.colors = undefined;
          }
          // Evita `/pokemon/cards?game=YGO` — navega para o path canônico do jogo.
          if (next.game && isGameScopedSearchPath(searchBasePath)) {
            const token = GAME_TOKENS[next.game as GameId];
            if (token) {
              const params = searchParamsFromFilters(next);
              params.delete("game");
              const qs = params.toString();
              const dest = gameCardsPath(token.slug);
              router.replace(qs ? `${dest}?${qs}` : dest, { scroll: false });
              return next;
            }
          }
        }
        syncURL(next);
        return next;
      });
    },
    [lockGame, router, searchBasePath, syncURL],
  );

  useEffect(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    const scoped = lockGame || isGameScopedSearchPath(searchBasePath);
    setFilters({
      ...fromUrl,
      q: initialQuery || fromUrl.q,
      // Path do TCG / lockGame: nunca herdar ?game= de outra origem (ex.: ?game=MTG em /lorcana/cards).
      game: scoped && initialGame ? initialGame : initialGame || fromUrl.game,
      sortBy: fromUrl.sortBy ?? "relevance",
    });
    setDebouncedQ(initialQuery || fromUrl.q || "");
  }, [searchParams, initialGame, initialQuery, lockGame, searchBasePath]);

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
          lockGame={lockGame}
        />

        <div className="min-w-0 flex-1">
          <MarketplaceProductsRail query={debouncedQ} intent={purchaseIntent} />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {isLoading && cards.length === 0
                ? "Carregando…"
                : `${total.toLocaleString("pt-BR")} resultados${
                    buyableCount > 0
                      ? ` · ${buyableCount.toLocaleString("pt-BR")} com oferta`
                      : ""
                  }`}
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
                {(
                  [
                    ["grid", LayoutGrid, "Grade"],
                    ["gallery", Rows3, "Galeria"],
                    ["list", List, "Lista"],
                    ["table", Table2, "Tabela"],
                    ["compact", LayoutGrid, "Compacto"],
                  ] as const
                ).map(([mode, Icon, label]) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={viewMode === mode ? "default" : "ghost"}
                    size="sm"
                    className="min-h-11"
                    onClick={() => setViewMode(mode)}
                    aria-label={`Visualização ${label}`}
                    aria-pressed={viewMode === mode}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {(isError || isDegraded) && (
            <InlineAlert
              className="mb-4"
              message={
                isFetching
                  ? "Servidor iniciando — tentando reconectar ao catálogo…"
                  : "Catálogo temporariamente indisponível. Tente novamente em instantes."
              }
              onRetry={!isFetching ? () => void refetch() : undefined}
            />
          )}

          {!isLoading && !isError && !isDegraded && cards.length === 0 ? (
            <SearchBuyEmptyState
              query={debouncedQ}
              intent={purchaseIntent}
              onClearFilters={clearFilters}
            />
          ) : (
            <CardGrid
              cards={cards}
              viewMode={viewMode}
              isLoading={isLoading || isFetchingNextPage}
              isError={isError || isDegraded}
              hasMore={Boolean(hasNextPage)}
              emptyMessage="Ainda não existem ofertas deste item no marketplace."
              onLoadMore={() => fetchNextPage()}
              onViewDetail={(id) => {
                void trackEvent("search_product_click", {
                  card_id: id,
                  query: debouncedQ,
                  intent: purchaseIntent,
                  source: "search",
                });
                if (cardDetailPath) {
                  router.push(`${cardDetailPath}/${encodeURIComponent(id)}`);
                } else {
                  setQuickViewCardId(id);
                }
              }}
              onAddToDeck={(card) => router.push(`/decks?add=${card.id}`)}
              onAddToCart={(card) => {
                void trackEvent("add_to_cart", {
                  card_id: card.id,
                  source: "search",
                });
                router.push("/carrinho");
              }}
            />
          )}
        </div>
      </div>

      {!cardDetailPath && (
        <QuickViewModal
          cardId={quickViewCardId}
          isOpen={Boolean(quickViewCardId)}
          onClose={() => setQuickViewCardId(null)}
        />
      )}
    </div>
  );
}
