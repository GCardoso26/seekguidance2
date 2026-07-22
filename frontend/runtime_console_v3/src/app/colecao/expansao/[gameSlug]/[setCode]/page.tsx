"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CollectionMissingPanel } from "@/components/collection-v2/CollectionMissingPanel";
import {
  gameCodeFromSlug,
  gameNameFromSlug,
} from "@/components/collection-v2/CollectionSetGrid";
import { useCollectionInsights } from "@/hooks/useCollectionInsights";
import { formatCurrency } from "@/lib/format-currency";
import { Skeleton } from "@/components/ui/skeleton";

export default function ColecaoExpansaoPage() {
  const params = useParams<{ gameSlug: string; setCode: string }>();
  const gameSlug = params.gameSlug;
  const setCode = decodeURIComponent(params.setCode);
  const gameCode = gameCodeFromSlug(gameSlug);
  const { data, isLoading } = useCollectionInsights();

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  const set = data?.bySet.find(
    (s) =>
      s.setCode.toLowerCase() === setCode.toLowerCase() &&
      (s.gameCode.toUpperCase() === gameCode.toUpperCase() ||
        s.gameCode.toLowerCase() === gameSlug.toLowerCase()),
  );

  return (
    <div className="space-y-8" data-testid="collection-set-page">
      <header>
        <p className="text-caption text-muted-foreground">
          <Link href="/colecao" className="hover:text-primary">
            Coleção
          </Link>{" "}
          /{" "}
          <Link href={`/colecao/jogo/${gameSlug}`} className="hover:text-primary">
            {gameNameFromSlug(gameSlug)}
          </Link>{" "}
          / {set?.setName || setCode}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">{set?.setName || setCode}</h1>
        {set && (
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <dt className="text-caption text-muted-foreground">Possuídas</dt>
              <dd className="font-semibold">{set.ownedUnique}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Faltantes</dt>
              <dd className="font-semibold">{set.missing ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Completo</dt>
              <dd className="font-semibold">
                {set.completionPct != null ? `${set.completionPct}%` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Valor</dt>
              <dd className="font-semibold">
                {set.value > 0 ? formatCurrency(set.value, data?.currency || "BRL") : "—"}
              </dd>
            </div>
          </dl>
        )}
      </header>

      <CollectionMissingPanel game={gameCode} set={setCode} gameSlug={gameSlug} />
    </div>
  );
}
