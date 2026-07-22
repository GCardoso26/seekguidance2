"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useUserCollection, useMyDecks } from "@/hooks/useDeck";
import { gameCardDetailPath } from "@/lib/game-routes";
import { gameMetaFromCode } from "@/lib/collection-v2";
import type { Deck, DeckCardEntry } from "@/types/deck";
import { Button } from "@/components/ui/button";

type Props = { deck: Deck };

function ownedQty(
  collection: Array<{ card_id: string; quantity: number }>,
  cardId: string,
): number {
  return collection.filter((c) => c.card_id === cardId).reduce((s, c) => s + c.quantity, 0);
}

export function DeckCollectionPanel({ deck }: Props) {
  const { data: collection = [] } = useUserCollection();
  const { data: myDecks = [] } = useMyDecks();
  const meta = gameMetaFromCode(deck.game);

  const rows = useMemo(() => {
    const entries: DeckCardEntry[] = [
      ...(deck.main_deck ?? []),
      ...(deck.sideboard ?? []),
      ...(deck.commander ?? []),
    ];
    return entries.map((entry) => {
      const have = ownedQty(collection, entry.card_id);
      const need = Math.max(0, entry.quantity - have);
      const inOther = myDecks
        .filter((d) => d.id !== deck.id)
        .filter((d) =>
          [...(d.main_deck ?? []), ...(d.sideboard ?? []), ...(d.commander ?? [])].some(
            (c) => c.card_id === entry.card_id,
          ),
        );
      return { entry, have, need, duplicates: Math.max(0, have - entry.quantity), inOther };
    });
  }, [deck, collection, myDecks]);

  const missingCount = rows.filter((r) => r.need > 0).length;

  return (
    <section className="space-y-4" data-testid="deck-collection-panel">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-h3">Coleção × Deck</h2>
          <p className="text-small text-muted-foreground">
            Status pessoal via Collection API. Faltam {missingCount} linhas.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/decks/${deck.id}?tab=marketplace`}>Comprar faltantes</Link>
        </Button>
      </div>

      <ul className="space-y-2">
        {rows.map(({ entry, have, need, duplicates, inOther }) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/30 px-3 py-2"
          >
            <div className="min-w-0">
              <Link
                href={gameCardDetailPath(meta.slug, entry.card_id)}
                className="font-medium text-foreground hover:text-primary"
              >
                {entry.card.name}
              </Link>
              <p className="text-caption text-muted-foreground">
                Deck {entry.quantity}x · Coleção {have}
                {need > 0 ? ` · Preciso de ${need}` : " · Tenho ✓"}
                {duplicates > 0 ? ` · ${duplicates} duplicata(s)` : ""}
                {inOther.length > 0 ? ` · em ${inOther.length} outro(s) deck(s)` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {need > 0 && (
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={`/loja/busca?q=${encodeURIComponent(entry.card.name)}&game=${encodeURIComponent(deck.game)}`}
                  >
                    Comprar
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" variant="ghost">
                <Link href="/colecao/wishlist">Wishlist</Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
