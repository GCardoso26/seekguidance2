"use client";

import Link from "next/link";
import { gameCardDetailPath } from "@/lib/game-routes";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId, UnifiedCard } from "@/types/card";

type Props = {
  card: UnifiedCard;
  relatedCards: UnifiedCard[];
};

function groupVersions(card: UnifiedCard, related: UnifiedCard[]): UnifiedCard[] {
  const bySet = new Map<string, UnifiedCard>();
  bySet.set(card.set?.code ?? card.set?.name ?? card.id, card);
  for (const c of related) {
    const key = c.set?.code ?? c.set?.name ?? c.id;
    if (!bySet.has(key)) bySet.set(key, c);
  }
  return Array.from(bySet.values()).sort((a, b) =>
    (a.set?.name ?? "").localeCompare(b.set?.name ?? "", "pt-BR"),
  );
}

export function CardVersionsTab({ card, relatedCards }: Props) {
  const gameSlug = GAME_TOKENS[card.game as GameId]?.slug ?? String(card.game).toLowerCase();
  const versions = groupVersions(card, relatedCards);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Todas as impressões conhecidas de <strong>{card.name}</strong> no catálogo.
      </p>
      <ul className="divide-y divide-border rounded-lg border">
        {versions.map((v) => {
          const active = v.id === card.id;
          const count = v.listingCount ?? 0;
          return (
            <li key={v.id}>
              <Link
                href={gameCardDetailPath(gameSlug, v.id)}
                className={`flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-muted/40 ${
                  active ? "bg-primary/5 font-medium" : ""
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span>
                  {v.set?.code && (
                    <span className="mr-2 font-mono text-xs text-muted-foreground">{v.set.code}</span>
                  )}
                  {v.set?.name}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {count > 0 ? `${count} ofertas` : "—"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {versions.length <= 1 && (
        <p className="text-xs text-muted-foreground">
          Apenas esta versão indexada. Novas reimpressões aparecerão aqui após sync do catálogo.
        </p>
      )}
    </div>
  );
}
