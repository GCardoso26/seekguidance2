"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Download, Star } from "lucide-react";
import { formatRelativeTimePt } from "@/lib/format-relative-time";
import { useConsultations } from "@/hooks/useConsultations";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { usePlanGate } from "@/hooks/usePlanGate";
import { useUpgradeModal } from "@/components/premium/UpgradeModalProvider";
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
  const exportGate = usePlanGate("export");
  const { showUpgrade } = useUpgradeModal();
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
    return <p className="text-sm text-muted-foreground/70">Carregando histórico…</p>;
  }

  const exportCsv = () => {
    if (!exportGate.allowed) {
      showUpgrade("export");
      return;
    }
    const header = "data,tcg,pergunta,veredito\n";
    const rows = items
      .map((item) => {
        const verdict = parseJudgeVerdict({
          success: item.success,
          answer: item.answer,
          confidence: item.confidence,
          sources: item.sources ?? [],
          runtime_confidence: item.runtime_confidence ?? 0.9,
          verdict: item.verdict,
        }).label;
        const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
        return [esc(item.createdAt.slice(0, 10)), esc(item.tcg), esc(item.question), esc(verdict)].join(",");
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historico-judge-tcg.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {!compact && items.length > 0 && (
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted/80"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
          {!exportGate.allowed && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-caption text-primary">Pro</span>
          )}
        </button>
      )}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar consultas…"
        className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
        aria-label="Buscar consultas"
      />
      {!compact && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTcgFilter("all")}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs",
              tcgFilter === "all" ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground",
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
                tcgFilter === id ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground",
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
              favoritesOnly ? "bg-primary/20 text-primary" : "text-muted-foreground",
            )}
          >
            <Star className={cn("h-3 w-3", favoritesOnly && "fill-current")} />
            Favoritos
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground/70">
          Nenhuma consulta encontrada.{" "}
          <Link href="/judge" className="text-primary hover:underline">
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
                <p className="truncate text-sm font-medium text-foreground">{item.question}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {brand.icon} · {verdict} ·{" "}
                  {formatRelativeTimePt(item.createdAt)}
                </p>
              </>
            );
            return (
              <li key={item.id} className="flex gap-2 surface-card p-3">
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
                  className="shrink-0 text-muted-foreground hover:text-primary"
                  aria-label="Favoritar"
                >
                  <Star
                    className={cn("h-4 w-4", isFavorite(item.id) && "fill-primary text-primary")}
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
