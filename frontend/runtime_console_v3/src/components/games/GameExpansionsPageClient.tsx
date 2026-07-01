"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { gameCardsPath, gameLandingPath } from "@/lib/game-routes";
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
      <MobileLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Jogo não encontrado</h1>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <section
        className="border-b border-border/40 py-8"
        style={{ backgroundColor: `${token.primary}10` }}
      >
        <div className="container mx-auto px-4">
          <Link href={gameLandingPath(slug)} className="text-sm text-muted-foreground hover:text-foreground">
            ← {token.name}
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <Image src={token.logo} alt="" width={56} height={56} className="h-14 w-14 object-contain" />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: token.primary }}>
                Expansões — {token.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Carregando…" : `${sets.length} sets no catálogo`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        )}
        {!isLoading && sets.length === 0 && (
          <p className="text-muted-foreground">Sets em sincronização para {token.name}.</p>
        )}
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <li key={set.code ?? set.name}>
              <Link
                href={`${gameCardsPath(slug)}?set=${encodeURIComponent(set.code ?? set.name)}`}
                className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 transition hover:border-primary/40 hover:bg-muted/30"
              >
                {set.code && (
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{set.code}</span>
                )}
                <span className="truncate text-sm font-medium">{set.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </MobileLayout>
  );
}
