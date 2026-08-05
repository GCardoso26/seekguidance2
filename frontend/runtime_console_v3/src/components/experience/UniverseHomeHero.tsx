import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { brand } from "@/lib/brand";
import { gameLandingPath } from "@/lib/game-routes";
import { listAllGameThemes } from "@/lib/experience/game-theme";
import { shouldBypassImageOptimizer } from "@/lib/format-currency";
import { isGameInImplementationWave } from "@/lib/game-rollout";
import type { CatalogHealthReport } from "@/types/card";
import type { GameId } from "@/types/card";

type Props = {
  health: CatalogHealthReport;
};

/** Server Component — LCP is the H1 (system/sans, preloaded). */
export function UniverseHomeHero({ health }: Props) {
  const themes = listAllGameThemes();
  const total = health.total_cards ?? 0;

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      data-testid="universe-hero"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(214 42% 28% / 0.18), transparent 55%), linear-gradient(180deg, hsl(210 16% 96%) 0%, hsl(var(--background)) 70%)",
        }}
        aria-hidden
      />
      <div className="container relative mx-auto max-w-6xl px-4 pb-10 pt-12 md:pb-14 md:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {brand.shortName}
        </p>
        <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Escolha seu universo
        </h2>
        <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          O ecossistema definitivo para Trading Card Games — colecione, monte decks,
          descubra preços e compre em um só lugar.
        </p>
        {total > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {total.toLocaleString("pt-BR")} cartas indexadas em {themes.length} universos
          </p>
        )}

        <div
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          data-testid="universe-grid"
        >
          {themes.map((theme, idx) => {
            const count = health.by_game?.[theme.gameId as GameId] ?? 0;
            const available = isGameInImplementationWave(theme.gameId);
            return (
              <Link
                key={theme.gameId}
                href={gameLandingPath(theme.slug)}
                data-testid={`universe-card-${theme.slug}`}
                className="universe-card group relative flex min-h-[148px] flex-col justify-between overflow-hidden rounded-2xl border border-border p-4"
                style={
                  {
                    ["--card-tint" as string]: theme.primary,
                    background: `linear-gradient(155deg, ${theme.primary}22 0%, hsl(var(--card)) 55%)`,
                  } as CSSProperties
                }
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70"
                  style={{ background: theme.primary }}
                  aria-hidden
                />
                <Image
                  src={theme.logo}
                  alt=""
                  width={56}
                  height={56}
                  quality={70}
                  sizes="56px"
                  priority={idx < 2}
                  loading={idx < 2 ? "eager" : "lazy"}
                  unoptimized={shouldBypassImageOptimizer(theme.logo)}
                  className="relative h-12 w-12 object-contain drop-shadow-sm md:h-14 md:w-14"
                />
                <div className="relative mt-3">
                  <span className="block text-sm font-semibold leading-snug text-foreground md:text-base">
                    {theme.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {!available
                      ? "Em breve"
                      : count > 0
                        ? `${count.toLocaleString("pt-BR")} cartas`
                        : "Entrar no portal"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
