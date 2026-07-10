"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import type { FeedbackItem } from "@/types/post";

export default function AdminFeedbackPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);

  const { data: items = [] } = useQuery({
    queryKey: ["admin-feedback", status, priority],
    queryFn: async () => {
      const res = await fetch(`/api/social/feedback?${params}`);
      if (!res.ok) return [];
      return res.json() as Promise<FeedbackItem[]>;
    },
  });

  const updateStatus = async (id: string, next: string) => {
    await fetch(`/api/social/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    void qc.invalidateQueries({ queryKey: ["admin-feedback"] });
  };

  return (
    <PageShell>
      <PageHeader title="Feedback" description="Sugestões e relatos enviados pelos usuários." />

      <div className="flex gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="luxury-input">
          <option value="">Todos status</option>
          <option value="open">Aberto</option>
          <option value="in_progress">Em progresso</option>
          <option value="resolved">Resolvido</option>
          <option value="closed">Fechado</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="luxury-input">
          <option value="">Todas prioridades</option>
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
        </select>
      </div>

      <ul className="space-y-3">
        {items.map((f) => (
          <li key={f.id} className="surface-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{f.subject}</span>
              <span className="text-xs text-muted-foreground">
                {f.type} · {f.priority} · {f.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
            <select
              value={f.status}
              onChange={(e) => void updateStatus(f.id, e.target.value)}
              className="luxury-input mt-3 text-xs"
            >
              <option value="open">Aberto</option>
              <option value="in_progress">Em progresso</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
            </select>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
