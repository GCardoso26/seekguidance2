"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CpfCheckoutModal } from "@/components/kyc/CpfCheckoutModal";
import { Button } from "@/components/ui/button";
import { needsCpfCompletion, useAccountStatus } from "@/hooks/useAccountStatus";
import { useTournamentDetail } from "@/hooks/useTournamentFlow";
import {
  useTournamentPaymentConfirm,
  useTournamentPaymentIntent,
  useTournamentRegistration,
} from "@/hooks/useTournamentRegistration";
import { showToast } from "@/lib/toast";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const qc = new QueryClient();

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function StripeTournamentForm({
  tournamentId,
  paymentIntentId,
  totalCents,
}: {
  tournamentId: string;
  paymentIntentId: string;
  totalCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const confirmPay = useTournamentPaymentConfirm();
  const { register } = useTournamentRegistration(tournamentId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Pagamento falhou");
      setLoading(false);
      return;
    }

    try {
      await confirmPay.mutateAsync(paymentIntentId);
      await register.mutateAsync(undefined);
      showToast("Inscrição confirmada!", "success");
      router.push(`/tournament/${tournamentId}?registered=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao confirmar inscrição");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="tournament-checkout-form">
      <p className="text-sm text-muted-foreground">Total: {formatMoney(totalCents)}</p>
      <PaymentElement />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={!stripe || loading} className="w-full bg-primary text-primary-foreground">
        {loading ? "Processando…" : "Pagar e inscrever-se"}
      </Button>
    </form>
  );
}

function CheckoutView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params.id);
  const { data: accountStatus, isLoading: accountLoading } = useAccountStatus();
  const { data: tournament } = useTournamentDetail(id);
  const paymentIntent = useTournamentPaymentIntent();
  const [cpfOpen, setCpfOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [totalCents, setTotalCents] = useState(0);

  const t = tournament as Record<string, unknown> | undefined;
  const entryFee = Number(t?.entry_fee_cents ?? 0);
  const name = String(t?.name ?? "Torneio");

  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    if (accountLoading || initDone) return;
    if (needsCpfCompletion(accountStatus)) {
      setCpfOpen(true);
      return;
    }
    if (entryFee <= 0) return;

    setInitDone(true);
    void paymentIntent.mutateAsync(id).then((data) => {
      if (data.status === "free") {
        window.location.href = `/tournament/${id}`;
        return;
      }
      setClientSecret(data.clientSecret ?? null);
      setPaymentIntentId(data.paymentIntentId ?? null);
      setTotalCents(data.amountCents ?? entryFee);
    });
  }, [accountLoading, accountStatus, entryFee, id, initDone, paymentIntent]);

  if (searchParams.get("payment_intent")) {
    return (
      <div className="luxury-page mx-auto max-w-lg p-6 text-center">
        <p className="text-muted-foreground">Processando retorno do pagamento…</p>
        <Link href={`/tournament/${id}`} className="mt-4 inline-block text-primary">
          Voltar ao torneio
        </Link>
      </div>
    );
  }

  return (
    <div className="luxury-page mx-auto max-w-lg space-y-6 p-4 pb-8">
      <Link href={`/tournament/${id}`} className="text-sm text-muted-foreground">
        ← Voltar ao torneio
      </Link>
      <h1 className="text-2xl font-bold" data-testid="tournament-checkout-title">
        Checkout — {name}
      </h1>
      <p className="text-sm text-muted-foreground">Taxa de inscrição + taxa de serviço (5%)</p>

      {paymentIntent.isError && (
        <p className="text-sm text-danger">{paymentIntent.error.message}</p>
      )}

      {clientSecret && stripePromise && paymentIntentId && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripeTournamentForm
            tournamentId={id}
            paymentIntentId={paymentIntentId}
            totalCents={totalCents}
          />
        </Elements>
      )}

      {!clientSecret && !paymentIntent.isError && (
        <p className="text-sm text-muted-foreground" data-testid="tournament-checkout-loading">
          Preparando pagamento…
        </p>
      )}

      {clientSecret && !stripePromise && (
        <p className="text-sm text-amber-300" data-testid="tournament-checkout-stripe-missing">
          Pagamento configurado — Stripe indisponível neste ambiente.
        </p>
      )}

      <CpfCheckoutModal open={cpfOpen} onClose={() => setCpfOpen(false)} />
    </div>
  );
}

export default function TournamentCheckoutPage() {
  return (
    <QueryClientProvider client={qc}>
      <CheckoutView />
    </QueryClientProvider>
  );
}
