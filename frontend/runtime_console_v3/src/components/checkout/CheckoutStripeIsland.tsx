"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe() {
  if (!publishableKey) return null;
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

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
      confirmParams: { return_url: `${window.location.origin}/checkout/success` },
    });
    if (result.error) {
      setError(result.error.message ?? "Pagamento falhou");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
          // Parcelas aparecem no Element quando o PaymentIntent tem installments.enabled
          // e a conta/bandeira oferece planos (Stripe nativo: principalmente MX; BR se habilitado).
        }}
      />
      {error && <p className="text-small text-danger">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || loading} loading={loading}>
        Pagar com cartão
      </Button>
    </form>
  );
}

type Props = {
  clientSecret: string;
};

/**
 * Island carregada sob demanda — Stripe.js NÃO entra no bundle inicial do checkout.
 */
export default function CheckoutStripeIsland({ clientSecret }: Props) {
  const stripe = useMemo(() => getStripe(), []);
  if (!stripe) {
    return <p className="text-small text-danger">Stripe não configurado</p>;
  }
  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        appearance: { theme: "stripe", variables: { colorPrimary: "hsl(262 70% 50%)" } },
      }}
    >
      <StripeCheckoutForm />
    </Elements>
  );
}
