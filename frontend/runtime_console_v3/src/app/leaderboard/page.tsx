"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LigaPassWidget } from "@/components/gamification/LigaPassWidget";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useLeaderboard } from "@/hooks/useRankings";
import { TOURNAMENT_GAMES } from "@/lib/tcg-adapters";
import { cn } from "@/lib/utils";
import type { LigaPassLeaderboardEntry } from "@/types/gamification";
import { LEVEL_COLORS } from "@/types/gamification";
import { Award, Flame, Search, Trophy } from "lucide-react";

const LeaderboardTable = dynamic(
  () => import("@/components/gamification/LeaderboardTable").then((m) => m.LeaderboardTable),
  { loading: () => <p className="text-sm text-muted-foreground">Carregando ranking…</p>, ssr: false },
);

type Metric = "competitive" | "consultations" | "streak" | "liga" | "xp";
type Scope = "global" | "friends" | "state";

type LeaderboardEntry = {
  rank: number;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  player_id: string;
  level?: string;
};

const METRICS: { id: Metric; label: string; icon: typeof Trophy }[] = [
  { id: "xp", label: "Níveis XP", icon: Trophy },
  { id: "liga", label: "Liga Pass", icon: Award },
  { id: "competitive", label: "Competitivo", icon: Trophy },
  { id: "consultations", label: "Consultas", icon: Search },
  { id: "streak", label: "Streak", icon: Flame },
];

function rankEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default function LeaderboardPage() {
  const { user } = useJudgeAuth();
  const { data: profile } = usePlayerProfile(user ? "me" : "");
  const [game, setGame] = useState("magic");
  const [metric, setMetric] = useState<Metric>("xp");
  const [scope, setScope] = useState<Scope>("global");

  const format = "STANDARD";
  const { data: competitiveData, isLoading: competitiveLoading } = useLeaderboard(
    game,
    format,
    1,
  );

  const { data: ligaData, isLoading: ligaLoading } = useQuery({
    queryKey: ["leaderboard-liga"],
    queryFn: async () => {
      const res = await fetch("/api/gamification/leaderboard?limit=50");
      if (!res.ok) throw new Error("Leaderboard Liga Pass indisponível");
      return res.json() as Promise<LigaPassLeaderboardEntry[]>;
    },
    enabled: metric === "liga",
  });

  const { data: customData, isLoading: customLoading } = useQuery({
    queryKey: ["leaderboard-custom", game, metric, scope, user?.id],
    queryFn: async () => {
      const qs = new URLSearchParams({ game, metric, scope });
      if (profile?.state) qs.set("state", profile.state);
      const res = await fetch(`/api/leaderboard/custom?${qs}`);
      if (!res.ok) throw new Error("Leaderboard indisponível");
      return res.json() as Promise<{
        entries: LeaderboardEntry[];
        myRank: number | null;
        total: number;
      }>;
    },
    enabled: metric !== "competitive" && metric !== "liga" && metric !== "xp",
  });

  const entries = useMemo((): LeaderboardEntry[] => {
    if (metric === "liga") {
      return (ligaData ?? []).map((e) => ({
        rank: e.rank,
        handle: e.username,
        display_name: e.display_name ?? e.username,
        avatar_url: e.avatar,
        score: e.total_xp,
        player_id: e.username,
        level: e.level,
      }));
    }
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
  }, [metric, competitiveData, customData, ligaData]);

  const myRank = metric === "competitive" || metric === "liga" ? null : (customData?.myRank ?? null);
  const total =
    metric === "competitive" || metric === "liga"
      ? entries.length
      : (customData?.total ?? entries.length);
  const loading =
    metric === "competitive"
      ? competitiveLoading
      : metric === "liga"
        ? ligaLoading
        : customLoading;

  const gameLabel = TOURNAMENT_GAMES.find((g) => g.code === game)?.name ?? game;

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-muted-foreground">
          ← Início
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {metric === "xp"
            ? "Ranking global por nível e XP"
            : metric === "liga"
              ? "Ranking global Liga Pass (XP)"
              : "Top jogadores por TCG e categoria"}
        </p>

        {metric === "xp" && (
          <div className="mt-6" data-testid="leaderboard-xp-tab">
            <LeaderboardTable />
          </div>
        )}

        {metric === "liga" && user && (
          <div className="mt-4">
            <LigaPassWidget />
          </div>
        )}

        {metric !== "liga" && metric !== "xp" && (
          <div className="mt-6 flex flex-wrap gap-2">
            {TOURNAMENT_GAMES.slice(0, 8).map((g) => (
              <button
                key={g.code}
                type="button"
                onClick={() => setGame(g.code)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  game === g.code ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground",
                )}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

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
                  metric === m.id ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>

        {metric !== "competitive" && metric !== "liga" && metric !== "xp" && (
          <div className="mt-3 flex gap-2">
            {(["global", "friends", "state"] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs capitalize",
                  scope === s ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                {s === "global" ? "Global" : s === "friends" ? "Amigos" : "Estado"}
              </button>
            ))}
          </div>
        )}

        {myRank != null && (
          <p className="mt-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
            Você está #{myRank} de {total} em {gameLabel}
          </p>
        )}

        <ul className="mt-6 space-y-2">
          {metric !== "xp" && loading && <li className="text-sm text-muted-foreground">Carregando…</li>}
          {metric !== "xp" && !loading && entries.length === 0 && (
            <li className="text-sm text-muted-foreground">Nenhum dado ainda para esta categoria.</li>
          )}
          {metric !== "xp" &&
            entries.map((e) => (
            <li
              key={`${e.player_id}-${e.rank}`}
              className="flex items-center gap-3 surface-card p-3"
            >
              <span className="w-10 text-center text-lg font-bold text-primary">
                {metric === "liga" ? rankEmoji(e.rank) : `#${e.rank}`}
              </span>
              {e.avatar_url ? (
                <Image
                  src={e.avatar_url}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {(e.display_name || e.handle).slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.display_name || `@${e.handle}`}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {metric === "liga" && e.level ? (
                    <span style={{ color: LEVEL_COLORS[e.level as keyof typeof LEVEL_COLORS] }}>
                      {e.level}
                    </span>
                  ) : (
                    `@${e.handle}`
                  )}
                </p>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {metric === "liga" ? `${e.score.toLocaleString("pt-BR")} XP` : e.score}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </MobileLayout>
  );
}
