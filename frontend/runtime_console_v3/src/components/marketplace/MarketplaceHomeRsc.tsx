import Link from "next/link";
import { Suspense } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MarketplaceHeroSearch } from "@/components/marketplace/MarketplaceHeroSearch";
import { MarketplaceHomeInteractiveSections } from "@/components/marketplace/MarketplaceHomeInteractiveSections";
import { TrustFooterStrip } from "@/components/layout/TrustFooterStrip";
import { UniverseHomeHero } from "@/components/experience/UniverseHomeHero";
import { PersonalizedHomeStrip } from "@/components/experience/PersonalizedHomeStrip";
import { Button } from "@/components/ui/button";
import { fetchCatalogHealth } from "@/lib/seo-metadata";
import { getMegaMenuGames, MOCK_CATALOG_HEALTH } from "@/lib/catalog-games";
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

async function UniverseHeroStream() {
  const raw = await fetchCatalogHealth();
  return <UniverseHomeHero health={asHealth(raw)} />;
}

function DiscoveryCta() {
  return (
    <section className="border-t border-border py-12">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Buscar no catálogo</h2>
        <p className="mt-2 text-muted-foreground">
          Compare ofertas de lojas, monte decks e acompanhe sua coleção.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="min-h-12 bg-primary text-primary-foreground">
            <Link href="/loja/busca">Ver ofertas</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="min-h-12">
            <Link href="/decks">Explorar decks</Link>
          </Button>
        </div>
        <p className="mt-4 text-caption text-muted-foreground">
          Lojista?{" "}
          <Link href="/vendedor/painel/listagens/nova" className="underline hover:text-foreground">
            Anunciar cartas
          </Link>
        </p>
      </div>
    </section>
  );
}

/** Home — portal multi-TCG (Experience Layer). */
export function MarketplaceHomeRsc() {
  const bootstrap = MOCK_CATALOG_HEALTH;
  const totalCards = bootstrap.total_cards ?? 50_000;
  const gameCount = getMegaMenuGames(bootstrap).length;

  return (
    <MobileLayout>
      <Suspense fallback={<UniverseHomeHero health={bootstrap} />}>
        <UniverseHeroStream />
      </Suspense>
      <PersonalizedHomeStrip />
      <div className="border-t border-border">
        <MarketplaceHeroSearch totalCards={totalCards} gameCount={gameCount} />
      </div>
      <Suspense
        fallback={<div className="h-96 bg-muted/30" aria-hidden data-testid="home-stream-fallback" />}
      >
        <MarketplaceHomeInteractiveSections />
      </Suspense>
      <DiscoveryCta />
      <TrustFooterStrip />
    </MobileLayout>
  );
}
