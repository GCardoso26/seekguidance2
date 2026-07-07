"use client";

import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";
import { FacetedSearch } from "@/components/search/FacetedSearch";
import { CatalogSearchSkeleton } from "@/components/search/CatalogSearchSkeleton";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  gameCardDetailPath,
  gameCardsPath,
  gameExpansionsPath,
  gameLandingPath,
} from "@/lib/game-routes";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import { getGameConfig } from "@/lib/games";

function GameCardsContent({ slug }: { slug: string }) {
  const gameId = gameIdFromSlug(slug);
  if (!gameId) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Jogo não encontrado</h1>
          <Link href="/loja" className="mt-4 inline-block text-primary hover:underline">
            Ver todos os jogos
          </Link>
        </div>
      </MobileLayout>
    );
  }

  const token = GAME_TOKENS[gameId as GameId];
  const config = getGameConfig(gameId as GameId);
  const cardsPath = gameCardsPath(slug);

  return (
    <MobileLayout>
      <section
        className="border-b border-border/40 py-8"
        style={{ backgroundColor: `${token.primary}10` }}
      >
        <div className="container mx-auto px-4">
          <Breadcrumbs
            className="mb-3"
            items={[
              { label: "Início", href: "/" },
              { label: "Loja", href: "/loja" },
              { label: token.name, href: gameLandingPath(slug) },
              { label: "Cartas" },
            ]}
          />
          <Link href={gameLandingPath(slug)} className="text-sm text-muted-foreground hover:text-foreground">
            ← {token.name}
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Image src={token.logo} alt="" width={56} height={56} className="h-14 w-14 object-contain" />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: token.primary }}>
                  Cartas — {token.name}
                </h1>
                <p className="text-sm text-muted-foreground">Busca com filtros avançados</p>
              </div>
            </div>
            <Link
              href={gameExpansionsPath(slug)}
              className="text-sm text-primary hover:underline"
            >
              Ver expansões →
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <FacetedSearch
          initialGame={gameId}
          searchBasePath={cardsPath}
          cardDetailPath={`/${slug}/cards`}
        />
        <p className="mt-6 text-xs text-muted-foreground">
          Filtros: {config.filters.join(", ")}
        </p>
      </div>
    </MobileLayout>
  );
}

export function GameCardsPageClient({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<CatalogSearchSkeleton />}>
      <GameCardsContent slug={slug} />
    </Suspense>
  );
}

// re-export for card detail breadcrumb helper
export { gameCardDetailPath };
