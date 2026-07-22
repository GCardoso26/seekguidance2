"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  DeckShowcaseCard,
  LargeMarketplaceCard,
  LargeSealedCard,
} from "@/components/experience/cards/LargeVisualCards";
import { useGamePortal } from "@/components/experience/GameProvider";
import {
  gameCardsPath,
  gameCollectionPath,
  gameExpansionsPath,
  gameLandingPath,
  gameMarketplacePath,
  gameSetPath,
  gameWishlistPath,
} from "@/lib/game-routes";
import { setCanonicalSlug, setMatchesSlug } from "@/lib/set-slug";
import {
  GAME_FEATURED_CATEGORY,
  getCategoriesForGame,
  marketplaceCategoryHref,
} from "@/lib/tcg-product-categories";
import { shouldBypassImageOptimizer } from "@/lib/format-currency";
import type { CatalogSetOption } from "@/types/search";

type CardRow = {
  id: string;
  name: string;
  imageUris?: { normal?: string; large?: string; small?: string };
  lowestPrice?: number;
  priceCurrency?: string;
  listingCount?: number;
};

type PublicDeck = { id: string; name?: string; title?: string; coverUrl?: string };

async function fetchSets(gameId: string): Promise<CatalogSetOption[]> {
  const res = await fetch(`/api/catalog/sets?game=${encodeURIComponent(gameId)}&limit=200`);
  if (!res.ok) return [];
  const data = (await res.json()) as { sets?: CatalogSetOption[] };
  return data.sets ?? [];
}

