"use client";

import Image from "next/image";
import { Image as ImageIcon, ZoomIn } from "lucide-react";
import { FoilShinyText } from "@/components/gallery/FoilShinyText";
import { Badge } from "@/components/ui/badge";
import { RarityBadge } from "@/components/catalog/RarityBadge";
import { cardImageUrl, shouldBypassImageOptimizer } from "@/lib/format-currency";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId, UnifiedCard } from "@/types/card";
import { cn } from "@/lib/utils";

type Props = {
  card: UnifiedCard;
  imageError: boolean;
  onImageError: () => void;
  onZoom: () => void;
  className?: string;
};

export function CardDetailHero({ card, imageError, onImageError, onZoom, className }: Props) {
  const gameToken = GAME_TOKENS[card.game as GameId];
  const imageSrc = cardImageUrl(card);
  const hasFoil = card.latestPrice?.foil || (card.finishes ?? []).some((f) => f.toLowerCase().includes("foil"));

  return (
    <div className={cn("space-y-4", className)}>
      <button
        type="button"
        className="group relative mx-auto block w-full max-w-lg cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={onZoom}
        aria-label={`Ampliar imagem de ${card.name}`}
      >
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${gameToken?.primary ?? "#6366f1"}18 0%, transparent 70%), linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)`,
          }}
        >
          <div className="relative mx-auto aspect-[63/88] w-full max-w-[320px] overflow-hidden rounded-xl shadow-xl ring-1 ring-border/80 transition-transform duration-300 group-hover:scale-[1.02]">
            {!imageError ? (
              <Image
                src={imageSrc}
                alt={`${card.name} — ${card.set?.name ?? ""}`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 90vw, 360px"
                onError={onImageError}
                unoptimized={shouldBypassImageOptimizer(imageSrc)}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <ImageIcon className="h-16 w-16 text-muted-foreground" aria-hidden />
              </div>
            )}
          </div>

          <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-border/60 bg-card/90 px-3 py-1.5 text-caption font-medium text-foreground opacity-0 shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-3.5 w-3.5" aria-hidden />
            Ampliar
          </span>
        </div>
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {hasFoil && (
          <span className="rounded-md border border-border bg-card px-2 py-1" data-testid="card-foil-seal">
            <FoilShinyText text="Foil" variant="seal" />
          </span>
        )}
        {card.rarity && <RarityBadge game={card.game} rarity={card.rarity} />}
        {card.set?.name && <Badge variant="outline">{card.set.name}</Badge>}
        {card.number && <Badge variant="muted">#{card.number}</Badge>}
      </div>
    </div>
  );
}
