"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { useGamePortal } from "@/components/experience/GameProvider";
import { HeroAssetFrame } from "@/components/assets/HeroAssetFrame";
import { GalleryCountUp } from "@/components/gallery/GalleryMotion";
import SoftAurora from "@/components/react-bits/SoftAurora";
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
  /** Carrossel full-bleed (ex.: banners Lorcana) — tem prioridade sobre backgroundImage */
  backgroundImages?: readonly string[] | null;
  className?: string;
};

const CAROUSEL_MS = 6_500;

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
  backgroundImages,
  className,
}: Props) {
  const { theme, slug, gameId } = useGamePortal();
  const hero = theme.hero;
  const expansionsHref = latestSetHref ?? gameExpansionsPath(slug);
  const reduceMotion = useReducedMotion();

  const carousel =
    backgroundImages && backgroundImages.length > 0
      ? [...backgroundImages]
      : [];
  const stillSrc =
    carousel[0] ||
    backgroundImage ||
    hero.imageDesktop ||
    hero.image ||
    hero.imageMobile ||
    hero.imageFallback ||
    null;
  const hasCarousel = carousel.length > 1;
  const hasStill = Boolean(stillSrc) || hasCarousel;

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (!hasCarousel) return;
    const id = window.setInterval(() => {
      setSlide((i) => (i + 1) % carousel.length);
    }, CAROUSEL_MS);
    return () => window.clearInterval(id);
  }, [hasCarousel, carousel.length]);

  const overlayMode = hasCarousel || Boolean(backgroundImage) ? "banner" : hero.overlay;

  return (
    <section
      className={cn("game-hero border-b border-[color:var(--game-border)]", className)}
      aria-label={`Hero ${theme.name}`}
      data-hero-carousel={hasCarousel ? "true" : undefined}
    >
      <div className="game-hero__media" aria-hidden>
        {hasCarousel ? (
          carousel.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className={cn(
                "game-hero__carousel-slide absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
                i === slide ? "opacity-100" : "opacity-0",
              )}
            />
          ))
        ) : hasStill ? (
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

      <div className="game-hero__overlay" data-overlay={overlayMode} />
      <div className="game-hero__fx" data-anim={hero.animation} />
      {!reduceMotion && !hasCarousel && !hasStill && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-30 mix-blend-soft-light"
          aria-hidden
          data-testid="game-hero-soft-aurora"
        >
          {/* SoftAurora exige hex; valores = Noite canônica (índigo atenuado), não neon default. */}
          <SoftAurora
            speed={0.4}
            brightness={0.42}
            color1="#2a3148"
            color2="#3d4560"
            enableMouseInteraction={false}
            bandHeight={0.5}
            noiseAmplitude={0.7}
          />
        </div>
      )}

      <div className="game-hero__content container relative z-[2] mx-auto flex max-w-6xl flex-col justify-end gap-8 px-4 py-14 md:min-h-[min(72vh,640px)] md:py-20">
        <Link
          href="/"
          className={cn(
            "w-fit text-sm transition",
            hasCarousel
              ? "text-slate-800/80 hover:text-slate-950"
              : "text-[color:var(--game-text-muted)] hover:text-[color:var(--game-text)]",
          )}
        >
          ← Todos os universos
        </Link>

        <div className="min-w-0 max-w-2xl">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.28em]",
              hasCarousel ? "text-amber-800" : "text-[color:var(--game-accent)]",
            )}
          >
            {hero.tagline}
          </p>
          <h1
            className={cn(
              "game-hero__title mt-2 text-4xl md:text-5xl lg:text-6xl",
              hasCarousel ? "text-slate-950" : "text-[color:var(--game-text)]",
            )}
          >
            {theme.name}
          </h1>
          <p
            className={cn(
              "mt-4 max-w-xl text-base md:text-lg",
              hasCarousel
                ? "font-medium text-slate-900"
                : "text-[color:var(--game-text-muted)]",
            )}
          >
            {healthLoading
              ? "Sincronizando o universo…"
              : cardCount > 0
                ? (
                  <>
                    {hero.description} ·{" "}
                    <GalleryCountUp to={cardCount} className="inline tabular-nums" /> cartas no catálogo
                  </>
                )
                : hero.description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={gameCardsPath(slug)}
              className="game-cta inline-flex min-h-12 items-center px-6 text-sm font-semibold"
              data-testid="game-cta-primary"
            >
              {hero.ctaPrimary}
            </Link>
            <Link
              href={expansionsHref}
              className={cn(
                "inline-flex min-h-12 items-center rounded-[var(--game-button-radius)] border px-6 text-sm font-medium backdrop-blur-sm transition",
                hasCarousel
                  ? "border-slate-900/20 bg-white/75 text-slate-900 hover:border-amber-700/50"
                  : "border-[color:var(--game-border)] bg-[color:var(--game-bg-elevated)]/70 text-[color:var(--game-text)] hover:border-[color:var(--game-accent)]",
              )}
            >
              {latestSetLabel ?? hero.ctaSecondary}
            </Link>
            <Link
              href={gameMarketplacePath(slug, gameId)}
              className={cn(
                "inline-flex min-h-12 items-center px-4 text-sm font-medium hover:underline",
                hasCarousel ? "text-amber-900" : "text-[color:var(--game-accent)]",
              )}
            >
              Marketplace
            </Link>
            <Link
              href={`/decks?game=${encodeURIComponent(gameId)}`}
              className={cn(
                "inline-flex min-h-12 items-center px-4 text-sm font-medium",
                hasCarousel
                  ? "text-slate-800 hover:text-slate-950"
                  : "text-[color:var(--game-text-muted)] hover:text-[color:var(--game-text)]",
              )}
            >
              Decks
            </Link>
          </div>
        </div>

        {hasCarousel ? (
          <div className="flex gap-2" role="tablist" aria-label="Banners do portal">
            {carousel.map((src, i) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={i === slide}
                aria-label={`Banner ${i + 1}`}
                className={cn(
                  "h-1.5 w-8 rounded-full transition",
                  i === slide ? "bg-slate-900" : "bg-slate-900/30 hover:bg-slate-900/50",
                )}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** @deprecated use GameHero — kept for imports */
export function PortalHero(props: Props) {
  return <GameHero {...props} />;
}
