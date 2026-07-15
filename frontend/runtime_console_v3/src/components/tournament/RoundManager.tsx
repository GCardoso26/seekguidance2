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
  const busy =
    flow.generateRound.isPending || flow.startRound.isPending || flow.endRound.isPending;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <TimerDisplay
        roundId={roundId}
        showExtend
        onExtend={() => flow.extendRound.mutate({ roundNumber: currentRound, minutes: 5 })}
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-small text-muted-foreground">Rodada</p>
        <p className="text-2xl font-bold text-foreground">
          {currentRound} de {totalRounds}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => flow.generateRound.mutate()}
          className="min-h-11 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {flow.generateRound.isPending ? "Gerando…" : "Gerar próxima rodada"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => flow.startRound.mutate(currentRound)}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-foreground disabled:opacity-50"
        >
          {flow.startRound.isPending ? "Iniciando…" : "Iniciar cronômetro"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => flow.endRound.mutate(currentRound)}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-foreground disabled:opacity-50"
        >
          {flow.endRound.isPending ? "Finalizando…" : "Encerrar rodada"}
        </button>
      </div>
    </div>
  );
}
