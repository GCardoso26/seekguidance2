"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["subscription"] });
    if (sessionId) {
      void trackEvent("checkout_completed", { session_id: sessionId });
    }
  }, [sessionId, queryClient]);

  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
        <span className="text-4xl" aria-hidden>
          ✓
        </span>
      </div>
      <h1 className="mb-4 text-3xl font-bold text-white">Subscrição ativada!</h1>
      <p className="mb-8 text-slate-400">
        O pagamento foi processado. Já podes usar as funcionalidades do teu plano.
      </p>
      <div className="space-y-3">
        <Link
          href="/judge"
          className="block w-full rounded-lg bg-emerald-500 py-3 font-medium text-white hover:bg-emerald-400"
        >
          Ir para a Mesa
        </Link>
        <Link
          href="/settings/billing"
          className="block w-full rounded-lg border border-slate-600 py-3 text-slate-300 hover:bg-slate-800"
        >
          Gerir subscrição
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <Suspense fallback={<p className="text-slate-400">A confirmar pagamento...</p>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
