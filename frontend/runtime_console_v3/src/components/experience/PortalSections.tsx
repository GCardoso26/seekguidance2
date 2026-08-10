"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { GameHero } from "@/components/experience/PortalHero";
import { PortalLatestSetsCarousel } from "@/components/experience/PortalLatestSetsCarousel";
import { PortalSealedProductsSection } from "@/components/experience/PortalSealedProductsSection";
import { PortalLiveBlocks } from "@/components/live-data/PortalLiveBlocks";
import { useGamePortal } from "@/components/experience/GameProvider";
import {
  DeckShowcaseCard,
  EventCard,
  ExpansionCardHero,
  LargeMarketplaceCard,
  NewsCard,
} from "@/components/experience/cards/LargeVisualCards";
import { ProductCategoryIcon } from "@/components/games/ProductCategoryIcon";
import {
  getCategoriesForGame,
  marketplaceCategoryHref,
  singlesSearchHref,
  type ProductCategoryId,
} from "@/lib/tcg-product-categories";
import {
  gameCardsPath,
  gameCollectionPath,
  gameExpansionsPath,
  gameMarketplacePath,
  gameSetPath,
  gameWishlistPath,
} from "@/lib/game-routes";
import { setCanonicalSlug } from "@/lib/set-slug";
import { resolveSetVisualUrl } from "@/lib/set-visual-url";
import { portalHeroBannerPaths, setLogoPublicPath } from "@/lib/portal-set-logos";
import { cn } from "@/lib/utils";

type SetRow = {
  code: string;
  name: string;
  id?: string;
  cardCount?: number;
  icon_url?: string | null;
  cover_url?: string | null;
};
type PublicDeck = { id: string; name?: string; title?: string; coverUrl?: string };
type PopularCard = {
  id: string;
  name: string;
  imageUris?: { normal?: string; large?: string; small?: string };
  lowestPrice?: number;
  priceCurrency?: string;
};

