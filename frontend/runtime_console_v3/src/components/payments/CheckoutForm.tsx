"use client";

import { useState } from "react";
import { useTournamentPayment } from "@/hooks/usePayments";

type Props = {
  tournamentId: string;
  tournamentName: string;
  feeCents: number;
  currency?: string;
};

function formatMoney(cents: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

export function CheckoutForm({ tournamentId, tournamentName, feeCents, currency = "BRL" }: Props) {
  const payment = useTournamentPayment();
  const [method, setMethod] = useState<"card" | "pix" | "paypal">("card");
  const platformFee = Math.round(feeCents * 0.05);
  const total = feeCents + platformFee;

  const handlePay = () => {
    payment.mutate(tournamentId);
  };

  if (feeCents <= 0) {
    return (
      <div className="rounded-xl border border-slate-700 p-6 text-center">
        <p className="text-success">Inscrição gratuita</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h3 className="text-lg font-semibold">Inscrição: {tournamentName}</h3>
      <p className="text-sm text-slate-400">Taxa: {formatMoney(feeCents, currency)}</p>

      <div className="mt-4 space-y-2">
        {(["card", "pix", "paypal"] as const).map((m) => (
          <label key={m} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-600 px-3 py-2">
            <input type="radio" checked={method === m} onChange={() => setMethod(m)} />
            <span>{m === "card" ? "💳 Cartão" : m === "pix" ? "🔑 PIX" : "🅿️ PayPal"}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 space-y-1 border-t border-slate-700 pt-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(feeCents, currency)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Taxa serviço (5%)</span>
          <span>{formatMoney(platformFee, currency)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatMoney(total, currency)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={payment.isPending}
        className="mt-4 w-full rounded-lg bg-amber-500 py-2 font-semibold text-slate-900 disabled:opacity-50"
      >
        {payment.isPending ? "Processando…" : "Confirmar pagamento"}
      </button>
      {payment.isError && <p className="mt-2 text-sm text-danger">{payment.error?.message}</p>}
      {payment.isSuccess && (
        <p className="mt-2 text-sm text-success">
          {payment.data?.status === "free" ? "Inscrição confirmada" : "Intenção de pagamento criada"}
        </p>
      )}
    </div>
  );
}
