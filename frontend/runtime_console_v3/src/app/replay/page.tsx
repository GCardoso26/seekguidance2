"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runtimeApi } from "@/services/api/runtime";
import { useAuthStore } from "@/stores/auth-store";

export default function ReplayPage() {
  const auth = useAuthStore((s) => s.accessToken || s.apiKey);
  const tenantId = useAuthStore((s) => s.tenantId);
  const q = useQuery({ queryKey: ["replay", tenantId], queryFn: () => runtimeApi.replays(auth, tenantId), enabled: !!auth });
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Replay Center</h1>
      <Card><CardHeader><CardTitle>Replay explorer</CardTitle></CardHeader>
        <CardContent>{q.isLoading ? "Loading..." : <pre className="text-xs overflow-auto max-h-[32rem]">{JSON.stringify(q.data, null, 2)}</pre>}</CardContent>
      </Card>
    </AppShell>
  );
}
