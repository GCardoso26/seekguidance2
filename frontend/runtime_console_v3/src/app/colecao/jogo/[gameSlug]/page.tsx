"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CollectionGameProgress } from "@/components/collection-v2/CollectionGameProgress";
import { CollectionSetGrid, gameNameFromSlug } from "@/components/collection-v2/CollectionSetGrid";
import { useCollectionInsights } from "@/hooks/useCollectionInsights";
import { formatCurrency } from "@/lib/format-currency";
import { Skeleton } from "@/components/ui/skeleton";

export default function ColecaoJogoPage() {
  const params = useParams<{ gameSlug: string }>();
  const gameSlug = params.gameSlug;
  const { data, isLoading } = useCollectionInsights();

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return null;

  const game = data.byGame.find((g) => g.gameSlug === gameSlug);
  const name = game?.gameName ?? gameNameFromSlug(gameSlug);

  return (
    <div className="space-y-8" data-testid="collection-game-page">
      <header>
        <p className="text-caption text-muted-foreground">
          <Link href="/colecao" className="hover:text-primary">
            Coleção
          </Link>{" "}
          / {name}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">{name}</h1>
        {game && (
          <p className="mt-1 text-small text-muted-foreground">
            {game.uniqueCards} únicas · {game.quantity} cartas
            {game.value > 0 ? ` · ${formatCurrency(game.value, data.currency)}` : ""}
            {game.completionPct != null ? ` · ${game.completionPct}%` : ""}
          </p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-h3">Expansões</h2>
        <CollectionSetGrid sets={data.bySet} gameSlug={gameSlug} currency={data.currency} />
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Outros jogos</h2>
        <CollectionGameProgress
          games={data.byGame.filter((g) => g.gameSlug !== gameSlug)}
          currency={data.currency}
        />
      </section>

      <div className="flex flex-wrap gap-3 text-small">
        <Link href={`/colecao/faltantes?game=${gameSlug}`} className="text-primary hover:underline">
          Faltantes
        </Link>
        <Link href="/colecao/duplicatas" className="text-primary hover:underline">
          Duplicatas
        </Link>
        <Link href="/colecao/wishlist" className="text-primary hover:underline">
          Wishlist
        </Link>
        <Link href={`/colecao/cartas?game=${gameSlug}`} className="text-primary hover:underline">
          Últimas cartas
        </Link>
      </div>
    </div>
  );
}
