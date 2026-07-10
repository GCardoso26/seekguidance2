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

function aggregateStatus(services: ServiceHealth[]): ServiceHealthStatus {
  if (services.some((s) => s.status === "offline")) return "offline";
  if (services.some((s) => s.status === "degraded")) return "degraded";
  return "online";
}

/** Indicador discreto no footer — modal só quando há problema real. */
export function ServiceStatusDot({ className }: { className?: string }) {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as HealthPayload;
      const list = data.services ?? [];
      setServices(list);
      const hasIssue = list.some((s) => s.status === "offline" || s.status === "degraded");
      if (hasIssue && !dismissed) setModalOpen(true);
    } catch {
      setServices([
        { name: "API Principal", status: "offline" },
        { name: "Banco de Regras", status: "offline" },
        { name: "AI Judge", status: "offline" },
      ]);
      if (!dismissed) setModalOpen(true);
    }
  }, [dismissed]);

  useEffect(() => {
    void fetchHealth();
    const id = window.setInterval(() => void fetchHealth(), POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchHealth]);

  const status = aggregateStatus(services.length ? services : [{ name: "API", status: "online" }]);
  const label = STATUS_LABEL[status];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (status !== "online") setModalOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300",
          className,
        )}
        title={`Serviços: ${label}${status !== "online" ? " — clique para detalhes" : ""}`}
        aria-label={`Estado dos serviços: ${label}`}
      >
        <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} aria-hidden />
        {label}
      </button>

      {modalOpen && !dismissed && status !== "online" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-status-title"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-slate-900 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setDismissed(true);
                setModalOpen(false);
              }}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-muted hover:text-white"
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
                  Instabilidade detectada
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Alguns serviços podem responder com lentidão ou indisponibilidade temporária.
                </p>
              </div>
            </div>
            <ul className="mb-6 space-y-2 rounded-xl border border-border bg-black/30 p-3">
              {services.map((service) => (
                <li
                  key={service.name}
                  className="flex items-center justify-between gap-3 text-sm text-slate-200"
                >
                  <span>{service.name}</span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[service.status])} />
                    {STATUS_LABEL[service.status]}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setDismissed(true);
                setModalOpen(false);
              }}
              className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400"
            >
              Continuar mesmo assim
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** @deprecated Use ServiceStatusDot — mantido para compatibilidade sem modal agressivo. */
export function ServiceStatusMonitor() {
  return null;
}
