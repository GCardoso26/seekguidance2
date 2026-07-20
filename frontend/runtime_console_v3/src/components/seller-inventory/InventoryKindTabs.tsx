"use client";

import { GameSelectorTabs } from "@/components/seller-catalog/GameSelectorTabs";
import { cn } from "@/lib/utils";
import type { CatalogGameSlug } from "@/lib/seller-product-categories";
import type { InventoryKind } from "./types";

type Props = {
  kind: InventoryKind;
  onKindChange: (k: InventoryKind) => void;
  game: string;
  onGameChange: (slug: CatalogGameSlug) => void;
};

export function InventoryKindTabs({ kind, onKindChange, game, onGameChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        {(
          [
            { id: "cards" as const, label: "Cartas" },
            { id: "products" as const, label: "Produtos" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onKindChange(tab.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              kind === tab.id
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-muted/80",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {kind === "cards" ? (
        <GameSelectorTabs activeSlug={game} onChange={onGameChange} />
      ) : null}
    </div>
  );
}
