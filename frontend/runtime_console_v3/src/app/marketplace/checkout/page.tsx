"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutProgressBar } from "@/components/checkout/CheckoutProgressBar";
import { EnhancedPixCheckoutPanel } from "@/components/checkout/EnhancedPixCheckoutPanel";
import { CouponApply } from "@/components/checkout/CouponApply";
import { CpfCheckoutModal } from "@/components/kyc/CpfCheckoutModal";
import { InlineLoading } from "@/components/ui/async-state";
import { needsCpfCompletion, useAccountStatus } from "@/hooks/useAccountStatus";
import { useShopCart } from "@/hooks/useShopCart";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { trackEvent } from "@/lib/analytics";
import { CheckoutReservationBanner } from "@/components/checkout/CheckoutReservationBanner";
import { EscrowToggle } from "@/components/escrow/EscrowToggle";
import type { CheckoutSessionInfo } from "@/types/seller";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Methods = {
  total_cents: number;
  methods: { pix: boolean; stripe: boolean; escrow?: boolean };
  escrow_fee_cents?: number;
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

function StripeCheckoutForm() {
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
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="w-full rounded-lg bg-luxury-gold py-3 font-semibold text-luxury-onyx disabled:opacity-50">
        {loading ? "Processando…" : "Pagar com cartão"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { data: accountStatus, isLoading: accountLoading } = useAccountStatus();
  const { data: cart, isLoading: cartLoading } = useShopCart();
  const [cpfModal, setCpfModal] = useState(false);
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
  const [useEscrow, setUseEscrow] = useState(false);

  useEffect(() => {
    if (accountLoading) return;
    if (needsCpfCompletion(accountStatus)) {
      setCpfModal(true);
      setLoading(false);
      return;
    }

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
  }, [accountLoading, accountStatus]);

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
    if (accountLoading || needsCpfCompletion(accountStatus)) return;

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
  }, [accountLoading, accountStatus]);

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
        use_escrow: useEscrow,
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
        use_escrow: useEscrow,
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

  const productSubtotal = methods?.total_cents ?? cart?.total_cents ?? 0;
  const netSubtotal = Math.max(0, productSubtotal - discountCents);
  const escrowFee = useEscrow ? Math.round(netSubtotal * 0.03) : 0;
  const previewTotal = netSubtotal + escrowFee;
  const summarySubtotal = productSubtotal;
  const summaryTotal = pixData?.amount_cents ?? previewTotal;
  const cartItems = cart?.items ?? [];

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Link href="/carrinho" className="text-sm text-luxury-mist hover:text-luxury-frost">
          ← Carrinho
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Checkout</h1>
        <CheckoutProgressBar currentStep="payment" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="order-2 min-w-0 space-y-4 lg:order-1">
            {checkoutSession?.expires_at && !reservationError && (
              <CheckoutReservationBanner
                expiresAt={checkoutSession.expires_at}
                onExpired={() => void handleReservationExpired()}
              />
            )}

            {reservationError && <p className="text-red-400">{reservationError}</p>}

            {!checkoutSession && !reservationError && (
              <InlineLoading message="Reservando estoque…" className="py-8" />
            )}

            {methods?.stores?.length === 1 && checkoutSession && !reservationError && (
              <>
                <EscrowToggle
                  enabled={useEscrow}
                  onChange={(value) => {
                    setUseEscrow(value);
                    setPixData(null);
                    setClientSecret(null);
                  }}
                  amountCents={Math.max(0, productSubtotal - discountCents)}
                  available={Boolean(methods.methods.escrow)}
                />
                <CouponApply
                  storeId={methods.stores[0].store_id}
                  orderTotalCents={methods.total_cents}
                  onApplied={handleCouponApplied}
                  onClear={handleCouponClear}
                />
              </>
            )}

            {methods &&
              (methods.methods.pix || methods.methods.stripe) &&
              !pixData &&
              !clientSecret &&
              checkoutSession &&
              !reservationError && (
                <div className="flex gap-3">
                  {methods.methods.pix && (
                    <button
                      type="button"
                      onClick={() => {
                        setPixData(null);
                        setClientSecret(null);
                        setMethod("pix");
                      }}
                      className={`flex-1 rounded-lg border p-4 text-left ${method === "pix" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10"}`}
                    >
                      <div className="font-semibold">PIX</div>
                      <div className="text-xs text-emerald-400">Zero comissão</div>
                    </button>
                  )}
                  {methods.methods.stripe && (
                    <button
                      type="button"
                      onClick={() => {
                        setPixData(null);
                        setClientSecret(null);
                        setMethod("stripe");
                        void startStripe();
                      }}
                      className={`flex-1 rounded-lg border p-4 text-left ${method === "stripe" ? "border-blue-500 bg-blue-500/10" : "border-white/10"}`}
                    >
                      <div className="font-semibold">Cartão</div>
                      <div className="text-xs text-luxury-mist">Stripe (opcional)</div>
                    </button>
                  )}
                </div>
              )}

            {method === "pix" &&
              methods?.methods.pix &&
              !pixData &&
              !clientSecret &&
              checkoutSession &&
              !reservationError && (
                <button
                  type="button"
                  data-testid="generate-pix"
                  disabled={pixLoading}
                  onClick={() => void startPix()}
                  className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {pixLoading ? "Gerando PIX…" : "Gerar PIX"}
                </button>
              )}

            {initError && <p className="text-red-400">{initError}</p>}
            {loading && !pixData && !clientSecret && !initError && method === "stripe" && (
              <InlineLoading message="Preparando pagamento…" className="py-8" />
            )}

            {pixData && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
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
                <Link
                  href="/marketplace/orders"
                  className="mt-4 block text-center text-sm text-luxury-gold underline"
                >
                  Meus pedidos
                </Link>
              </div>
            )}

            {clientSecret && stripePromise && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night" } }}>
                  <StripeCheckoutForm />
                </Elements>
              </div>
            )}
          </div>

          <CheckoutOrderSummary
            className="order-1 lg:order-2"
            items={cartItems}
            subtotalCents={summarySubtotal}
            discountCents={discountCents}
            escrowFeeCents={escrowFee}
            totalCents={summaryTotal}
            storeName={methods?.stores?.[0]?.store_name}
            couponCode={appliedCoupon?.code ?? pixData?.coupon_code}
            isLoading={loading || cartLoading || accountLoading}
            sticky
          />
        </div>

        <CpfCheckoutModal open={cpfModal} onClose={() => setCpfModal(false)} />
      </div>
    </MobileLayout>
  );
}
