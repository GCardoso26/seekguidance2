"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PixCheckoutPanel } from "@/components/marketplace/PixCheckoutPanel";
import { formatShopPrice } from "@/lib/marketplace-shop";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Methods = {
  total_cents: number;
  methods: { pix: boolean; stripe: boolean };
  default_method: "pix" | "stripe";
};

type PixData = {
  txid: string;
  copy_payload: string;
  qr_code: string | null;
  amount_cents: number;
  expires_at: string;
  pix_key: string;
  store_name: string;
};

function StripeCheckoutForm({ totalCents }: { totalCents: number }) {
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
      confirmParams: { return_url: `${window.location.origin}/marketplace/checkout/success` },
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
        {loading ? "Processando…" : "Pagar com cartão"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const [methods, setMethods] = useState<Methods | null>(null);
  const [method, setMethod] = useState<"pix" | "stripe">("pix");
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [totalCents, setTotalCents] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMethods() {
      const res = await fetch("/api/marketplace/shop/checkout/methods");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setInitError(String(body.detail ?? "Não foi possível iniciar checkout"));
        setLoading(false);
        return;
      }
      const data = (await res.json()) as Methods;
      setMethods(data);
      setTotalCents(data.total_cents);
      setMethod(data.default_method === "stripe" && data.methods.stripe ? "stripe" : "pix");
      setLoading(false);
    }
    void loadMethods();
  }, []);

  async function startPix() {
    setLoading(true);
    setInitError(null);
    const res = await fetch("/api/marketplace/shop/checkout/pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setInitError(String(body.detail ?? "Erro ao gerar PIX"));
      setLoading(false);
      return;
    }
    const data = await res.json();
    setPixData(data.pix as PixData);
    setLoading(false);
  }

  async function startStripe() {
    if (!stripePromise) {
      setInitError("Stripe não configurado");
      return;
    }
    setLoading(true);
    setInitError(null);
    const res = await fetch("/api/marketplace/shop/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setInitError(String(body.detail ?? "Erro ao iniciar pagamento"));
      setLoading(false);
      return;
    }
    const data = await res.json();
    setClientSecret(data.client_secret);
    setTotalCents(data.total_cents ?? totalCents);
    setLoading(false);
  }

  useEffect(() => {
    if (!methods || pixData || clientSecret) return;
    if (method === "pix" && methods.methods.pix) void startPix();
    if (method === "stripe" && methods.methods.stripe) void startStripe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, methods]);

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Link href="/marketplace/cart" className="text-sm text-luxury-mist">← Carrinho</Link>
        <h1 className="mt-4 text-2xl font-bold">Checkout</h1>

        {methods && (
          <p className="mt-2 text-sm text-luxury-mist">Total: {formatShopPrice(methods.total_cents)}</p>
        )}

        {methods && (methods.methods.pix || methods.methods.stripe) && !pixData && !clientSecret && (
          <div className="mt-6 flex gap-3">
            {methods.methods.pix && (
              <button
                type="button"
                onClick={() => { setPixData(null); setClientSecret(null); setMethod("pix"); void startPix(); }}
                className={`flex-1 rounded-lg border p-4 text-left ${method === "pix" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10"}`}
              >
                <div className="font-semibold">PIX</div>
                <div className="text-xs text-emerald-400">Zero comissão</div>
              </button>
            )}
            {methods.methods.stripe && (
              <button
                type="button"
                onClick={() => { setPixData(null); setClientSecret(null); setMethod("stripe"); void startStripe(); }}
                className={`flex-1 rounded-lg border p-4 text-left ${method === "stripe" ? "border-blue-500 bg-blue-500/10" : "border-white/10"}`}
              >
                <div className="font-semibold">Cartão</div>
                <div className="text-xs text-luxury-mist">Stripe (opcional)</div>
              </button>
            )}
          </div>
        )}

        {initError && <p className="mt-4 text-red-400">{initError}</p>}
        {loading && !pixData && !clientSecret && !initError && <p className="mt-4 text-luxury-mist">Preparando pagamento…</p>}

        {pixData && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <PixCheckoutPanel pix={pixData} />
            <Link href="/marketplace" className="mt-4 block text-center text-sm text-luxury-gold underline">
              Voltar ao marketplace
            </Link>
          </div>
        )}

        {clientSecret && stripePromise && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night" } }}>
              <StripeCheckoutForm totalCents={totalCents} />
            </Elements>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
