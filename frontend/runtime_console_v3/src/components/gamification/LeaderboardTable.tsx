"use client";

import { useState } from "react";
import { useGamificationLeaderboard } from "@/hooks/useGamification";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";

type Scope = "global" | "city" | "game";

const CITIES = ["São Paulo", "Rio de Janeiro", "Curitiba", "Belo Horizonte", "Porto Alegre"];
const GAMES = ["magic", "pokemon", "yugioh", "onepiece"];

function rankEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export function LeaderboardTable() {
  const { user } = useJudgeAuth();
  const [scope, setScope] = useState<Scope>("global");
  const [city, setCity] = useState(CITIES[0]);
  const [game, setGame] = useState(GAMES[0]);

  const { data, isLoading } = useGamificationLeaderboard({
    city: scope === "city" ? city : undefined,
    game: scope === "game" ? game : undefined,
    limit: 100,
  });

  const entries = data?.entries ?? [];

  return (
    <div data-testid="xp-leaderboard">
      <div className="flex flex-wrap gap-2">
        {(["global", "city", "game"] as Scope[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              scope === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted",
            )}
          >
            {s === "global" ? "Global" : s === "city" ? "Por cidade" : "Por jogo"}
          </button>
        ))}
      </div>

      {scope === "city" && (
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-3 rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm text-foreground"
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      {scope === "game" && (
        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          className="mt-3 rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm text-foreground"
        >
          {GAMES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      )}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando ranking…</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Jogador</th>
                <th className="px-4 py-3">Nível</th>
                <th className="px-4 py-3">XP</th>
                <th className="px-4 py-3">Badges</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 100).map((row) => {
                const isMe = user?.id === row.user_id;
                return (
                  <tr
                    key={`${row.user_id}-${row.rank}`}
                    data-testid={row.rank <= 10 ? `leaderboard-row-${row.rank}` : undefined}
                    className={cn(
                      "border-b border-border/60",
                      isMe && "bg-primary/10",
                    )}
                  >
                    <td className="px-4 py-3 font-medium">{rankEmoji(row.rank)}</td>
                    <td className="px-4 py-3">
                      <span className={cn(isMe && "font-semibold text-primary")}>
                        {row.display_name}
                        {isMe ? " (você)" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.current_level}</td>
                    <td className="px-4 py-3">{row.total_xp.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3">{row.badges_count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data?.my_rank != null && (
        <p className="mt-3 text-sm text-muted-foreground">
          Sua posição: <span className="font-semibold text-primary">#{data.my_rank}</span>
        </p>
      )}
    </div>
  );
}
