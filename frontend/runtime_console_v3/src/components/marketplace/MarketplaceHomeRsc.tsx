import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MarketplaceHeroSearch } from "@/components/marketplace/MarketplaceHeroSearch";
import { MarketplaceHomeInteractiveSections } from "@/components/marketplace/MarketplaceHomeInteractiveSections";
import { TrustFooterStrip } from "@/components/layout/TrustFooterStrip";
import { Button } from "@/components/ui/button";
import { fetchCatalogHealth } from "@/lib/seo-metadata";
import { getMegaMenuGames, MOCK_CATALOG_HEALTH } from "@/lib/catalog-games";
import { shouldBypassImageOptimizer } from "@/lib/format-currency";
import { gameSlugFromId } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import type { CatalogHealthReport } from "@/types/card";

function asHealth(
  raw: { total_cards?: number; by_game?: Record<string, number> } | null,
): CatalogHealthReport {
  if (!raw) return MOCK_CATALOG_HEALTH;
  return {
    ...MOCK_CATALOG_HEALTH,
    total_cards: raw.total_cards ?? MOCK_CATALOG_HEALTH.total_cards,
    by_game: raw.by_game ?? MOCK_CATALOG_HEALTH.by_game,
  };
}

function PopularGamesSection({ health }: { health: CatalogHealthReport }) {
  const games = getMegaMenuGames(health);
  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="mb-4 text-xl font-bold text-foreground">Jogos populares</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7" data-testid="game-grid">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/loja/${gameSlugFromId(game.id as GameId)}`}
            data-testid={`game-card-${gameSlugFromId(game.id as GameId)}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all duration-base hover:border-primary/30 hover:shadow-card-hover"
          >
            <Image
              src={game.logoUrl}
              alt=""
              width={48}
              height={48}
              quality={60}
              sizes="48px"
              unoptimized={shouldBypassImageOptimizer(game.logoUrl)}
              className="h-12 w-12 object-contain"
            />
            <span className="text-center text-sm font-medium">{game.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function PopularGamesStream() {
  const raw = await fetchCatalogHealth();
  return <PopularGamesSection health={asHealth(raw)} />;
}

function WhyJudgeSection() {
  const items = [
    {
      title: "Ofertas de lojas reais",
      text: "Cada anúncio indica a loja vendedora, a condição da carta e o preço pedido.",
    },
    {
      title: "Pagamento no checkout",
      text: "Quando disponível, você paga com PIX ou cartão. A compra protegida retém o valor até a confirmação de recebimento, se você optar por ela.",
    },
    {
      title: "Frete com CEP",
      text: "Informe o CEP na página do produto; no carrinho veja frete e prazo oficiais da loja.",
    },
    {
      title: "Vários jogos no mesmo catálogo",
      text: "Pokémon, Magic, Lorcana e outros jogos listados pelas lojas parceiras.",
    },
  ];
  return (
    <section className="border-t border-border py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="text-center text-h2 font-semibold text-foreground">Como a loja funciona</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-h4 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-small text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="border-t border-border py-12">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Ver ofertas ou anunciar</h2>
        <p className="mt-2 text-muted-foreground">Abra a busca de cartas ou cadastre anúncios da sua loja.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="min-h-12 bg-primary text-primary-foreground">
            <Link href="/loja/busca">Ver ofertas</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="min-h-12">
            <Link href="/vendedor/painel/listagens/nova">Anunciar cartas</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Home marketplace — hero imediato (sem await), games/health em stream. */
export function MarketplaceHomeRsc() {
  const bootstrap = MOCK_CATALOG_HEALTH;
  const totalCards = bootstrap.total_cards ?? 50_000;
  const gameCount = getMegaMenuGames(bootstrap).length;

  return (
    <MobileLayout>
      <MarketplaceHeroSearch totalCards={totalCards} gameCount={gameCount} />
      <Suspense fallback={<PopularGamesSection health={bootstrap} />}>
        <PopularGamesStream />
      </Suspense>
      <Suspense
        fallback={<div className="h-96 bg-muted/30" aria-hidden data-testid="home-stream-fallback" />}
      >
        <MarketplaceHomeInteractiveSections />
      </Suspense>
      <WhyJudgeSection />
      <FinalCtaSection />
      <TrustFooterStrip />
    </MobileLayout>
  );
}
