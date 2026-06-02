"use client";

import { useState } from "react";

type TrendRow = {
  game_slug: string;
  thumbs_up_pct?: number | null;
  thumbs_down_pct?: number | null;
  questions_per_day?: number;
  confidence_avg?: number | null;
};

type Props = {
  games: TrendRow[];
  trends?: Record<string, { label: string; games_tracked?: number }>;
};

const PERIODS = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
] as const;

export function JudgeTrendsTable({ games, trends }: Props) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("7d");

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={
              period === p.id
                ? "rounded-md bg-[hsl(var(--tcg-accent))] px-3 py-1 text-xs font-semibold text-white"
                : "rounded-md border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            }
          >
            {trends?.[p.id]?.label ?? p.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-4">Jogo</th>
              <th className="py-2 pr-4">Perguntas/dia</th>
              <th className="py-2 pr-4">👍 %</th>
              <th className="py-2 pr-4">👎 %</th>
              <th className="py-2">Confiança</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.game_slug} className="border-b border-border/50">
                <td className="py-2 font-medium uppercase">{g.game_slug}</td>
                <td className="py-2">{g.questions_per_day ?? "—"}</td>
                <td className="py-2">
                  {g.thumbs_up_pct != null ? `${Math.round(g.thumbs_up_pct * 100)}%` : "—"}
                </td>
                <td className="py-2">
                  {g.thumbs_down_pct != null ? `${Math.round(g.thumbs_down_pct * 100)}%` : "—"}
                </td>
                <td className="py-2">
                  {g.confidence_avg != null ? `${Math.round(g.confidence_avg * 100)}%` : "—"}
                </td>
              </tr>
            ))}
            {games.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-muted-foreground">
                  Sem dados para {trends?.[period]?.label ?? period}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
