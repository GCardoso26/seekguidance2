"use client";

import { useRouter } from "next/navigation";
import { GlobalSearchBar } from "@/components/home/GlobalSearchBar";
import { GameSelector } from "@/components/home/GameSelector";
import { TopMoversPlaceholder } from "@/components/trends/TopMoversPlaceholder";
import { countAvailableGames, mapHealthToGames } from "@/lib/catalog-games";
import { formatCountStable } from "@/lib/format-count";
import { gameSlugFromId } from "@/lib/tcg-tokens";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import type { GameId } from "@/types/card";

export function CatalogMarketplaceSection({
  showHero = true,
  showGames = true,
}: {
  showHero?: boolean;
  showGames?: boolean;
}) {
  const router = useRouter();
  const { data: health, isLoading, isError } = useCatalogHealth();

  const games = mapHealthToGames(health);
  const availableCount = countAvailableGames(health);

  const handleGameSelect = (gameId: string) => {
    router.push(`/loja/${gameSlugFromId(gameId as GameId)}`);
  };

  return (
    <>
      {showHero && (
      <section
        className="relative overflow-hidden border-b border-border bg-background pb-12 pt-10 md:pt-12"
        aria-labelledby="catalog-hero-title"
      >
        <div className="page-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-small font-medium text-primary mb-2">Catálogo de cartas</p>
            <h2 id="catalog-hero-title" className="text-display font-semibold tracking-tight">
              Busque a carta e compare ofertas de lojas
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-body-lg text-muted-foreground">
              Preços e estoque vêm das lojas listadas. Você paga no checkout com PIX ou cartão, quando
              disponível.
            </p>
          </div>

          <GlobalSearchBar className="mt-8" />

          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-small text-muted-foreground"
            aria-live="polite"
          >
            {isLoading && <span>Carregando catálogo…</span>}
            {!isLoading && health && (
              <>
                <span aria-label={`${health.total_cards} cartas no catálogo`}>
                  {formatCountStable(health.total_cards)} cartas
                </span>
                <span aria-label={`${availableCount} jogos disponíveis`}>
                  {availableCount} jogos
                </span>
                {health.ready_for_marketplace && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-small text-foreground">
                    Catálogo disponível
                  </span>
                )}
              </>
            )}
            {isError && !health && (
              <span className="text-warning">
                Catálogo offline — exibindo preview de desenvolvimento
              </span>
            )}
          </div>
        </div>
      </section>
      )}

      {showGames && (
      <section className="page-container py-12" aria-labelledby="game-selector-title">
        <h2 id="game-selector-title" className="mb-2 text-h2 font-semibold">
          Escolha seu jogo
        </h2>
        <p className="mb-6 text-small text-muted-foreground">
          Navegue pelo catálogo completo de cada TCG suportado.
        </p>
        <GameSelector games={games} onSelect={handleGameSelect} />
      </section>
      )}

      <section className="page-container py-12" aria-labelledby="trends-title">
        <h2 id="trends-title" className="mb-6 text-h2 font-semibold">
          Tendências do dia
        </h2>
        <TopMoversPlaceholder />
      </section>
    </>
  );
}
