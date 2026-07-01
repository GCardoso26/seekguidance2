"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { ProductCategoryIcon } from "@/components/games/ProductCategoryIcon";
import { Button } from "@/components/ui/button";
import {
  GAME_FEATURED_CATEGORY,
  getCategoriesForGame,
  marketplaceCategoryHref,
  singlesSearchHref,
  type ProductCategoryId,
} from "@/lib/tcg-product-categories";
import { gameCardsPath, gameLandingPath } from "@/lib/game-routes";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import { cn } from "@/lib/utils";

type SetRow = { code: string; name: string; id?: string };

async function fetchRecentSets(gameId: string): Promise<SetRow[]> {
  const res = await fetch(`/api/catalog/sets?game=${encodeURIComponent(gameId)}&limit=8`);
  if (!res.ok) return [];
  const data = (await res.json()) as { sets?: SetRow[] };
  return (data.sets ?? []).slice(0, 8);
}

type Props = {
  gameId: GameId;
  slug: string;
  onNavigate?: () => void;
};

export function GameMegaMenuPanel({ gameId, slug, onNavigate }: Props) {
  const token = GAME_TOKENS[gameId];
  const categories = getCategoriesForGame(gameId);
  const featuredCat = GAME_FEATURED_CATEGORY[gameId] ?? "booster_box";
  const featuredMeta = categories.find((c) => c.id === featuredCat) ?? categories[0];

  const { data: sets = [], isLoading: setsLoading } = useQuery({
    queryKey: ["catalog-sets-mega-menu", gameId],
    queryFn: () => fetchRecentSets(gameId),
    staleTime: 120_000,
  });

  function categoryHref(catId: ProductCategoryId): string {
    if (catId === "single") return singlesSearchHref(slug);
    return marketplaceCategoryHref(slug, catId);
  }

  return (
    <div className="grid divide-y divide-white/10 lg:grid-cols-[1fr_1fr_1.05fr] lg:divide-x lg:divide-y-0">
      <div className="p-5">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-luxury-gold">Últimas expansões</h2>
        <ul className="mt-3 space-y-1.5">
          {setsLoading && <li className="text-sm text-luxury-mist">Carregando sets…</li>}
          {!setsLoading && sets.length === 0 && (
            <li className="text-sm text-luxury-mist">Sets em sincronização</li>
          )}
          {sets.map((set) => (
            <li key={set.code ?? set.name}>
              <Link
                href={`${gameCardsPath(slug)}?set=${encodeURIComponent(set.code ?? set.name)}`}
                className="block truncate text-sm text-luxury-frost hover:text-luxury-gold"
                onClick={onNavigate}
              >
                {set.code && <span className="mr-2 font-mono text-xs text-luxury-mist">{set.code}</span>}
                {set.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={singlesSearchHref(slug)}
          className="mt-3 inline-block text-xs text-luxury-gold hover:underline"
          onClick={onNavigate}
        >
          Ver todas as expansões…
        </Link>
      </div>

      <div className="p-5">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-luxury-gold">Categorias</h2>
        <ul className="mt-3 grid grid-cols-1 gap-0.5 sm:grid-cols-2 lg:grid-cols-1">
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={categoryHref(cat.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-luxury-frost",
                  "transition hover:bg-white/5 hover:text-luxury-gold",
                )}
                onClick={onNavigate}
              >
                <ProductCategoryIcon categoryId={cat.id} size={22} />
                <span>{cat.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={`/marketplace?game_id=${gameId}`}
          className="mt-3 inline-block text-xs text-luxury-gold hover:underline"
          onClick={onNavigate}
        >
          Ver todas as categorias…
        </Link>
      </div>

      <div className="flex flex-col items-center justify-between p-5 text-center">
        <Link
          href={gameLandingPath(slug)}
          className="flex items-center gap-1.5 self-start text-sm text-luxury-gold hover:underline"
          onClick={onNavigate}
        >
          <Home className="h-4 w-4" />
          Homepage {token.name}
        </Link>
        {featuredMeta && (
          <>
            <Link
              href={categoryHref(featuredMeta.id)}
              className="mt-4 text-sm font-medium text-luxury-gold hover:underline"
              onClick={onNavigate}
            >
              {featuredMeta.label}
            </Link>
            <div className="my-3 flex h-36 w-full max-w-[220px] items-center justify-center rounded-xl bg-white/5 p-3">
              <Image
                src={featuredMeta.imageUrl}
                alt={featuredMeta.label}
                width={140}
                height={140}
                className="max-h-32 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-luxury-mist">Produtos selados de {token.name}</p>
            <Button
              asChild
              size="sm"
              className="mt-3 w-full max-w-[220px] bg-luxury-gold text-luxury-onyx hover:bg-luxury-gold/90"
            >
              <Link href={categoryHref(featuredMeta.id)} onClick={onNavigate}>
                Ver ofertas
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
