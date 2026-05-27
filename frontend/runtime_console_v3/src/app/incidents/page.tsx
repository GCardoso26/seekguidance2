"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runtimeApi } from "@/services/api/runtime";
import { useAuthStore } from "@/stores/auth-store";

export default function Page() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const q = useQuery({
    queryKey: ["incidents"],
    queryFn: () => runtimeApi.incidents().catch(() => runtimeApi.status()),
    enabled: isAuthenticated,
  });
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Incidents</h1>
      <Card>
        <CardHeader><CardTitle>Live data</CardTitle></CardHeader>
        <CardContent>
          {q.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {q.isError && <p className="text-sm text-danger">Degraded — retry later</p>}
          {q.isSuccess && <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(q.data, null, 2)}</pre>}
        </CardContent>
      </Card>
    </AppShell>
  );
}
