"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Truck } from "lucide-react";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutPaymentMethodPicker } from "@/components/checkout/CheckoutPaymentMethodPicker";
import { CartShippingQuotePanel, type SelectedShippingQuote } from "@/components/cart/CartShippingQuotePanel";
import { CouponApply } from "@/components/checkout/CouponApply";
import { GalleryFade } from "@/components/gallery/GalleryMotion";
import { CpfCheckoutModal } from "@/components/kyc/CpfCheckoutModal";
import { InlineLoading } from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { needsCpfCompletion, useAccountStatus } from "@/hooks/useAccountStatus";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useShopCart } from "@/hooks/useShopCart";
import { useSmartCart } from "@/hooks/useBuyerExperience";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { trackEvent } from "@/lib/analytics";
import { brand } from "@/lib/brand";
import { CheckoutReservationBanner } from "@/components/checkout/CheckoutReservationBanner";
import { EscrowToggle } from "@/components/escrow/EscrowToggle";
import type { CheckoutSessionInfo } from "@/types/seller";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

const CheckoutStripeIsland = dynamic(
  () => import("@/components/checkout/CheckoutStripeIsland"),
  {
    ssr: false,
    loading: () => <InlineLoading message="Carregando cartão…" className="py-6" />,
  },
);

const EnhancedPixCheckoutPanel = dynamic(
  () =>
    import("@/components/checkout/EnhancedPixCheckoutPanel").then((m) => m.EnhancedPixCheckoutPanel),
  {
    ssr: false,
    loading: () => <InlineLoading message="Carregando PIX…" className="py-6" />,
  },
);

type Methods = {
  total_cents: number;
  methods: { pix: boolean; stripe: boolean; counter?: boolean; escrow?: boolean };
  escrow_fee_cents?: number;
  default_method: "pix" | "stripe" | "counter";
  cart_is_event_only?: boolean;
  stores?: Array<{
    store_id: string;
    store_name: string;
    pix_available?: boolean;
    stripe_available?: boolean;
    verification_status?: string | null;
    average_rating?: number | null;
    review_count?: number | null;
  }>;
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

function formatApiDetail(detail: unknown, fallback: string): string {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (detail && typeof detail === "object") {
    const rec = detail as Record<string, unknown>;
    if (typeof rec.message === "string" && rec.message.trim()) return rec.message;
    if (typeof rec.detail === "string" && rec.detail.trim()) return rec.detail;
  }
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return null;
      })
      .filter(Boolean);
    if (parts.length) return parts.join("; ");
  }
  return fallback;
}

