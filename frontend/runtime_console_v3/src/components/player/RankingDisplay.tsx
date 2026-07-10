type Ranking = {
  game_code?: string;
  format?: string;
  points?: number;
  tier?: string;
  division?: number;
};

type Props = {
  rankings: Ranking[];
};

const TIER_BARS: Record<string, number> = {
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Platinum: 4,
  Diamond: 5,
  Mythic: 6,
  Legend: 7,
};

export function RankingDisplay({ rankings }: Props) {
  if (!rankings.length) {
    return <p className="text-sm text-muted-foreground">Sem rankings ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {rankings.map((r) => {
        const filled = TIER_BARS[r.tier ?? "Bronze"] ?? 1;
        return (
          <div key={`${r.game_code}-${r.format}`} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {r.game_code} {r.format}
              </span>
              <span className="text-primary">
                {r.tier} {r.division ? `D${r.division}` : ""} · {r.points} pts
              </span>
            </div>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded ${i < filled ? "bg-primary" : "bg-slate-700"}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
