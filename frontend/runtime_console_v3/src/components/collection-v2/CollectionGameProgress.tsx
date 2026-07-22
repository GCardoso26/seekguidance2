"use client";

import Link from "next/link";
import { gameMetaFromCode, type CollectionGameBreakdown } from "@/lib/collection-v2";
import { formatCurrency } from "@/lib/format-currency";

type Props = {
  games: CollectionGameBreakdown[];
  currency?: string;
};

export function CollectionGameProgress({ games, currency = "BRL" }: Props) {
  if (games.length === 0) {
    return (
      <p className="text-small text-muted-foreground">
        Ainda não há cartas na coleção. Explore o{" "}
        <Link href="/" className="text-primary hover:underline">
          universo
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="space-y-4" data-testid="collection-game-progress">
      {games.map((g) => {
        const meta = gameMetaFromCode(g.gameCode);
        const pct = g.completionPct;
        return (
          <li key={g.gameCode}>
            <Link
              href={`/colecao/jogo/${g.gameSlug}`}
              className="block rounded-xl border border-border/70 bg-card/40 p-4 transition hover:border-primary/40"
              style={{ borderLeftWidth: 3, borderLeftColor: meta.primary }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{g.gameName}</p>
                  <p className="text-caption text-muted-foreground">
                    {g.uniqueCards} únicas · {g.quantity} cartas
                    {g.value > 0 ? ` · ${formatCurrency(g.value, currency)}` : ""}
                  </p>
                </div>
                <span className="text-h3 font-semibold tabular-nums text-foreground">
                  {pct != null ? `${pct}%` : "—"}
                </span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={pct ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progresso ${g.gameName}`}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct ?? Math.min(100, (g.uniqueCards / Math.max(g.quantity, 1)) * 40)}%`,
                    backgroundColor: meta.primary,
                  }}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
