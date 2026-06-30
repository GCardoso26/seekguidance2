"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCategoryIcon } from "@/components/games/ProductCategoryIcon";
import {
  getCategoriesForGame,
  marketplaceCategoryHref,
  singlesSearchHref,
  type ProductCategoryId,
} from "@/lib/tcg-product-categories";
import { mapHealthToGames } from "@/lib/catalog-games";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import { GAME_TOKENS, gameSlugFromId } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import { cn } from "@/lib/utils";

const PRIORITY_SLUGS = ["lorcana", "mtg", "pokemon", "yugioh", "fab", "digimon", "onepiece"];

type Props = {
  className?: string;
};

export function GameMegaMenu({ className }: Props) {
  const pathname = usePathname();
  const { data: health } = useCatalogHealth();
  const games = mapHealthToGames(health).filter((g) => g.isAvailable);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activeSlug = pathname.match(/^\/loja\/([^/]+)/)?.[1] ?? null;

  const sorted = [...games].sort((a, b) => {
    const sa = gameSlugFromId(a.id as GameId);
    const sb = gameSlugFromId(b.id as GameId);
    const ai = PRIORITY_SLUGS.indexOf(sa);
    const bi = PRIORITY_SLUGS.indexOf(sb);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const close = useCallback(() => setOpenSlug(null), []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [close]);

  function categoryHref(slug: string, catId: ProductCategoryId): string {
    if (catId === "single") return singlesSearchHref(slug);
    return marketplaceCategoryHref(slug, catId);
  }

  return (
    <div ref={wrapRef} className={cn("relative border-t border-white/5", className)}>
      <nav
        className="flex items-center gap-0.5 overflow-x-auto py-2 scrollbar-hide"
        aria-label="Jogos TCG — categorias"
      >
        <Link
          href="/loja/busca"
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
            !activeSlug || activeSlug === "busca"
              ? "bg-luxury-gold text-luxury-onyx"
              : "text-luxury-mist hover:bg-white/5 hover:text-luxury-frost",
          )}
        >
          Todos
        </Link>

        {sorted.map((game) => {
          const slug = gameSlugFromId(game.id as GameId);
          const token = GAME_TOKENS[game.id as GameId];
          const active = activeSlug === slug;
          const isOpen = openSlug === slug;
          const categories = getCategoriesForGame(game.id as GameId).slice(0, 10);

          return (
            <div key={game.id} className="relative shrink-0">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={() => setOpenSlug(isOpen ? null : slug)}
                onMouseEnter={() => setOpenSlug(slug)}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active || isOpen
                    ? "bg-luxury-gold/15 text-luxury-gold"
                    : "text-luxury-mist hover:bg-white/5 hover:text-luxury-frost",
                )}
              >
                <Image src={game.logoUrl || token.logo} alt="" width={16} height={16} className="h-4 w-4 rounded object-contain" />
                <span className="max-w-[8rem] truncate">{game.name}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition", isOpen && "rotate-180")} />
              </button>

              {isOpen && (
                <div
                  className="absolute left-0 top-full z-30 mt-1 w-[min(100vw-2rem,42rem)] rounded-xl border border-white/10 bg-luxury-obsidian p-4 shadow-2xl"
                  onMouseLeave={close}
                >
                  <Link
                    href={`/loja/${slug}`}
                    className="mb-3 flex items-center gap-2 text-sm font-medium text-luxury-gold hover:underline"
                    onClick={close}
                  >
                    <Image src={token.logo} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
                    Homepage {token.name}
                  </Link>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-luxury-mist">Categorias</p>
                      <ul className="mt-2 space-y-0.5">
                        {categories.map((cat) => (
                          <li key={cat.id}>
                            <Link
                              href={categoryHref(slug, cat.id)}
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-luxury-frost hover:bg-white/5 hover:text-luxury-gold"
                              onClick={close}
                            >
                              <ProductCategoryIcon categoryId={cat.id} size={20} />
                              {cat.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg bg-white/5 p-4 text-center">
                      <Image
                        src={token.logo}
                        alt=""
                        width={80}
                        height={80}
                        className="h-20 w-20 object-contain opacity-90"
                      />
                      <p className="mt-2 text-sm font-medium text-luxury-frost">{token.name}</p>
                      <Link
                        href={singlesSearchHref(slug)}
                        className="mt-3 text-xs text-luxury-gold hover:underline"
                        onClick={close}
                      >
                        Buscar singles →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <Link
          href="/loja"
          className="shrink-0 rounded-full px-3 py-1.5 text-sm text-luxury-mist hover:text-luxury-gold"
        >
          Todos os jogos
        </Link>
      </nav>
    </div>
  );
}
