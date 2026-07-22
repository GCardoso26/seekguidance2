"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CollectionSetGrid, gameCodeFromSlug } from "@/components/collection-v2/CollectionSetGrid";
import { useCollectionInsights } from "@/hooks/useCollectionInsights";
import { Skeleton } from "@/components/ui/skeleton";

function FaltantesContent() {
  const search = useSearchParams();
  const gameFilter = search.get("game");
  const { data, isLoading } = useCollectionInsights();

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (!data) return null;

  const incomplete = data.bySet
    .filter((s) => (s.missing == null ? s.ownedUnique > 0 : s.missing > 0))
    .filter((s) => {
      if (!gameFilter) return true;
      return (
        s.gameCode.toLowerCase() === gameFilter.toLowerCase() ||
        s.gameCode.toUpperCase() === gameCodeFromSlug(gameFilter).toUpperCase()
      );
    });

  return (
    <div className="space-y-6" data-testid="collection-faltantes-page">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Cartas faltantes</h1>
        <p className="mt-1 text-small text-muted-foreground">
          Escolha uma expansão para ver preços e comprar via Marketplace.
        </p>
      </header>

      {incomplete.length === 0 ? (
        <p className="text-small text-muted-foreground">
          Sem expansões incompletas detectadas. Adicione cartas ou explore o{" "}
          <Link href="/" className="text-primary hover:underline">
            catálogo
          </Link>
          .
        </p>
      ) : (
        <CollectionSetGrid sets={incomplete} gameSlug={gameFilter ?? undefined} currency={data.currency} />
      )}
    </div>
  );
}

export default function ColecaoFaltantesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
      <FaltantesContent />
    </Suspense>
  );
}