async function fetchRecentSets(gameId: string): Promise<SetRow[]> {
  const res = await fetch(`/api/catalog/sets?game=${encodeURIComponent(gameId)}&limit=12`);
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

async function fetchPopularCards(gameId: string): Promise<PopularCard[]> {
  const params = new URLSearchParams({
    game: gameId,
    limit: "8",
    sortBy: "relevance",
  });
  const res = await fetch(`/api/catalog/cards/search?${params}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { cards?: PopularCard[]; items?: PopularCard[] };
  return (data.cards ?? data.items ?? []).slice(0, 8);
}

type Props = {
  cardCount?: number;
  healthLoading?: boolean;
};

function SectionHeader({
  title,
  href,
  linkLabel = "Ver todos",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-3">
      <h2 className="portal-section-title text-xl md:text-2xl">{title}</h2>
      {href ? (
        <Link href={href} className="portal-link text-xs font-medium hover:underline">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Game Landing — same section tree for every TCG; Theme Engine skins the experience.
 * Data only from Catalog / Decks / Marketplace public BFF routes.
 */
export function PortalSections({ cardCount = 0, healthLoading }: Props) {
  const { gameId, slug, theme } = useGamePortal();
  const categories = getCategoriesForGame(gameId);
  const marketplaceHref = gameMarketplacePath(slug, gameId);

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

  const { data: popular = [], isLoading: popularLoading } = useQuery({
    queryKey: ["portal-popular-cards", gameId],
    queryFn: () => fetchPopularCards(gameId),
    staleTime: 120_000,
  });

  const latest = sets[0];
  const latestHref = latest
    ? gameSetPath(slug, setCanonicalSlug(latest))
    : gameExpansionsPath(slug);
  const heroBanners = portalHeroBannerPaths(gameId);
  const heroBackground =
    heroBanners.length === 0 && latest
      ? resolveSetVisualUrl({
          coverUrl: latest.cover_url,
          setLogoUrl: setLogoPublicPath(gameId, latest.code),
          iconUrl: null,
          fallback: "",
        }) || null
      : null;

  function categoryHref(catId: ProductCategoryId): string {
    if (catId === "single") return singlesSearchHref(slug);
    return marketplaceCategoryHref(slug, catId);
  }

  return (
    <div className="marketplace-skin">
      <GameHero
        cardCount={cardCount}
        healthLoading={healthLoading}
        latestSetHref={latestHref}
        latestSetLabel={latest ? latest.name : undefined}
        backgroundImage={heroBackground}
        backgroundImages={heroBanners.length > 0 ? heroBanners : null}
      />

      <PortalLatestSetsCarousel />

      {/* Últimas expansões */}
      <section className="portal-section container mx-auto max-w-6xl px-4 py-12">
        <SectionHeader title="Últimas edições" href={gameExpansionsPath(slug)} />
        {setsLoading && (
          <p className="text-sm text-[color:var(--game-text-muted)]">Carregando coleções…</p>
        )}
        {!setsLoading && sets.length === 0 && (
          <p className="text-sm text-[color:var(--game-text-muted)]">Sincronizando coleções...</p>
        )}
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sets.slice(0, 4).map((set) => (
            <li key={set.code ?? set.name}>
              <ExpansionCardHero
                href={gameSetPath(slug, setCanonicalSlug(set))}
                title={set.name}
                code={set.code}
                subtitle={
                  set.cardCount
                    ? `${set.cardCount} cartas`
                    : "Abrir landing da expansão"
                }
                imageUrl={resolveSetVisualUrl({
                  coverUrl: set.cover_url,
                  setLogoUrl: setLogoPublicPath(gameId, set.code),
                  iconUrl: null,
                  fallback: theme.logo,
                })}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Decks em destaque */}
      <section className="portal-section container mx-auto max-w-6xl px-4 py-12">
        <SectionHeader
          title="Decks em destaque"
          href={`/decks?game=${encodeURIComponent(gameId)}`}
        />
        {decksLoading && (
          <p className="text-sm text-[color:var(--game-text-muted)]">Carregando decks…</p>
        )}
        {!decksLoading && decks.length === 0 && (
          <p className="text-sm text-[color:var(--game-text-muted)]">
            Ainda sem decks públicos —{" "}
            <Link href="/decks/novo" className="portal-link hover:underline">
              crie o seu
            </Link>
          </p>
        )}
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        </ul>
      </section>

      {/* Cartas populares */}
      <section className="portal-section container mx-auto max-w-6xl px-4 py-12">
        <SectionHeader title="Cartas em alta" href={gameCardsPath(slug)} />
        {popularLoading && (
          <p className="text-sm text-[color:var(--game-text-muted)]">Carregando cartas…</p>
        )}
        <ul className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {popular.map((card) => {
            const img =
              card.imageUris?.large ?? card.imageUris?.normal ?? card.imageUris?.small;
            const price =
              card.lowestPrice != null
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: card.priceCurrency || "BRL",
                  }).format(card.lowestPrice)
                : undefined;
            return (
              <li key={card.id}>
                <LargeMarketplaceCard
                  href={`${gameCardsPath(slug)}/${encodeURIComponent(card.id)}`}
                  title={card.name}
                  imageUrl={img}
                  priceLabel={price}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <PortalSealedProductsSection marketplaceHref={marketplaceHref} />

      {/* Marketplace CTA */}
      <section className="portal-section container mx-auto max-w-6xl px-4 py-12">
        <SectionHeader title="Marketplace" href={marketplaceHref} />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="large-visual-card p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--game-accent)]">
              Loja {theme.name}
            </p>
            <h3 className="portal-section-title mt-2 text-2xl md:text-3xl">
              Todos os jogos em um único mercado.
            </h3>
            <p className="mt-3 max-w-lg text-sm text-[color:var(--game-text-muted)]">
              Ofertas de cartas, produtos selados e acessórios.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={gameCardsPath(slug)} className="game-cta inline-flex min-h-11 items-center px-5 text-sm font-semibold">
                Singles
              </Link>
              <Link
                href={marketplaceHref}
                className="inline-flex min-h-11 items-center rounded-[var(--game-button-radius)] border border-[color:var(--game-border)] px-5 text-sm font-medium"
              >
                Todas as ofertas
              </Link>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-2 content-start">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <Link
                  href={categoryHref(cat.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--game-card-radius)] border border-[color:var(--game-border)] bg-[color:var(--game-bg-elevated)]/60 px-3 py-2.5 text-sm",
                    "transition hover:border-[color:var(--game-accent)]",
                  )}
                >
                  <ProductCategoryIcon categoryId={cat.id} size={22} />
                  <span className="truncate">{cat.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Eventos + Ranking (estrutura — conteúdo pós-Beta) */}
      <section className="portal-section container mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader title="Eventos" href="/search/torneios" />
            <ul className="grid gap-4 sm:grid-cols-2">
              <li>
                <EventCard
                  href="/search/torneios"
                  title={`Torneios ${theme.name}`}
                  subtitle="Calendário e inscrição — em desenvolvimento"
                  when="Em breve"
                  imageUrl={theme.logo}
                />
              </li>
              <li>
                <NewsCard
                  href="/comunidade"
                  title="Comunidade"
                  subtitle="Notícias e novidades do meta."
                  imageUrl={theme.logo}
                />
              </li>
            </ul>
          </div>
          <div>
            <SectionHeader title="Ranking" href="/comunidade/leaderboard" />
            <div className="large-visual-card p-6">
              <p className="text-sm text-[color:var(--game-text-muted)]">
                Rankings por jogo chegam no épico Social / Rankings — a âncora de navegação já
                existe neste portal.
              </p>
              <Link
                href="/comunidade/leaderboard"
                className="portal-link mt-4 inline-flex text-sm font-medium hover:underline"
              >
                Ver leaderboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Data — portal por jogo */}
      <PortalLiveBlocks />

      {/* Coleção / Deck Builder / Favoritos / Wishlist */}
      <section className="portal-section container mx-auto max-w-6xl px-4 py-12 pb-16">
        <SectionHeader title="Sua jornada neste universo" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: gameCollectionPath(slug),
              title: "Coleção",
              subtitle: "Dashboard Steam-like",
            },
            {
              href: `/decks?game=${encodeURIComponent(gameId)}`,
              title: "Deck Builder",
              subtitle: "Workspace completo",
            },
            {
              href: "/perfil",
              title: "Favoritos",
              subtitle: "No seu perfil",
            },
            {
              href: gameWishlistPath(),
              title: "Wishlist",
              subtitle: "Faltantes e alertas",
            },
          ].map((item) => (
            <li key={item.title}>
              <Link
                href={item.href}
                className="large-visual-card block p-5 transition"
              >
                <h3 className="font-semibold text-[color:var(--game-text)]">{item.title}</h3>
                <p className="mt-1 text-sm text-[color:var(--game-text-muted)]">{item.subtitle}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center text-xs text-[color:var(--game-text-muted)]">
          Universo {theme.name}
        </p>
      </section>
    </div>
  );
}
