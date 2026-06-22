"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { Suspense, use } from "react";
import Image from "next/image";
import { FacetedSearch } from "@/components/search/FacetedSearch";
import { CatalogSearchSkeleton } from "@/components/search/CatalogSearchSkeleton";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import { getGameConfig } from "@/lib/games";

function GameBuscaContent({ slug }: { slug: string }) {
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

  return (
    <MobileLayout>
      <section
        className="border-b border-border/40 py-8"
        style={{ backgroundColor: `${token.primary}10` }}
      >
        <div className="container mx-auto px-4">
          <Link href="/loja" className="text-sm text-muted-foreground hover:text-foreground">
            ← Todos os jogos
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <Image src={token.logo} alt="" width={56} height={56} className="h-14 w-14 object-contain" />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: token.primary }}>
                {token.name}
              </h1>
              <p className="text-sm text-muted-foreground">Busca no catálogo de {token.name}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <FacetedSearch
          initialGame={gameId}
          searchBasePath={`/loja/${slug}/busca`}
          cardDetailPath="/loja/cartas"
        />
        <p className="mt-6 text-xs text-muted-foreground">
          Filtros: {config.filters.join(", ")}
        </p>
      </div>
    </MobileLayout>
  );
}

export default function GameBuscaPage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = use(params);
  return (
    <Suspense fallback={<CatalogSearchSkeleton />}>
      <GameBuscaContent slug={game} />
    </Suspense>
  );
}
