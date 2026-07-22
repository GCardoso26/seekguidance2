"use client";

import { cn } from "@/lib/utils";

export const DECK_WORKSPACE_TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "cartas", label: "Cartas" },
  { id: "analise", label: "Análise" },
  { id: "colecao", label: "Coleção" },
  { id: "marketplace", label: "Marketplace" },
  { id: "historico", label: "Histórico" },
  { id: "comentarios", label: "Comentários" },
  { id: "config", label: "Configurações" },
] as const;

export type DeckWorkspaceTabId = (typeof DECK_WORKSPACE_TABS)[number]["id"];

type Props = {
  active: DeckWorkspaceTabId;
  onChange: (id: DeckWorkspaceTabId) => void;
};

export function DeckWorkspaceTabs({ active, onChange }: Props) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border pb-px"
      aria-label="Abas do deck workspace"
      data-testid="deck-workspace-tabs"
    >
      {DECK_WORKSPACE_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
            active === tab.id
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
