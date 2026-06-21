"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import type { AppNotification } from "@/types/post";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

function groupLabel(date: Date): string {
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return "Esta semana";
  return "Anteriores";
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/social/notifications", { cache: "no-store" });
      if (!res.ok) return [];
      return res.json() as Promise<AppNotification[]>;
    },
  });

  const markRead = async (n: AppNotification) => {
    if (!n.readAt) {
      await fetch(`/api/social/notifications/${n.id}/read`, { method: "POST" });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    }
  };

  const groups = items.reduce<Record<string, AppNotification[]>>((acc, n) => {
    const label = n.createdAt ? groupLabel(new Date(n.createdAt)) : "Anteriores";
    acc[label] = acc[label] ?? [];
    acc[label].push(n);
    return acc;
  }, {});

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-luxury-mist">
          ← Início
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Notificações</h1>
        {isLoading && <p className="mt-4 text-luxury-mist">Carregando…</p>}
        {!isLoading && items.length === 0 && (
          <div className="mt-12 text-center text-luxury-mist">
            <p className="text-4xl">🔔</p>
            <p className="mt-4">Nenhuma notificação por enquanto.</p>
          </div>
        )}
        {Object.entries(groups).map(([label, group]) => (
          <section key={label} className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-luxury-mist">{label}</h2>
            <div className="space-y-2">
              {group.map((n) => (
                <article
                  key={n.id}
                  className={cn(
                    "rounded-xl border border-white/10 bg-white/5 p-4",
                    !n.readAt && "border-luxury-gold/30",
                  )}
                >
                  <div className="flex justify-between gap-2">
                    <h3 className="font-medium">{n.title}</h3>
                    <span className="text-xs text-luxury-mist">
                      {n.createdAt ? formatRelativeTime(n.createdAt) : ""}
                    </span>
                  </div>
                  {n.content && <p className="mt-2 text-sm text-luxury-mist">{n.content}</p>}
                  <div className="mt-3 flex gap-3">
                    {n.link && (
                      <Link href={n.link} onClick={() => void markRead(n)} className="text-sm text-luxury-gold underline">
                        Ver detalhes
                      </Link>
                    )}
                    {!n.readAt && (
                      <button type="button" onClick={() => void markRead(n)} className="text-xs text-luxury-mist">
                        Marcar lida
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        <p className="mt-8 text-center">
          <Link href="/settings/notifications" className="text-sm text-luxury-gold underline">
            Preferências de notificação
          </Link>
        </p>
      </div>
    </MobileLayout>
  );
}
