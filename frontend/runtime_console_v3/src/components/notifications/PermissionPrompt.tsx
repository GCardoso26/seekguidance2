"use client";

import { useEffect, useState } from "react";
import { requestNotificationPermission } from "@/lib/notifications/push";

export function NotificationPermissionPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  if (permission === "granted") return null;

  return (
    <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-950/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-blue-100">Ative as notificações</h3>
          <p className="text-sm text-blue-200/80">
            Receba alertas de rodadas, resultados e novos torneios.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            const result = await requestNotificationPermission();
            setPermission(result);
          }}
          className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Ativar
        </button>
      </div>
    </div>
  );
}
