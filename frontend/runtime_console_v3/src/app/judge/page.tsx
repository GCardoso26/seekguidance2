import { Suspense } from "react";
import { ConsentBanner } from "@/components/ConsentBanner";
import { JudgePageClient } from "./JudgePageClient";

export default function JudgePage() {
  return (
    <Suspense
      fallback={
        <div className="judge-app flex min-h-screen items-center justify-center bg-luxury-onyx text-sm text-luxury-mist">
          A carregar Judge TCG…
        </div>
      }
    >
      <JudgePageClient />
      <ConsentBanner />
    </Suspense>
  );
}
