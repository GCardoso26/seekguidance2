"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpansionCardHero } from "@/components/experience/cards/LargeVisualCards";
import { gameLandingPath, gameSetPath } from "@/lib/game-routes";
import { setCanonicalSlug } from "@/lib/set-slug";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import type { CatalogSetOption } from "@/types/search";

async function fetchSets(gameId: string): Promise<CatalogSetOption[]> {
  const res = await fetch(`/api/catalog/sets?game=${encodeURIComponent(gameId)}&limit=200`);
  if (!res.ok) return [];
  const data = (await res.json()) as { sets?: CatalogSetOption[] };
  return data.sets ?? [];
}

export function GameExpansionsPageClient({ slug }: { slug: string }) {
  const gameId = gameIdFromSlug(slug);
  const token = gameId ? GAME_TOKENS[gameId as GameId] : null;

  const { data: sets = [], isLoading } = useQuery({
    queryKey: ["catalog-sets-all", gameId],
    queryFn: () => fetchSets(gameId!),
    enabled: Boolean(gameId),
    staleTime: 120_000,
  });

  if (!gameId || !token) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Jogo não encontrado</h1>
      </div>
    );
  }

  return (
    <>
      <section className="game-hero border-b border-[color:var(--game-border)]">
        <div className="game-hero__overlay" data-overlay="gradient-dark" />
        <div className="game-hero__content container mx-auto max-w-6xl px-4 py-10">
          <Link
            href={gameLandingPath(slug)}
            className="text-sm text-[color:var(--game-text-muted)] hover:text-[color:var(--game-text)]"
          >
            ← {token.name}
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <Image src={token.logo} alt="" width={64} height={64} className="h-16 w-16 object-contain" />
            <div>
              <h1 className="game-hero__title text-3xl text-[color:var(--game-text)]">
                Expansões — {token.name}
              </h1>
              <p className="text-sm text-[color:var(--game-text-muted)]">
                {isLoading ? "Carregando…" : `${sets.length} sets · landings dedicadas`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-10">
        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[400/500] rounded-[var(--game-card-radius)]" />
            ))}
          </div>
        )}
        {!isLoading && sets.length === 0 && (
          <p className="text-[color:var(--game-text-muted)]">
            Sets em sincronização para {token.name}.
          </p>
        )}
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sets.map((set) => {
            const setSlug = setCanonicalSlug(set);
            return (
              <li key={set.code ?? set.name}>
                <ExpansionCardHero
                  href={gameSetPath(slug, setSlug)}
                  title={set.name}
                  code={set.code}
                  subtitle={
                    set.cardCount != null ? `${set.cardCount} cartas` : "Abrir expansão"
                  }
                  imageUrl={token.logo}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
