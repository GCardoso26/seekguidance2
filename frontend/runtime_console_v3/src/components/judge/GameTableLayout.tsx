"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type MobileTab = "history" | "play" | "sources";

type Props = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  className?: string;
  /** Incrementar para abrir aba Histórico no mobile (ex.: botão do header). */
  openHistorySignal?: number;
};

const TAB_LABELS: Record<MobileTab, string> = {
  history: "Histórico",
  play: "Mesa",
  sources: "Fontes",
};

export function GameTableLayout({ left, center, right, className, openHistorySignal }: Props) {
  const [tab, setTab] = useState<MobileTab>("play");

  useEffect(() => {
    if (openHistorySignal && openHistorySignal > 0) {
      setTab("history");
      document.getElementById("judge-history-zone")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [openHistorySignal]);

  return (
    <div className={cn("judge-game-table", className)}>
      {/* Desktop: três zonas */}
      <div className="hidden gap-4 md:grid md:grid-cols-[minmax(200px,240px)_1fr_minmax(220px,280px)] md:items-start lg:gap-6">
        <section
          id="judge-history-zone"
          className="judge-table-zone p-3 lg:p-4"
          aria-label="Histórico de partida"
        >
          {left}
        </section>
        <section className="min-w-0 space-y-4" aria-label="Pergunta e resposta">
          {center}
        </section>
        <section className="judge-table-zone p-3 lg:sticky lg:top-24 lg:p-4" aria-label="Fontes e regras">
          {right}
        </section>
      </div>

      {/* Mobile: abas inferiores */}
      <div className="md:hidden">
        <div className="min-h-[50vh] pb-20">
          {tab === "history" && <div className="judge-table-zone p-3">{left}</div>}
          {tab === "play" && <div className="space-y-4">{center}</div>}
          {tab === "sources" && <div className="judge-table-zone p-3">{right}</div>}
        </div>
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[var(--tcg-border)] bg-[var(--tcg-surface-elevated)]"
          role="tablist"
          aria-label="Zonas da mesa"
        >
          {(["history", "play", "sources"] as MobileTab[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "min-h-12 flex-1 py-3 text-center text-xs font-semibold text-[var(--tcg-text-secondary)]",
                tab === key && "judge-mobile-tab--active",
              )}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
