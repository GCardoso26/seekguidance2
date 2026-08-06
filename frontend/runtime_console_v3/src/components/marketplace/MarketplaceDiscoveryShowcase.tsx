import {
  getDiscoveryCategoryTiles,
  getDiscoveryCollectionTiles,
  getDiscoveryLaunchTiles,
} from "@/lib/marketplace-discovery";
import { DiscoveryTileLink } from "@/components/marketplace/DiscoveryTileLink";

function RailHeader({
  title,
  description,
  testId,
}: {
  title: string;
  description: string;
  testId: string;
}) {
  return (
    <div className="mb-4" data-testid={testId}>
      <h2 className="text-h2 font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-1 max-w-[62ch] text-small text-muted-foreground">{description}</p>
    </div>
  );
}

/**
 * Vitrine de descoberta — categorias, coleções e lançamentos com arte real.
 * Shell comercial permanente (sem data-mood / game-portal).
 */
export function MarketplaceDiscoveryShowcase() {
  const categories = getDiscoveryCategoryTiles();
  const collections = getDiscoveryCollectionTiles();
  const launches = getDiscoveryLaunchTiles();

  return (
    <section
      className="border-b border-border bg-background py-8 sm:py-10"
      data-testid="marketplace-discovery-showcase"
    >
      <div className="container mx-auto space-y-10 px-4">
        <div>
          <RailHeader
            title="Onde comprar"
            description="Singles, selados e acessórios — entre no hub e filtre ofertas reais."
            testId="discovery-rail-categories"
          />
          <ul className="grid gap-3 sm:grid-cols-3">
            {categories.map((tile) => (
              <li key={tile.id}>
                <DiscoveryTileLink tile={tile} variant="category" />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <RailHeader
            title="Coleções em destaque"
            description="Arte de sets e universos — explore o catálogo sem trocar a identidade da loja."
            testId="discovery-rail-collections"
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((tile) => (
              <li key={tile.id}>
                <DiscoveryTileLink tile={tile} variant="feature" />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <RailHeader
            title="Explorar coleções"
            description="Atalhos pré-filtrados para beachhead e jogos shadow — sem inventar estoque."
            testId="discovery-rail-launches"
          />
          <ul className="grid gap-3 sm:grid-cols-3">
            {launches.map((tile) => (
              <li key={tile.id}>
                <DiscoveryTileLink tile={tile} variant="feature" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
