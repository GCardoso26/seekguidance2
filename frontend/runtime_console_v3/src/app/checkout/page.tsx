import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { CheckoutProgressBar } from "@/components/checkout/CheckoutProgressBar";
import { InlineLoading } from "@/components/ui/async-state";
import { SkipToMain } from "@/components/a11y/SkipToMain";

/**
 * Shell RSC: H1 + progress estáticos para LCP; island client com fluxo de pagamento.
 * Evidência: CHECKOUT_FINAL_PROFILE.md (LCP 2.0s no monólito client).
 */
export default function CheckoutPage() {
  return (
    <MobileLayout>
      <SkipToMain />
      <div className="page-container py-6 lg:py-8" id="main-content">
        <Link
          href="/carrinho"
          className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar ao carrinho
        </Link>

        <header className="mt-4 space-y-4">
          <div>
            <h1 className="text-h1 text-foreground">Finalizar compra</h1>
            <p className="mt-1 text-small text-muted-foreground">
              Revise o resumo, escolha o pagamento e conclua com segurança.
            </p>
          </div>
          <CheckoutProgressBar currentStep="payment" />
        </header>

        <Suspense
          fallback={
            <div className="mt-8">
              <InlineLoading message="Carregando checkout…" className="py-16" />
            </div>
          }
        >
          <CheckoutClient />
        </Suspense>
      </div>
    </MobileLayout>
  );
}
