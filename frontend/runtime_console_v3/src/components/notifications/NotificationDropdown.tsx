"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  MessageCircle,
  ShoppingBag,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { AppNotification } from "@/types/post";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsFeed,
  useNotificationsUnreadCount,
} from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, LucideIcon> = {
  price_alert: Bell,
  order_update: ShoppingBag,
  tournament_reminder: Trophy,
  tournament_result: Trophy,
  xp_earned: Star,
  badge_unlocked: Star,
  message: MessageCircle,
};

type NotificationDropdownProps = {
  limit?: number;
  className?: string;
};

export function NotificationDropdown({ limit = 5, className }: NotificationDropdownProps) {
  const router = useRouter();
  const { data: unread = { count: 0 } } = useNotificationsUnreadCount();
  const { data: items = [] } = useNotificationsFeed();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const handleOpen = async (n: AppNotification) => {
    if (!n.readAt) await markRead.mutateAsync(n);
    if (n.link) router.push(n.link);
  };

  return (
    <div
      data-testid="notification-dropdown"
      className={cn(
        "invisible absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-card opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm font-medium">Notificações</span>
        {unread.count > 0 && (
          <button
            type="button"
            onClick={() => void markAll.mutate()}
            className="text-xs text-primary"
          >
            Marcar lidas
          </button>
        )}
      </div>
      <ul className="max-h-80 overflow-y-auto">
        {items.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação</li>
        )}
        {items.slice(0, limit).map((n) => {
          const Icon = TYPE_ICONS[n.type] ?? Bell;
          return (
            <li key={n.id} data-testid={`notification-item-${n.id}`}>
              <div
                className={cn(
                  "flex gap-3 px-4 py-3 text-left text-sm hover:bg-muted/80",
                  !n.readAt && "bg-primary/5",
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => void handleOpen(n)}>
                  <p className="font-medium text-foreground">{n.title}</p>
                  {n.content && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.content}</p>
                  )}
                  <p className="mt-1 text-caption text-muted-foreground">
                    {n.createdAt ? formatRelativeTime(n.createdAt) : ""}
                  </p>
                </button>
                <button
                  type="button"
                  aria-label="Remover"
                  onClick={() => void remove.mutate(n)}
                  className="text-xs text-muted-foreground hover:text-danger"
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border p-2 text-center">
        <Link href="/notifications" className="text-xs text-primary underline">
          Ver todas
        </Link>
      </div>
    </div>
  );
}
