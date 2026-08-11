"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { Suspense } from "react";
import { LojaMarketplaceAlert } from "@/app/loja/LojaMarketplaceAlert";
import BlurText from "@/components/react-bits/BlurText";
import CountUp from "@/components/react-bits/CountUp";
import Magnet from "@/components/react-bits/Magnet";
import Noise from "@/components/react-bits/Noise";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";

type Props = {
  totalCards?: number;
  gameCount?: number;
};

/**
 * Hero Galeria de /loja — Noise + BlurText (proxy SplitText) + CountUp + Magnet no CTA.
 * Um floreio de interação por ação (Magnet). Sem wash de primary no fundo.
 */
export function LojaHeroGallery({ totalCards = 0, gameCount = 0 }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="relative overflow-hidden border-b border-border bg-background"
      data-testid="loja-hero-gallery"
    >
      {!reduceMotion && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-35" aria-hidden>
          <Noise patternAlpha={10} patternRefreshInterval={4} patternSize={250} />
        </div>
      )}
      <div className="container relative z-10 mx-auto max-w-6xl px-4 py-10">
        <Breadcrumbs
          className="mb-4 text-muted-foreground"
          items={[{ label: "Início", href: "/" }, { label: "Loja" }]}
        />
        <Suspense fallback={null}>
          <LojaMarketplaceAlert />
        </Suspense>

        <h1 className="sr-only">Catálogo de TCGs</h1>
        {reduceMotion ? (
          <p className="font-display text-3xl font-bold text-foreground" aria-hidden>
            Catálogo de TCGs
          </p>
        ) : (
          <BlurText
            text="Catálogo de TCGs"
            delay={60}
            animateBy="words"
            direction="top"
            className="font-display text-3xl font-bold text-foreground"
          />
        )}

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Cada jogo te leva a universos diferentes. Explore cada universo, tudo no mesmo lugar.
        </p>

        {(totalCards > 0 || gameCount > 0) && (
          <p className="mt-4 text-sm text-muted-foreground" data-testid="loja-hero-stats">
            {totalCards > 0 && (
              <>
                <span className="font-display text-lg font-semibold text-foreground tabular-nums">
                  {reduceMotion ? (
                    totalCards.toLocaleString("pt-BR")
                  ) : (
                    <CountUp to={totalCards} duration={1.4} separator="." className="inline" />
                  )}
                </span>{" "}
                cartas
              </>
            )}
            {totalCards > 0 && gameCount > 0 && <span className="mx-2 text-border">·</span>}
            {gameCount > 0 && (
              <>
                <span className="font-display text-lg font-semibold text-foreground tabular-nums">
                  {reduceMotion ? gameCount : <CountUp to={gameCount} duration={1.2} className="inline" />}
                </span>{" "}
                jogos
              </>
            )}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Magnet
            padding={48}
            magnetStrength={3}
            disabled={Boolean(reduceMotion)}
            wrapperClassName="inline-flex"
            innerClassName="inline-flex"
          >
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/loja/busca" prefetch>
                Buscar singles
              </Link>
            </Button>
          </Magnet>
          <Button asChild variant="outline" className="border-border">
            <Link href="/loja/selados" prefetch={false}>
              Produtos selados
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
