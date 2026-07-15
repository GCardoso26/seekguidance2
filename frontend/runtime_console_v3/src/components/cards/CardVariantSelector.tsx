"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";
import type { UnifiedCard } from "@/types/card";
import { useCardIntelligence } from "@/hooks/useCardIntelligence";
import { gameCardDetailPath } from "@/lib/game-routes";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

type Props = {
  card: UnifiedCard;
  cardId: string;
  selectedCondition?: string;
  onConditionChange?: (condition: string) => void;
};

export function CardVariantSelector({
  card,
  cardId,
  selectedCondition,
  onConditionChange,
}: Props) {
  const { data } = useCardIntelligence(cardId);
  const [foilOnly, setFoilOnly] = useState(false);
  const gameSlug = GAME_TOKENS[card.game as GameId]?.slug || String(card.game).toLowerCase();

  const conditions = card.pricesByCondition ?? [];
  const finishes = card.finishes ?? data?.taxonomy.finishes ?? [];
  const variants = useMemo(() => {
    const list = data?.variants ?? [];
    if (!foilOnly) return list;
    return list.filter((v) => (v.finishes ?? []).some((f) => f.toLowerCase().includes("foil")));
  }, [data?.variants, foilOnly]);

  return (
    <section
      className="rounded-xl border bg-card p-4"
      aria-labelledby="variant-selector-title"
      data-testid="card-variant-selector"
    >
      <h2 id="variant-selector-title" className="text-sm font-semibold">
        Variações
      </h2>

      {conditions.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-muted-foreground">Condição</p>
          <div className="flex flex-wrap gap-2" role="listbox" aria-label="Condição">
            {conditions.map((pc) => (
              <button
                key={`${pc.condition}-${pc.foil}`}
                type="button"
                role="option"
                aria-selected={selectedCondition === pc.condition}
                onClick={() => onConditionChange?.(pc.condition)}
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition",
                  selectedCondition === pc.condition
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <ConditionBadge condition={pc.condition as CardCondition} size="sm" />
                {pc.foil && <span className="text-caption text-muted-foreground">Foil</span>}
                <span>{formatCurrency(pc.price, pc.currency)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">Acabamento</p>
        <button
          type="button"
          onClick={() => setFoilOnly((v) => !v)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs",
            foilOnly ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-600" : "border-border",
          )}
          aria-pressed={foilOnly}
        >
          Foil
        </button>
        {finishes.map((f) => (
          <span key={f} className="rounded-full bg-muted px-2 py-0.5 text-caption capitalize">
            {f.replace(/_/g, " ")}
          </span>
        ))}
        {(card.language || variants[0]?.language) && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-caption uppercase">
            {card.language}
          </span>
        )}
      </div>

      {variants.length > 0 && (
        <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs">
          {variants.slice(0, 16).map((v) => (
            <li key={v.id}>
              <Link
                href={gameCardDetailPath(gameSlug, v.id)}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/60"
              >
                <span>
                  {(v.language || "?").toUpperCase()} · {v.setCode || "—"}
                  {v.finishes?.[0] ? ` · ${v.finishes[0]}` : ""}
                </span>
                <span className="text-muted-foreground">
                  {v.lowestPrice != null ? formatCurrency(v.lowestPrice, "USD") : "—"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
