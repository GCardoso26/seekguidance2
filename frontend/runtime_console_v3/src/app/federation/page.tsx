"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runtimeApi } from "@/services/api/runtime";
import { useAuthStore } from "@/stores/auth-store";

export default function FederationPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const q = useQuery({ queryKey: ["federation"], queryFn: () => runtimeApi.federation(), enabled: isAuthenticated });
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Federation</h1>
      <Card>
        <CardHeader><CardTitle>Topology & node health</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(q.data, null, 2)}</pre>
        </CardContent>
      </Card>
    </AppShell>
  );
}
