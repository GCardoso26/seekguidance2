"use client";

import { MatchCard } from "@/components/tournament/MatchCard";
import type { SwissRoundView } from "@/types/tournament-bracket";

type Props = {
  rounds: SwissRoundView[];
  activeRound?: number;
};

export function SwissBracket({ rounds, activeRound }: Props) {
  if (rounds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="swiss-bracket-empty">
        Nenhuma rodada suíça gerada ainda.
      </p>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" data-testid="swiss-bracket">
      {rounds.map((round) => (
        <div
          key={round.roundNumber}
          className={`min-w-[240px] shrink-0 snap-start space-y-3 ${
            activeRound === round.roundNumber ? "opacity-100" : "opacity-80"
          }`}
        >
          <p
            className={`sticky top-0 text-center text-sm font-semibold ${
              activeRound === round.roundNumber ? "text-info" : "text-primary"
            }`}
          >
            Rodada {round.roundNumber}
          </p>
          {round.pairings.map((p) => (
            <MatchCard
              key={p.id}
              matchNumber={p.tableNumber}
              roundLabel={`R${round.roundNumber}`}
              player1Name={p.player1Name}
              player2Name={p.player2Name}
              player1Id={p.player1Name}
              player2Id={p.isBye ? null : p.player2Name}
              tableNumber={p.tableNumber}
              status={p.status}
              isBye={p.isBye}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
