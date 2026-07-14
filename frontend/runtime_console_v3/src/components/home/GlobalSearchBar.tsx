"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useSearchPlatform } from "@/features/search/SearchPlatformContext";
import { CardImage } from "@/components/ui/CardImage";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { cardImageUrl, formatCurrency, isSvgImageUrl } from "@/lib/format-currency";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { CatalogSearchResponse, GameId } from "@/types/card";
import { cn } from "@/lib/utils";

interface GlobalSearchBarProps {
  className?: string;
  placeholder?: string;
  defaultGame?: string;
  variant?: "hero" | "header";
  showGameFilter?: boolean;
}

export function GlobalSearchBar({
  className,
  placeholder = "Buscar cartas em todos os TCGs…",
  defaultGame,
  variant = "hero",
}: GlobalSearchBarProps) {
  const router = useRouter();
  const { openPalette } = useSearchPlatform();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogSearchResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openPalette();
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (defaultGame) params.set("game", defaultGame);
    const suffix = params.toString();
    setIsOpen(false);
    router.push(suffix ? `/loja/busca?${suffix}` : "/loja/busca");
  };

  const searchCards = useCallback(async (q: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: "8" });
      if (defaultGame) params.set("game", defaultGame);
      const res = await fetch(`/api/catalog/cards/search?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as CatalogSearchResponse;
        setResults(data);
      }
    } catch {
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [defaultGame]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length >= 2) {
      void searchCards(q);
    } else {
      setResults(null);
    }
  }, [debouncedQuery, searchCards]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isHeader = variant === "header";
  const cards = results?.cards ?? [];
  const showDropdown = isOpen && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Busca global de cartas"
      >
        <div className="relative">
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
              isHeader ? "left-3 h-4 w-4" : "left-4 h-5 w-5",
            )}
            aria-hidden
          />
          <Input
            type="search"
            role="combobox"
            data-testid="global-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "w-full pr-14",
              isHeader
                ? "h-9 rounded-lg border-border bg-background pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:ring-primary/30"
                : "h-12 rounded-full border-border bg-card/80 pl-12 text-base shadow-sm backdrop-blur-sm",
            )}
            aria-label="Termo de busca"
            aria-expanded={showDropdown}
            aria-controls="global-search-results"
            aria-autocomplete="list"
            aria-haspopup="listbox"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {!query && isHeader && (
              <button
                type="button"
                onClick={() => openPalette()}
                className="hidden min-h-11 min-w-11 items-center justify-center rounded border border-border px-2 text-caption text-muted-foreground hover:bg-muted sm:inline-flex"
                aria-label="Abrir busca universal (Ctrl+K)"
              >
                ⌘K
              </button>
            )}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults(null);
                }}
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </form>

      {showDropdown && (
        <div
          id="global-search-results"
          data-testid="search-results"
          className={cn(
            "absolute top-full z-30 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border shadow-xl",
            isHeader
              ? "border-border bg-card"
              : "border-border bg-background",
          )}
        >
          {isLoading && (
            <p className="p-4 text-center text-sm text-muted-foreground">Buscando…</p>
          )}

          {!isLoading && cards.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Cards</p>
              {cards.map((card) => {
                const token = GAME_TOKENS[card.game as GameId];
                const price = card.lowestPrice ?? card.latestPrice?.price;
                const imageSrc = cardImageUrl(card);
                return (
                  <Link
                    key={card.id}
                    href={`/loja/cartas/${card.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded px-2 py-2 hover:bg-muted/50"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                      <CardImage
                        src={imageSrc}
                        alt={card.name}
                        fill
                        listQuality
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{card.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {card.set.name} · {token?.name ?? card.game}
                      </p>
                    </div>
                    {price !== undefined && (
                      <span className="shrink-0 text-sm font-medium text-success">
                        {formatCurrency(price, card.latestPrice?.currency ?? "USD")}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {!isLoading && cards.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">Nenhum resultado</p>
          )}

          <div className="border-t p-2">
            <Link
              href={`/loja/busca?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-primary hover:underline"
            >
              Ver todos os resultados →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
