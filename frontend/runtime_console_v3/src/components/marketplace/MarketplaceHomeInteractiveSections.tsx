"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const TrendingCardsGrid = dynamic(
  () => import("@/components/marketplace/TrendingCardsGrid").then((m) => m.TrendingCardsGrid),
  {
    loading: () => (
      <div className="grid gap-4 md:grid-cols-3" data-testid="featured-cards-loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
    ),
    ssr: false,
  },
);

const FeaturedShopsGrid = dynamic(
  () => import("@/components/marketplace/FeaturedShopsGrid").then((m) => m.FeaturedShopsGrid),
  {
    loading: () => (
      <div className="grid gap-4 md:grid-cols-4" data-testid="featured-shops-loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
    ),
    ssr: false,
  },
);

const CatalogMarketplaceSection = dynamic(
  () =>
    import("@/components/home/CatalogMarketplaceSection").then((m) => m.CatalogMarketplaceSection),
  {
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted/40" aria-hidden />,
    ssr: false,
  },
);

const LiveHomeFeed = dynamic(
  () => import("@/components/live-data/LiveHomeFeed").then((m) => m.LiveHomeFeed),
  {
    loading: () => <div className="h-96 animate-pulse bg-muted/30" aria-hidden />,
    ssr: false,
  },
);

export function MarketplaceHomeInteractiveSections() {
  return (
    <>
      <CatalogMarketplaceSection showHero={false} showGames={false} />
      <section className="border-t border-border py-8" data-testid="home-offers-week">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-h2 font-semibold text-foreground">Ofertas e catálogo</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Produtos com foto, preço e disponibilidade reais — sem estoque inventado.
          </p>
        </div>
      </section>
      <LiveHomeFeed />
      <section className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-h2 font-semibold text-foreground">Produtos populares</h2>
            <Link
              href="/loja/tendencias"
              className="text-sm text-primary hover:underline"
              onClick={() => {
                void import("@/lib/analytics").then(({ trackEvent }) =>
                  trackEvent("home_product_ctr", { source: "trending_link" }),
                );
              }}
            >
              Ver todas →
            </Link>
          </div>
          <TrendingCardsGrid />
        </div>
      </section>
      <section className="border-t border-border bg-card/30 py-8">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-h2 font-semibold text-foreground">Lojas em destaque</h2>
          <FeaturedShopsGrid />
        </div>
      </section>
    </>
  );
}