/** Island client do checkout — shell H1/RSC fica em app/checkout/page.tsx. */
export function CheckoutClient() {
  const { user, loading: authLoading } = useJudgeAuth();
  const { data: accountStatus, isLoading: accountLoading } = useAccountStatus();
  const { data: cart, isLoading: cartLoading } = useShopCart();
  const { data: smartCart } = useSmartCart("best_value");
  const [cpfModal, setCpfModal] = useState(false);
  const [methods, setMethods] = useState<Methods | null>(null);
  const [method, setMethod] = useState<"pix" | "stripe" | "counter">("pix");
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
  const [counterLoading, setCounterLoading] = useState(false);
  const [counterDone, setCounterDone] = useState<{ orderId: string; expiresAt: string } | null>(null);
  const [useEscrow, setUseEscrow] = useState(false);
  const [shippingSelection, setShippingSelection] = useState<SelectedShippingQuote | null>(null);
  const bootStarted = useRef(false);
  const stripeStarted = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (accountLoading) return;
    if (needsCpfCompletion(accountStatus)) {
      setCpfModal(true);
      setLoading(false);
      return;
    }
    // Evita 2º initiate (accountStatus muda de identidade → cancela sessão → Stripe 400)
    if (bootStarted.current) return;
    bootStarted.current = true;

    async function bootCheckout() {
      setLoading(true);
      setInitError(null);
      setReservationError(null);

      // Methods ANTES de reservar — evita 400 "estoque insuficiente" por reserved da própria sessão
      const methodsRes = await fetch("/api/marketplace/shop/checkout/methods");
      if (!methodsRes.ok) {
        const body = await methodsRes.json().catch(() => ({}));
        setInitError(formatApiDetail(body.detail, "Não foi possível iniciar checkout"));
        setLoading(false);
        return;
      }
      const methodsData = (await methodsRes.json()) as Methods;
      setMethods(methodsData);
      setTotalCents(methodsData.total_cents);
      if (methodsData.default_method === "counter" && methodsData.methods.counter) {
        setMethod("counter");
      } else if (methodsData.default_method === "stripe" && methodsData.methods.stripe) {
        setMethod("stripe");
      } else {
        setMethod("pix");
      }

      const initRes = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (initRes.status === 423) {
        setReservationError(
          "Item sendo processado por outro comprador. Tente novamente em instantes.",
        );
        setLoading(false);
        return;
      }
      if (!initRes.ok) {
        const body = await initRes.json().catch(() => ({}));
        setReservationError(formatApiDetail(body.detail, "Não foi possível reservar estoque"));
        setLoading(false);
        return;
      }
      const initData = await initRes.json();
      const checkout = (initData.checkout ?? initData) as CheckoutSessionInfo;
      setCheckoutSession(checkout);
      setLoading(false);
    }
    void bootCheckout();
  }, [authLoading, user, accountLoading, accountStatus]);

  async function handleReservationExpired() {
    if (checkoutSession?.session_id) {
      await fetch(`/api/checkout/${checkoutSession.session_id}/cancel`, { method: "POST" });
    }
    setCheckoutSession(null);
    setPixData(null);
    setClientSecret(null);
    setReservationError("Sessão expirada. Os itens foram liberados — atualize a página para tentar novamente.");
  }

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
      setInitError(formatApiDetail(body.detail, "Erro ao gerar PIX"));
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
    if (!publishableKey) {
      setInitError("Stripe não configurado");
      return;
    }
    if (stripeStarted.current) return;
    stripeStarted.current = true;
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
      const message = formatApiDetail(body.detail, "Erro ao iniciar pagamento");
      console.error("checkout_stripe_failed", { status: res.status, detail: body.detail });
      setInitError(message);
      setLoading(false);
      stripeStarted.current = false; // permite retry manual
      return;
    }
    const data = await res.json();
    setClientSecret(data.client_secret);
    setTotalCents(data.total_cents ?? totalCents);
    setLoading(false);
  }

  async function startCounter() {
    setCounterLoading(true);
    setInitError(null);
    const res = await fetch("/api/marketplace/shop/checkout/counter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkout_session_id: checkoutSession?.session_id ?? null,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setInitError(formatApiDetail(body.detail, "Erro ao reservar no balcão"));
      setCounterLoading(false);
      return;
    }
    const data = (await res.json()) as { order_id?: string; expires_at?: string };
    setCounterDone({
      orderId: String(data.order_id ?? ""),
      expiresAt: String(data.expires_at ?? ""),
    });
    void trackEvent("checkout_started", {
      payment_method: "counter",
      total_cents: totalCents,
      order_id: data.order_id,
    });
    setCounterLoading(false);
  }

  useEffect(() => {
    if (!methods || !checkoutSession || pixData || clientSecret || reservationError || initError || loading) return;
    if (method === "counter" || counterDone) return;
    if (method === "stripe" && methods.methods.stripe) void startStripe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, methods, checkoutSession, reservationError, initError, loading, counterDone]);

  function handleCouponApplied(discount: number, code: string) {
    setDiscountCents(discount);
    const storeId = methods?.stores?.[0]?.store_id;
    if (storeId) {
      setAppliedCoupon({ code, storeId });
      if (pixData) setPixData(null);
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
  const showPaymentStep =
    methods &&
    (methods.methods.pix || methods.methods.stripe || methods.methods.counter) &&
    !pixData &&
    !clientSecret &&
    !counterDone &&
    checkoutSession &&
    !reservationError;
  const eventOnly = Boolean(methods?.cart_is_event_only);

  return (
    <>
      <p className="mt-4 text-small text-muted-foreground" data-testid="checkout-trust-line">
        Operador: {brand.legalName}
        {brand.cnpj ? ` · CNPJ ${brand.cnpj}` : ""}. Dúvidas:{" "}
        <a className="text-primary underline" href={`mailto:${brand.supportEmail}`}>
          {brand.supportEmail}
        </a>
        .{" "}
        <Link href="/politicas/compra" className="text-primary underline">
          Compra
        </Link>
        {" · "}
        <Link href="/politicas/reembolso" className="text-primary underline">
          Reembolso
        </Link>
        {" · "}
        <Link href="/politicas/cancelamento" className="text-primary underline">
          Cancelamento
        </Link>
        {" · "}
        <Link href="/termos" className="text-primary underline">
          Termos
        </Link>
        {" · "}
        <Link href="/privacidade" className="text-primary underline">
          Privacidade
        </Link>
        .
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* Coluna principal — fluxo de pagamento */}
          <div className="min-w-0 space-y-5">
            {checkoutSession?.expires_at && !reservationError && (
              <CheckoutReservationBanner
                expiresAt={checkoutSession.expires_at}
                onExpired={() => void handleReservationExpired()}
              />
            )}

            {reservationError && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-small text-danger" role="alert">
                {reservationError}
              </div>
            )}

            {!authLoading && !user && (
              <Card padding="md">
                <CardContent className="space-y-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">Entre para finalizar a compra.</p>
                  <Button asChild>
                    <Link href="/entrar?next=/checkout">Entrar</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {Boolean(user) && !checkoutSession && !reservationError && (
              <Card padding="md">
                <InlineLoading message="Preparando seu pagamento…" className="py-6" />
              </Card>
            )}

            {checkoutSession && !reservationError && !eventOnly && (
              <Card variant="muted" padding="md">
                <CardHeader className="flex-row items-center gap-2 space-y-0 p-0 pb-3">
                  <Truck className="h-4 w-4 text-primary" aria-hidden />
                  <CardTitle className="text-h3">Frete e prazo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-0">
                  <CartShippingQuotePanel
                    compact
                    loginNextPath="/checkout"
                    onSelectionChange={setShippingSelection}
                  />
                  {shippingSelection?.delivery_days != null && (
                    <p className="text-caption text-muted-foreground" data-testid="checkout-delivery-hint">
                      Prazo cotado:{" "}
                      {shippingSelection.delivery_days === 0
                        ? "retirada"
                        : `~${shippingSelection.delivery_days} dia(s)`}
                      {shippingSelection.service ? ` · ${shippingSelection.service}` : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {methods?.stores?.length === 1 && checkoutSession && !reservationError && !eventOnly && (
              <div className="space-y-4">
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
              </div>
            )}

            {showPaymentStep && (
              <Card padding="md" className="space-y-5">
                <CheckoutPaymentMethodPicker
                  method={method}
                  pixAvailable={methods.methods.pix}
                  stripeAvailable={methods.methods.stripe}
                  counterAvailable={Boolean(methods.methods.counter)}
                  onSelectPix={() => {
                    setPixData(null);
                    setClientSecret(null);
                    setMethod(methods.methods.pix ? "pix" : "stripe");
                  }}
                  onSelectStripe={() => {
                    setPixData(null);
                    setClientSecret(null);
                    setMethod("stripe");
                    void startStripe();
                  }}
                  onSelectCounter={() => {
                    setPixData(null);
                    setClientSecret(null);
                    stripeStarted.current = false;
                    setMethod("counter");
                  }}
                />

                {method === "pix" && methods.methods.pix && (
                  <Button
                    type="button"
                    size="lg"
                    className="w-full bg-success hover:bg-success/90"
                    data-testid="generate-pix"
                    disabled={pixLoading}
                    loading={pixLoading}
                    onClick={() => void startPix()}
                  >
                    Gerar código PIX
                  </Button>
                )}

                {method === "counter" && methods.methods.counter && (
                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    data-testid="confirm-counter-hold"
                    disabled={counterLoading}
                    loading={counterLoading}
                    onClick={() => void startCounter()}
                  >
                    Reservar vaga (pagar no balcão)
                  </Button>
                )}
              </Card>
            )}

            {counterDone && (
              <Card padding="md">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-h3">Vaga reservada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-0 text-sm text-muted-foreground">
                  <p>
                    Pagamento no balcão. Sua vaga fica reservada por 24 horas até a loja confirmar.
                  </p>
                  {counterDone.expiresAt && (
                    <p>
                      Expira em{" "}
                      <span className="font-medium text-foreground">
                        {new Date(counterDone.expiresAt).toLocaleString("pt-BR")}
                      </span>
                    </p>
                  )}
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/perfil/pedidos">Ver meus pedidos</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {initError && (
              <p className="text-small text-danger" role="alert">
                {initError}
              </p>
            )}

            {loading && !pixData && !clientSecret && !initError && method === "stripe" && (
              <Card padding="md">
                <InlineLoading message="Preparando pagamento com cartão…" className="py-6" />
              </Card>
            )}

            {pixData && (
              <Card padding="md">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-h3">Pague com PIX</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-0">
                  <EnhancedPixCheckoutPanel
                    pix={pixData}
                    onRegenerate={() => {
                      setPixData(null);
                      void startPix();
                    }}
                  />
                  <div className="rounded-xl bg-muted/40 px-4 py-3 text-center">
                    <p className="text-caption text-muted-foreground">Valor total</p>
                    <GalleryFade>
                      <p className="font-mono text-2xl font-bold" data-testid="final-amount">
                        {formatShopPrice(pixData.amount_cents)}
                      </p>
                    </GalleryFade>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/marketplace/orders">Ver meus pedidos</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {clientSecret && (
              <Card padding="md">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-h3">Pagamento com cartão</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CheckoutStripeIsland clientSecret={clientSecret} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo sticky */}
          <CheckoutOrderSummary
            items={cartItems}
            subtotalCents={summarySubtotal}
            discountCents={discountCents}
            escrowFeeCents={escrowFee}
            quotedShippingCents={shippingSelection?.price_cents ?? null}
            shippingQuoteLabel={shippingSelection?.service ?? null}
            savingsCents={smartCart?.summary.savings_cents}
            totalCents={summaryTotal}
            storeName={methods?.stores?.[0]?.store_name}
            stores={methods?.stores}
            storesCount={methods?.stores?.length ?? smartCart?.summary.store_count}
            deliveryDays={shippingSelection?.delivery_days ?? null}
            couponCode={appliedCoupon?.code ?? pixData?.coupon_code}
            isLoading={loading || cartLoading || accountLoading}
            sticky
          />
        </div>

        <CpfCheckoutModal open={cpfModal} onClose={() => setCpfModal(false)} />
    </>
  );
}
