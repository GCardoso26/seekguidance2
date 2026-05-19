"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runtimeApi } from "@/services/api/runtime";
import { useAuthStore } from "@/stores/auth-store";

export default function TenantsPage() {
  const auth = useAuthStore((s) => s.accessToken || s.apiKey);
  const q = useQuery({ queryKey: ["tenants"], queryFn: () => runtimeApi.tenants(auth), enabled: !!auth });
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Tenants</h1>
      <Card><CardHeader><CardTitle>Tenant registry</CardTitle></CardHeader>
        <CardContent>{q.isLoading ? "Loading..." : <pre className="text-xs overflow-auto">{JSON.stringify(q.data, null, 2)}</pre>}</CardContent>
      </Card>
    </AppShell>
  );
}
