"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatRelativeTimePt } from "@/lib/format-relative-time";
import { Clock, Search, Star, Trash2, X } from "lucide-react";
import Link from "next/link";
import { getTcgBrand } from "@/lib/tcg-brand";
import { parseJudgeVerdict } from "@/lib/judge-verdict";
import { TCG_OPTIONS, type JudgeHistoryItem, type TcgType } from "@/types/judge";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  items: JudgeHistoryItem[];
  loading?: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  tcgFilter: TcgType | "all";
  onTcgFilterChange: (tcg: TcgType | "all") => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (v: boolean) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (item: JudgeHistoryItem) => void;
  onSelect: (item: JudgeHistoryItem) => void;
  onDelete?: (id: string) => void;
};

function verdictSummary(item: JudgeHistoryItem): string {
  const parsed = parseJudgeVerdict({
    success: item.success,
    answer: item.answer,
    confidence: item.confidence,
    sources: item.sources ?? [],
    runtime_confidence: item.runtime_confidence ?? 0.9,
    verdict: item.verdict,
    rule_applied: item.rule_applied,
    explanation: item.explanation,
    exceptions: item.exceptions,
  });
  return parsed.label;
}

export function ConsultationHistory({
  open,
  onClose,
  items,
  loading,
  query,
  onQueryChange,
  tcgFilter,
  onTcgFilterChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onDelete,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-label="Fechar histórico"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
            aria-label="Minhas consultas"
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-lg font-bold text-white">Minhas consultas</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted/80 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-3 border-b border-border p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Buscar consultas…"
                  className="w-full surface-card py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-luxury-gold/30"
                  aria-label="Buscar consultas"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onTcgFilterChange("all")}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    tcgFilter === "all"
                      ? "bg-primary/20 text-primary-light"
                      : "bg-muted/50 text-muted-foreground",
                  )}
                >
                  Todos
                </button>
                {TCG_OPTIONS.slice(0, 8).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onTcgFilterChange(g.id)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      tcgFilter === g.id
                        ? "bg-primary/20 text-primary-light"
                        : "bg-muted/50 text-muted-foreground",
                    )}
                  >
                    {g.label.split(" ")[0]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                  favoritesOnly ? "bg-primary/20 text-primary-light" : "text-muted-foreground",
                )}
              >
                <Star className={cn("h-3.5 w-3.5", favoritesOnly && "fill-luxury-gold")} />
                Favoritos
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading && <p className="text-center text-sm text-muted-foreground/70">Carregando…</p>}
              {!loading && items.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma consulta ainda.</p>
                  <p className="mt-2 text-xs text-muted-foreground/70">Faça sua primeira pergunta na mesa!</p>
                  <Link
                    href="/judge"
                    onClick={onClose}
                    className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Ir para a mesa
                  </Link>
                </div>
              )}
              <ul className="space-y-2">
                {items.map((item) => {
                  const brand = getTcgBrand(item.tcg);
                  const summary = verdictSummary(item);
                  const rel = formatRelativeTimePt(item.createdAt);
                  return (
                    <li key={item.id}>
                      <div className="group flex gap-2 surface-card p-3 transition hover:border-border">
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(item);
                            onClose();
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-sm font-medium text-foreground">{item.question}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/70">
                            <span
                              className="rounded px-1.5 py-0.5 font-semibold"
                              style={{
                                background: `hsl(${brand.accent} / 0.2)`,
                                color: `hsl(${brand.accent})`,
                              }}
                            >
                              {brand.icon}
                            </span>
                            <span>{summary}</span>
                            <span>{rel}</span>
                          </div>
                        </button>
                        <div className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(item)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
                            aria-label={isFavorite(item.id) ? "Remover favorito" : "Favoritar"}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                isFavorite(item.id) && "fill-luxury-gold text-primary",
                              )}
                            />
                          </button>
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(item.id)}
                              className="rounded-lg p-1.5 text-muted-foreground/70 opacity-0 transition group-hover:opacity-100 hover:bg-muted hover:text-red-400"
                              aria-label="Remover consulta"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
