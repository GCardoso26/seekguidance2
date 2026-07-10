"use client";

import { Command } from "cmdk";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Star, X } from "lucide-react";
import { trackSearchEvent } from "@/features/search/analytics/searchAnalytics";
import {
  loadSearchFavorites,
  toggleSearchFavorite,
  type SearchFavorite,
} from "@/features/search/storage/searchFavorites";
import { loadSearchHistory, pushSearchHistory, pushSearchQuery } from "@/features/search/storage/searchHistory";
import { useSearchOrchestrator } from "@/features/search/useSearchOrchestrator";
import { GROUP_LABELS, GROUP_ORDER, type SearchResult, type SearchResultGroup } from "@/features/search/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlobalCommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<SearchFavorite[]>([]);
  const { results, loading, context } = useSearchOrchestrator(query, open);

  useEffect(() => {
    if (open) setFavorites(loadSearchFavorites());
    else setQuery("");
  }, [open]);

  const grouped = useMemo(() => {
    const map = new Map<SearchResultGroup, SearchResult[]>();
    for (const r of results) {
      const list = map.get(r.group) ?? [];
      list.push(r);
      map.set(r.group, list);
    }
    return map;
  }, [results]);

  const history = useMemo(() => loadSearchHistory().slice(0, 6), [open, query]);

  const selectResult = useCallback(
    (item: SearchResult) => {
      pushSearchQuery(query);
      pushSearchHistory({
        id: `res-${item.id}`,
        query,
        resultId: item.id,
        title: item.title,
        href: item.href,
        group: item.group,
      });
      trackSearchEvent({
        type: "select",
        query,
        resultId: item.id,
        providerId: item.providerId,
        surface: context.surface,
      });
      router.push(item.href);
      onOpenChange(false);
    },
    [query, router, onOpenChange, context.surface],
  );

  const onToggleFavorite = useCallback((item: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = toggleSearchFavorite({
      id: item.id,
      title: item.title,
      href: item.href,
      group: item.group,
    });
    setFavorites(next);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-foreground/50 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
      data-testid="global-command-palette"
    >
      <div className="mx-auto mt-[10vh] w-full max-w-2xl px-4" onClick={(e) => e.stopPropagation()}>
        <Command
          label="Command Palette"
          className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          shouldFilter={false}
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Buscar cartas, pedidos, clientes, rotas…"
              className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              autoFocus
              data-testid="global-command-palette-input"
              aria-label="Busca global"
            />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded p-1 hover:bg-muted"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Command.List className="max-h-[min(60vh,480px)] overflow-y-auto p-2">
            {query.length < 2 && favorites.length > 0 && (
              <Command.Group heading="Favoritos" className="cmdk-group-heading">
                {favorites.map((f) => (
                  <Command.Item
                    key={f.id}
                    value={`fav-${f.id}`}
                    onSelect={() => router.push(f.href)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-muted/50"
                  >
                    <Star className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm">{f.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {query.length < 2 && history.length > 0 && (
              <Command.Group heading="Recentes" className="cmdk-group-heading">
                {history.map((h) => (
                  <Command.Item
                    key={h.id}
                    value={`hist-${h.id}`}
                    onSelect={() => {
                      if (h.href) router.push(h.href);
                      else setQuery(h.query);
                    }}
                    className="cursor-pointer rounded-lg px-2 py-2 text-sm aria-selected:bg-muted/50"
                  >
                    {h.title ?? h.query}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {query.length >= 2 && loading && (
              <div className="space-y-2 p-2" data-testid="command-palette-skeleton">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/50" />
                ))}
              </div>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                Nenhum resultado para &quot;{query}&quot;
              </Command.Empty>
            )}

            {GROUP_ORDER.map((group) => {
              const items = grouped.get(group);
              if (!items?.length) return null;
              return (
                <Command.Group key={group} heading={GROUP_LABELS[group]} className="cmdk-group-heading">
                  {items.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.id}
                      onSelect={() => selectResult(item)}
                      className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-muted/50"
                    >
                      {item.group === "cards" && item.meta?.image ? (
                        <div className="relative h-8 w-6 shrink-0 overflow-hidden rounded">
                          <Image src={String(item.meta.image)} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        {item.subtitle && (
                          <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        title="Favoritar"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => onToggleFavorite(item, e)}
                      >
                        <Star className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                      </button>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-caption text-muted-foreground">
            <span>
              <kbd className="rounded border border-border px-1">↑↓</kbd> navegar
            </span>
            <span>
              <kbd className="rounded border border-border px-1">↵</kbd> abrir
            </span>
            <span>
              <kbd className="rounded border border-border px-1">Esc</kbd> fechar
            </span>
            <span className="text-muted-foreground/70">{context.surface}</span>
          </div>
        </Command>
      </div>
      <style jsx global>{`
        .cmdk-group-heading {
          padding: 0.25rem 0.5rem;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgb(163 163 163);
        }
      `}</style>
    </div>
  );
}
