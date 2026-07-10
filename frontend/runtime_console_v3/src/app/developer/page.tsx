"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default function DeveloperPortalPage() {
  const qc = useQueryClient();
  const { data: usage } = useQuery({
    queryKey: ["dev-usage"],
    queryFn: async () => {
      const res = await fetch("/api/developer/usage");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const createKey = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/developer/api-keys", { method: "POST" });
      if (!res.ok) throw new Error("Falha");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dev-usage"] }),
  });

  const u = usage as Record<string, unknown> | null;
  const newKey = createKey.data as { apiKey?: string } | undefined;

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">Developer Portal</h1>
        <section className="mt-6 rounded-xl border border-slate-700 p-4">
          <h2 className="font-semibold">API Key</h2>
          {newKey?.apiKey ? (
            <code className="mt-2 block break-all rounded bg-slate-900 p-2 text-sm">{newKey.apiKey}</code>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Prefixo: {String(u?.key_prefix ?? "—")}</p>
          )}
          <button
            type="button"
            onClick={() => createKey.mutate()}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm text-foreground"
          >
            Gerar nova key
          </button>
        </section>
        {u && (
          <section className="mt-6 rounded-xl border border-slate-700 p-4">
            <h2 className="font-semibold">Uso (30 dias)</h2>
            <p className="mt-2 text-warning">
              {String(u.usage_count)} / {String(u.rate_limit_monthly)} requests
            </p>
          </section>
        )}
        <p className="mt-6 text-sm text-slate-400">
          Documentação: <a href="/docs/API_PUBLIC.md" className="text-info">API pública v1</a>
        </p>
      </div>
    </MobileLayout>
  );
}
