"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import type { AppNotification } from "@/types/post";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/relative-time";

export function GlobalNotificationBell() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: unread = { count: 0 } } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
      if (!res.ok) return { count: 0 };
      return res.json() as Promise<{ count: number }>;
    },
    refetchInterval: 30_000,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["notifications-feed"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/feed", { cache: "no-store" });
      if (!res.ok) return [];
      return res.json() as Promise<AppNotification[]>;
    },
    refetchInterval: 30_000,
  });

  const markRead = async (n: AppNotification) => {
    const source = n.source || "social";
    await fetch(`/api/notifications/${n.id}/read?source=${source}`, { method: "POST" });
    void qc.invalidateQueries({ queryKey: ["notifications-feed"] });
    void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    if (n.link) router.push(n.link);
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
    void qc.invalidateQueries({ queryKey: ["notifications-feed"] });
    void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
  };

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label="Notificações"
        className="relative rounded-lg p-2 text-luxury-mist hover:bg-white/5 hover:text-luxury-frost"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {unread.count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread.count > 9 ? "9+" : unread.count}
          </span>
        )}
      </button>
      <div className="invisible absolute right-0 z-50 mt-2 w-80 rounded-xl border border-white/10 bg-luxury-obsidian opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <span className="text-sm font-medium">Notificações</span>
          {unread.count > 0 && (
            <button type="button" onClick={() => void markAllRead()} className="text-xs text-luxury-gold">
              Marcar lidas
            </button>
          )}
        </div>
        <ul className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-luxury-mist">Nenhuma notificação</li>
          )}
          {items.slice(0, 10).map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => void markRead(n)}
                className={cn(
                  "block w-full px-4 py-3 text-left text-sm hover:bg-white/5",
                  !n.readAt && "bg-luxury-gold/5",
                )}
              >
                <p className="font-medium text-luxury-frost">{n.title}</p>
                {n.content && <p className="mt-0.5 line-clamp-2 text-xs text-luxury-mist">{n.content}</p>}
                <p className="mt-1 text-[10px] text-luxury-mist">
                  {n.createdAt ? formatRelativeTime(n.createdAt) : ""}
                </p>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 p-2 text-center">
          <Link href="/notifications" className="text-xs text-luxury-gold underline">
            Ver todas
          </Link>
        </div>
      </div>
    </div>
  );
}
