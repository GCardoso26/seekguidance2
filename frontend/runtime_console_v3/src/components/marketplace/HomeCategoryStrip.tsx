"use client";

import { DiscoveryTileLink } from "@/components/marketplace/DiscoveryTileLink";
import { getDiscoveryCategoryTiles } from "@/lib/marketplace-discovery";

/**
 * Compat: strip de categorias com arte.
 * Prefer `MarketplaceDiscoveryShowcase` na home (P1 OpenDesign).
 */
export function HomeCategoryStrip() {
  const categories = getDiscoveryCategoryTiles();
  return (
    <section className="border-b border-border py-8" data-testid="home-category-strip">
      <div className="container mx-auto px-4">
        <h2 className="text-h2 font-semibold text-foreground">Onde comprar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Singles, selados e acessórios — ofertas reais quando existirem.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {categories.map((tile) => (
            <li key={tile.id}>
              <DiscoveryTileLink tile={tile} variant="category" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
