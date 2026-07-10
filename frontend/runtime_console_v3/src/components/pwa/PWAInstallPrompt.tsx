"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("pwa-install-dismissed") === "1") {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setDeferred(null);
    else {
      localStorage.setItem("pwa-install-dismissed", "1");
      setDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-md rounded-xl border border-primary/30 bg-card/95 p-4 shadow-xl backdrop-blur md:left-auto md:right-6">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary-light" aria-hidden />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Instalar Judge TCG</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Acesse rapidamente do seu celular, mesmo offline.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void install()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Instalar
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("pwa-install-dismissed", "1");
                setDismissed(true);
              }}
              className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("pwa-install-dismissed", "1");
            setDismissed(true);
          }}
          className="text-muted-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
