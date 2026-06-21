"use client";

import { useRouter } from "next/navigation";
import { GlobalSearchBar } from "@/components/home/GlobalSearchBar";
import { GameSelector } from "@/components/home/GameSelector";
import { TopMoversPlaceholder } from "@/components/trends/TopMoversPlaceholder";
import { countAvailableGames, mapHealthToGames } from "@/lib/catalog-games";
import { gameSlugFromId } from "@/lib/tcg-tokens";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import type { GameId } from "@/types/card";

export function CatalogMarketplaceSection() {
  const router = useRouter();
  const { data: health, isLoading, isError } = useCatalogHealth();

  const games = mapHealthToGames(health);
  const availableCount = countAvailableGames(health);

  const handleGameSelect = (gameId: string) => {
    router.push(`/games/${gameSlugFromId(gameId as GameId)}`);
  };

  return (
    <>
      <section
        className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-muted/40 to-background pb-16 pt-12 md:pt-16"
        aria-labelledby="catalog-hero-title"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
              Marketplace Neutro · 0% comissão
            </p>
            <h2 id="catalog-hero-title" className="text-3xl font-bold tracking-tight md:text-5xl">
              Descubra, monte decks e compre cartas
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              Catálogo unificado de TCGs com busca facetada, preços de mercado e checkout PIX direto ao
              lojista.
            </p>
          </div>

          <GlobalSearchBar className="mt-8" />

          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            aria-live="polite"
          >
            {isLoading && <span>Carregando catálogo…</span>}
            {!isLoading && health && (
              <>
                <span aria-label={`${health.total_cards} cartas no catálogo`}>
                  🎴 {health.total_cards.toLocaleString("pt-BR")} cartas
                </span>
                <span aria-label={`${availableCount} jogos disponíveis`}>
                  🎮 {availableCount} jogos
                </span>
                {health.ready_for_marketplace && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
                    Catálogo pronto
                  </span>
                )}
              </>
            )}
            {isError && !health && (
              <span className="text-amber-600 dark:text-amber-400">
                Catálogo offline — exibindo preview de desenvolvimento
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12" aria-labelledby="game-selector-title">
        <h2 id="game-selector-title" className="mb-2 text-2xl font-semibold">
          Escolha seu jogo
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Navegue pelo catálogo completo de cada TCG suportado.
        </p>
        <GameSelector games={games} onSelect={handleGameSelect} />
      </section>

      <section className="container mx-auto px-4 py-12" aria-labelledby="trends-title">
        <h2 id="trends-title" className="mb-6 text-2xl font-semibold">
          Tendências do dia
        </h2>
        <TopMoversPlaceholder />
      </section>
    </>
  );
}
