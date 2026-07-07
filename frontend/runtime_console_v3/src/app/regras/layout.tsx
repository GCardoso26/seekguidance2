"use client";

import { RulesAccessDenied } from "@/components/rules/RulesAccessDenied";
import { InlineLoading } from "@/components/ui/async-state";
import { useRulesAccess } from "@/hooks/useRulesAccess";

export default function RegrasLayout({ children }: { children: React.ReactNode }) {
  const { allowed, reason, loading } = useRulesAccess();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <InlineLoading message="Verificando acesso…" />
      </div>
    );
  }

  if (!allowed && reason) {
    return <RulesAccessDenied reason={reason} />;
  }

  return <>{children}</>;
}
