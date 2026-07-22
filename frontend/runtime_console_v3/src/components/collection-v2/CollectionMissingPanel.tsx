"use client";

import Link from "next/link";
import { useCollectionMissing } from "@/hooks/useCollectionInsights";
import { formatCurrency } from "@/lib/format-currency";
import { gameCardDetailPath } from "@/lib/game-routes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  game: string;
  set: string;
  gameSlug: string;
};

export function CollectionMissingPanel({ game, set, gameSlug }: Props) {
  const { data, isLoading, isError } = useCollectionMissing(game, set);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-small text-muted-foreground">
        Não foi possível carregar cartas faltantes agora.
      </p>
    );
  }

  const buyUrl = `/loja/busca?game=${encodeURIComponent(game)}&set=${encodeURIComponent(set)}`;

  return (
    <section className="space-y-4" data-testid="collection-missing-panel">
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <p className="text-h3 text-foreground">Faltam {data.missingCount} cartas</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-caption text-muted-foreground">Preço mínimo</dt>
            <dd className="font-semibold">
              {data.minPrice != null ? formatCurrency(data.minPrice, data.currency) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Preço médio</dt>
            <dd className="font-semibold">
              {data.avgPrice != null ? formatCurrency(data.avgPrice, data.currency) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Comprar todas (est.)</dt>
            <dd className="font-semibold">
              {data.sumPrice != null ? formatCurrency(data.sumPrice, data.currency) : "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={buyUrl}>Comprar todas</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/colecao/wishlist">Adicionar Wishlist</Link>
          </Button>
        </div>
      </div>

      {data.missing.length === 0 ? (
        <p className="text-small text-success">Set completo nesta amostra do catálogo.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {data.missing.slice(0, 60).map((card) => (
            <li key={card.id}>
              <Link
                href={gameCardDetailPath(gameSlug, card.id)}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/30 px-3 py-2 hover:border-primary/40"
              >
                <span className="truncate text-small font-medium text-foreground">{card.name}</span>
                <span className="shrink-0 text-caption text-muted-foreground">
                  {card.unitPrice != null ? formatCurrency(card.unitPrice, card.currency) : "—"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
