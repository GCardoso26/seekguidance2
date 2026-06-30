"use client";

import { Button } from "@/components/ui/button";

type Props = {
  phase: string;
  format: string;
  isOrganizer: boolean;
  currentRound: number;
  totalRounds: number;
  onStartTournament?: () => void;
  onGenerateRound?: () => void;
  onAdvanceTopCut?: () => void;
  onFinalize?: () => void;
  pending?: {
    start?: boolean;
    round?: boolean;
    topCut?: boolean;
    finalize?: boolean;
  };
};

export function BracketControls({
  phase,
  format,
  isOrganizer,
  currentRound,
  totalRounds,
  onStartTournament,
  onGenerateRound,
  onAdvanceTopCut,
  onFinalize,
  pending,
}: Props) {
  if (!isOrganizer) return null;

  const isSwiss = format === "swiss" || format === "round_robin";

  return (
    <div
      className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 p-4"
      data-testid="bracket-controls"
    >
      <p className="w-full text-sm text-luxury-mist">Controles do organizador</p>

      {(phase === "check_in" || phase === "registration_open") && onStartTournament && (
        <Button
          type="button"
          size="sm"
          className="bg-luxury-gold text-luxury-onyx"
          disabled={pending?.start}
          onClick={onStartTournament}
          data-testid="bracket-start-tournament"
        >
          {pending?.start ? "Iniciando…" : "Iniciar torneio"}
        </Button>
      )}

      {isSwiss && phase === "in_progress" && onGenerateRound && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending?.round}
          onClick={onGenerateRound}
          data-testid="bracket-next-round"
        >
          {pending?.round ? "Gerando…" : `Próxima rodada (${currentRound}/${totalRounds})`}
        </Button>
      )}

      {phase === "swiss_complete" && onAdvanceTopCut && (
        <Button
          type="button"
          size="sm"
          className="bg-luxury-gold text-luxury-onyx"
          disabled={pending?.topCut}
          onClick={onAdvanceTopCut}
          data-testid="bracket-start-topcut"
        >
          {pending?.topCut ? "Gerando…" : "Iniciar Top Cut"}
        </Button>
      )}

      {(phase === "bracket_complete" || phase === "swiss_complete") && onFinalize && (
        <Button
          type="button"
          size="sm"
          className="bg-emerald-600 text-white hover:bg-emerald-500"
          disabled={pending?.finalize}
          onClick={onFinalize}
          data-testid="bracket-finalize"
        >
          {pending?.finalize ? "Finalizando…" : "Finalizar torneio"}
        </Button>
      )}
    </div>
  );
}
