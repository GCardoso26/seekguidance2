"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadJudgeFavorites, toggleJudgeFavorite, isJudgeFavorite } from "@/lib/judge-favorites";
import { loadJudgeHistoryHybrid } from "@/lib/judge-cloud-history";
import { filterJudgeHistory } from "@/lib/judge-history-groups";
import type { JudgeHistoryItem, TcgType } from "@/types/judge";

export function useConsultations(userId?: string | null) {
  const [items, setItems] = useState<JudgeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tcgFilter, setTcgFilter] = useState<TcgType | "all">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    setLoading(true);
    const loaded = await loadJudgeHistoryHybrid(userId ?? undefined);
    setItems(loaded);
    setFavoriteIds(new Set(loadJudgeFavorites().map((f) => f.id)));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    let list = filterJudgeHistory(items, query);
    if (tcgFilter !== "all") list = list.filter((i) => i.tcg === tcgFilter);
    if (favoritesOnly) list = list.filter((i) => favoriteIds.has(i.id));
    return list;
  }, [items, query, tcgFilter, favoritesOnly, favoriteIds]);

  const toggleFavorite = useCallback((item: JudgeHistoryItem) => {
    toggleJudgeFavorite(item);
    setFavoriteIds(new Set(loadJudgeFavorites().map((f) => f.id)));
  }, []);

  const isFavorite = useCallback((id: string) => favoriteIds.has(id) || isJudgeFavorite(id), [favoriteIds]);

  const removeLocal = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    // TODO: DELETE cloud session item quando API estiver disponível
  }, []);

  return {
    items: filtered,
    allItems: items,
    loading,
    query,
    setQuery,
    tcgFilter,
    setTcgFilter,
    favoritesOnly,
    setFavoritesOnly,
    toggleFavorite,
    isFavorite,
    removeLocal,
    reload,
  };
}
