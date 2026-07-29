"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useGamePortal } from "@/components/experience/GameProvider";
import { gameMarketplaceSetPath } from "@/lib/game-routes";
import {
  featuredSetCodesForGame,
  gameHasSetLogos,
  setLogoPublicPath,
} from "@/lib/portal-set-logos";
import { cn } from "@/lib/utils";

type SetRow = { code: string; name: string; cardCount?: number };

async function fetchSets(gameId: string): Promise<SetRow[]> {
  const res = await fetch(`/api/catalog/sets?game=${encodeURIComponent(gameId)}&limit=24`);
  if (!res.ok) return [];
  const data = (await res.json()) as { sets?: SetRow[] };
  return data.sets ?? [];
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-3">
      <h2 className="portal-section-title text-xl md:text-2xl">{title}</h2>
    </div>
  );
}

/**
 * Carrossel dos 3 sets mais recentes com key art local (/logos/sets/{game}/*.avif).
 * Clique → marketplace filtrado por coleção (`/loja/busca?game=&set=`).
 */
export function PortalLatestSetsCarousel() {
  const { gameId, slug } = useGamePortal();
  const trackRef = useRef<HTMLUListElement>(null);

  const { data: sets = [], isLoading } = useQuery({
    queryKey: ["portal-latest-sets", gameId],
    queryFn: () => fetchSets(gameId),
    staleTime: 120_000,
  });

  const featured = useMemo(() => {
    if (!gameHasSetLogos(gameId)) return [];
    const codes = featuredSetCodesForGame(gameId);
    const byCode = new Map(sets.map((s) => [s.code?.toUpperCase(), s]));
    const picked = codes
      .map((code) => byCode.get(code))
      .filter((s): s is SetRow => Boolean(s?.code));

    if (picked.length >= 3) return picked.slice(0, 3);

    const fallback = sets
      .filter((s) => setLogoPublicPath(gameId, s.code))
      .slice(0, 3);
    return fallback.length ? fallback : picked;
  }, [gameId, sets]);

  if (!gameHasSetLogos(gameId)) return null;

  const scroll = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.85;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="portal-section container mx-auto max-w-6xl px-4 py-12">
      <SectionHeader title="Coleções em destaque" />
      {isLoading && (
        <p className="text-sm text-[color:var(--game-text-muted)]">Carregando coleções…</p>
      )}
      {!isLoading && featured.length === 0 && (
        <p className="text-sm text-[color:var(--game-text-muted)]">Sets em sincronização</p>
      )}
      {featured.length > 0 && (
        <div className="relative">
          <button
            type="button"
            className="portal-carousel-arrow absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 md:flex"
            aria-label="Anterior"
            onClick={() => scroll(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <ul
            ref={trackRef}
            className="portal-carousel-track flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {featured.map((set) => {
              const logo = setLogoPublicPath(gameId, set.code);
              const href = gameMarketplaceSetPath(slug, gameId, set.code);
              return (
                <li
                  key={set.code}
                  className="min-w-[min(100%,280px)] flex-[0_0_min(100%,280px)] snap-start sm:min-w-[calc(50%-8px)] sm:flex-[0_0_calc(50%-8px)] lg:min-w-[calc(33.333%-11px)] lg:flex-[0_0_calc(33.333%-11px)]"
                >
                  <Link
                    href={href}
                    className={cn(
                      "large-visual-card group flex h-full flex-col items-center p-6 text-center transition",
                      "hover:border-[color:var(--game-accent)]",
                    )}
                  >
                    <div className="relative mb-4 aspect-[400/500] w-full overflow-hidden rounded-[calc(var(--game-card-radius)-4px)] bg-[color:var(--game-bg)]">
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logo}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-3xl font-bold text-[color:var(--game-text-muted)]">
                          {set.code}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--game-accent)]">
                      {set.code}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-[color:var(--game-text)]">
                      {set.name}
                    </h3>
                    {set.cardCount ? (
                      <p className="mt-1 text-sm text-[color:var(--game-text-muted)]">
                        {set.cardCount.toLocaleString("pt-BR")} cartas
                      </p>
                    ) : null}
                    <span className="game-cta mt-4 inline-flex min-h-10 items-center px-4 text-xs font-semibold">
                      Ver cartas no marketplace →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="portal-carousel-arrow absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 md:flex"
            aria-label="Próximo"
            onClick={() => scroll(1)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}
