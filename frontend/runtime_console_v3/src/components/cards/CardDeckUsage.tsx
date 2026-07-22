"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useMyDecks, usePublicDecks } from "@/hooks/useDeck";
import type { UnifiedCard } from "@/types/card";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  card: UnifiedCard;
};

export function CardDeckUsage({ card }: Props) {
  const game = String(card.game || "").toUpperCase();
  const { data: myDecks = [], isLoading: loadingMine } = useMyDecks();
  const { data: publicDecks = [], isLoading: loadingPublic } = usePublicDecks(game || undefined);

  const mineUsing = useMemo(
    () =>
      myDecks.filter((d) =>
        [...(d.main_deck ?? []), ...(d.sideboard ?? []), ...(d.commander ?? [])].some(
          (c) => c.card_id === card.id,
        ),
      ),
    [myDecks, card.id],
  );

  const publicTop = useMemo(() => {
    const scored = publicDecks.map((d) => {
      const entries = [...(d.main_deck ?? []), ...(d.sideboard ?? []), ...(d.commander ?? [])];
      const has = entries.some((c) => c.card_id === card.id);
      return { deck: d, has, score: (d.views || 0) + (d.likes || 0) * 3 };
    });
    return scored
      .filter((x) => x.has || publicDecks.length <= 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.deck);
  }, [publicDecks, card.id]);

  const loading = loadingMine || loadingPublic;
  const metaShare =
    publicDecks.length > 0
      ? Math.round(
          (publicDecks.filter((d) =>
            [...(d.main_deck ?? []), ...(d.sideboard ?? []), ...(d.commander ?? [])].some(
              (c) => c.card_id === card.id,
            ),
          ).length /
            publicDecks.length) *
            1000,
        ) / 10
      : null;

  return (
    <section
      className="rounded-xl border border-border/70 bg-card/40 p-4"
      data-testid="card-deck-usage"
      aria-labelledby="card-deck-usage-title"
    >
      <h2 id="card-deck-usage-title" className="text-h3 text-foreground">
        Utilização em decks
      </h2>
      {loading ? (
        <Skeleton className="mt-3 h-20 w-full rounded-lg" />
      ) : (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/40 p-2 text-center">
              <dt className="text-caption text-muted-foreground">Meus decks</dt>
              <dd className="font-semibold">{mineUsing.length}</dd>
            </div>
            <div className="rounded-lg bg-muted/40 p-2 text-center">
              <dt className="text-caption text-muted-foreground">Decks públicos</dt>
              <dd className="font-semibold">{publicDecks.length}</dd>
            </div>
            <div className="rounded-lg bg-muted/40 p-2 text-center">
              <dt className="text-caption text-muted-foreground">Meta share</dt>
              <dd className="font-semibold">{metaShare != null ? `${metaShare}%` : "—"}</dd>
            </div>
          </dl>

          {mineUsing.length > 0 && (
            <div className="mt-4">
              <p className="text-caption text-muted-foreground">Seus decks</p>
              <ul className="mt-1 space-y-1">
                {mineUsing.slice(0, 5).map((d) => (
                  <li key={d.id}>
                    <Link href={`/decks/${d.id}`} className="text-small text-primary hover:underline">
                      {d.name} · {d.format}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {publicTop.length > 0 && (
            <div className="mt-4">
              <p className="text-caption text-muted-foreground">Top decks do universo</p>
              <ul className="mt-1 space-y-1">
                {publicTop.map((d) => (
                  <li key={d.id}>
                    <Link href={`/decks/${d.id}`} className="text-small text-primary hover:underline">
                      {d.name} · {d.views} views
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 space-y-3" data-testid="card-deck-actions">
            <p className="text-caption text-muted-foreground">Ações de deck</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/decks?add=${encodeURIComponent(card.id)}`}
                className="text-small text-primary hover:underline"
              >
                Adicionar ao deck
              </Link>
              <Link href="/decks" className="text-small text-primary hover:underline">
                Meus decks
              </Link>
              <Link
                href={`/loja/busca?q=${encodeURIComponent(card.name)}`}
                className="text-small text-primary hover:underline"
              >
                Comprar / substituir
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
