import Link from "next/link";
import { Suspense } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CatalogSearchSkeleton } from "@/components/search/CatalogSearchSkeleton";
import { LojaBuscaClient } from "@/app/loja/busca/LojaBuscaClient";
import { GameTaxonomyChip } from "@/components/marketplace/GameTaxonomyChip";

/**
 * Shell RSC (H1/copy estáticos) + island FacetedSearch.
 * Camada permanente: sem MarketplaceGameSkin / data-mood.
 * `?game=` só informa taxonomia via chip local.
 */
export default function LojaBuscaPage() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Início
        </Link>
        <h1 className="mt-4 text-2xl font-bold" data-testid="loja-busca-title">
          Comprar no marketplace
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Produtos com oferta aparecem primeiro. Filtre por jogo, coleção, raridade e preço.
        </p>
        <div className="mt-8">
          <Suspense fallback={<CatalogSearchSkeleton />}>
            <GameTaxonomyChip />
            <LojaBuscaClient />
          </Suspense>
        </div>
      </div>
    </MobileLayout>
  );
}
