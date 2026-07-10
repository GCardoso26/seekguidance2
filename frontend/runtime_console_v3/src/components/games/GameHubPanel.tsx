"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import { ProductCategoryIcon } from "@/components/games/ProductCategoryIcon";
import { Button } from "@/components/ui/button";
import {
  GAME_FEATURED_CATEGORY,
  getCategoriesForGame,
  marketplaceCategoryHref,
  singlesSearchHref,
  type ProductCategoryId,
} from "@/lib/tcg-product-categories";
import { gameLandingPath } from "@/lib/game-routes";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import { cn } from "@/lib/utils";

type SetRow = { code: string; name: string; id?: string };

async function fetchRecentSets(gameId: string): Promise<SetRow[]> {
  const res = await fetch(`/api/catalog/sets?game=${encodeURIComponent(gameId)}&limit=10`);
  if (!res.ok) return [];
  const data = (await res.json()) as { sets?: SetRow[] };
  return (data.sets ?? []).slice(0, 10);
}

type Props = {
  gameId: GameId;
  slug: string;
  cardCount?: number;
  healthLoading?: boolean;
};

export function GameHubPanel({ gameId, slug, cardCount = 0, healthLoading }: Props) {
  const token = GAME_TOKENS[gameId];
  const categories = getCategoriesForGame(gameId);
  const featuredCat = GAME_FEATURED_CATEGORY[gameId] ?? "booster_box";
  const featuredMeta = categories.find((c) => c.id === featuredCat) ?? categories[0];

  const { data: sets = [], isLoading: setsLoading } = useQuery({
    queryKey: ["catalog-sets-recent", gameId],
    queryFn: () => fetchRecentSets(gameId),
    staleTime: 120_000,
  });

  function categoryHref(catId: ProductCategoryId): string {
    if (catId === "single") return singlesSearchHref(slug);
    return marketplaceCategoryHref(slug, catId);
  }

  return (
    <div className="space-y-0">
      {/* Hero compacto */}
      <section
        className="border-b border-border py-8"
        style={{ background: `linear-gradient(135deg, ${token.primary}18 0%, transparent 60%)` }}
      >
        <div className="container mx-auto max-w-6xl px-4">
          <Link href="/loja" className="text-sm text-muted-foreground hover:text-primary">
            ← Biblioteca de TCGs
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Image src={token.logo} alt="" width={64} height={64} className="h-16 w-16 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">{token.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {healthLoading
                  ? "Carregando catálogo…"
                  : cardCount > 0
                    ? `${cardCount.toLocaleString("pt-BR")} cartas indexadas`
                    : "Catálogo em sincronização"}
              </p>
            </div>
          </div>
          <Link
            href={gameLandingPath(slug)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Compass className="h-4 w-4" />
            Visitar homepage do jogo
          </Link>
        </div>
      </section>

      {/* Painel estilo CardTrader — 3 colunas */}
      <section className="container mx-auto max-w-6xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-xl">
          <div className="grid divide-y divide-border lg:grid-cols-[1fr_1fr_1.1fr] lg:divide-x lg:divide-y-0">
            {/* Expansões recentes */}
            <div className="p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Últimas expansões</h2>
              <ul className="mt-4 space-y-2">
                {setsLoading && (
                  <li className="text-sm text-muted-foreground">Carregando sets…</li>
                )}
                {!setsLoading && sets.length === 0 && (
                  <li className="text-sm text-muted-foreground">Sets em sincronização</li>
                )}
                {sets.map((set) => (
                  <li key={set.code ?? set.name}>
                    <Link
                      href={`${singlesSearchHref(slug)}?set=${encodeURIComponent(set.code ?? set.name)}`}
                      className="block truncate text-sm text-foreground hover:text-primary"
                    >
                      {set.code && (
                        <span className="mr-2 font-mono text-xs text-muted-foreground">{set.code}</span>
                      )}
                      {set.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={singlesSearchHref(slug)}
                className="mt-4 inline-block text-xs text-primary hover:underline"
              >
                Ver todas as expansões…
              </Link>
            </div>

            {/* Categorias */}
            <div className="p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Categorias</h2>
              <ul className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-1">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={categoryHref(cat.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground",
                        "transition hover:bg-muted/80 hover:text-primary",
                      )}
                      data-testid={`category-${cat.id}`}
                    >
                      <ProductCategoryIcon categoryId={cat.id} size={24} />
                      <span>{cat.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/marketplace?game_id=${gameId}`}
                className="mt-4 inline-block text-xs text-primary hover:underline"
              >
                Ver todas as categorias…
              </Link>
            </div>

            {/* Destaque */}
            <div className="flex flex-col items-center justify-between border-t border-border p-6 text-center lg:border-t-0">
              {featuredMeta && (
                <>
                  <Link
                    href={categoryHref(featuredMeta.id)}
                    className="text-base font-medium text-primary hover:underline"
                  >
                    {featuredMeta.label}
                  </Link>
                  <div className="my-4 flex h-48 w-full max-w-xs items-center justify-center rounded-xl bg-muted/50 p-4">
                    <Image
                      src={featuredMeta.imageUrl}
                      alt={featuredMeta.label}
                      width={160}
                      height={160}
                      className="max-h-40 w-auto object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Produtos selados de {token.name}</p>
                  <Button asChild className="mt-4 w-full max-w-xs bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href={categoryHref(featuredMeta.id)}>Ver ofertas</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Atalhos rápidos */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="sm" variant="outline" className="border-white/15">
            <Link href={singlesSearchHref(slug)}>Buscar singles</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-white/15">
            <Link href="/decks/novo">Montar deck</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-white/15">
            <Link href="/judge">Consultar regras</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
