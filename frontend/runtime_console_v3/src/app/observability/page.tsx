"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricPanel } from "@/components/operational/metric-panel";
import { runtimeApi } from "@/services/api/runtime";
import { useAuthStore } from "@/stores/auth-store";

export default function ObservabilityPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const health = useQuery({ queryKey: ["health"], queryFn: () => runtimeApi.health(), enabled: isAuthenticated });
  const metrics = useQuery({ queryKey: ["metrics"], queryFn: () => runtimeApi.metrics(), enabled: isAuthenticated });
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Observability Center</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        <MetricPanel title="Health" value={health.data?.integrity_status ?? "—"} />
        <MetricPanel title="Latency" value={`${health.data?.latency_ms ?? "—"} ms`} />
      </div>
      <Card>
        <CardHeader><CardTitle>Metrics snapshot</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(metrics.data, null, 2)}</pre>
        </CardContent>
      </Card>
    </AppShell>
  );
}
