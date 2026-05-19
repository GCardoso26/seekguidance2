"use client";
import Link from "next/link";
import { useState } from "react";
import type { BackendHealthState } from "@/types/judge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const HEALTH_LABEL: Record<BackendHealthState, string> = {
  online: "Online",
  degraded: "Degraded",
  offline: "Offline",
};

const HEALTH_VARIANT: Record<BackendHealthState, "success" | "warning" | "danger"> = {
  online: "success",
  degraded: "warning",
  offline: "danger",
};

type Props = {
  health: BackendHealthState;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
};

export function JudgeLayout({ health, children, sidebar }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden rounded-md border border-border px-2 py-1 text-xs"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">TCG Judge</p>
            <h1 className="text-lg font-semibold">Consulta de regras</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={HEALTH_VARIANT[health]}>{HEALTH_LABEL[health]}</Badge>
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-primary hidden sm:inline">
            Console
          </Link>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside
          className={cn(
            "border-r border-border bg-card/30 p-4 w-72 shrink-0",
            "fixed md:static inset-y-0 left-0 z-10 pt-16 md:pt-0 transform transition md:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          {sidebar}
        </aside>
        {open && (
          <button
            type="button"
            className="fixed inset-0 z-[5] bg-black/40 md:hidden"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
        )}
        <main className="flex-1 p-4 md:p-6 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
