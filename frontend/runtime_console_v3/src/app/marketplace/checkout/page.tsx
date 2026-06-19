"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { formatShopPrice } from "@/lib/marketplace-shop";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function CheckoutForm({ totalCents }: { totalCents: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/marketplace/checkout/success`,
      },
    });
    if (result.error) {
      setError(result.error.message ?? "Pagamento falhou");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-luxury-mist">Total: {formatShopPrice(totalCents)}</p>
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="w-full rounded-lg bg-luxury-gold py-3 font-semibold text-luxury-onyx disabled:opacity-50">
        {loading ? "Processando…" : "Pagar"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [totalCents, setTotalCents] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!stripePromise) {
        setInitError("Stripe não configurado (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)");
        return;
      }
      const res = await fetch("/api/marketplace/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setInitError(body.detail ?? "Não foi possível iniciar o checkout");
        return;
      }
      const data = await res.json();
      setClientSecret(data.client_secret);
      setTotalCents(data.total_cents ?? 0);
    }
    void init();
  }, []);

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Link href="/marketplace/cart" className="text-sm text-luxury-mist">← Carrinho</Link>
        <h1 className="mt-4 text-2xl font-bold">Checkout</h1>
        {initError && <p className="mt-4 text-red-400">{initError}</p>}
        {clientSecret && stripePromise && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night" } }}>
              <CheckoutForm totalCents={totalCents} />
            </Elements>
          </div>
        )}
        {!clientSecret && !initError && <p className="mt-4 text-luxury-mist">Preparando pagamento…</p>}
      </div>
    </MobileLayout>
  );
}
