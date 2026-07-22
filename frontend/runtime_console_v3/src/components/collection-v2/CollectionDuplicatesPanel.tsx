"use client";

import Link from "next/link";
import { gameMetaFromCode, type CollectionEnrichedItem } from "@/lib/collection-v2";
import { formatCurrency } from "@/lib/format-currency";
import { gameCardDetailPath } from "@/lib/game-routes";
import { Button } from "@/components/ui/button";
import { useMyDecks } from "@/hooks/useDeck";

type Props = {
  items: CollectionEnrichedItem[];
  currency?: string;
};

export function CollectionDuplicatesPanel({ items, currency = "BRL" }: Props) {
  const { data: decks = [] } = useMyDecks();
  const dups = items.filter((i) => i.quantity > 1);

  const decksForCard = (cardId: string) =>
    decks.filter((d) =>
      [...(d.main_deck ?? []), ...(d.sideboard ?? []), ...(d.commander ?? [])].some(
        (c) => c.card_id === cardId,
      ),
    );

  if (dups.length === 0) {
    return (
      <p className="text-small text-muted-foreground" data-testid="collection-duplicates-empty">
        Nenhuma duplicata no momento.
      </p>
    );
  }

  return (
    <ul className="space-y-3" data-testid="collection-duplicates-panel">
      {dups.map((item) => {
        const meta = gameMetaFromCode(item.card?.game_code);
        const used = decksForCard(item.card_id);
        const usedQty = used.reduce((sum, d) => {
          const entries = [...(d.main_deck ?? []), ...(d.sideboard ?? []), ...(d.commander ?? [])];
          return sum + entries.filter((c) => c.card_id === item.card_id).reduce((s, c) => s + c.quantity, 0);
        }, 0);
        const available = Math.max(0, item.quantity - Math.max(usedQty, 1));
        const sellValue =
          item.unitPrice != null ? item.unitPrice * Math.max(1, item.quantity - 1) : null;

        return (
          <li
            key={item.id}
            className="rounded-xl border border-border/70 bg-card/40 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={gameCardDetailPath(meta.slug, item.card_id)}
                  className="font-semibold text-foreground hover:text-primary"
                >
                  {item.card?.name ?? "Carta"}
                </Link>
                <p className="mt-1 text-caption text-muted-foreground">
                  Tenho {item.quantity}
                  {used.length > 0 ? ` · ${used.length} deck(s) · ~${usedQty} em uso` : ""}
                  {available > 0 ? ` · ${available} disponíveis` : ""}
                </p>
                {sellValue != null && (
                  <p className="mt-1 text-small text-foreground">
                    Valor de venda (extras): {formatCurrency(sellValue, currency)}
                  </p>
                )}
                {used.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {used.slice(0, 5).map((d) => (
                      <li key={d.id}>
                        <Link href={`/decks/${d.id}`} className="text-caption text-primary hover:underline">
                          {d.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/vendedor/painel/listagens/nova?cardId=${encodeURIComponent(item.card_id)}`}
                >
                  Publicar anúncio
                </Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
