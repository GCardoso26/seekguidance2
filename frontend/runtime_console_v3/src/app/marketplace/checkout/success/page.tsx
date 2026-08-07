"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { awardXp } from "@/lib/xp";

function CheckoutSuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const paymentIntent = searchParams.get("payment_intent");
  const redirectStatus = searchParams.get("redirect_status");
  const paymentSucceeded =
    redirectStatus === "succeeded" || Boolean(orderId) || Boolean(paymentIntent);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!paymentSucceeded || trackedRef.current) return;
    trackedRef.current = true;
    void trackEvent("purchase_completed", {
      order_id: orderId || undefined,
      payment_intent: paymentIntent || undefined,
      redirect_status: redirectStatus || undefined,
    });
    void awardXp(25, "purchase");
  }, [orderId, paymentIntent, paymentSucceeded, redirectStatus]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400"
        aria-hidden
      >
        ✓
      </div>
      <h1 className="text-2xl font-bold text-[var(--ink)]">Pagamento recebido!</h1>
      <p className="mt-2 text-sm text-[var(--ink-3)]">
        {orderId
          ? "Seu pedido foi confirmado. O vendedor será notificado e você receberá atualizações por e-mail."
          : paymentSucceeded
            ? "Seu pagamento foi confirmado. O pedido está sendo processado — você verá o status em Meus pedidos em instantes."
            : "Se o pagamento foi concluído, o pedido aparecerá em Meus pedidos em breve."}
      </p>
      {orderId ? (
        <p className="mt-4 font-mono text-xs text-[var(--ink-3)]">Pedido: {orderId}</p>
      ) : null}
      {paymentIntent && !orderId ? (
        <p className="mt-4 font-mono text-xs text-[var(--ink-3)]">Pagamento: {paymentIntent}</p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/perfil/pedidos"
          className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-fg)]"
        >
          Ver meus pedidos
        </Link>
        <Link
          href="/loja/cartas"
          className="rounded-xl border border-[var(--line)] px-6 py-3 text-sm font-medium text-[var(--ink)]"
        >
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-[var(--ink-3)]">
          Confirmando pagamento…
        </div>
      }
    >
      <CheckoutSuccessInner />
    </Suspense>
  );
}
