"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Protected } from "@/src/components/Protected";
import { Card, Loading } from "@/src/components/ui";

function CheckoutBody() {
  const params = useSearchParams();
  const sessionId = params.get("session");

  return (
    <Card className="space-y-4" data-testid="checkout-started">
      <h1 className="text-xl font-semibold text-zinc-900">Checkout iniciado</h1>
      <p className="text-sm text-zinc-600">
        Sessão criada com status <strong>CREATED</strong>. O pagamento real fica para a
        Sprint 9 — o endpoint <code className="text-xs">/checkout/:id/pay</code> já existe
        na API.
      </p>
      {sessionId ? (
        <dl className="text-sm text-zinc-700">
          <dt className="font-medium text-zinc-900">Checkout session</dt>
          <dd className="font-mono text-xs break-all">{sessionId}</dd>
        </dl>
      ) : (
        <p className="text-sm text-zinc-600">
          Nenhuma sessão na URL. Inicie pelo{" "}
          <Link href="/cart" className="text-emerald-800 underline">
            carrinho
          </Link>
          .
        </p>
      )}
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/search" className="text-emerald-800 underline">
          Voltar à busca
        </Link>
        <Link href="/" className="text-zinc-700 underline">
          Início
        </Link>
      </div>
    </Card>
  );
}

export default function CheckoutPage() {
  return (
    <Protected>
      <Suspense fallback={<Loading label="Carregando checkout…" />}>
        <CheckoutBody />
      </Suspense>
    </Protected>
  );
}
