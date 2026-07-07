"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { trackSearchEvent } from "@/features/search/analytics/searchAnalytics";
import { rankSearchResults } from "@/features/search/ranking/rankResults";
import { ALL_SEARCH_PROVIDERS, getActiveProviders } from "@/features/search/providers/registry";
import { loadSearchFavorites } from "@/features/search/storage/searchFavorites";
import { loadSearchHistory } from "@/features/search/storage/searchHistory";
import type { SearchContext, SearchResult, SearchSurface } from "@/features/search/types";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

const DEBOUNCE_MS = 180;

function detectSurface(pathname: string): SearchSurface {
  if (pathname.startsWith("/vendedor/painel")) return "seller";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/judge") || pathname.startsWith("/regras")) return "judge";
  if (pathname.startsWith("/loja") || pathname.startsWith("/mercado") || pathname.startsWith("/store")) {
    return "marketplace";
  }
  return "public";
}

export function useSearchOrchestrator(query: string, enabled: boolean) {
  const pathname = usePathname() ?? "/";
  const { user } = useJudgeAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const context: SearchContext = useMemo(
    () => ({
      surface: detectSurface(pathname),
      pathname,
      isAuthenticated: Boolean(user),
      isSeller: pathname.startsWith("/vendedor/painel"),
      isAdmin: pathname.startsWith("/admin"),
      isJudge: pathname.startsWith("/judge") || pathname.startsWith("/regras"),
    }),
    [pathname, user],
  );

  const favorites = useMemo(() => new Set(loadSearchFavorites().map((f) => f.id)), []);
  const recentIds = useMemo(
    () => new Set(loadSearchHistory().map((h) => h.resultId ?? h.id).filter(Boolean) as string[]),
    [query],
  );

  const runSearch = useCallback(
    async (q: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!enabled || q.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const started = performance.now();
      const providers = getActiveProviders(ALL_SEARCH_PROVIDERS, context);

      try {
        const batches = await Promise.all(
          providers.map((p) =>
            p.search(q, context, controller.signal).catch(() => [] as SearchResult[]),
          ),
        );
        const flat = batches.flat();
        const ranked = rankSearchResults(q, flat, {
          favoriteIds: favorites,
          recentIds,
          providerBoost: { navigation: 5, "seller-global": 10 },
        });
        setResults(ranked);
        trackSearchEvent({
          type: ranked.length ? "search" : "empty",
          query: q,
          resultCount: ranked.length,
          latencyMs: Math.round(performance.now() - started),
          surface: context.surface,
        });
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [context, enabled, favorites, recentIds],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void runSearch(query), DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, runSearch]);

  return { results, loading, context };
}
