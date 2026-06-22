"use client";

import { Suspense } from "react";
import Link from "next/link";
import { FacetedSearch } from "@/components/search/FacetedSearch";
import { CatalogSearchSkeleton } from "@/components/search/CatalogSearchSkeleton";
import { MobileLayout } from "@/components/layout/MobileLayout";

function CatalogSearchContent() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Início
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Loja de cartas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Busca facetada com filtros por jogo, coleção, raridade e preço.
        </p>
        <div className="mt-8">
          <FacetedSearch searchBasePath="/loja/busca" cardDetailPath="/loja/cartas" />
        </div>
      </div>
    </MobileLayout>
  );
}

export default function LojaBuscaPage() {
  return (
    <Suspense fallback={<CatalogSearchSkeleton />}>
      <CatalogSearchContent />
    </Suspense>
  );
}
