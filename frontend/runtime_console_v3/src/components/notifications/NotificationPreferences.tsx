"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function NotificationPreferences() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-300">Notificações push</span>
        <input
          type="checkbox"
          checked={pushEnabled}
          onChange={(e) => {
            setPushEnabled(e.target.checked);
            setSaved(false);
          }}
          className="h-4 w-4"
        />
      </label>
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-300">Notificações por e-mail</span>
        <input
          type="checkbox"
          checked={emailEnabled}
          onChange={(e) => {
            setEmailEnabled(e.target.checked);
            setSaved(false);
          }}
          className="h-4 w-4"
        />
      </label>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setSaved(true)}
        className="border-slate-600"
      >
        Salvar preferências
      </Button>
      {saved && <p className="text-sm text-success">Preferências salvas localmente.</p>}
    </div>
  );
}
