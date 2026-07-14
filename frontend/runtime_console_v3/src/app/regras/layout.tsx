"use client";

import { RulesAccessDenied } from "@/components/rules/RulesAccessDenied";
import { InlineLoading } from "@/components/ui/async-state";
import { useRulesAccess } from "@/hooks/useRulesAccess";
import { JudgeProviders } from "@/providers/JudgeProviders";

export default function RegrasLayout({ children }: { children: React.ReactNode }) {
  const { allowed, reason, loading } = useRulesAccess();

  if (loading) {
    return (
      <JudgeProviders>
        <div className="flex min-h-[50vh] items-center justify-center">
          <InlineLoading message="Verificando acesso…" />
        </div>
      </JudgeProviders>
    );
  }

  if (!allowed && reason) {
    return (
      <JudgeProviders>
        <RulesAccessDenied reason={reason} />
      </JudgeProviders>
    );
  }

  return <JudgeProviders>{children}</JudgeProviders>;
}
