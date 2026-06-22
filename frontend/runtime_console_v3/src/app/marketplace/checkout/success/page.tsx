"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { trackEvent } from "@/lib/analytics";

export default function CheckoutSuccessPage() {
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
    }
  }, [searchParams]);

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-luxury-gold">Pagamento recebido!</h1>
        <p className="mt-4 text-luxury-mist">Seu pedido será processado pela loja em breve.</p>
        <Link href="/marketplace" className="mt-8 inline-block rounded-lg bg-luxury-gold px-6 py-3 font-semibold text-luxury-onyx">
          Voltar ao marketplace
        </Link>
      </div>
    </MobileLayout>
  );
}
