"use client";

import Link from "next/link";
import { CardCard } from "@/components/cards/CardCard";
import { gameCardDetailPath } from "@/lib/game-routes";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardIntelligence } from "@/hooks/useCardIntelligence";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId, UnifiedCard } from "@/types/card";

type Props = {
  cardId: string;
  card: UnifiedCard;
  fallbackRelated?: UnifiedCard[];
};

function Rail({
  title,
  cards,
  gameSlug,
}: {
  title: string;
  cards: UnifiedCard[];
  gameSlug: string;
}) {
  if (!cards.length) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {cards.slice(0, 6).map((c) => (
          <Link key={c.id} href={gameCardDetailPath(gameSlug, c.id)} className="block">
            <CardCard card={c} variant="compact" showPrice source="related" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CardIntelligenceSection({ cardId, card, fallbackRelated = [] }: Props) {
  const { data, isLoading } = useCardIntelligence(cardId);
  const gameSlug = GAME_TOKENS[card.game as GameId]?.slug || String(card.game).toLowerCase();
  const hints = data?.sellerAiHints ?? null;

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="card-intelligence-skeleton">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[63/88] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const related = data?.related;
  const showFallback = !related && fallbackRelated.length > 0;

  return (
    <section className="space-y-6" data-testid="card-intelligence-section" aria-labelledby="intel-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="intel-title" className="text-lg font-semibold">
          Dados do catálogo
        </h2>
        {hints && (
          <p className="text-xs text-muted-foreground" data-testid="seller-ai-hints">
            Demanda {hints.demand ?? "—"} · Competitividade {hints.competitiveness ?? "—"}
            {hints.suggestedPrice != null ? ` · Preço sugerido ~${hints.suggestedPrice.toFixed(2)}` : ""}
            {hints.velocityHint ? ` · Velocidade ${hints.velocityHint}` : ""}
          </p>
        )}
      </div>

      {showFallback && (
        <Rail title="Mesma expansão" cards={fallbackRelated} gameSlug={gameSlug} />
      )}

      {related && (
        <>
          <Rail title="Mesma expansão" cards={related.sameSet} gameSlug={gameSlug} />
          <Rail title="Compradas juntas com frequência" cards={related.frequentlyTogether} gameSlug={gameSlug} />
          <Rail title="Staples" cards={related.staples} gameSlug={gameSlug} />
          <Rail title="Upgrades" cards={related.upgrades} gameSlug={gameSlug} />
          <Rail title="Alternativas" cards={related.alternatives} gameSlug={gameSlug} />
          <Rail title="Commander" cards={related.commanderHints} gameSlug={gameSlug} />
        </>
      )}

      {data?.variants && data.variants.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Idiomas e acabamentos</h3>
          <ul className="flex flex-wrap gap-2">
            {data.variants.slice(0, 12).map((v) => (
              <li key={v.id}>
                <Link
                  href={gameCardDetailPath(gameSlug, v.id)}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:bg-muted"
                >
                  {(v.language || "?").toUpperCase()}
                  {v.finishes?.[0] ? ` · ${v.finishes[0]}` : ""}
                  {v.setCode ? ` · ${v.setCode}` : ""}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
