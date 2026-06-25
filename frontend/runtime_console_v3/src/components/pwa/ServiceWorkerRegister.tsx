"use client";

import { useEffect } from "react";
import { useJudgeToast } from "@/hooks/use-judge-toast";

/** Registra SW e notifica quando há nova versão disponível. */
export function ServiceWorkerRegister() {
  const { success } = useJudgeToast();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              success("Nova versão disponível! Recarregue para atualizar.");
              window.dispatchEvent(new CustomEvent("sw-update-available"));
            }
          });
        });
      })
      .catch((err) => console.error("[PWA] SW registration failed:", err));
  }, [success]);

  return null;
}
