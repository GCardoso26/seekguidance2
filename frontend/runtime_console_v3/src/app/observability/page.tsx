"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricPanel } from "@/components/operational/metric-panel";
import { GameQualityCard } from "@/components/observability/judge/GameQualityCard";
import { JudgeAlertBanner } from "@/components/observability/judge/JudgeAlertBanner";
import { JudgeLatencyChart } from "@/components/observability/judge/JudgeLatencyChart";
import { JudgeTrendsTable } from "@/components/observability/judge/JudgeTrendsTable";
import { getJudgeQuality, getJudgeQualityMetrics } from "@/services/judgeApi";
import { getJudgeGrowth } from "@/services/judgeGrowthApi";
import { runtimeApi } from "@/services/api/runtime";
import { getInfrastructure, getWarmupStatus } from "@/services/infrastructureApi";
import { useAuthStore } from "@/stores/auth-store";

export default function ObservabilityPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => runtimeApi.health(),
    enabled: isAuthenticated,
  });
  const metrics = useQuery({
    queryKey: ["metrics"],
    queryFn: () => runtimeApi.metrics(),
    enabled: isAuthenticated,
  });
  const judgeQuality = useQuery({
    queryKey: ["judge-quality", 7],
    queryFn: () => getJudgeQuality(7),
  });
  const judgeMetrics = useQuery({
    queryKey: ["judge-quality-metrics", 7],
    queryFn: () => getJudgeQualityMetrics(7),
  });
  const judgeGrowth = useQuery({
    queryKey: ["judge-growth", 30],
    queryFn: () => getJudgeGrowth(30),
  });
  const warmup = useQuery({
    queryKey: ["runtime-warmup"],
    queryFn: getWarmupStatus,
  });
  const infra = useQuery({
    queryKey: ["infrastructure"],
    queryFn: getInfrastructure,
    enabled: isAuthenticated,
  });

  const cacheRate = Math.round((judgeQuality.data?.cache?.cache_hit_rate ?? 0) * 100);
  const lat = judgeQuality.data?.latency;

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">Observability Center</h1>

      <h2 className="mb-3 text-lg font-semibold">Judge Quality</h2>
      <JudgeAlertBanner activeGames={judgeMetrics.data?.alerts ?? []} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(judgeMetrics.data?.games ?? {}).map(([slug, m]) => (
          <GameQualityCard
            key={slug}
            metrics={{
              game_slug: slug,
              queries_24h: m.queries_24h,
              thumbs_up_pct: m.thumbs_up_pct,
              thumbs_down_pct: m.thumbs_down_pct,
              confidence_avg: m.confidence_avg,
              cache_hit_rate: m.cache_hit_rate,
              alert_active: m.alert_active,
              latency_p95_ms: m.latency_p95_ms,
            }}
          />
        ))}
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Latência por fase (P50)</CardTitle>
        </CardHeader>
        <CardContent>
          <JudgeLatencyChart
            latencyByPhase={
              Object.values(judgeMetrics.data?.games ?? {})[0]?.latency_by_phase
            }
          />
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tendências</CardTitle>
        </CardHeader>
        <CardContent>
          <JudgeTrendsTable
            games={judgeQuality.data?.games ?? []}
            trends={judgeQuality.data?.trends}
          />
        </CardContent>
      </Card>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricPanel title="Cache hit rate" value={`${cacheRate}%`} />
        <MetricPanel
          title="Embedding P95"
          value={lat?.embedding_ms ? `${lat.embedding_ms.p95} ms` : "—"}
        />
        <MetricPanel
          title="Retrieval P95"
          value={lat?.retrieval_ms ? `${lat.retrieval_ms.p95} ms` : "—"}
        />
        <MetricPanel
          title="Generation P95"
          value={lat?.generation_ms ? `${lat.generation_ms.p95} ms` : "—"}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Feedback por jogo (7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Jogo</th>
                  <th className="py-2 pr-4">Perguntas/dia</th>
                  <th className="py-2 pr-4">👍 %</th>
                  <th className="py-2 pr-4">👎 %</th>
                  <th className="py-2">Alerta</th>
                </tr>
              </thead>
              <tbody>
                {(judgeQuality.data?.games ?? []).map((g) => (
                  <tr key={g.game_slug} className="border-b border-border/50">
                    <td className="py-2 font-medium uppercase">{g.game_slug}</td>
                    <td className="py-2">{g.questions_per_day ?? "—"}</td>
                    <td className="py-2">
                      {g.thumbs_up_pct != null ? `${Math.round(g.thumbs_up_pct * 100)}%` : "—"}
                    </td>
                    <td className="py-2">
                      {g.thumbs_down_pct != null ? `${Math.round(g.thumbs_down_pct * 100)}%` : "—"}
                    </td>
                    <td className="py-2 text-xs text-amber-700">{g.alert ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Infrastructure</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricPanel
          title="Health Score"
          value={infra.data ? `${infra.data.operational_health_score}/100` : "—"}
        />
        <MetricPanel title="DB" value={infra.data?.dependencies?.database ?? "—"} />
        <MetricPanel title="Redis" value={infra.data?.dependencies?.redis ?? "—"} />
        <MetricPanel title="OTEL" value={infra.data?.dependencies?.otel ?? "—"} />
        <MetricPanel
          title="Warmup embedding"
          value={warmup.data?.embedding_ready ? "Ready" : "Pending"}
        />
        <MetricPanel
          title="Warmup judge"
          value={warmup.data?.judge_ready ? "Ready" : "Pending"}
        />
        <MetricPanel
          title="Ingestion queue"
          value={String(infra.data?.ingestion_queue_pending ?? "—")}
        />
        <MetricPanel
          title="Cache hit (infra)"
          value={
            infra.data ? `${Math.round((infra.data.cache_hit_rate ?? 0) * 100)}%` : "—"
          }
        />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Runtime Startup</h2>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Warmup status</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs">{JSON.stringify(warmup.data ?? {}, null, 2)}</pre>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Judge Tracing</h2>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <pre className="max-h-48 overflow-auto text-xs">
            {JSON.stringify(infra.data?.judge_metrics ?? {}, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Growth</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricPanel title="DAU" value={String(judgeGrowth.data?.dau ?? "—")} />
        <MetricPanel title="WAU" value={String(judgeGrowth.data?.wau ?? "—")} />
        <MetricPanel title="MAU" value={String(judgeGrowth.data?.mau ?? "—")} />
        <MetricPanel
          title="CTR Related Questions"
          value={
            judgeGrowth.data
              ? `${Math.round((judgeGrowth.data.related_question_ctr ?? 0) * 100)}%`
              : "—"
          }
        />
        <MetricPanel
          title="Shares criados"
          value={String(judgeGrowth.data?.shares_created ?? "—")}
        />
        <MetricPanel
          title="Shares abertos"
          value={String(judgeGrowth.data?.shares_opened ?? "—")}
        />
        <MetricPanel
          title="Perguntas / sessão"
          value={String(judgeGrowth.data?.questions_per_session ?? "—")}
        />
        <MetricPanel
          title="Sessões / utilizador"
          value={String(judgeGrowth.data?.sessions_per_user ?? "—")}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Top jogos (eventos)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            {(judgeGrowth.data?.top_games ?? []).map((g) => (
              <li key={g.game}>
                <span className="font-medium uppercase">{g.game}</span> — {g.events}
              </li>
            ))}
            {(judgeGrowth.data?.top_games?.length ?? 0) === 0 && (
              <li className="text-muted-foreground">Sem dados no período.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        <MetricPanel title="Health" value={health.data?.integrity_status ?? "—"} />
        <MetricPanel title="Latency" value={`${health.data?.latency_ms ?? "—"} ms`} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Metrics snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto text-xs">
            {JSON.stringify(metrics.data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </AppShell>
  );
}
