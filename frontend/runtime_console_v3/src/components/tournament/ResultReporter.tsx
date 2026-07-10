"use client";

type Props = {
  onReport: (player1Wins: number, player2Wins: number) => void;
  disabled?: boolean;
};

const PRESETS = [
  { label: "2 - 0", p1: 2, p2: 0 },
  { label: "2 - 1", p1: 2, p2: 1 },
  { label: "1 - 2", p1: 1, p2: 2 },
  { label: "0 - 2", p1: 0, p2: 2 },
  { label: "1 - 1", p1: 1, p2: 1 },
];

export function ResultReporter({ onReport, disabled }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">Reportar resultado (BO3)</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={disabled}
            onClick={() => onReport(p.p1, p.p2)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-foreground hover:border-amber-500 disabled:opacity-40"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
