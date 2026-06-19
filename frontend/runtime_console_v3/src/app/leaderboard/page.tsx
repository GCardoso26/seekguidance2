"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useLeaderboard } from "@/hooks/useRankings";
import { TOURNAMENT_GAMES } from "@/lib/tcg-adapters";
import { cn } from "@/lib/utils";
import { Flame, Trophy, Search } from "lucide-react";

type Metric = "competitive" | "consultations" | "streak";
type Scope = "global" | "friends" | "state";

const METRICS: { id: Metric; label: string; icon: typeof Trophy }[] = [
  { id: "competitive", label: "Competitivo", icon: Trophy },
  { id: "consultations", label: "Consultas", icon: Search },
  { id: "streak", label: "Streak", icon: Flame },
];

export default function LeaderboardPage() {
  const { user } = useJudgeAuth();
  const { data: profile } = usePlayerProfile(user ? "me" : "");
  const [game, setGame] = useState("magic");
  const [metric, setMetric] = useState<Metric>("consultations");
  const [scope, setScope] = useState<Scope>("global");

  const format = "STANDARD";
  const { data: competitiveData, isLoading: competitiveLoading } = useLeaderboard(
    game,
    format,
    1,
  );

  const { data: customData, isLoading: customLoading } = useQuery({
    queryKey: ["leaderboard-custom", game, metric, scope, user?.id],
    queryFn: async () => {
      const qs = new URLSearchParams({ game, metric, scope });
      if (profile?.state) qs.set("state", profile.state);
      const res = await fetch(`/api/leaderboard/custom?${qs}`);
      if (!res.ok) throw new Error("Leaderboard indisponível");
      return res.json() as Promise<{
        entries: Array<{
          rank: number;
          handle: string;
          display_name: string;
          avatar_url: string | null;
          score: number;
          player_id: string;
        }>;
        myRank: number | null;
        total: number;
      }>;
    },
    enabled: metric !== "competitive",
  });

  const entries = useMemo(() => {
    if (metric === "competitive") {
      const raw = competitiveData as { entries?: Array<Record<string, unknown>> } | undefined;
      return (raw?.entries ?? []).slice(0, 10).map((e, i) => ({
        rank: Number(e.rank ?? i + 1),
        handle: String(e.handle ?? ""),
        display_name: String(e.display_name ?? e.handle ?? ""),
        avatar_url: (e.avatar_url as string | null) ?? null,
        score: Number(e.points ?? 0),
        player_id: String(e.player_id ?? ""),
      }));
    }
    return customData?.entries ?? [];
  }, [metric, competitiveData, customData]);

  const myRank = metric === "competitive" ? null : (customData?.myRank ?? null);
  const total = metric === "competitive" ? entries.length : (customData?.total ?? entries.length);
  const loading = metric === "competitive" ? competitiveLoading : customLoading;

  const gameLabel = TOURNAMENT_GAMES.find((g) => g.code === game)?.name ?? game;

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-luxury-mist">
          ← Início
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-sm text-luxury-mist">Top jogadores por TCG e categoria</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TOURNAMENT_GAMES.slice(0, 8).map((g) => (
            <button
              key={g.code}
              type="button"
              onClick={() => setGame(g.code)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                game === g.code ? "bg-luxury-gold/20 text-luxury-gold-light" : "bg-white/5 text-luxury-mist",
              )}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetric(m.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs",
                  metric === m.id ? "bg-luxury-gold/20 text-luxury-gold-light" : "bg-white/5 text-luxury-mist",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>

        {metric !== "competitive" && (
          <div className="mt-3 flex gap-2">
            {(["global", "friends", "state"] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs capitalize",
                  scope === s ? "bg-white/10 text-luxury-frost" : "text-luxury-mist",
                )}
              >
                {s === "global" ? "Global" : s === "friends" ? "Amigos" : "Estado"}
              </button>
            ))}
          </div>
        )}

        {myRank != null && (
          <p className="mt-4 rounded-xl border border-luxury-gold/30 bg-luxury-gold/5 px-4 py-3 text-sm text-luxury-gold-light">
            Você está #{myRank} de {total} em {gameLabel}
          </p>
        )}

        <ul className="mt-6 space-y-2">
          {loading && <li className="text-sm text-luxury-mist">Carregando…</li>}
          {!loading && entries.length === 0 && (
            <li className="text-sm text-luxury-mist">Nenhum dado ainda para esta categoria.</li>
          )}
          {entries.map((e) => (
            <li
              key={`${e.player_id}-${e.rank}`}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <span className="w-8 text-center text-lg font-bold text-luxury-gold">#{e.rank}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.display_name || `@${e.handle}`}</p>
                <p className="text-xs text-luxury-mist">@{e.handle}</p>
              </div>
              <span className="text-sm font-semibold text-luxury-frost">{e.score}</span>
            </li>
          ))}
        </ul>
      </div>
    </MobileLayout>
  );
}
