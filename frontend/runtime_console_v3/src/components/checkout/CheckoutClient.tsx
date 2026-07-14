"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutPaymentMethodPicker } from "@/components/checkout/CheckoutPaymentMethodPicker";
import { CouponApply } from "@/components/checkout/CouponApply";
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

/** Island client do checkout — shell H1/RSC fica em app/checkout/page.tsx. */
export function CheckoutClient() {
  const { user, loading: authLoading } = useJudgeAuth();
  const { data: accountStatus, isLoading: accountLoading } = useAccountStatus();
  const { data: cart, isLoading: cartLoading } = useShopCart();
  const { data: smartCart } = useSmartCart("best_value");
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

  useEffect(() => {
    if (authLoading || !user) return;
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
  }, [authLoading, user, accountLoading, accountStatus]);

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
    if (!publishableKey) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, methods, checkoutSession, reservationError]);

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
    methods && (methods.methods.pix || methods.methods.stripe) && !pixData && !clientSecret && checkoutSession && !reservationError;

  return (
    <>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
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
                <InlineLoading message="Reservando estoque…" className="py-6" />
              </Card>
            )}

            {smartCart?.summary && checkoutSession && !reservationError && (
              <Card variant="muted" padding="md">
                <CardHeader className="flex-row items-center gap-2 space-y-0 p-0 pb-3">
                  <Truck className="h-4 w-4 text-primary" aria-hidden />
                  <CardTitle className="text-h3">Entrega estimada</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 p-0 text-small sm:grid-cols-3">
                  <div>
                    <p className="text-caption text-muted-foreground">Frete</p>
                    <p className="font-semibold">
                      {smartCart.summary.estimated_shipping_cents != null
                        ? formatShopPrice(smartCart.summary.estimated_shipping_cents)
                        : "No carrinho"}
                    </p>
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">Prazo</p>
                    <p className="font-semibold">~{smartCart.summary.estimated_sla_days ?? "—"} dias</p>
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">Lojas</p>
                    <p className="font-semibold">{smartCart.summary.store_count ?? 1}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {methods?.stores?.length === 1 && checkoutSession && !reservationError && (
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
                  onSelectPix={() => {
                    setPixData(null);
                    setClientSecret(null);
                    setMethod("pix");
                  }}
                  onSelectStripe={() => {
                    setPixData(null);
                    setClientSecret(null);
                    setMethod("stripe");
                    void startStripe();
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
                    <p className="font-mono text-2xl font-bold" data-testid="final-amount">
                      {formatShopPrice(pixData.amount_cents)}
                    </p>
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
            shippingCents={smartCart?.summary.estimated_shipping_cents}
            savingsCents={smartCart?.summary.savings_cents}
            totalCents={summaryTotal}
            storeName={methods?.stores?.[0]?.store_name}
            storesCount={methods?.stores?.length ?? smartCart?.summary.store_count}
            deliveryDays={smartCart?.summary.estimated_sla_days}
            couponCode={appliedCoupon?.code ?? pixData?.coupon_code}
            isLoading={loading || cartLoading || accountLoading}
            sticky
          />
        </div>

        <CpfCheckoutModal open={cpfModal} onClose={() => setCpfModal(false)} />
    </>
  );
}
