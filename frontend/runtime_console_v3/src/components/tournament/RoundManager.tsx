"use client";

import { TimerDisplay } from "@/components/tournament/TimerDisplay";
import { useTournamentFlow } from "@/hooks/useTournamentFlow";

type Props = {
  tournamentId: string;
  currentRound: number;
  roundId: string | null;
  totalRounds: number;
};

export function RoundManager({ tournamentId, currentRound, roundId, totalRounds }: Props) {
  const flow = useTournamentFlow(tournamentId);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <TimerDisplay
        roundId={roundId}
        showExtend
        onExtend={() => flow.extendRound.mutate({ roundNumber: currentRound, minutes: 5 })}
      />
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-6">
        <p className="text-sm text-slate-400">Rodada</p>
        <p className="text-2xl font-bold text-foreground">
          {currentRound} de {totalRounds}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => flow.generateRound.mutate()}
          className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-900"
        >
          Gerar próxima rodada
        </button>
        <button
          type="button"
          onClick={() => flow.startRound.mutate(currentRound)}
          className="rounded-lg border border-slate-600 px-4 py-2 text-foreground"
        >
          Iniciar timer
        </button>
        <button
          type="button"
          onClick={() => flow.endRound.mutate(currentRound)}
          className="rounded-lg border border-slate-600 px-4 py-2 text-foreground"
        >
          Finalizar rodada
        </button>
      </div>
    </div>
  );
}