async function fetchSetCards(gameId: string, setCode: string): Promise<CardRow[]> {
  const params = new URLSearchParams({
    game: gameId,
    set: setCode,
    limit: "24",
    sortBy: "price_desc",
  });
  const res = await fetch(`/api/catalog/cards/search?${params}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { cards?: CardRow[]; items?: CardRow[] };
  return data.cards ?? data.items ?? [];
}

async function fetchPublicDecks(gameId: string): Promise<PublicDeck[]> {
  const res = await fetch(`/api/decks/public?game=${encodeURIComponent(gameId)}&limit=4`);
  if (!res.ok) return [];
  const data = (await res.json()) as { decks?: PublicDeck[]; items?: PublicDeck[] };
  return (data.decks ?? data.items ?? []).slice(0, 4);
}

function formatPrice(value?: number, currency?: string) {
  if (value == null) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(value);
}

type Props = { setSlug: string };

export function ExpansionLandingClient({ setSlug }: Props) {
  const { gameId, slug, theme } = useGamePortal();
  const categories = getCategoriesForGame(gameId);
  const featuredCat = GAME_FEATURED_CATEGORY[gameId] ?? "booster_box";
  const sealed = categories.find((c) => c.id === featuredCat) ?? categories[0];

  const { data: sets = [], isLoading: setsLoading } = useQuery({
    queryKey: ["catalog-sets-all", gameId],
    queryFn: () => fetchSets(gameId),
    staleTime: 120_000,
  });

  const set = sets.find((s) => setMatchesSlug(s, setSlug));
  const setCode = set?.code ?? setSlug.toUpperCase();

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["expansion-cards", gameId, setCode],
    queryFn: () => fetchSetCards(gameId, setCode),
    enabled: Boolean(set || setSlug),
    staleTime: 120_000,
  });

  const { data: decks = [] } = useQuery({
    queryKey: ["portal-decks-public", gameId, "expansion"],
    queryFn: () => fetchPublicDecks(gameId),
    staleTime: 120_000,
  });

  const priced = cards.filter((c) => c.lowestPrice != null);
  const avg =
    priced.length > 0
      ? priced.reduce((acc, c) => acc + (c.lowestPrice ?? 0), 0) / priced.length
      : null;
  const mostExpensive = [...cards]
    .filter((c) => c.lowestPrice != null)
    .sort((a, b) => (b.lowestPrice ?? 0) - (a.lowestPrice ?? 0))
    .slice(0, 6);
  const mostPlayed = [...cards]
    .sort((a, b) => (b.listingCount ?? 0) - (a.listingCount ?? 0))
    .slice(0, 6);

  const title = set?.name ?? setSlug.replace(/-/g, " ");
  const canonicalSetSlug = set ? setCanonicalSlug(set) : setSlug;

  if (!setsLoading && sets.length > 0 && !set) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="portal-section-title text-2xl">Expansão não encontrada</h1>
        <p className="mt-2 text-sm text-[color:var(--game-text-muted)]">
          Não há set correspondente a <code>{setSlug}</code> em {theme.name}.
        </p>
        <Link href={gameExpansionsPath(slug)} className="portal-link mt-6 inline-flex hover:underline">
          Ver todas as expansões
        </Link>
      </div>
    );
  }

  return (
    <div className="marketplace-skin">
      {/* Hero */}
      <section className="game-hero border-b border-[color:var(--game-border)]">
        <div className="game-hero__overlay" data-overlay={theme.hero.overlay} />
        <div className="game-hero__fx" data-anim={theme.hero.animation} />
        <div className="game-hero__content container relative mx-auto max-w-6xl px-4 py-12 md:py-16">
          <Breadcrumbs
            items={[
              { label: "Universos", href: "/" },
              { label: theme.name, href: gameLandingPath(slug) },
              { label: "Expansões", href: gameExpansionsPath(slug) },
              { label: title },
            ]}
          />
          <div className="mt-8 flex flex-wrap items-end gap-6">
            <Image
              src={theme.logo}
              alt=""
              width={96}
              height={96}
              className="h-20 w-20 object-contain md:h-24 md:w-24"
              unoptimized={shouldBypassImageOptimizer(theme.logo)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--game-accent)]">
                {set?.code ? `Set · ${set.code}` : "Expansão"}
              </p>
              <h1 className="game-hero__title mt-2 text-3xl text-[color:var(--game-text)] md:text-5xl">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[color:var(--game-text-muted)] md:text-base">
                Banner oficial, checklist, preços e marketplace de {title} em {theme.name}.{" "}
                {set?.cardCount != null
                  ? `${set.cardCount} cartas no catálogo.`
                  : cardsLoading
                    ? "Carregando cartas…"
                    : `${cards.length} cartas carregadas.`}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`${gameCardsPath(slug)}?set=${encodeURIComponent(setCode)}`}
                  className="game-cta inline-flex min-h-11 items-center px-5 text-sm font-semibold"
                >
                  Ver todas as cartas
                </Link>
                <Link
                  href={gameMarketplacePath(slug, gameId)}
                  className="inline-flex min-h-11 items-center rounded-[var(--game-button-radius)] border border-[color:var(--game-border)] px-5 text-sm"
                >
                  Marketplace
                </Link>
                <Link
                  href={gameCollectionPath(slug)}
                  className="inline-flex min-h-11 items-center px-4 text-sm text-[color:var(--game-accent)] hover:underline"
                >
                  Minha coleção
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto max-w-6xl px-4 py-10">
        <ul className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Preço médio",
              value: formatPrice(avg ?? undefined) ?? "—",
            },
            {
              label: "Cartas listadas",
              value: String(cards.length || set?.cardCount || "—"),
            },
            {
              label: "Canonical",
              value: `/${slug}/sets/${canonicalSetSlug}`,
            },
          ].map((stat) => (
            <li key={stat.label} className="large-visual-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--game-accent)]">
                {stat.label}
              </p>
              <p className="mt-1 truncate text-lg font-semibold text-[color:var(--game-text)]">
                {stat.value}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Cartas mais caras */}
      <section className="portal-section container mx-auto max-w-6xl px-4 py-10">
        <h2 className="portal-section-title mb-5 text-xl md:text-2xl">Cartas mais caras</h2>
        {cardsLoading && (
          <p className="text-sm text-[color:var(--game-text-muted)]">Carregando…</p>
        )}
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {mostExpensive.map((card) => (
            <li key={card.id}>
              <LargeMarketplaceCard
                href={`${gameCardsPath(slug)}/${encodeURIComponent(card.id)}`}
                title={card.name}
                imageUrl={
                  card.imageUris?.large ?? card.imageUris?.normal ?? card.imageUris?.small
                }
                priceLabel={formatPrice(card.lowestPrice, card.priceCurrency) ?? undefined}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Cartas mais jogadas / liquidez */}
      <section className="portal-section container mx-auto max-w-6xl px-4 py-10">
        <h2 className="portal-section-title mb-5 text-xl md:text-2xl">Cartas mais jogadas</h2>
        <p className="mb-4 text-sm text-[color:var(--game-text-muted)]">
          Proxy por liquidez de marketplace (listings) — Analytics aprofundado reutiliza o BC
          existente.
        </p>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {(mostPlayed.length ? mostPlayed : cards.slice(0, 6)).map((card) => (
            <li key={`play-${card.id}`}>
              <LargeMarketplaceCard
                href={`${gameCardsPath(slug)}/${encodeURIComponent(card.id)}`}
                title={card.name}
                imageUrl={
                  card.imageUris?.large ?? card.imageUris?.normal ?? card.imageUris?.small
                }
                meta="Meta / liquidez"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Checklist sample */}
      <section className="portal-section container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="portal-section-title text-xl md:text-2xl">Cards da expansão</h2>
          <Link
            href={`${gameCardsPath(slug)}?set=${encodeURIComponent(setCode)}`}
            className="portal-link text-xs hover:underline"
          >
            Checklist completa
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cards.slice(0, 12).map((card) => (
            <li key={`grid-${card.id}`}>
              <LargeMarketplaceCard
                href={`${gameCardsPath(slug)}/${encodeURIComponent(card.id)}`}
                title={card.name}
                imageUrl={
                  card.imageUris?.large ?? card.imageUris?.normal ?? card.imageUris?.small
                }
                priceLabel={formatPrice(card.lowestPrice, card.priceCurrency) ?? undefined}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Selados + marketplace + coleção + decks + wishlist */}
      <section className="portal-section container mx-auto max-w-6xl px-4 py-10">
        <h2 className="portal-section-title mb-5 text-xl md:text-2xl">Produtos selados</h2>
        {sealed ? (
          <div className="max-w-xs">
            <LargeSealedCard
              href={marketplaceCategoryHref(slug, sealed.id)}
              title={sealed.label}
              imageUrl={sealed.imageUrl}
              subtitle={`${title} · ${theme.name}`}
            />
          </div>
        ) : null}
      </section>

      <section className="portal-section container mx-auto max-w-6xl px-4 py-10">
        <h2 className="portal-section-title mb-5 text-xl md:text-2xl">Decks usando esta expansão</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {decks.map((deck) => (
            <li key={deck.id}>
              <DeckShowcaseCard
                href={`/decks/${deck.id}`}
                title={deck.name || deck.title || "Deck"}
                imageUrl={deck.coverUrl ?? theme.logo}
                subtitle={theme.name}
              />
            </li>
          ))}
          {decks.length === 0 && (
            <li className="text-sm text-[color:var(--game-text-muted)]">
              Sem decks públicos filtrados por set ainda — explore{" "}
              <Link
                href={`/decks?game=${encodeURIComponent(gameId)}`}
                className="portal-link hover:underline"
              >
                decks de {theme.name}
              </Link>
              .
            </li>
          )}
        </ul>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-12 pb-16">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: gameMarketplacePath(slug, gameId), title: "Marketplace", sub: "Ofertas deste universo" },
            { href: gameCollectionPath(slug), title: "Minha coleção", sub: "Progresso e faltantes" },
            { href: gameWishlistPath(), title: "Wishlist", sub: "Alertas de preço" },
            { href: "/perfil", title: "Favoritos", sub: "No perfil do jogador" },
          ].map((item) => (
            <li key={item.title}>
              <Link href={item.href} className="large-visual-card block p-5">
                <h3 className="font-semibold text-[color:var(--game-text)]">{item.title}</h3>
                <p className="mt-1 text-sm text-[color:var(--game-text-muted)]">{item.sub}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-xs text-[color:var(--game-text-muted)]">
          Landing canônica:{" "}
          <Link href={gameSetPath(slug, canonicalSetSlug)} className="portal-link hover:underline">
            {gameSetPath(slug, canonicalSetSlug)}
          </Link>
        </p>
      </section>
    </div>
  );
}
