import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MarketplaceHeroSearch } from "@/components/marketplace/MarketplaceHeroSearch";
import { MarketplaceHomeBelowFold } from "@/components/marketplace/MarketplaceHomeBelowFold";
import { MarketplaceDiscoveryShowcase } from "@/components/marketplace/MarketplaceDiscoveryShowcase";
import { TrustFooterStrip } from "@/components/layout/TrustFooterStrip";
import { UniverseHomeHero } from "@/components/experience/UniverseHomeHero";
import { Button } from "@/components/ui/button";
import { getMegaMenuGames, MOCK_CATALOG_HEALTH } from "@/lib/catalog-games";

function EcosystemSection() {
  return (
    <section className="border-t border-border py-12" data-testid="home-ecosystem">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Conheça o ecossistema</h2>
        <p className="mt-2 text-muted-foreground">
          Decks, coleção, eventos e regras — depois de comprar.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="outline" asChild className="min-h-12">
            <Link href="/decks">Explorar decks</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="min-h-12">
            <Link href="/search/torneios">Eventos</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="min-h-12">
            <Link href="/judge">Judge</Link>
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

/**
 * Home conversion-first — LCP = hero de compra + busca; vitrine material abaixo.
 * Universos TCG e institucional ficam abaixo do fold de produtos.
 */
export function MarketplaceHomeRsc() {
  const bootstrap = MOCK_CATALOG_HEALTH;
  const totalCards = bootstrap.total_cards ?? 50_000;
  const gameCount = getMegaMenuGames(bootstrap).length;

  return (
    <MobileLayout>
      <MarketplaceHeroSearch totalCards={totalCards} gameCount={gameCount} />
      <MarketplaceDiscoveryShowcase />
      <MarketplaceHomeBelowFold />
      <div className="border-t border-border">
        <UniverseHomeHero health={bootstrap} />
      </div>
      <EcosystemSection />
      <TrustFooterStrip />
    </MobileLayout>
  );
}
