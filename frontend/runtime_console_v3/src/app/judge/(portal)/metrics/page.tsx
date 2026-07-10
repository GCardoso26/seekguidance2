"use client";

import { useJudgeStats } from "@/hooks/useJudgeReports";
import { KPICard } from "@/components/judge-panel/KPICard";

export default function JudgeMetricsPage() {
  const { data: stats, isLoading } = useJudgeStats();

  if (isLoading) return <p className="text-muted-foreground">Carregando métricas...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Métricas do painel</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPICard title="Total reports" value={stats?.total ?? 0} color="purple" />
        <KPICard title="Abertos" value={stats?.open ?? 0} color="red" />
        <KPICard title="SLA vencido" value={stats?.overdue ?? 0} color="yellow" />
        <KPICard title="Resolvidos hoje" value={stats?.resolvedToday ?? 0} color="green" />
      </div>
      <p className="text-sm text-muted-foreground">
        Métricas avançadas (appeal rate, tempo médio por severidade) serão expandidas com dados
        persistidos no Supabase.
      </p>
    </div>
  );
}
