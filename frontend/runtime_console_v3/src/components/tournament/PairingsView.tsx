"use client";

type Pairing = {
  id: string;
  table_number: number;
  player1_name: string;
  player1_points?: number;
  player2_name?: string;
  player2_points?: number;
  status: string;
  is_bye?: boolean;
};

export function PairingsView({ pairings, highlightTable }: { pairings: Pairing[]; highlightTable?: number }) {
  return (
    <ul className="space-y-2">
      {pairings.map((p) => (
        <li
          key={p.id}
          className={`rounded-lg border px-4 py-3 ${
            p.table_number === highlightTable ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-800/50"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-slate-500">Mesa {p.table_number}</span>
            <span className="text-xs text-slate-500">{p.status}</span>
          </div>
          <p className="mt-1 text-foreground">
            {p.player1_name} ({p.player1_points ?? 0} pts)
            {p.is_bye ? " — BYE" : ` vs ${p.player2_name} (${p.player2_points ?? 0} pts)`}
          </p>
        </li>
      ))}
    </ul>
  );
}
