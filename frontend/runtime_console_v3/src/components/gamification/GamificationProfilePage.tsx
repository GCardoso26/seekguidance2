"use client";

import Link from "next/link";
import { UserLevelBadge } from "@/components/gamification/UserLevelBadge";
import { useGamificationProfile } from "@/hooks/useGamification";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { XP_ACTION_LABELS } from "@/lib/gamification";

export function GamificationProfilePage() {
  const { user, loading: authLoading } = useJudgeAuth();
  const { data, isLoading } = useGamificationProfile();

  if (authLoading || (user && isLoading)) {
    return <p className="text-sm text-muted-foreground" data-testid="gamification-loading">Carregando perfil…</p>;
  }

  if (!user || !data) {
    return <p className="text-sm text-muted-foreground">Faça login para ver sua gamificação.</p>;
  }

  return (
    <div data-testid="gamification-profile">
      <UserLevelBadge />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Compras" value={data.stats.purchases} />
        <Stat label="Vendas" value={data.stats.sales} />
        <Stat label="Torneios" value={data.stats.tournaments} />
        <Stat label="Alertas" value={data.stats.price_alerts} />
        <Stat label="Avaliações" value={data.stats.reviews} />
        <Stat label="Badges" value={data.badges_unlocked} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/badges"
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:border-primary/40"
        >
          Ver todos os badges
        </Link>
        <Link
          href="/comunidade/leaderboard"
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:border-primary/40"
        >
          Leaderboard
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Histórico de XP</h2>
        {data.recent_events.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum evento ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.recent_events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center justify-between surface-card rounded-lg px-4 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {XP_ACTION_LABELS[ev.action] ?? ev.action}
                </span>
                <span className="font-semibold text-primary">+{ev.xp_amount} XP</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card rounded-lg p-4 text-center">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
