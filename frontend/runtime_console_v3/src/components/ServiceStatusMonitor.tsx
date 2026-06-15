"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { ServiceHealth, ServiceHealthStatus } from "@/types/service-health";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

const STATUS_LABEL: Record<ServiceHealthStatus, string> = {
  online: "Online",
  degraded: "Degradado",
  offline: "Offline",
};

const STATUS_DOT: Record<ServiceHealthStatus, string> = {
  online: "bg-emerald-400",
  degraded: "bg-amber-400",
  offline: "bg-red-400",
};

type HealthPayload = {
  status: string;
  services: ServiceHealth[];
  checkedAt: string;
};

export function ServiceStatusMonitor() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as HealthPayload;
      setServices(data.services ?? []);
      const hasIssue = data.services?.some(
        (s) => s.status === "offline" || s.status === "degraded",
      );
      if (hasIssue) {
        setOpen(true);
        setDismissed(false);
      }
    } catch {
      setServices([
        { name: "API Principal", status: "offline" },
        { name: "Banco de Regras", status: "offline" },
        { name: "AI Judge", status: "offline" },
      ]);
      setOpen(true);
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
    const id = window.setInterval(() => void fetchHealth(), POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchHealth]);

  if (!open || dismissed) return null;

  const showModal = services.some((s) => s.status === "offline" || s.status === "degraded");
  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-status-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            setOpen(false);
          }}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
            <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden />
          </div>
          <div>
            <h2 id="service-status-title" className="text-lg font-bold text-white">
              Problemas Técnicos
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Alguns serviços estão passando por instabilidades. Nossa equipe já foi notificada e
              está trabalhando para resolver o mais rápido possível.
            </p>
          </div>
        </div>

        <ul className="mb-6 space-y-2 rounded-xl border border-white/10 bg-black/30 p-3">
          {services.map((service) => (
            <li
              key={service.name}
              className="flex items-center justify-between gap-3 text-sm text-slate-200"
            >
              <span>{service.name}</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span
                  className={cn("h-2 w-2 rounded-full", STATUS_DOT[service.status])}
                  aria-hidden
                />
                {STATUS_LABEL[service.status]}
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            setOpen(false);
          }}
          className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
        >
          Entendi, continuar mesmo assim
        </button>
      </div>
    </div>
  );
}
