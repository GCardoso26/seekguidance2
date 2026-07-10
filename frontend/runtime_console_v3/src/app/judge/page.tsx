import { Suspense } from "react";
import { ConsentBanner } from "@/components/ConsentBanner";
import { JudgeRulesAccessGuard } from "@/components/judge/JudgeRulesAccessGuard";
import { JudgePageClient } from "./JudgePageClient";

export default function JudgePage() {
  return (
    <Suspense
      fallback={
        <div className="judge-app flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          A carregar Judge TCG…
        </div>
      }
    >
      <JudgeRulesAccessGuard>
        <JudgePageClient />
      </JudgeRulesAccessGuard>
      <ConsentBanner />
    </Suspense>
  );
}
