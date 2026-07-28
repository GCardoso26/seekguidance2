"use client";

import Link from "next/link";
import { useGamePortal } from "@/components/experience/GameProvider";
import { HeroAssetFrame } from "@/components/assets/HeroAssetFrame";
import { ResponsiveImage } from "@/components/assets/ResponsiveImage";
import {
  gameCardsPath,
  gameExpansionsPath,
  gameMarketplacePath,
} from "@/lib/game-routes";
import { cn } from "@/lib/utils";

type Props = {
  cardCount?: number;
  healthLoading?: boolean;
  latestSetHref?: string;
  latestSetLabel?: string;
  /** Arte de fundo do universo (ex.: cover da última expansão) */
  backgroundImage?: string | null;
  className?: string;
};

/**
 * Hero System — cinematic portal entrance (Theme Engine V2 + Asset Pipeline V2).
 * Desktop / mobile / overlay / fallback / video structure.
 */
export function GameHero({
  cardCount = 0,
  healthLoading,
  latestSetHref,
  latestSetLabel,
  backgroundImage,
  className,
}: Props) {
  const { theme, slug, gameId } = useGamePortal();
  const hero = theme.hero;
  const expansionsHref = latestSetHref ?? gameExpansionsPath(slug);
  const stillSrc =
    backgroundImage ||
    hero.imageDesktop ||
    hero.image ||
    hero.imageMobile ||
    hero.imageFallback ||
    null;
  const hasStill = Boolean(stillSrc);

  return (
    <section
      className={cn("game-hero border-b border-[color:var(--game-border)]", className)}
      aria-label={`Hero ${theme.name}`}
    >
      <div className="game-hero__media" aria-hidden>
        {hasStill ? (
          <HeroAssetFrame
            desktopSrc={stillSrc || hero.imageDesktop || hero.image}
            mobileSrc={hero.imageMobile || stillSrc || undefined}
            fallbackSrc={hero.imageFallback || theme.logo}
            overlaySrc={hero.imageOverlay}
            alt={theme.name}
            priority
          />
        ) : null}
        {hero.video ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={hero.imageDesktop || hero.image || undefined}
            aria-hidden
          >
            <source src={hero.video} />
          </video>
        ) : null}
      </div>

      <div className="game-hero__overlay" data-overlay={hero.overlay} />
      <div className="game-hero__fx" data-anim={hero.animation} />

      <div className="game-hero__content container relative mx-auto flex max-w-6xl flex-col justify-end gap-8 px-4 py-14 md:min-h-[min(72vh,640px)] md:py-20">
        <Link
          href="/"
          className="w-fit text-sm text-[color:var(--game-text-muted)] transition hover:text-[color:var(--game-text)]"
        >
          ← Todos os universos
        </Link>

        <div className="flex flex-wrap items-end gap-6 md:gap-10">
          <ResponsiveImage
            src={theme.logo}
            alt={`Logo ${theme.name}`}
            mediaType="SET_LOGO"
            width={112}
            height={112}
            priority
            className="h-24 w-24 object-contain drop-shadow-lg md:h-28 md:w-28"
          />
          <div className="min-w-0 max-w-2xl flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--game-accent)]">
              {hero.tagline}
            </p>
            <h1 className="game-hero__title mt-2 text-4xl text-[color:var(--game-text)] md:text-5xl lg:text-6xl">
              {theme.name}
            </h1>
            <p className="mt-4 max-w-xl text-base text-[color:var(--game-text-muted)] md:text-lg">
              {healthLoading
                ? "Sincronizando o universo…"
                : cardCount > 0
                  ? `${hero.description} · ${cardCount.toLocaleString("pt-BR")} cartas no catálogo`
                  : hero.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={gameCardsPath(slug)}
                className="game-cta inline-flex min-h-12 items-center px-6 text-sm font-semibold"
              >
                {hero.ctaPrimary}
              </Link>
              <Link
                href={expansionsHref}
                className="inline-flex min-h-12 items-center rounded-[var(--game-button-radius)] border border-[color:var(--game-border)] bg-[color:var(--game-bg-elevated)]/70 px-6 text-sm font-medium text-[color:var(--game-text)] backdrop-blur-sm transition hover:border-[color:var(--game-accent)]"
              >
                {latestSetLabel ?? hero.ctaSecondary}
              </Link>
              <Link
                href={gameMarketplacePath(slug, gameId)}
                className="inline-flex min-h-12 items-center px-4 text-sm font-medium text-[color:var(--game-accent)] hover:underline"
              >
                Marketplace
              </Link>
              <Link
                href={`/decks?game=${encodeURIComponent(gameId)}`}
                className="inline-flex min-h-12 items-center px-4 text-sm font-medium text-[color:var(--game-text-muted)] hover:text-[color:var(--game-text)]"
              >
                Decks
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** @deprecated use GameHero — kept for imports */
export function PortalHero(props: Props) {
  return <GameHero {...props} />;
}
