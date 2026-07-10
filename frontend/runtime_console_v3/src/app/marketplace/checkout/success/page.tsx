"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { CheckCircle2, Package } from "lucide-react";
import { CheckoutProgressBar } from "@/components/checkout/CheckoutProgressBar";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="page-container max-w-2xl py-12 lg:py-16">
      <CheckoutProgressBar currentStep="confirmation" className="mb-10" />

      <Card padding="lg" variant="elevated" className="text-center">
        <CardContent className="flex flex-col items-center gap-4 p-0 pt-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-9 w-9" aria-hidden />
          </span>
          <h1 className="text-h1 text-foreground">Pagamento recebido!</h1>
          <p className="max-w-md text-body text-muted-foreground">
            Seu pedido foi registrado e a loja será notificada. Acompanhe o status em Meus pedidos.
          </p>
          <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/marketplace/orders">
                <Package className="mr-2 h-4 w-4" aria-hidden />
                Meus pedidos
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/loja">Continuar comprando</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <MobileLayout>
      <Suspense
        fallback={
          <p className="page-container py-16 text-center text-muted-foreground">Carregando…</p>
        }
      >
        <CheckoutSuccessContent />
      </Suspense>
    </MobileLayout>
  );
}
