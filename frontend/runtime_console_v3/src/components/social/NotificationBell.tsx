"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppNotification } from "@/types/post";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: unread = { count: 0 } } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      const res = await fetch("/api/social/notifications/unread-count", { cache: "no-store" });
      if (!res.ok) return { count: 0 };
      return res.json() as Promise<{ count: number }>;
    },
    refetchInterval: 30_000,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/social/notifications", { cache: "no-store" });
      if (!res.ok) return [];
      return res.json() as Promise<AppNotification[]>;
    },
    refetchInterval: 30_000,
  });

  const markRead = async (n: AppNotification) => {
    await fetch(`/api/social/notifications/${n.id}/read`, { method: "POST" });
    void qc.invalidateQueries({ queryKey: ["notifications"] });
    void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    if (n.link) router.push(n.link);
  };

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label="Notificações"
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {unread.count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread.count > 9 ? "9+" : unread.count}
          </span>
        )}
      </button>
      <div className="invisible absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-card opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="border-b border-border px-4 py-2 text-sm font-medium">Notificações</div>
        <ul className="max-h-80 overflow-y-auto">
          {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação</li>}
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => void markRead(n)}
                className={cn(
                  "block w-full px-4 py-3 text-left text-sm hover:bg-muted/80",
                  !n.readAt && "bg-primary/5",
                )}
              >
                <p className="font-medium text-foreground">{n.title}</p>
                {n.content && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.content}</p>}
                {n.link && (
                  <span className="mt-1 inline-block text-xs text-primary">
                    <Link href={n.link} onClick={(e) => e.stopPropagation()}>
                      Abrir
                    </Link>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
