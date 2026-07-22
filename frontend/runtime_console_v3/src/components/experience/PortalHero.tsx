"use client";

import Image from "next/image";
import Link from "next/link";
import { useGamePortal } from "@/components/experience/GameProvider";
import { gameCardsPath } from "@/lib/game-routes";
import { shouldBypassImageOptimizer } from "@/lib/format-currency";

type Props = {
  cardCount?: number;
  healthLoading?: boolean;
};

export function PortalHero({ cardCount = 0, healthLoading }: Props) {
  const { theme, slug } = useGamePortal();

  return (
    <section className="portal-hero border-b border-border py-10 md:py-14">
      <div className="container mx-auto max-w-6xl px-4">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Todos os universos
        </Link>
        <div className="mt-6 flex flex-wrap items-end gap-6">
          <Image
            src={theme.logo}
            alt=""
            width={88}
            height={88}
            unoptimized={shouldBypassImageOptimizer(theme.logo)}
            className="h-20 w-20 object-contain md:h-[5.5rem] md:w-[5.5rem]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Portal
            </p>
            <h1
              className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
              style={{ fontFamily: "var(--font-display-family), serif" }}
            >
              {theme.name}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              {healthLoading
                ? "Carregando catálogo…"
                : cardCount > 0
                  ? `${cardCount.toLocaleString("pt-BR")} cartas · singles, expansões e decks neste universo`
                  : "Catálogo em sincronização — explore singles e decks enquanto o índice atualiza"}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={gameCardsPath(slug)}
                className="portal-cta inline-flex min-h-11 items-center rounded-md px-5 text-sm font-semibold transition"
              >
                Explorar singles
              </Link>
              <Link
                href={`/decks?game=${encodeURIComponent(theme.gameId)}`}
                className="inline-flex min-h-11 items-center rounded-md border border-border bg-background/80 px-5 text-sm font-medium text-foreground transition hover:border-[color:var(--game-primary)]"
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
