"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Check } from "lucide-react";
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
    <div className="luxury-page mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
        <Check className="h-10 w-10 text-primary" strokeWidth={1.5} aria-hidden />
      </div>
      <h1 className="mb-4 text-3xl font-light text-foreground">Subscrição ativada</h1>
      <p className="mb-8 text-muted-foreground">
        O pagamento foi processado. Já podes usar as funcionalidades do teu plano.
      </p>
      <div className="space-y-3">
        <Link href="/judge" className="luxury-btn-primary block w-full">
          Ir para a Mesa
        </Link>
        <Link href="/settings/billing" className="luxury-btn-secondary block w-full">
          Gerir subscrição
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<p className="luxury-page py-24 text-center text-muted-foreground">A confirmar pagamento…</p>}>
      <SuccessContent />
    </Suspense>
  );
}
