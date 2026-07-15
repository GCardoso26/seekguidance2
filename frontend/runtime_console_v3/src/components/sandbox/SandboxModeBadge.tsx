"use client";

import { canElevateSandbox } from "@/lib/app-mode";

/** Visible only in sandbox/development — not in production/beta chrome noise. */
export function SandboxModeBadge() {
  if (!canElevateSandbox()) return null;
  return (
    <span
      data-testid="sandbox-badge"
      className="hidden rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-caption font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 sm:inline"
      title="Modo sandbox — recursos de demo liberados para testes"
    >
      Sandbox
    </span>
  );
}
