"use client";

import type { MatchDisplayStatus } from "@/types/tournament-bracket";
import { MATCH_STATUS_STYLES, resolveMatchDisplayStatus } from "@/lib/tournament-bracket";

type Props = {
  matchNumber: number;
  roundLabel?: string;
  player1Name: string;
  player2Name?: string;
  winnerId?: string | null;
  player1Id?: string | null;
  player2Id?: string | null;
  tableNumber?: number | null;
  status?: string;
  isBye?: boolean;
  canEdit?: boolean;
  reporting?: boolean;
  onReportWinner?: (winnerId: string) => void;
};

export function MatchCard({
  matchNumber,
  roundLabel,
  player1Name,
  player2Name,
  winnerId,
  player1Id,
  player2Id,
  tableNumber,
  status,
  isBye,
  canEdit,
  reporting,
  onReportWinner,
}: Props) {
  const displayStatus: MatchDisplayStatus = resolveMatchDisplayStatus({
    status,
    player2Id,
    isBye,
  });
  const style = MATCH_STATUS_STYLES[displayStatus];
  const pending = displayStatus !== "completed" && displayStatus !== "bye";

  const renderPlayer = (pid: string | null | undefined, name: string, idx: number) => {
    if (!pid && displayStatus !== "bye") return null;
    const isWinner = winnerId === pid;
    const canReport =
      canEdit && pending && pid && player1Id && player2Id && onReportWinner && !reporting;

    return (
      <div key={pid ?? `bye-${idx}`} className="flex items-center justify-between gap-2">
        <span
          className={
            isWinner
              ? "font-semibold text-primary-light"
              : pending
                ? "text-foreground"
                : "text-muted-foreground line-through"
          }
        >
          {name}
        </span>
        {canReport && pid && (
          <button
            type="button"
            onClick={() => onReportWinner(pid)}
            className="shrink-0 rounded bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary-light hover:bg-primary/90/30"
            data-testid={`match-report-winner-${pid}`}
          >
            Venceu
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={`rounded-xl border p-3 text-sm shadow-sm ${style}`}
      data-testid={`match-card-${matchNumber}`}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
        {roundLabel ? `${roundLabel} · ` : ""}M{matchNumber}
        {tableNumber ? ` · Mesa ${tableNumber}` : ""}
        {displayStatus === "bye" && " · BYE"}
      </p>
      <div className="mt-2 space-y-1">
        {player1Id && renderPlayer(player1Id, player1Name, 0)}
        {displayStatus === "bye" ? (
          <p className="text-xs text-amber-300">BYE automático</p>
        ) : (
          player2Id && renderPlayer(player2Id, player2Name ?? "TBD", 1)
        )}
      </div>
      {displayStatus === "completed" && (
        <p className="mt-2 text-[10px] text-emerald-400/90">Encerrada</p>
      )}
    </div>
  );
}
