import { Suspense } from "react";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { JudgePageClient } from "./JudgePageClient";

export default function JudgePage() {
  return (
    <Suspense
      fallback={
        <div className="judge-app flex min-h-screen items-center justify-center text-sm text-[hsl(222_15%_45%)]">
          A carregar Judge TCG…
        </div>
      }
    >
      <AuthProvider>
        <JudgePageClient />
        <ConsentBanner />
      </AuthProvider>
    </Suspense>
  );
}
