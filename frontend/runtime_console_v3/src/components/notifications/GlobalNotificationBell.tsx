"use client";

import { Bell } from "lucide-react";
import dynamic from "next/dynamic";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useNotificationsUnreadCount } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const NotificationDropdown = dynamic(
  () => import("@/components/notifications/NotificationDropdown").then((m) => m.NotificationDropdown),
  { ssr: false },
);

export function GlobalNotificationBell() {
  const { user, loading } = useJudgeAuth();
  const { data: unread = { count: 0 } } = useNotificationsUnreadCount();

  if (loading || !user) return null;

  return (
    <div className="group relative">
      <button
        type="button"
        data-testid="notification-bell"
        aria-label={`Notificações${unread.count > 0 ? ` (${unread.count} não lidas)` : ""}`}
        className={cn(
          "relative rounded-lg p-2 transition",
          unread.count > 0
            ? "text-luxury-frost hover:bg-white/5"
            : "text-luxury-mist hover:bg-white/5 hover:text-luxury-frost",
        )}
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {unread.count > 0 && (
          <span
            data-testid="notification-unread-badge"
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {unread.count > 9 ? "9+" : unread.count}
          </span>
        )}
      </button>
      <NotificationDropdown />
    </div>
  );
}
