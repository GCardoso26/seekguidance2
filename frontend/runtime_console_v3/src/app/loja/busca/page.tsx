import Link from "next/link";
import { Suspense } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CatalogSearchSkeleton } from "@/components/search/CatalogSearchSkeleton";
import { LojaBuscaClient } from "@/app/loja/busca/LojaBuscaClient";
import { MarketplaceGameSkin } from "@/components/experience/MarketplaceGameSkin";

/**
 * Shell RSC (H1/copy estáticos) + island FacetedSearch.
 * Alinha `/loja/busca` ao padrão do hub `/loja` para LCP.
 * Epic 6: Theme Engine V2 skin when `?game=` is present.
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
            <MarketplaceGameSkin>
              <LojaBuscaClient />
            </MarketplaceGameSkin>
          </Suspense>
        </div>
      </div>
    </MobileLayout>
  );
}
