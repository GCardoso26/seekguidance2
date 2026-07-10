"use client";

import { useRoundTimer } from "@/hooks/useRoundTimer";

type Props = {
  roundId: string | null;
  onExtend?: () => void;
  showExtend?: boolean;
};

export function TimerDisplay({ roundId, onExtend, showExtend }: Props) {
  const { remaining, status, formatted } = useRoundTimer(roundId);
  const urgent = remaining > 0 && remaining <= 300;

  return (
    <div
      className={`rounded-xl border p-6 text-center ${
        urgent ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-800/60"
      }`}
    >
      <p className="text-sm text-slate-400">Tempo restante</p>
      <p className="text-4xl font-mono font-bold text-foreground">{formatted}</p>
      <p className="mt-1 text-xs text-slate-500">Estado: {status}</p>
      {showExtend && onExtend && (
        <button
          type="button"
          onClick={onExtend}
          className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm text-foreground hover:bg-slate-600"
        >
          +5 min
        </button>
      )}
    </div>
  );
}
