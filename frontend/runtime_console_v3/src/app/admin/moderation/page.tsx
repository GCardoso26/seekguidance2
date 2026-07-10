"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";

type ReportRow = {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  community_posts: { title?: string; content?: string; author_id?: string } | null;
};

export default function AdminModerationPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");

  const { data: items = [] } = useQuery({
    queryKey: ["moderation", status],
    queryFn: async () => {
      const res = await fetch(`/api/social/moderation?status=${status}`);
      if (!res.ok) return [];
      return res.json() as Promise<ReportRow[]>;
    },
  });

  const act = async (
    reportId: string,
    action: "approve" | "hide" | "delete" | "ban",
    userId?: string,
  ) => {
    await fetch("/api/social/moderation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action, userId }),
    });
    void qc.invalidateQueries({ queryKey: ["moderation"] });
  };

  return (
    <PageShell>
      <PageHeader title="Moderação" description="Denúncias da comunidade e ações de moderação." />

      <div className="flex gap-2">
        {(["pending", "resolved", "dismissed", "all"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1 text-xs capitalize ${status === s ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
          >
            {s === "all" ? "Todos" : s}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.id} className="surface-card p-4">
            <p className="font-medium">{r.community_posts?.title ?? "Post denunciado"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {r.reason} · {r.status} · {new Date(r.created_at).toLocaleString("pt-BR")}
            </p>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{r.community_posts?.content}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void act(r.id, "approve")}
                className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs text-success"
              >
                Aprovar
              </button>
              <button
                type="button"
                onClick={() => void act(r.id, "hide")}
                className="rounded-lg bg-amber-500/20 px-3 py-1 text-xs text-warning"
              >
                Ocultar
              </button>
              <button
                type="button"
                onClick={() => void act(r.id, "delete")}
                className="rounded-lg bg-red-500/20 px-3 py-1 text-xs text-danger"
              >
                Deletar
              </button>
              {r.community_posts?.author_id && (
                <button
                  type="button"
                  onClick={() => void act(r.id, "ban", r.community_posts!.author_id!)}
                  className="rounded-lg bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  Banir autor
                </button>
              )}
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma denúncia neste filtro.</li>}
      </ul>
    </PageShell>
  );
}
