type GameRow = {
  game_code: string;
  tournaments: number;
  participants: number;
};

type Props = {
  breakdown: GameRow[];
};

export function ParticipationChart({ breakdown }: Props) {
  const total = breakdown.reduce((s, g) => s + Number(g.participants ?? 0), 0) || 1;

  return (
    <div className="space-y-3">
      {breakdown.map((g) => {
        const pct = Math.round((Number(g.participants) / total) * 100);
        return (
          <div key={g.game_code}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{g.game_code}</span>
              <span className="text-slate-400">
                {pct}% ({g.participants} jogadores)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-slate-700">
              <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
