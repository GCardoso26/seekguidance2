"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PortalHero } from "@/components/experience/PortalHero";
import { useGamePortal } from "@/components/experience/GameProvider";
import { ProductCategoryIcon } from "@/components/games/ProductCategoryIcon";
import {
  GAME_FEATURED_CATEGORY,
  getCategoriesForGame,
  marketplaceCategoryHref,
  singlesSearchHref,
  type ProductCategoryId,
} from "@/lib/tcg-product-categories";
import { gameCardsPath, gameExpansionsPath } from "@/lib/game-routes";
import { cn } from "@/lib/utils";

type SetRow = { code: string; name: string; id?: string };
type PublicDeck = { id: string; name?: string; title?: string };

async function fetchRecentSets(gameId: string): Promise<SetRow[]> {
  const res = await fetch(`/api/catalog/sets?game=${encodeURIComponent(gameId)}&limit=10`);
  if (!res.ok) return [];
  const data = (await res.json()) as { sets?: SetRow[] };
  return (data.sets ?? []).slice(0, 8);
}

async function fetchPublicDecks(gameId: string): Promise<PublicDeck[]> {
  const res = await fetch(
    `/api/decks/public?game=${encodeURIComponent(gameId)}&limit=6`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { decks?: PublicDeck[]; items?: PublicDeck[] };
  return (data.decks ?? data.items ?? []).slice(0, 6);
}

type Props = {
  cardCount?: number;
  healthLoading?: boolean;
};

/**
 * Same section tree for every TCG — content from existing APIs only.
 */
export function PortalSections({ cardCount = 0, healthLoading }: Props) {
  const { gameId, slug, theme } = useGamePortal();
  const categories = getCategoriesForGame(gameId);
  const featuredCat = GAME_FEATURED_CATEGORY[gameId] ?? "booster_box";
  const featuredMeta = categories.find((c) => c.id === featuredCat) ?? categories[0];

  const { data: sets = [], isLoading: setsLoading } = useQuery({
    queryKey: ["portal-sets", gameId],
    queryFn: () => fetchRecentSets(gameId),
    staleTime: 120_000,
  });

  const { data: decks = [], isLoading: decksLoading } = useQuery({
    queryKey: ["portal-decks-public", gameId],
    queryFn: () => fetchPublicDecks(gameId),
    staleTime: 120_000,
  });

  function categoryHref(catId: ProductCategoryId): string {
    if (catId === "single") return singlesSearchHref(slug);
    return marketplaceCategoryHref(slug, catId);
  }

  return (
    <div className="space-y-0">
      <PortalHero cardCount={cardCount} healthLoading={healthLoading} />

      <section className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Expansões */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">Últimas expansões</h2>
              <Link href={gameExpansionsPath(slug)} className="portal-link text-xs hover:underline">
                Ver todas
              </Link>
            </div>
            <ul className="mt-4 space-y-2">
              {setsLoading && (
                <li className="text-sm text-muted-foreground">Carregando…</li>
              )}
              {!setsLoading && sets.length === 0 && (
                <li className="text-sm text-muted-foreground">Sets em sincronização</li>
              )}
              {sets.map((set) => (
                <li key={set.code ?? set.name}>
                  <Link
                    href={`${singlesSearchHref(slug)}?set=${encodeURIComponent(set.code ?? set.name)}`}
                    className="block truncate text-sm text-foreground hover:text-[color:var(--game-primary)]"
                  >
                    {set.code && (
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        {set.code}
                      </span>
                    )}
                    {set.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Decks */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">Decks públicos</h2>
              <Link
                href={`/decks?game=${encodeURIComponent(gameId)}`}
                className="portal-link text-xs hover:underline"
              >
                Explorar
              </Link>
            </div>
            <ul className="mt-4 space-y-2">
              {decksLoading && (
                <li className="text-sm text-muted-foreground">Carregando…</li>
              )}
              {!decksLoading && decks.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  Ainda sem decks públicos —{" "}
                  <Link href="/decks/novo" className="portal-link hover:underline">
                    crie o seu
                  </Link>
                </li>
              )}
              {decks.map((deck) => (
                <li key={deck.id}>
                  <Link
                    href={`/decks/${deck.id}`}
                    className="block truncate text-sm text-foreground hover:text-[color:var(--game-primary)]"
                  >
                    {deck.name || deck.title || "Deck"}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketplace / selados */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">Marketplace</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Singles e produtos selados de lojas neste universo.
            </p>
            {featuredMeta && (
              <Link
                href={categoryHref(featuredMeta.id)}
                className="mt-4 flex flex-col items-center rounded-xl border border-border bg-card/60 p-5 transition hover:border-[color:var(--game-primary)]"
              >
                <Image
                  src={featuredMeta.imageUrl}
                  alt=""
                  width={120}
                  height={120}
                  className="max-h-28 w-auto object-contain"
                />
                <span className="mt-3 text-sm font-medium text-foreground">
                  {featuredMeta.label}
                </span>
              </Link>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={gameCardsPath(slug)}
                className="portal-cta inline-flex min-h-10 items-center rounded-md px-4 text-sm font-semibold"
              >
                Singles
              </Link>
              <Link
                href={`/loja/busca?game=${encodeURIComponent(gameId)}`}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-medium"
              >
                Ofertas
              </Link>
            </div>
          </div>
        </div>

        {/* Categories strip */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-foreground">Categorias</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={categoryHref(cat.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2.5 text-sm",
                    "transition hover:border-[color:var(--game-primary)]",
                  )}
                >
                  <ProductCategoryIcon categoryId={cat.id} size={22} />
                  <span>{cat.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Universo {theme.name} · mesma estrutura de portal para todos os TCGs
        </p>
      </section>
    </div>
  );
}
