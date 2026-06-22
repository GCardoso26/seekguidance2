"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { EnhancedPixCheckoutPanel } from "@/components/checkout/EnhancedPixCheckoutPanel";
import { CouponApply } from "@/components/checkout/CouponApply";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { trackEvent } from "@/lib/analytics";
import { CheckoutReservationBanner } from "@/components/checkout/CheckoutReservationBanner";
import type { CheckoutSessionInfo } from "@/types/seller";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Methods = {
  total_cents: number;
  methods: { pix: boolean; stripe: boolean };
  default_method: "pix" | "stripe";
  stores?: Array<{ store_id: string; store_name: string }>;
};

type PixData = {
  txid: string;
  copy_payload: string;
  qr_code: string | null;
  amount_cents: number;
  subtotal_cents?: number;
  discount_cents?: number;
  coupon_code?: string | null;
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
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSessionInfo | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [totalCents, setTotalCents] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const [discountCents, setDiscountCents] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; storeId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pixLoading, setPixLoading] = useState(false);

  useEffect(() => {
    async function reserveStock() {
      const res = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.status === 423) {
        setReservationError("Item sendo processado por outro comprador. Tente novamente em instantes.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setReservationError(String(body.detail ?? "Não foi possível reservar estoque"));
        return;
      }
      const data = await res.json();
      const checkout = (data.checkout ?? data) as CheckoutSessionInfo;
      setCheckoutSession(checkout);
    }
    void reserveStock();
  }, []);

  async function handleReservationExpired() {
    if (checkoutSession?.session_id) {
      await fetch(`/api/checkout/${checkoutSession.session_id}/cancel`, { method: "POST" });
    }
    setCheckoutSession(null);
    setPixData(null);
    setClientSecret(null);
    setReservationError("Sessão expirada. Os itens foram liberados — atualize a página para tentar novamente.");
  }

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

  async function startPix(coupon?: { code: string; storeId: string } | null) {
    setPixLoading(true);
    setInitError(null);
    const activeCoupon = coupon ?? appliedCoupon;
    const res = await fetch("/api/marketplace/shop/checkout/pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coupon_code: activeCoupon?.code ?? null,
        store_id: activeCoupon?.storeId ?? null,
        checkout_session_id: checkoutSession?.session_id ?? null,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setInitError(String(body.detail ?? "Erro ao gerar PIX"));
      setPixLoading(false);
      return;
    }
    const data = await res.json();
    setPixData(data.pix as PixData);
    if (typeof data.discount_cents === "number") setDiscountCents(data.discount_cents);
    if (typeof data.total_cents === "number") setTotalCents(data.total_cents);
    void trackEvent("checkout_started", {
      payment_method: "PIX",
      total_cents: data.total_cents ?? totalCents,
      txid: (data.pix as PixData)?.txid,
    });
    setPixLoading(false);
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
      body: JSON.stringify({
        checkout_session_id: checkoutSession?.session_id ?? null,
      }),
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
    if (!methods || !checkoutSession || pixData || clientSecret || reservationError) return;
    if (method === "stripe" && methods.methods.stripe) void startStripe();
    // PIX exige clique explícito (permite aplicar cupom antes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, methods, checkoutSession, reservationError]);

  function handleCouponApplied(discount: number, code: string) {
    setDiscountCents(discount);
    const storeId = methods?.stores?.[0]?.store_id;
    if (storeId) {
      setAppliedCoupon({ code, storeId });
      if (pixData) {
        setPixData(null);
      }
    }
  }

  function handleCouponClear() {
    setDiscountCents(0);
    setAppliedCoupon(null);
    if (pixData) setPixData(null);
  }

  const previewTotal = Math.max(0, (methods?.total_cents ?? 0) - discountCents);

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Link href="/marketplace/cart" className="text-sm text-luxury-mist">← Carrinho</Link>
        <h1 className="mt-4 text-2xl font-bold">Checkout</h1>

        {checkoutSession?.expires_at && !reservationError && (
          <div className="mt-4">
            <CheckoutReservationBanner
              expiresAt={checkoutSession.expires_at}
              onExpired={() => void handleReservationExpired()}
            />
          </div>
        )}

        {reservationError && (
          <p className="mt-4 text-red-400">{reservationError}</p>
        )}

        {!checkoutSession && !reservationError && (
          <p className="mt-4 text-luxury-mist">Reservando estoque…</p>
        )}

        {methods && (
          <p className="mt-2 text-sm text-luxury-mist">
            Total: {formatShopPrice(previewTotal)}
            {discountCents > 0 && (
              <span className="ml-2 text-emerald-400" data-testid="discount-amount">
                (−{formatShopPrice(discountCents)})
              </span>
            )}
          </p>
        )}

        {methods?.stores?.length === 1 && (
          <div className="mt-4">
            <CouponApply
              storeId={methods.stores[0].store_id}
              orderTotalCents={methods.total_cents}
              onApplied={handleCouponApplied}
              onClear={handleCouponClear}
            />
          </div>
        )}

        {methods && (methods.methods.pix || methods.methods.stripe) && !pixData && !clientSecret && checkoutSession && !reservationError && (
          <div className="mt-6 flex gap-3">
            {methods.methods.pix && (
              <button
                type="button"
                onClick={() => { setPixData(null); setClientSecret(null); setMethod("pix"); }}
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

        {method === "pix" && methods?.methods.pix && !pixData && !clientSecret && checkoutSession && !reservationError && (
          <button
            type="button"
            data-testid="generate-pix"
            disabled={pixLoading}
            onClick={() => void startPix()}
            className="mt-6 w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white disabled:opacity-50"
          >
            {pixLoading ? "Gerando PIX…" : "Gerar PIX"}
          </button>
        )}

        {initError && <p className="mt-4 text-red-400">{initError}</p>}
        {loading && !pixData && !clientSecret && !initError && method === "stripe" && (
          <p className="mt-4 text-luxury-mist">Preparando pagamento…</p>
        )}

        {pixData && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <EnhancedPixCheckoutPanel
              pix={pixData}
              onRegenerate={() => {
                setPixData(null);
                void startPix();
              }}
            />
            <p className="mt-2 text-center text-lg font-bold" data-testid="final-amount">
              {formatShopPrice(pixData.amount_cents)}
            </p>
            <Link href="/marketplace/orders" className="mt-4 block text-center text-sm text-luxury-gold underline">
              Meus pedidos
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
