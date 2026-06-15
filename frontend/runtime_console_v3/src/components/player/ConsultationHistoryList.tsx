"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatRelativeTimePt } from "@/lib/format-relative-time";
import { Star } from "lucide-react";
import { useConsultations } from "@/hooks/useConsultations";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { getTcgBrand } from "@/lib/tcg-brand";
import { parseJudgeVerdict } from "@/lib/judge-verdict";
import type { JudgeHistoryItem } from "@/types/judge";
import { cn } from "@/lib/utils";

type Props = {
  onSelect?: (item: JudgeHistoryItem) => void;
  compact?: boolean;
};

export function ConsultationHistoryList({ onSelect, compact }: Props) {
  const { user } = useJudgeAuth();
  const {
    items,
    loading,
    query,
    setQuery,
    tcgFilter,
    setTcgFilter,
    favoritesOnly,
    setFavoritesOnly,
    isFavorite,
    toggleFavorite,
  } = useConsultations(user?.id);

  const tcgChips = useMemo(
    () => [...new Set(items.map((i) => i.tcg))].slice(0, 6),
    [items],
  );

  if (loading) {
    return <p className="text-sm text-slate-500">Carregando histórico…</p>;
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar consultas…"
        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
        aria-label="Buscar consultas"
      />
      {!compact && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTcgFilter("all")}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs",
              tcgFilter === "all" ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-400",
            )}
          >
            Todos
          </button>
          {tcgChips.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTcgFilter(id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs",
                tcgFilter === id ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-400",
              )}
            >
              {getTcgBrand(id).icon}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs",
              favoritesOnly ? "bg-amber-500/20 text-amber-300" : "text-slate-400",
            )}
          >
            <Star className={cn("h-3 w-3", favoritesOnly && "fill-current")} />
            Favoritos
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-center text-sm text-slate-500">
          Nenhuma consulta encontrada.{" "}
          <Link href="/judge" className="text-amber-400 hover:underline">
            Ir para a mesa
          </Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const brand = getTcgBrand(item.tcg);
            const verdict = parseJudgeVerdict({
              success: item.success,
              answer: item.answer,
              confidence: item.confidence,
              sources: item.sources ?? [],
              runtime_confidence: item.runtime_confidence ?? 0.9,
              verdict: item.verdict,
            }).label;
            const inner = (
              <>
                <p className="truncate text-sm font-medium text-slate-100">{item.question}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {brand.icon} · {verdict} ·{" "}
                  {formatRelativeTimePt(item.createdAt)}
                </p>
              </>
            );
            return (
              <li key={item.id} className="flex gap-2 rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                {onSelect ? (
                  <button type="button" onClick={() => onSelect(item)} className="min-w-0 flex-1 text-left">
                    {inner}
                  </button>
                ) : (
                  <div className="min-w-0 flex-1">{inner}</div>
                )}
                <button
                  type="button"
                  onClick={() => toggleFavorite(item)}
                  className="shrink-0 text-slate-400 hover:text-amber-400"
                  aria-label="Favoritar"
                >
                  <Star
                    className={cn("h-4 w-4", isFavorite(item.id) && "fill-amber-400 text-amber-400")}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
