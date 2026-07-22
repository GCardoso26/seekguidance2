"use client";

import { CollectionDuplicatesPanel } from "@/components/collection-v2/CollectionDuplicatesPanel";
import { useCollectionInsights } from "@/hooks/useCollectionInsights";
import { Skeleton } from "@/components/ui/skeleton";

export default function ColecaoDuplicatasPage() {
  const { data, isLoading } = useCollectionInsights();

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  return (
    <div className="space-y-6" data-testid="collection-duplicatas-page">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Duplicatas</h1>
        <p className="mt-1 text-small text-muted-foreground">
          Cartas extras, uso em decks e publicação no Marketplace.
        </p>
      </header>
      <CollectionDuplicatesPanel items={data?.items ?? []} currency={data?.currency} />
    </div>
  );
}
