"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import AnimatedContent from "@/components/react-bits/AnimatedContent";
import CountUp from "@/components/react-bits/CountUp";
import GlareHover from "@/components/react-bits/GlareHover";
import { gameLandingPath } from "@/lib/game-routes";
import { shouldBypassImageOptimizer } from "@/lib/format-currency";
import { cn } from "@/lib/utils";
import type { GameCardProps } from "@/components/games/GameCard";

type Props = GameCardProps & {
  /** Índice na grade — stagger do reveal. */
  index?: number;
};

/**
 * Card de universo TCG — parede neutra + selo taxonômico 1px + GlareHover.
 * A cor do jogo não lava a superfície (tese Galeria).
 */
export function GameCardGallery({
  slug,
  name,
  description,
  logoUrl,
  cardCount,
  primaryColor,
  isAvailable = true,
  className,
  priority = false,
  index = 0,
}: Props) {
  const reduceMotion = useReducedMotion();

  const card = (
    <Link
      href={gameLandingPath(slug)}
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:bg-[color:var(--surface-2,var(--card))]",
        !isAvailable && "opacity-60",
        className,
      )}
      data-testid={`store-game-card-${slug}`}
    >
      {/* Selo taxonômico — fio 1px no topo, única cor do jogo */}
      <span
        className="absolute inset-x-0 top-0 h-px"
        style={{ backgroundColor: primaryColor }}
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 p-2">
          <Image
            src={logoUrl}
            alt=""
            width={48}
            height={48}
            quality={60}
            sizes="40px"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            unoptimized={shouldBypassImageOptimizer(logoUrl)}
            className="h-10 w-10 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-tight text-foreground">{name}</h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between text-xs">
        <span className="font-medium tabular-nums text-foreground">
          {cardCount > 0 ? (
            <>
              {reduceMotion ? (
                cardCount.toLocaleString("pt-BR")
              ) : (
                <CountUp to={cardCount} duration={1.1} separator="." className="inline" />
              )}{" "}
              cartas
            </>
          ) : (
            "Em sincronização"
          )}
        </span>
        <span className="font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Ver cartas →
        </span>
      </div>
    </Link>
  );

  const withGlare = reduceMotion ? (
    card
  ) : (
    <GlareHover
      width="100%"
      height="100%"
      background="transparent"
      borderColor="transparent"
      borderRadius="0.75rem"
      glareColor="rgba(255,255,255,0.85)"
      glareOpacity={0.18}
      glareSize={220}
      transitionDuration={550}
      className="!h-full !w-full !min-h-0 place-items-stretch border-0"
      style={{ width: "100%", height: "100%", border: "none" }}
    >
      {card}
    </GlareHover>
  );

  if (reduceMotion) return withGlare;

  return (
    <AnimatedContent
      distance={28}
      duration={0.55}
      delay={Math.min(index * 0.04, 0.28)}
      threshold={0.12}
      initialOpacity={0}
      animateOpacity
      className="h-full"
    >
      {withGlare}
    </AnimatedContent>
  );
}
