"use client";

import { MatchCard } from "@/components/tournament/MatchCard";
import { eliminationRoundLabel } from "@/lib/tournament-bracket";
import type { BracketMatchView } from "@/types/tournament-bracket";

type Props = {
  matches: BracketMatchView[];
  nameById: Record<string, string>;
  canEdit?: boolean;
  onReportWinner?: (matchId: string, winnerId: string) => void;
  reportingMatchId?: string | null;
  title?: string;
};

export function EliminationBracket({
  matches,
  nameById,
  canEdit = false,
  onReportWinner,
  reportingMatchId,
  title = "Eliminatória",
}: Props) {
  const rounds = [...new Set(matches.map((m) => m.roundNumber))].sort((a, b) => a - b);
  const maxRound = rounds[rounds.length - 1] ?? 1;

  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="elimination-bracket-empty">
        Bracket eliminatório ainda não gerado.
      </p>
    );
  }

  return (
    <div data-testid="elimination-bracket">
      <p className="mb-3 text-sm font-medium text-foreground">{title}</p>
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
        {rounds.map((r) => (
          <div key={r} className="min-w-[220px] shrink-0 snap-start space-y-3">
            <p className="sticky top-0 text-center text-sm font-semibold text-primary">
              {eliminationRoundLabel(r, maxRound)}
            </p>
            {matches
              .filter((m) => m.roundNumber === r)
              .sort((a, b) => a.matchNumber - b.matchNumber)
              .map((m) => {
                const p1Name = m.player1Id
                  ? (m.player1Name ?? nameById[m.player1Id] ?? "TBD")
                  : "BYE / TBD";
                const p2Name = m.player2Id
                  ? (m.player2Name ?? nameById[m.player2Id] ?? "TBD")
                  : undefined;
                const isBye = Boolean(m.player1Id && !m.player2Id);

                return (
                  <MatchCard
                    key={m.id}
                    matchNumber={m.matchNumber}
                    player1Name={p1Name}
                    player2Name={p2Name}
                    player1Id={m.player1Id}
                    player2Id={m.player2Id}
                    winnerId={m.winnerId}
                    tableNumber={m.tableNumber}
                    status={m.status}
                    isBye={isBye}
                    canEdit={canEdit}
                    reporting={reportingMatchId === m.id}
                    onReportWinner={
                      onReportWinner && m.player1Id && m.player2Id
                        ? (winnerId) => onReportWinner(m.id, winnerId)
                        : undefined
                    }
                  />
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
