"use client";

import type { ReactNode } from "react";
import { RulesAccessDenied } from "@/components/rules/RulesAccessDenied";
import { InlineLoading } from "@/components/ui/async-state";
import { useRulesAccess } from "@/hooks/useRulesAccess";

export function JudgeRulesAccessGuard({ children }: { children: ReactNode }) {
  const { allowed, reason, loading } = useRulesAccess();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <InlineLoading message="Verificando acesso às regras…" />
      </div>
    );
  }

  if (!allowed && reason) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <RulesAccessDenied reason={reason} title="Mesa de Regras" />
      </div>
    );
  }

  return <>{children}</>;
}
