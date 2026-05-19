"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { MetricPanel } from "@/components/operational/metric-panel";
import { HealthBadge } from "@/components/operational/health-badge";
import { runtimeApi } from "@/services/api/runtime";
import { useAuthStore } from "@/stores/auth-store";

export default function DashboardPage() {
  const token = useAuthStore((s) => s.accessToken);
  const apiKey = useAuthStore((s) => s.apiKey);
  const auth = token || apiKey;
  const health = useQuery({ queryKey: ["health"], queryFn: () => runtimeApi.health(auth), enabled: !!auth });
  const metrics = useQuery({ queryKey: ["metrics"], queryFn: () => runtimeApi.metrics(auth), enabled: !!auth });
  const incidents = useQuery({ queryKey: ["incidents"], queryFn: () => runtimeApi.incidents(auth), enabled: !!auth });

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Executive Overview</h1>
        <HealthBadge status={health.data?.integrity_status} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricPanel title="Latency" value={`${health.data?.latency_ms ?? "—"} ms`} />
        <MetricPanel title="Incidents" value={incidents.data?.incidents?.length ?? 0} />
        <MetricPanel title="Metrics" value={Object.keys(metrics.data?.metrics || {}).length} hint="runtime snapshot" />
        <MetricPanel title="Status" value={health.data?.status ?? "—"} />
      </div>
    </AppShell>
  );
}
