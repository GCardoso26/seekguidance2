"use client";

import type { CardSnapshot, GameLogEntry } from "@/lib/game-log/schema";
import { cn } from "@/lib/utils";

type Props = {
  entries: GameLogEntry[];
  highlightedSequences?: number[];
  onCardHover?: (card: CardSnapshot) => void;
};

export function GameLogViewer({ entries, highlightedSequences, onCardHover }: Props) {
  return (
    <div className="space-y-1 font-mono text-xs">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={cn(
            "rounded border border-border/60 px-2 py-1.5",
            highlightedSequences?.includes(entry.sequence) && "border-amber-500/60 bg-amber-500/10",
          )}
        >
          <div className="flex gap-2 text-muted-foreground">
            <span>#{entry.sequence}</span>
            <span>{new Date(entry.timestamp).toLocaleTimeString("pt-BR")}</span>
            <span className="text-success/90">{entry.action.type}</span>
          </div>
          <p className="text-foreground/80">
            {entry.actor.player_name} (assento {entry.actor.seat})
          </p>
          {entry.game_state_snapshot.zones.flatMap((z) =>
            z.cards.map((c) => (
              <button
                key={c.instance_id}
                type="button"
                className="mr-2 text-purple-300/80 underline-offset-2 hover:underline"
                onMouseEnter={() => onCardHover?.(c)}
              >
                {c.name}
              </button>
            )),
          )}
        </div>
      ))}
      {entries.length === 0 && (
        <p className="text-muted-foreground">Nenhuma entrada de log para esta partida.</p>
      )}
    </div>
  );
}
