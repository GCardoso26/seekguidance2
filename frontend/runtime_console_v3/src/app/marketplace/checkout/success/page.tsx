"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { CheckoutProgressBar } from "@/components/checkout/CheckoutProgressBar";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { awardXpFireAndForget } from "@/lib/award-xp-client";
import { trackEvent } from "@/lib/analytics";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    const total = searchParams.get("total_cents");
    if (orderId) {
      void trackEvent("purchase", {
        order_id: orderId,
        total_cents: total ? Number(total) : undefined,
        payment_method: searchParams.get("payment_method") ?? "stripe",
        source: "checkout_success",
      });
      awardXpFireAndForget("marketplace_purchase");
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <CheckoutProgressBar currentStep="confirmation" />
      <div className="mt-10 text-center">
        <h1 className="text-2xl font-bold text-luxury-gold">Pagamento recebido!</h1>
        <p className="mt-4 text-luxury-mist">Seu pedido será processado pela loja em breve.</p>
        <Link href="/loja" className="mt-8 inline-block rounded-lg bg-luxury-gold px-6 py-3 font-semibold text-luxury-onyx">
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <MobileLayout>
      <Suspense fallback={<p className="p-16 text-center text-luxury-mist">Carregando…</p>}>
        <CheckoutSuccessContent />
      </Suspense>
    </MobileLayout>
  );
}
