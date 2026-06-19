"use client";

export type BracketMatchView = {
  id: string;
  roundNumber: number;
  matchNumber: number;
  player1Id?: string | null;
  player2Id?: string | null;
  winnerId?: string | null;
  tableNumber?: number | null;
  status?: string;
};

const ROUND_LABELS: Record<number, string> = {
  1: "Quartas",
  2: "Semi",
  3: "Final",
};

type Props = {
  matches: BracketMatchView[];
  nameById: Record<string, string>;
  canEdit?: boolean;
  onReportWinner?: (matchId: string, winnerId: string) => void;
  reportingMatchId?: string | null;
};

export function BracketTree({
  matches,
  nameById,
  canEdit = false,
  onReportWinner,
  reportingMatchId,
}: Props) {
  const rounds = [...new Set(matches.map((m) => m.roundNumber))].sort((a, b) => a - b);
  const maxRound = rounds[rounds.length - 1] ?? 1;

  const roundLabel = (r: number) => {
    if (r === maxRound && maxRound >= 2) return "Final";
    if (r === maxRound - 1 && maxRound >= 3) return "Semi";
    return ROUND_LABELS[r] ?? `Rodada ${r}`;
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
      {rounds.map((r) => (
        <div key={r} className="min-w-[220px] shrink-0 snap-start space-y-3">
          <p className="sticky top-0 text-center text-sm font-semibold text-luxury-gold-light">
            {roundLabel(r)}
          </p>
          {matches
            .filter((m) => m.roundNumber === r)
            .sort((a, b) => a.matchNumber - b.matchNumber)
            .map((m) => {
              const p1Name = m.player1Id ? nameById[m.player1Id] ?? "TBD" : "BYE / TBD";
              const p2Name = m.player2Id ? nameById[m.player2Id] ?? "TBD" : "BYE / TBD";
              const pending = m.status !== "completed";
              const canReport =
                canEdit &&
                pending &&
                m.player1Id &&
                m.player2Id &&
                onReportWinner &&
                reportingMatchId !== m.id;

              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm shadow-sm"
                >
                  <p className="text-[10px] uppercase tracking-wide text-luxury-mist/70">
                    M{m.matchNumber}
                    {m.tableNumber ? ` · Mesa ${m.tableNumber}` : ""}
                  </p>
                  <div className="mt-2 space-y-1">
                    {[m.player1Id, m.player2Id].map((pid, idx) => {
                      if (!pid) return null;
                      const name = idx === 0 ? p1Name : p2Name;
                      const isWinner = m.winnerId === pid;
                      return (
                        <div key={pid} className="flex items-center justify-between gap-2">
                          <span
                            className={
                              isWinner
                                ? "font-semibold text-luxury-gold-light"
                                : pending
                                  ? "text-luxury-frost"
                                  : "text-luxury-mist line-through"
                            }
                          >
                            {name}
                          </span>
                          {canReport && (
                            <button
                              type="button"
                              disabled={!canReport}
                              onClick={() => onReportWinner?.(m.id, pid)}
                              className="shrink-0 rounded bg-luxury-gold/20 px-2 py-0.5 text-[10px] font-semibold text-luxury-gold-light hover:bg-luxury-gold/30"
                            >
                              Venceu
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {m.status === "completed" && (
                    <p className="mt-2 text-[10px] text-emerald-400/90">Encerrada</p>
                  )}
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
