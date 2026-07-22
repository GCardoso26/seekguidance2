"use client";

/**
 * Produtos relacionados do mesmo jogo — extensão marketplace (selados, sleeves, etc.).
 * Consome apenas APIs públicas via links de descoberta; sem SQL / BC novo.
 */
import Link from "next/link";
import { Package } from "lucide-react";
import { gameLandingPath } from "@/lib/game-routes";
import type { UnifiedCard } from "@/types/card";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

const RELATED_PRODUCT_HINTS = [
  { label: "Boosters", q: "booster" },
  { label: "Displays", q: "display" },
  { label: "Sleeves", q: "sleeve" },
  { label: "Deck boxes", q: "deck box" },
  { label: "Playmats", q: "playmat" },
  { label: "Pastas", q: "binder" },
] as const;

type Props = {
  card: UnifiedCard;
  gameSlug: string;
};

export function CardRelatedProductsSection({ card, gameSlug }: Props) {
  const gameName = GAME_TOKENS[card.game as GameId]?.name ?? card.game;
  const base = gameLandingPath(gameSlug);

  return (
    <section
      className="space-y-4"
      data-testid="card-related-products"
      aria-labelledby="related-products-title"
    >
      <div>
        <h2 id="related-products-title" className="text-h3 text-foreground">
          Produtos do universo
        </h2>
        <p className="mt-1 text-small text-muted-foreground">
          Selados e acessórios relacionados a {gameName} — descubra no portal do jogo.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {RELATED_PRODUCT_HINTS.map(({ label, q }) => (
          <li key={q}>
            <Link
              href={`${base}?q=${encodeURIComponent(q)}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-border/70 bg-card/30 px-3 py-4 text-center transition hover:border-[color:var(--game-accent,hsl(var(--primary)))] hover:bg-card/60"
            >
              <Package className="h-5 w-5 text-muted-foreground" aria-hidden />
              <span className="text-caption font-medium text-foreground">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
