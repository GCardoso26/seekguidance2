"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useUserRole } from "@/hooks/useUserRole";

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
  const { isAdmin, loading } = useUserRole();
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");

  const { data: items = [] } = useQuery({
    queryKey: ["moderation", status],
    queryFn: async () => {
      const res = await fetch(`/api/social/moderation?status=${status}`);
      if (!res.ok) return [];
      return res.json() as Promise<ReportRow[]>;
    },
    enabled: isAdmin,
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

  if (loading) return null;
  if (!isAdmin) {
    return (
      <MobileLayout>
        <p className="p-8 text-center text-luxury-mist">Acesso restrito a administradores.</p>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/admin" className="text-sm text-luxury-mist">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-light">Moderação</h1>
        <div className="mt-4 flex gap-2">
          {(["pending", "resolved", "dismissed", "all"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1 text-xs capitalize ${status === s ? "bg-luxury-gold/20 text-luxury-gold-light" : "text-luxury-mist"}`}
            >
              {s === "all" ? "Todos" : s}
            </button>
          ))}
        </div>
        <ul className="mt-6 space-y-3">
          {items.map((r) => (
            <li key={r.id} className="luxury-card rounded-xl p-4">
              <p className="font-medium">{r.community_posts?.title ?? "Post denunciado"}</p>
              <p className="mt-1 text-xs text-luxury-mist">
                {r.reason} · {r.status} · {new Date(r.created_at).toLocaleString("pt-BR")}
              </p>
              <p className="mt-2 line-clamp-3 text-sm text-luxury-mist">{r.community_posts?.content}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void act(r.id, "approve")}
                  className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300"
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => void act(r.id, "hide")}
                  className="rounded-lg bg-amber-500/20 px-3 py-1 text-xs text-amber-200"
                >
                  Ocultar
                </button>
                <button
                  type="button"
                  onClick={() => void act(r.id, "delete")}
                  className="rounded-lg bg-red-500/20 px-3 py-1 text-xs text-red-300"
                >
                  Deletar
                </button>
                {r.community_posts?.author_id && (
                  <button
                    type="button"
                    onClick={() => void act(r.id, "ban", r.community_posts!.author_id!)}
                    className="rounded-lg bg-white/10 px-3 py-1 text-xs text-luxury-mist"
                  >
                    Banir autor
                  </button>
                )}
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-luxury-mist">Nenhuma denúncia neste filtro.</li>}
        </ul>
      </div>
    </MobileLayout>
  );
}
