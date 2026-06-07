"use client";

type BracketMatch = {
  id: string;
  roundNumber: number;
  matchNumber: number;
  player1Id?: string | null;
  player2Id?: string | null;
  winnerId?: string | null;
  tableNumber?: number | null;
};

type Props = {
  matches: BracketMatch[];
  nameById: Record<string, string>;
};

export function BracketTree({ matches, nameById }: Props) {
  const rounds = [...new Set(matches.map((m) => m.roundNumber))].sort((a, b) => a - b);

  return (
    <div className="flex gap-8 overflow-x-auto pb-4">
      {rounds.map((r) => (
        <div key={r} className="min-w-[200px] space-y-3">
          <p className="text-center text-sm font-semibold text-slate-400">Ronda {r}</p>
          {matches
            .filter((m) => m.roundNumber === r)
            .sort((a, b) => a.matchNumber - b.matchNumber)
            .map((m) => (
              <div key={m.id} className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-sm">
                <p className="text-slate-500">M{m.matchNumber}</p>
                <p className={m.winnerId === m.player1Id ? "text-amber-400" : "text-white"}>
                  {m.player1Id ? nameById[m.player1Id] ?? m.player1Id : "TBD"}
                </p>
                <p className={m.winnerId === m.player2Id ? "text-amber-400" : "text-white"}>
                  {m.player2Id ? nameById[m.player2Id] ?? m.player2Id : "TBD"}
                </p>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
