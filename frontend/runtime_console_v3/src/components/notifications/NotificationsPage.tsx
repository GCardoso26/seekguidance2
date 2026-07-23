"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from "@/hooks/useNotifications";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/notifications";
import {
  actionForNotification,
  groupNotifications,
  priorityForNotification,
} from "@/lib/notifications/center";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import type { NotificationFilter } from "@/lib/notifications";

const FILTERS: Array<{ id: NotificationFilter; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "Não lidas" },
  { id: "price_alert", label: "Preços" },
  { id: "order_update", label: "Pedidos" },
  { id: "tournament_reminder", label: "Torneios" },
  { id: "xp_earned", label: "XP" },
];

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-rose-500",
  high: "bg-amber-500",
  normal: "bg-primary",
  low: "bg-muted-foreground",
};

export function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const v2 = isFeatureEnabled("NOTIFICATION_CENTER_V2");
  const { data, isLoading } = useNotificationsList(filter);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const items = data?.items ?? [];
  const groups = useMemo(() => (v2 ? groupNotifications(items) : []), [items, v2]);

  return (
    <div data-testid="notifications-page">
      {v2 && (
        <p className="mb-4 text-sm text-muted-foreground" data-testid="notification-center-v2">
          Notification Center — agrupadas, prioridade e ações (Domain Events via BFF, sem polling).
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "min-h-11 rounded-full px-3 py-1 text-xs font-medium transition",
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {data && data.unread > 0 && (
          <button
            type="button"
            onClick={() => void markAll.mutate()}
            className="min-h-11 text-sm text-primary underline"
          >
            Marcar todas como lidas ({data.unread})
          </button>
        )}
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>}

      {!isLoading && items.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-4xl" aria-hidden>
            🔔
          </p>
          <p className="mt-4">Nenhuma notificação neste filtro.</p>
        </div>
      )}

      {v2 && groups.length > 0 ? (
        <div className="mt-6 space-y-8">
          {groups.map((g) => (
            <section key={g.id}>
              <h2 className="mb-3 flex items-center justify-between text-sm font-semibold">
                <span>{g.label}</span>
                {g.unread > 0 && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                    {g.unread} não lidas
                  </span>
                )}
              </h2>
              <div className="space-y-2">
                {g.items.map((n) => {
                  const action = actionForNotification(n);
                  const priority = priorityForNotification(n);
                  return (
                    <article
                      key={n.id}
                      data-testid={`notification-row-${n.id}`}
                      className={cn("surface-card p-4", !n.readAt && "border-primary/30")}
                    >
                      <div className="flex justify-between gap-2">
                        <div className="flex gap-2">
                          <span
                            className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", PRIORITY_DOT[priority])}
                            aria-label={`prioridade ${priority}`}
                          />
                          <div>
                            <span className="text-caption uppercase tracking-wide text-muted-foreground">
                              {NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}
                            </span>
                            <h3 className="font-medium text-foreground">{n.title}</h3>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {n.createdAt ? formatRelativeTime(n.createdAt) : ""}
                        </span>
                      </div>
                      {n.content && <p className="mt-2 text-sm text-muted-foreground">{n.content}</p>}
                      <div className="mt-3 flex flex-wrap gap-3">
                        {action && (
                          <Link
                            href={action.href}
                            className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline"
                          >
                            {action.label}
                          </Link>
                        )}
                        {!n.readAt && (
                          <button
                            type="button"
                            onClick={() => void markRead.mutate(n)}
                            className="min-h-11 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Marcar lida
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void remove.mutate(n)}
                          className="min-h-11 text-xs text-muted-foreground hover:text-danger"
                        >
                          Remover
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {items.map((n) => (
            <article
              key={n.id}
              data-testid={`notification-row-${n.id}`}
              className={cn("surface-card p-4", !n.readAt && "border-primary/30")}
            >
              <div className="flex justify-between gap-2">
                <div>
                  <span className="text-caption uppercase tracking-wide text-muted-foreground">
                    {NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}
                  </span>
                  <h3 className="font-medium text-foreground">{n.title}</h3>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {n.createdAt ? formatRelativeTime(n.createdAt) : ""}
                </span>
              </div>
              {n.content && <p className="mt-2 text-sm text-muted-foreground">{n.content}</p>}
              <div className="mt-3 flex gap-3">
                {n.link && (
                  <Link href={n.link} className="text-sm text-primary underline">
                    Ver detalhes
                  </Link>
                )}
                {!n.readAt && (
                  <button
                    type="button"
                    onClick={() => void markRead.mutate(n)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Marcar lida
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void remove.mutate(n)}
                  className="text-xs text-muted-foreground hover:text-danger"
                >
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {items.length > 0 && filter === "all" && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          {data?.total ?? items.length} notificações no total
        </p>
      )}
    </div>
  );
}
