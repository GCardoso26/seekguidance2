"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthBadge } from "@/components/operational/health-badge";
import { runtimeApi } from "@/services/api/runtime";
import { useAuthStore } from "@/stores/auth-store";

export default function DeploymentsPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const q = useQuery({ queryKey: ["deployments"], queryFn: () => runtimeApi.deployments(), enabled: isAuthenticated });
  const status = (q.data as { deployments?: { status?: string }[] })?.deployments?.[0]?.status;
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Deployments</h1>
      <div className="mb-4"><HealthBadge status={status === "operational" ? "ok" : "degraded"} /></div>
      <Card>
        <CardHeader><CardTitle>Deployment history</CardTitle></CardHeader>
        <CardContent>
          {q.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {q.isError && <p className="text-sm text-danger">Degraded mode</p>}
          {q.isSuccess && <pre className="text-xs overflow-auto">{JSON.stringify(q.data, null, 2)}</pre>}
        </CardContent>
      </Card>
    </AppShell>
  );
}
